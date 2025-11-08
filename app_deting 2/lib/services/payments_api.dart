import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentsApi {
  static const String _base = 'https://admin.yaari.me';
  static Uri _url(String path) => Uri.parse('$_base$path');

  static Future<List<PlanItem>> fetchPlans() async {
    final res = await http.get(_url('/api/plans'));
    if (res.statusCode != 200) return [];
    final body = jsonDecode(res.body);
    final List list = body is List ? body : (body['data'] ?? []);
    return list.map((e) => PlanItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<CreateOrderResponse?> createOrder({
    required String userId,
    required num amountRupees,
    required String type, // 'topup' | 'plan'
    String? planId,
    int? coins,
  }) async {
    final res = await http.post(
      _url('/api/payments/order'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        'amountRupees': amountRupees,
        'type': type,
        'planId': planId,
        'coins': coins,
      }),
    );
    if (res.statusCode != 200) return null;
    final m = jsonDecode(res.body) as Map<String, dynamic>;
    final data = m['data'] ?? m;
    return CreateOrderResponse.fromJson(data);
  }

  static Future<VerifyPaymentResponse?> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    final res = await http.post(
      _url('/api/payments/verify'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'orderId': orderId,
        'paymentId': paymentId,
        'signature': signature,
      }),
    );
    if (res.statusCode != 200) return null;
    final m = jsonDecode(res.body) as Map<String, dynamic>;
    final data = m['data'] ?? m;
    return VerifyPaymentResponse.fromJson(data);
  }
}

class PlanItem {
  final String id;
  final String title;
  final int coins;
  final num price;
  final num originalPrice;
  final bool isActive;

  PlanItem({
    required this.id,
    required this.title,
    required this.coins,
    required this.price,
    required this.originalPrice,
    required this.isActive,
  });

  factory PlanItem.fromJson(Map<String, dynamic> j) {
    return PlanItem(
      id: (j['_id'] ?? j['id'] ?? '').toString(),
      title: (j['title'] ?? '').toString(),
      coins: _asInt(j['coins']) ?? 0,
      price: _asNum(j['price']) ?? 0,
      originalPrice: _asNum(j['originalPrice']) ?? _asNum(j['price']) ?? 0,
      isActive: (j['isActive'] ?? true) == true,
    );
  }
}

class CreateOrderResponse {
  final String orderId;
  final int amountPaise;
  final String currency;
  final String keyId;

  CreateOrderResponse({
    required this.orderId,
    required this.amountPaise,
    required this.currency,
    required this.keyId,
  });

  factory CreateOrderResponse.fromJson(Map<String, dynamic> j) {
    return CreateOrderResponse(
      orderId: (j['orderId'] ?? '').toString(),
      amountPaise: _asInt(j['amountPaise']) ?? 0,
      currency: (j['currency'] ?? 'INR').toString(),
      keyId: (j['keyId'] ?? '').toString(),
    );
  }
}

class VerifyPaymentResponse {
  final bool success;
  final int? newBalance;

  VerifyPaymentResponse({required this.success, this.newBalance});

  factory VerifyPaymentResponse.fromJson(Map<String, dynamic> j) {
    return VerifyPaymentResponse(
      success: j['success'] == true,
      newBalance: _asInt(j['newBalance']),
    );
  }
}

int? _asInt(dynamic v) {
  if (v is int) return v;
  if (v is String) return int.tryParse(v);
  if (v is num) return v.toInt();
  return null;
}

num? _asNum(dynamic v) {
  if (v is num) return v;
  if (v is String) return num.tryParse(v);
  return null;
}