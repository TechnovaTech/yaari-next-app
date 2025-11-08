// Web-only Razorpay checkout bridge
// Requires adding checkout script in web/index.html
// <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
import 'dart:async';
import 'dart:js' as js;
import 'dart:js_util' as jsu;

// Top-level function used by conditional bridge import
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
  final handler = js.allowInterop((response) {
    final paymentId = response['razorpay_payment_id']?.toString() ?? '';
    final signature = response['razorpay_signature']?.toString() ?? '';
    completer.complete({
      'razorpay_payment_id': paymentId,
      'razorpay_signature': signature,
    });
  });
  final onFailure = js.allowInterop((error) {
    if (!completer.isCompleted) {
      completer.completeError(error);
    }
  });

  final options = jsu.jsify({
    'key': keyId,
    'amount': amountPaise,
    'currency': currency,
    'name': name,
    'description': description,
    'order_id': orderId,
    'handler': handler,
    'prefill': {
      if (prefillName != null) 'name': prefillName,
      if (prefillEmail != null) 'email': prefillEmail,
      if (prefillContact != null) 'contact': prefillContact,
    },
    'theme': {'color': '#FF8547'},
  });

  try {
    final Razorpay = js.context['Razorpay'];
    if (Razorpay == null) {
      throw 'Razorpay script not loaded';
    }
    final rzp = jsu.callConstructor(Razorpay, [options]);
    jsu.callMethod(rzp, 'on', [
      'payment.failed',
      onFailure,
    ]);
    jsu.callMethod(rzp, 'open', []);
  } catch (e) {
    if (!completer.isCompleted) completer.completeError(e);
  }

  return completer.future;
}