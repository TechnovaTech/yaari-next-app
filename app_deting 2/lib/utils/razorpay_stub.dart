// Mobile/desktop stub for Razorpay checkout. Avoids importing dart:js.
// Throws an UnsupportedError at runtime if invoked on non-web platforms.

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
  throw UnsupportedError('Razorpay web checkout is not available on this platform');
}