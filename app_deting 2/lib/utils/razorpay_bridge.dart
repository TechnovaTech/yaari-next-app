// Conditional import bridge that selects web or stub implementation.
import 'razorpay_stub.dart' if (dart.library.js) 'razorpay_web.dart';

class RazorpayBridge {
  static Future<Map<String, String>> openCheckout({
    required String keyId,
    required int amountPaise,
    required String orderId,
    String currency = 'INR',
    String name = 'Yaari',
    String description = 'Coin purchase',
    String? prefillName,
    String? prefillEmail,
    String? prefillContact,
  }) {
    return openCheckoutImpl(
      keyId: keyId,
      amountPaise: amountPaise,
      orderId: orderId,
      currency: currency,
      name: name,
      description: description,
      prefillName: prefillName,
      prefillEmail: prefillEmail,
      prefillContact: prefillContact,
    );
  }
}