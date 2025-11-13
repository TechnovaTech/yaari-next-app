import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/users_api.dart';
import '../services/payments_api.dart';
import '../utils/razorpay_bridge.dart';
import '../services/analytics_service.dart';
import '../services/firebase_analytics_service.dart';
import '../services/meta_analytics_service.dart';

class CoinsScreen extends StatefulWidget {
  const CoinsScreen({super.key});

  @override
  State<CoinsScreen> createState() => _CoinsScreenState();
}

class _CoinsScreenState extends State<CoinsScreen> {
  int _balance = 0;
  int _coinsPerRupee = 1;
  List<PlanItem> _plans = const [];
  PlanItem? _selectedPlan;
  final TextEditingController _coinsInput = TextEditingController();
  bool _loading = true;
  String? _userId;

  @override
  void initState() {
    super.initState();
    _init();
    
    // Track wallet clicked event
    AnalyticsService.instance.track('walletClicked', {'walletBalance': _balance});
  }

  @override
  void dispose() {
    _coinsInput.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('user');
      String? uid;
      if (raw != null) {
        try {
          final m = jsonDecode(raw);
          if (m is Map<String, dynamic>) {
            uid = _extractUserId(m);
          }
        } catch (_) {}
      }
      _userId = uid;
      final settings = await UsersApi.fetchSettings();
      _coinsPerRupee = settings.coinsPerRupee;
      if (uid != null && uid.isNotEmpty) {
        final bal = await UsersApi.fetchBalance(uid);
        _balance = bal ?? 0;
      }
      _plans = await PaymentsApi.fetchPlans();
    } catch (_) {}
    if (mounted) {
      setState(() => _loading = false);
      // Track recharge pack viewed event after loading
      AnalyticsService.instance.track('rechargePackViewed');
    }
  }

  String? _extractUserId(Map<String, dynamic> m) {
    // Support multiple shapes: { _id }, { id }, { userId }, { user: { _id } }
    for (final k in ['_id', 'id', 'userId']) {
      final v = m[k];
      if (v != null && v.toString().isNotEmpty) return v.toString();
    }
    final u = m['user'];
    if (u is Map<String, dynamic>) {
      return _extractUserId(u);
    }
    return null;
  }

  num _priceForCoins(int coins) {
    // coinsPerRupee means 1 INR gives X coins; price = coins / X
    return (coins / (_coinsPerRupee == 0 ? 1 : _coinsPerRupee)).toStringAsFixed(2) == '0.00'
        ? 0
        : double.parse((coins / (_coinsPerRupee == 0 ? 1 : _coinsPerRupee)).toStringAsFixed(2));
  }

  Future<void> _proceedToPayment() async {
    if (_userId == null || _userId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User not logged in')));
      return;
    }
    final int coinsRequested = int.tryParse(_coinsInput.text.trim()) ?? 0;
    final bool isPlan = _selectedPlan != null;
    if (!isPlan && coinsRequested <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter coins or select a plan')));
      return;
    }

    setState(() => _loading = true);
    try {
      final num amountRupees = isPlan ? _selectedPlan!.price : _priceForCoins(coinsRequested);
      final order = await PaymentsApi.createOrder(
        userId: _userId!,
        amountRupees: amountRupees,
        type: isPlan ? 'plan' : 'topup',
        planId: isPlan ? _selectedPlan!.id : null,
        coins: isPlan ? null : coinsRequested,
      );
      if (order == null || order.orderId.isEmpty) {
        throw 'Failed to create order';
      }

      // Open Razorpay checkout (web via bridge; stub on mobile)
      final payment = await RazorpayBridge.openCheckout(
        keyId: order.keyId,
        amountPaise: order.amountPaise,
        orderId: order.orderId,
        currency: order.currency,
        name: 'Yaari',
        description: isPlan ? 'Plan purchase' : 'Coin recharge',
      );

      final verify = await PaymentsApi.verifyPayment(
        orderId: order.orderId,
        paymentId: payment['razorpay_payment_id'] ?? '',
        signature: payment['razorpay_signature'] ?? '',
      );
      if (verify?.success == true) {
        // Track payment done event to Mixpanel/CleverTap
        AnalyticsService.instance.track('paymentDone', {
          'packId': isPlan ? _selectedPlan!.id : '',
          'packValue': amountRupees,
          'transactionId': payment['razorpay_payment_id'] ?? '',
          'paymentGateway': 'razorpay',
          'status': 'success',
        });
        
        // Track charged event for revenue tracking (Mixpanel)
        AnalyticsService.instance.trackCharged(
          amount: amountRupees,
          currency: 'INR',
          paymentGateway: 'razorpay',
          transactionId: payment['razorpay_payment_id'] ?? '',
          productId: isPlan ? _selectedPlan!.id : 'custom_topup',
          quantity: isPlan ? _selectedPlan!.coins : coinsRequested,
        );
        
        // Track to Firebase Analytics
        FirebaseAnalyticsService.instance.trackPaymentDone(
          packId: isPlan ? _selectedPlan!.id : 'custom_topup',
          packValue: amountRupees,
          transactionId: payment['razorpay_payment_id'] ?? '',
          paymentGateway: 'razorpay',
          status: 'success',
        );
        
        // Track to Meta Analytics
        MetaAnalyticsService.instance.trackPaymentDone(
          packId: isPlan ? _selectedPlan!.id : 'custom_topup',
          packValue: amountRupees,
          transactionId: payment['razorpay_payment_id'] ?? '',
          paymentGateway: 'razorpay',
          status: 'success',
        );
        
        setState(() {
          _balance = verify?.newBalance ?? _balance;
          _coinsInput.clear();
          _selectedPlan = null;
        });
        try {
          final prefs = await SharedPreferences.getInstance();
          final rawUser = prefs.getString('user');
          if (rawUser != null) {
            final mm = jsonDecode(rawUser);
            final map = mm is Map<String, dynamic> ? mm : <String, dynamic>{};
            void set(Map<String, dynamic> obj) {
              obj['balance'] = _balance;
              obj['coins'] = _balance;
              obj['amount'] = _balance;
            }
            set(map);
            final u = map['user'];
            if (u is Map<String, dynamic>) set(u);
            final d = map['data'];
            if (d is Map<String, dynamic>) set(d);
            await prefs.setString('user', jsonEncode(map));
          }
        } catch (_) {}
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment successful')));
      } else {
        throw 'Payment verification failed';
      }
    } on UnsupportedError catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Payment not supported on this platform: ${e.message}')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment error: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallWidth = screenWidth < 360; // compact phones
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Coins',
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Total balance card refined to match mock
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEFE6),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [
                    BoxShadow(color: Colors.black12, blurRadius: 12, offset: Offset(0, 6)),
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const _YCoinIcon(size: 44),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Total Coin Balance',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                              color: Colors.black,
                            ),
                          ),
                          SizedBox(height: 6),
                          Text(
                            '$_balance',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              const Divider(),
              const SizedBox(height: 16),
              const Text(
                'Add More Coins',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFFF8547),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                keyboardType: TextInputType.number,
                controller: _coinsInput,
                decoration: InputDecoration(
                  hintText: 'Enter no of coins',
                  prefixIcon: const Icon(Icons.monetization_on_outlined),
                  suffixText: 'Inr ${_priceForCoins(int.tryParse(_coinsInput.text.trim()) ?? 0)}',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Make grid non-scrollable and let page scroll instead to avoid overflow
              GridView.count(
                crossAxisCount: isSmallWidth ? 2 : 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                // Slightly taller tiles on compact widths to avoid bottom overflow
                childAspectRatio: isSmallWidth ? 0.75 : 0.85,
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                children: [
                  for (final p in _plans.where((p) => p.isActive))
                    GestureDetector(
                      onTap: () {
                        setState(() => _selectedPlan = p);
                        // Track recharge CTA clicked event
                        AnalyticsService.instance.track('rechargeCtaClicked', {
                          'packId': p.id,
                          'packValue': p.price,
                          'packMinutes': p.coins,
                          'paymentGateway': 'razorpay',
                        });
                      },
                      child: _PlanPack(
                        coins: p.coins,
                        price: p.price,
                        originalPrice: p.originalPrice,
                        selected: _selectedPlan?.id == p.id,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF8547),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _loading ? null : _proceedToPayment,
                  child: const Text(
                    'Proceed to Payment',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                  ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class _PlanPack extends StatelessWidget {
  final int coins;
  final num price;
  final num originalPrice;
  final bool selected;
  const _PlanPack({
    required this.coins,
    required this.price,
    required this.originalPrice,
    this.selected = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: selected ? const Color(0xFFFFD8C4) : const Color(0xFFFFEFE6),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      clipBehavior: Clip.hardEdge,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const _YCoinIcon(size: 20),
              const SizedBox(width: 8),
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  '$coins',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  softWrap: false,
                  style: GoogleFonts.getFont(
                    'Baloo Tammudu 2',
                    textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.black),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            '₹$price',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            softWrap: false,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.black),
          ),
          const SizedBox(height: 6),
          Text(
            '₹$originalPrice',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            softWrap: false,
            style: const TextStyle(fontSize: 14, color: Colors.black54, fontWeight: FontWeight.w600, decoration: TextDecoration.lineThrough),
          ),
        ],
      ),
    );
  }
}

class _YCoinIcon extends StatelessWidget {
  final double size;
  const _YCoinIcon({this.size = 36});

  @override
  Widget build(BuildContext context) {
    return Image.asset('assets/images/coin.png', width: size, height: size);
  }
}