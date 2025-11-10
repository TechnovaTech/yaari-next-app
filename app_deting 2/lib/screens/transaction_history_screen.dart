import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  final String _apiBase = 'https://admin.yaari.me';
  bool _loading = true;
  String? _error;
  List<_TransactionItem> _transactions = const [];

  @override
  void initState() {
    super.initState();
    _initAndFetch();
  }

  Future<void> _initAndFetch() async {
    try {
      setState(() {
        _loading = true;
        _error = null;
      });

      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('user');
      String? userId;

      if (raw != null && raw.isNotEmpty) {
        try {
          final m = jsonDecode(raw);
          if (m is Map<String, dynamic>) {
            final inner = (m['user'] is Map<String, dynamic>) ? m['user'] as Map<String, dynamic> : m;
            userId = (inner['id'] ?? inner['_id'] ?? inner['userId'])?.toString();
          }
        } catch (_) {}
      }

      // Allow overriding via route arguments: pass a map {'userId': '...'} or string id
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map && args['userId'] != null) {
        userId = args['userId'].toString();
      } else if (args is String && args.isNotEmpty) {
        userId = args;
      }

      if (userId == null || userId.isEmpty) {
        setState(() {
          _error = 'Please login to view transactions';
          _loading = false;
          _transactions = const [];
        });
        return;
      }

      await _fetchTransactions(userId);
    } catch (e) {
      setState(() {
        _error = 'Failed to load transactions';
        _loading = false;
      });
    }
  }

  Future<void> _fetchTransactions(String userId) async {
    try {
      final uri = Uri.parse('$_apiBase/api/users/$userId/transactions');
      final res = await http.get(uri);
      final dynamic decoded = jsonDecode(res.body);
      if (res.statusCode < 200 || res.statusCode >= 300) {
        final String msg = (decoded is Map<String, dynamic>)
            ? (decoded['error']?.toString() ?? 'Failed to load transactions')
            : 'Failed to load transactions';
        setState(() {
          _error = msg;
          _loading = false;
          _transactions = const [];
        });
        return;
      }

      final List<dynamic> list = () {
        if (decoded is List) return decoded;
        if (decoded is Map<String, dynamic>) {
          final inner = decoded['transactions'];
          if (inner is List) return inner;
        }
        return <dynamic>[];
      }();
      final tx = list
          .map((e) => _TransactionItem.fromJson(e is Map<String, dynamic> ? e : <String, dynamic>{}))
          .toList();

      setState(() {
        _transactions = tx;
        _error = null;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load transactions';
        _loading = false;
        _transactions = const [];
      });
    }
  }

  String _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final d = DateTime.tryParse(iso)?.toLocal();
      if (d == null) return '';
      final String y = d.year.toString().padLeft(4, '0');
      final String m = d.month.toString().padLeft(2, '0');
      final String day = d.day.toString().padLeft(2, '0');
      final String hh = d.hour.toString().padLeft(2, '0');
      final String mm = d.minute.toString().padLeft(2, '0');
      return '$day-$m-$y, $hh:$mm';
    } catch (_) {
      return '';
    }
  }

  String _formatRupees(double? v) {
    if (v == null) return '—';
    try {
      // Show without decimals if integral, else up to 2 decimals.
      if (v % 1 == 0) {
        return v.toInt().toString();
      }
      return v.toStringAsFixed(2);
    } catch (_) {
      return v.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.black87),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Transaction History',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ),

            // Body
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : (_error != null && _error!.isNotEmpty)
                      ? Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24.0),
                          child: Center(
                            child: Text(
                              _error!,
                              style: const TextStyle(color: Colors.red, fontSize: 14),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      : (_transactions.isEmpty)
                          ? _EmptyState()
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                              itemCount: _transactions.length,
                              itemBuilder: (context, index) {
                                final tx = _transactions[index];
                                return Container(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.03),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                    border: Border.all(color: const Color(0xFFF0F0F0)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            (tx.type ?? 'Transaction'),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w600,
                                              fontSize: 14,
                                              color: Colors.black87,
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF2F2F2),
                                              borderRadius: BorderRadius.circular(999),
                                            ),
                                            child: Text(
                                              (tx.status ?? 'success'),
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Colors.black54,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            _formatDate(tx.createdAt),
                                            style: const TextStyle(fontSize: 12, color: Colors.black54),
                                          ),
                                          Text(
                                            '₹${_formatRupees(tx.amountRupees)}',
                                            style: const TextStyle(fontSize: 12, color: Colors.black87),
                                          ),
                                        ],
                                      ),
                                      if (tx.coins != null)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4.0),
                                          child: Text(
                                            'Coins: ${tx.coins}',
                                            style: const TextStyle(fontSize: 11, color: Colors.black54),
                                          ),
                                        ),
                                      if ((tx.description ?? '').isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4.0),
                                          child: Text(
                                            tx.description!,
                                            style: const TextStyle(fontSize: 11, color: Colors.black54),
                                          ),
                                        ),
                                    ],
                                  ),
                                );
                              },
                            ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TransactionItem {
  final String? id;
  final String? type;
  final double? amountRupees;
  final int? coins;
  final String? status;
  final String? createdAt;
  final String? description;

  const _TransactionItem({
    this.id,
    this.type,
    this.amountRupees,
    this.coins,
    this.status,
    this.createdAt,
    this.description,
  });

  factory _TransactionItem.fromJson(Map<String, dynamic> j) {
    double? _toDouble(dynamic v) {
      if (v == null) return null;
      if (v is num) return v.toDouble();
      if (v is String) {
        final s = v.replaceAll(RegExp(r'[^0-9\.-]'), '').trim();
        if (s.isEmpty) return null;
        return double.tryParse(s);
      }
      return null;
    }

    double? _parseAmount(Map<String, dynamic> m) {
      for (final key in [
        'amountRupees',
        'amountRs',
        'amount',
        'priceRupees',
        'price',
        'rupees',
        'total',
        'paid',
        'finalAmount',
        'grossAmount',
        'amount_in_rupees',
      ]) {
        final d = _toDouble(m[key]);
        if (d != null) return d;
      }
      // Try derive from coins * rate if provided
      final coins = _toDouble(m['coins']);
      final rate = _toDouble(m['coinRate'] ?? m['pricePerCoin'] ?? m['perCoinPrice']);
      if (coins != null && rate != null) {
        return coins * rate;
      }
      return null;
    }

    return _TransactionItem(
      id: (j['_id'] ?? j['id'])?.toString(),
      type: (j['type'] ?? 'Transaction')?.toString(),
      amountRupees: _parseAmount(j),
      coins: () {
        final v = j['coins'];
        if (v is num) return v.toInt();
        if (v is String) return int.tryParse(v);
        return null;
      }(),
      status: (j['status'] ?? 'success')?.toString(),
      createdAt: (j['createdAt'] ?? j['created_at'] ?? j['date'])?.toString(),
      description: (j['description'] ?? '')?.toString(),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text.rich(
              TextSpan(
                children: const [
                  TextSpan(
                    text: 'Need help\nunderstanding\nyour ',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Colors.black54,
                      fontFamily: 'Poppins',
                    ),
                  ),
                  TextSpan(
                    text: 'transactions?',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 24),

            const Text(
              'If you have any questions or spot\nsomething unusual, please reach\nout to us at',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.black54,
                fontFamily: 'Poppins',
              ),
            ),

            const SizedBox(height: 6),

            InkWell(
              onTap: () async {
                final uri = Uri(scheme: 'mailto', path: 'support@yaari.me');
                await launchUrl(uri);
              },
              child: const Text(
                'support@yaari.me',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFFFF8547),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'Poppins',
                  decoration: TextDecoration.underline,
                ),
              ),
            ),

            const SizedBox(height: 6),

            const Text(
              'Our team is here to assist you.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.black54,
                fontFamily: 'Poppins',
              ),
            ),
          ],
        ),
      ),
    );
  }
}