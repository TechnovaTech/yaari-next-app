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

  /// Fetch active ads to show on the Home hero card.
  static Future<List<AdItem>> fetchAds() async {
    final res = await http.get(_url('/api/ads'));
    if (res.statusCode != 200) return [];
    final body = jsonDecode(res.body);
    final List list = body is List ? body : (body['data'] ?? []);
    return list.map((e) => AdItem.fromJson(e as Map<String, dynamic>)).toList();
  }
}

class UserListItem {
  final String id;
  final String name;
  final String status; // Online | Busy | Offline
  final String attributes; // composed display string
  final String? avatarUrl;
  final String? gender; // male | female

  const UserListItem({
    required this.id,
    required this.name,
    required this.status,
    required this.attributes,
    this.avatarUrl,
    this.gender,
  });

  factory UserListItem.fromJson(Map<String, dynamic> j) {
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
    final String s = (j['status'] ?? j['presence'] ?? 'Online').toString();
    final String? avatar = j['avatar'] as String? ?? j['image'] as String?;
    final String? gender = (j['gender'] ?? j['sex'])?.toString();
    return UserListItem(
      id: id,
      name: name,
      status: s.isEmpty ? 'Online' : s,
      attributes: attributes.isEmpty ? 'Attributes' : attributes,
      avatarUrl: avatar,
      gender: gender?.toLowerCase(),
    );
  }
}

class Settings {
  final int audioCallRate;
  final int videoCallRate;
  const Settings({this.audioCallRate = 10, this.videoCallRate = 10});

  factory Settings.fromJson(Map<String, dynamic> j) {
    final int audio = _asInt(j['audioCallRate']) ?? 10;
    final int video = _asInt(j['videoCallRate']) ?? 10;
    return Settings(audioCallRate: audio, videoCallRate: video);
  }

  static int? _asInt(dynamic v) {
    if (v is int) return v;
    if (v is String) return int.tryParse(v);
    return null;
  }
}

class AdItem {
  final String? imageUrl;
  final String? linkUrl;
  final String? title;
  const AdItem({this.imageUrl, this.linkUrl, this.title});

  factory AdItem.fromJson(Map<String, dynamic> j) {
    return AdItem(
      imageUrl: (j['imageUrl'] ?? j['image'])?.toString(),
      linkUrl: (j['linkUrl'] ?? j['url'] ?? j['link'])?.toString(),
      title: (j['title'] ?? j['name'])?.toString(),
    );
  }
}