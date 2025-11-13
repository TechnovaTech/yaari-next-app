import 'dart:convert';
import 'package:http/http.dart' as http;

class UsersApi {
  static const String _base = 'https://admin.yaari.me';

  static Uri _url(String path) => Uri.parse('$_base$path');

  static Future<List<UserListItem>> fetchUsersList() async {
    final res = await http.get(_url('/api/users-list'));
    if (res.statusCode != 200) return [];
    final body = jsonDecode(res.body);
    final List list = body is List ? body : (body['data'] ?? []);
    return list.map((e) => UserListItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  static Future<Settings> fetchSettings() async {
    final res = await http.get(_url('/api/settings'));
    if (res.statusCode != 200) return const Settings();
    final m = jsonDecode(res.body) as Map<String, dynamic>;
    return Settings.fromJson(m['data'] ?? m);
  }

  static Future<int?> fetchBalance(String userId) async {
    final res = await http.get(_url('/api/users/$userId/balance'));
    if (res.statusCode != 200) return null;
    final m = jsonDecode(res.body) as Map<String, dynamic>;
    final data = m['data'] ?? m;
    final bal = data['balance'] ?? data['coins'] ?? data['amount'];
    if (bal is int) return bal;
    if (bal is String) return int.tryParse(bal);
    return null;
  }

  static Future<int?> deductCoins({
    required String userId,
    required int coins,
    required String callType, // 'audio' | 'video'
  }) async {
    final res = await http.post(
      _url('/api/users/$userId/deduct-coins'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'coins': coins, 'callType': callType}),
    );
    final m = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = m['data'] ?? m;
      final bal = data['newBalance'] ?? data['balance'] ?? data['coins'] ?? data['amount'];
      if (bal is int) return bal;
      if (bal is String) return int.tryParse(bal);
      return null;
    } else {
      final err = (m['error'] ?? m['message'] ?? 'Failed to deduct coins').toString();
      throw Exception(err);
    }
  }

  /// Fetch active ads to show on the Home hero card.
  static Future<List<AdItem>> fetchAds() async {
    final res = await http.get(_url('/api/ads'));
    if (res.statusCode != 200) return [];
    final body = jsonDecode(res.body);
    // Next.js API returns { success, ads }; admin API may return { data: [...] }
    final List list = body is List ? body : (body['ads'] ?? body['data'] ?? []);
    return list
        .map((e) => AdItem.fromJson(e as Map<String, dynamic>))
        .where((a) => a.isActive != false) // if field missing, treat as active
        .toList();
  }
}

class UserListItem {
  final String id;
  final String name;
  final String status; // Online | Busy | Offline
  final String attributes; // composed display string
  final String? avatarUrl;
  final String? gender; // male | female
  final String callAccess; // 'none' | 'audio' | 'video' | 'full'

  const UserListItem({
    required this.id,
    required this.name,
    required this.status,
    required this.attributes,
    this.avatarUrl,
    this.gender,
    this.callAccess = 'full',
  });

  factory UserListItem.fromJson(Map<String, dynamic> j) {
    String? _normalizeGender(dynamic g) {
      final t = (g?.toString() ?? '').trim().toLowerCase();
      if (t.isEmpty) return null;
      if (t.startsWith('m')) return 'male';
      if (t.startsWith('f')) return 'female';
      if (t == '0') return 'female';
      if (t == '1') return 'male';
      return t;
    }
    String? _fixUrl(String? url) {
      if (url == null || url.isEmpty) return url;
      // Normalize admin uploads
      if (url.startsWith('/uploads/')) {
        return 'https://admin.yaari.me$url';
      }
      // Replace local hosts with admin base
      return url.replaceAll(RegExp(r'https?://(localhost|0\.0\.0\.0):\d+'), 'https://admin.yaari.me');
    }

    final String id = (j['_id'] ?? j['id'] ?? '').toString();
    final String name = (j['name'] ?? j['username'] ?? 'User Name').toString();
    final String lang = (j['language'] ?? '').toString();
    final String hobby = (j['hobby'] ?? (j['about'] ?? '')).toString();
    final String age = (j['age'] ?? '').toString();
    final String attributes = [
      if (hobby.isNotEmpty) hobby,
      if (age.isNotEmpty) age,
      if (lang.isNotEmpty) lang,
    ].join(' • ');
    final String? avatar = _fixUrl(
      (j['profilePic'] as String?) ?? (j['avatar'] as String?) ?? (j['image'] as String?)
    );
    final String? gender = _normalizeGender(j['gender'] ?? j['sex']);
    final String rawAccess = (j['callAccess'] ?? 'full').toString().toLowerCase();
    final String callAccess = {
      'none': 'none',
      'audio': 'audio',
      'video': 'video',
      'full': 'full',
    }[rawAccess] ?? 'full';
    return UserListItem(
      id: id,
      name: name,
      status: 'Offline',
      attributes: attributes.isEmpty ? 'Attributes' : attributes,
      avatarUrl: avatar,
      gender: gender,
      callAccess: callAccess,
    );
  }
}

class Settings {
  final int audioCallRate;
  final int videoCallRate;
  final int coinsPerRupee;
  const Settings({this.audioCallRate = 10, this.videoCallRate = 10, this.coinsPerRupee = 1});

  factory Settings.fromJson(Map<String, dynamic> j) {
    final int audio = _asInt(j['audioCallRate']) ?? 10;
    final int video = _asInt(j['videoCallRate']) ?? 10;
    final int cpr = _asInt(j['coinsPerRupee']) ?? 1;
    return Settings(audioCallRate: audio, videoCallRate: video, coinsPerRupee: cpr);
  }

  static int? _asInt(dynamic v) {
    if (v is int) return v;
    if (v is String) return int.tryParse(v);
    return null;
  }
}

class AdItem {
  final String? imageUrl;
  final String? videoUrl;
  final String? linkUrl;
  final String? title;
  final String? description;
  final String? mediaType; // 'photo' | 'video'
  final bool? isActive;

  const AdItem({
    this.imageUrl,
    this.videoUrl,
    this.linkUrl,
    this.title,
    this.description,
    this.mediaType,
    this.isActive,
  });

  factory AdItem.fromJson(Map<String, dynamic> j) {
    String? _fixUpload(String? url) {
      if (url == null || url.isEmpty) return url;
      return url.startsWith('/uploads/') ? 'https://admin.yaari.me$url' : url;
    }

    return AdItem(
      imageUrl: _fixUpload((j['imageUrl'] ?? j['image'])?.toString()),
      videoUrl: _fixUpload((j['videoUrl'] ?? j['video'])?.toString()),
      linkUrl: (j['linkUrl'] ?? j['url'] ?? j['link'])?.toString(),
      title: (j['title'] ?? j['name'])?.toString(),
      description: (j['description'] ?? j['desc'])?.toString(),
      mediaType: (j['mediaType'] ?? j['type'])?.toString(),
      isActive: j['isActive'] is bool ? j['isActive'] as bool : null,
    );
  }
}