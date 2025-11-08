import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CoinsScreen extends StatelessWidget {
  const CoinsScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                        children: const [
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
                            '0',
                            style: TextStyle(
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
                decoration: InputDecoration(
                  hintText: 'Enter no of coins',
                  prefixIcon: const Icon(Icons.monetization_on_outlined),
                  suffixText: 'Inr 0.0',
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
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.85,
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                children: const [
                  _CoinPack(amount: 50),
                  _CoinPack(amount: 50),
                  _CoinPack(amount: 50),
                  _CoinPack(amount: 50),
                  _CoinPack(amount: 50),
                  _CoinPack(amount: 50),
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
                  onPressed: () {},
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

class _CoinPack extends StatelessWidget {
  final int amount;
  const _CoinPack({required this.amount});

  @override
  Widget build(BuildContext context) {
    final int mrp = amount * 2;
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFFEFE6),
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 4)),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const _YCoinIcon(size: 20),
              const SizedBox(width: 8),
              Text(
                '$amount',
                style: GoogleFonts.getFont(
                  'Baloo Tammudu 2',
                  textStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.black),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                '₹$mrp',
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.black54,
                  decoration: TextDecoration.lineThrough,
                  decorationThickness: 2,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '₹$amount',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.black),
              ),
            ],
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