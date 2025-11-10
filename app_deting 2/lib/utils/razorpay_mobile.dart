import 'dart:async';
import 'package:razorpay_flutter/razorpay_flutter.dart';

// Native Android/iOS Razorpay checkout implementation
Future<Map<String, String>> openCheckoutImpl({
  required String keyId,
  required int amountPaise,
  required String orderId,
  String currency = 'INR',
  String name = 'Yaari',
  String description = 'Coin purchase',
  String? prefillName,
  String? prefillEmail,
  String? prefillContact,
}) async {
  final completer = Completer<Map<String, String>>();
  final razorpay = Razorpay();

  void clear() {
    try {
      razorpay.clear();
    } catch (_) {}
  }

  razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse res) {
    completer.complete({
      'razorpay_payment_id': res.paymentId ?? '',
      'razorpay_signature': res.signature ?? '',
    });
    clear();
  });

  razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse res) {
    if (!completer.isCompleted) {
      completer.completeError('Payment failed (${res.code}): ${res.message}');
    }
    clear();
  });

  razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse res) {
    // Not used; keep for completeness
  });

  final options = {
    'key': keyId,
    'amount': amountPaise,
    'currency': currency,
    'name': name,
    'description': description,
    'order_id': orderId,
    'timeout': 120,
    'theme': {'color': '#FF8547'},
    'prefill': {
      if (prefillName != null) 'name': prefillName,
      if (prefillEmail != null) 'email': prefillEmail,
      if (prefillContact != null) 'contact': prefillContact,
    },
  };

  try {
    razorpay.open(options);
  } catch (e) {
    clear();
    rethrow;
  }

  return completer.future;
}