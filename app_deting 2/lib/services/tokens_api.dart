import 'dart:convert';
import 'package:http/http.dart' as http;

class TokensApi {
  static const String _base = 'https://admin.yaari.me';
  static Uri _url(String path) => Uri.parse('$_base$path');

  /// Fetch an Agora RTC token for the given channel from admin API.
  /// Returns null if request fails or token missing.
  static Future<String?> fetchRtcToken(String channelName) async {
    try {
      final res = await http.post(
        _url('/api/agora/token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'channelName': channelName}),
      );
      if (res.statusCode != 200) return null;
      final m = jsonDecode(res.body) as Map<String, dynamic>;
      final token = (m['token'] ?? (m['data']?['token']))?.toString();
      return (token != null && token.isNotEmpty) ? token : null;
    } catch (_) {
      return null;
    }
  }
}