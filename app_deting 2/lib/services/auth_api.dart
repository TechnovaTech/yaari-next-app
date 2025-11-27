import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthApi {
  static const String _base = 'https://admin.yaari.me/api/auth';
  static const String _tcTokenUrl = 'https://oauth.truecaller.com/v1/token';
  static const String _tcUserinfoUrl = 'https://oauth.truecaller.com/v1/userinfo';

  static Future<Map<String, dynamic>> sendOtp(String phone) async {
    final uri = Uri.parse('$_base/send-otp');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone}),
    );
    final body = _decodeBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {'success': true, 'data': body};
    }
    return {
      'success': false,
      'message': body['message'] ?? 'Failed to send OTP',
      'status': res.statusCode,
    };
  }

  static Future<Map<String, dynamic>> verifyOtp({required String phone, required String otp}) async {
    final uri = Uri.parse('$_base/verify-otp');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'otp': otp}),
    );
    final body = _decodeBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {'success': true, 'data': body};
    }
    return {
      'success': false,
      'message': body['message'] ?? 'Invalid OTP',
      'status': res.statusCode,
    };
  }

  static Map<String, dynamic> _decodeBody(http.Response res) {
    try {
      return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      return {'raw': res.body};
    }
  }

  static Future<Map<String, dynamic>> truecallerExchange({required String authorizationCode, required String codeVerifier}) async {
    final uri = Uri.parse('$_base/truecaller-oauth/exchange');
    final res = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'authorizationCode': authorizationCode,
        'codeVerifier': codeVerifier,
      }),
    );
    final body = _decodeBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {'success': true, 'data': body};
    }
    return {
      'success': false,
      'message': body['message'] ?? 'Truecaller exchange failed',
      'status': res.statusCode,
    };
  }

  static Future<Map<String, dynamic>> truecallerLogin({required String authorizationCode, required String codeVerifier}) async {
    final uri = Uri.parse('$_base/truecaller-oauth/login');
    final res = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': 'fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
      },
      body: jsonEncode({
        'authorizationCode': authorizationCode,
        'codeVerifier': codeVerifier,
        'clientId': 'fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
        'client_id': 'fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
      }),
    );
    final body = _decodeBody(res);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return {'success': true, 'data': body};
    }
    try {
      final tokenRes = await http.post(
        Uri.parse(_tcTokenUrl),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: {
          'grant_type': 'authorization_code',
          'code': authorizationCode,
          'code_verifier': codeVerifier,
          'client_id': 'fn_yohgvr75otxdy6eqursnetjuhk8b8xqdqzvahurs',
        },
      );
      final tokenJson = _decodeBody(tokenRes);
      final access = tokenJson['access_token']?.toString();
      if (tokenRes.statusCode >= 200 && tokenRes.statusCode < 300 && access != null && access.isNotEmpty) {
        final userRes = await http.get(
          Uri.parse(_tcUserinfoUrl),
          headers: {'Authorization': 'Bearer $access'},
        );
        final userJson = _decodeBody(userRes);
        if (userRes.statusCode >= 200 && userRes.statusCode < 300) {
          final phoneRaw = (userJson['phone_number'] ?? userJson['phoneNumber'] ?? userJson['phone'] ?? '').toString();
          final phone = phoneRaw.replaceAll(RegExp(r'^\+91\s*', caseSensitive: false), '').replaceAll(RegExp(r'\s+'), '');
          if (RegExp(r'^[0-9]{10}$').hasMatch(phone)) {
            final user = {
              'phone': phone,
              'name': (userJson['name'] ?? userJson['given_name'] ?? '').toString().isEmpty ? null : (userJson['name'] ?? userJson['given_name']).toString(),
              'tcScopes': userJson['scopes'],
            };
            return {'success': true, 'data': {'user': user}};
          }
        }
      }
    } catch (_) {}
    return {
      'success': false,
      'message': body['message'] ?? 'Truecaller login failed',
      'status': res.statusCode,
    };
  }
}
