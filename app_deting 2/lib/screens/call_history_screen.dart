import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class CallHistoryScreen extends StatefulWidget {
  const CallHistoryScreen({super.key});

  // Keep static colors available for child widgets referencing CallHistoryScreen.*
  static const Color bg = Color(0xFFFEF8F4);
  static const Color pillIncoming = Color(0xFF28C76F);
  static const Color pillOutgoing = Color(0xFFFF8547);
  static const Color pillCompleted = Color(0xFF9E9E9E);
  static const Color pillMissed = Color(0xFFE53935);
  static const Color divider = Color(0xFFE7E2DC);

  @override
  State<CallHistoryScreen> createState() => _CallHistoryScreenState();
}

class _CallHistoryScreenState extends State<CallHistoryScreen> {
  static const String _apiBase = 'https://admin.yaari.me';
  List<_CallData> _items = const [];

  @override
  void initState() {
    super.initState();
    _initAndFetch();
  }

  Future<void> _initAndFetch() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('user');
      String? userId;

      // Try a direct userId key if available
      userId = prefs.getString('userId');

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

      // Fallback to query parameters (useful on web: /#call_history?userId=...)
      if (userId == null || userId.isEmpty) {
        final qp = Uri.base.queryParameters;
        final qpId = qp['userId'] ?? qp['id'] ?? '';
        if (qpId.isNotEmpty) {
          userId = qpId;
        }
      }

      if (userId == null || userId.isEmpty) {
        debugPrint('⚠️ [CallHistory] No userId found in prefs, route, or URL. Showing placeholders.');
        setState(() {
          _items = const [];
        });
        return;
      }

      debugPrint('🔎 [CallHistory] Fetching history for userId=$userId');
      await _fetchCallHistory(userId);
    } catch (_) {
      debugPrint('❌ [CallHistory] Error during init. Showing placeholders.');
      setState(() {
        _items = const [];
      });
    }
  }

  Future<void> _fetchCallHistory(String userId) async {
    try {
      final uri = Uri.parse('$_apiBase/api/call-history?userId=$userId');
      final res = await http.get(uri);
      final dynamic decoded = jsonDecode(res.body);
      if (res.statusCode < 200 || res.statusCode >= 300) {
        debugPrint('❌ [CallHistory] HTTP ${res.statusCode} fetching $uri');
        setState(() {
          _items = const [];
        });
        return;
      }

      final List<dynamic> listRaw = decoded is List
          ? decoded
          : (decoded is Map<String, dynamic> && decoded['data'] is List)
              ? decoded['data'] as List
              : <dynamic>[];
      // Deduplicate by _id to avoid duplicate entries
      final seen = <String>{};
      final list = listRaw.where((e) {
        final m = e is Map<String, dynamic> ? e : <String, dynamic>{};
        final id = (m['_id'] ?? '').toString();
        final createdAt = (m['createdAt'] ?? m['startTime'] ?? '').toString();
        final otherName = (m['otherUserName'] ?? '').toString();
        final callType = (m['callType'] ?? '').toString();
        final isOut = (m['isOutgoing'] ?? false) == true;
        final durationSec = _asInt(m['duration']);
        final signature = id.isNotEmpty
            ? id
            : '$createdAt|$otherName|$callType|$isOut|$durationSec';
        if (signature.isEmpty) return true;
        if (seen.contains(signature)) return false;
        seen.add(signature);
        return true;
      }).toList();

      final items = list.map((e) {
        final m = e is Map<String, dynamic> ? e : <String, dynamic>{};
        final String status = (m['status'] ?? '').toString();
        final bool isOutgoing = (m['isOutgoing'] ?? false) == true;
        final String direction = isOutgoing ? 'Outgoing' : 'Incoming';
        final String statusText = status.isEmpty ? '' : status;
        final String name = (m['otherUserName'] ?? '').toString();
        final String attributes = (m['otherUserAbout'] ?? '').toString();
        final String createdAt = (m['createdAt'] ?? m['startTime'] ?? '').toString();
        final int durationSec = _asInt(m['duration']);
        final String? avatar = _normalizeUrl((m['otherUserAvatar'] ?? '')?.toString());
        return _CallData(
          direction: direction,
          status: statusText,
          name: name,
          attributes: attributes,
          time: _formatDate(createdAt),
          duration: _formatDuration(durationSec),
          avatarUrl: (avatar != null && avatar.isNotEmpty) ? avatar : null,
        );
      }).toList();

      setState(() {
        _items = items;
      });
      debugPrint('✅ [CallHistory] Loaded ${items.length} items.');
    } catch (_) {
      debugPrint('❌ [CallHistory] Network or parsing error.');
      setState(() {
        _items = const [];
      });
    }
  }

  int _asInt(dynamic v) {
    try {
      if (v == null) return 0;
      if (v is int) return v;
      if (v is double) return v.round();
      return int.tryParse(v.toString()) ?? 0;
    } catch (_) {
      return 0;
    }
  }

  String _formatDuration(int seconds) {
    if (seconds <= 0) return '00:00';
    final int m = seconds ~/ 60;
    final int s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  String _formatDate(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    try {
      final d = DateTime.tryParse(iso)?.toLocal();
      if (d == null) return '';
      final int hour24 = d.hour;
      final int hour12 = ((hour24 + 11) % 12) + 1; // 0 -> 12, 13 -> 1
      final String mm = d.minute.toString().padLeft(2, '0');
      final String suffix = hour24 >= 12 ? 'PM' : 'AM';
      return '$hour12:$mm $suffix';
    } catch (_) {
      return '';
    }
  }

  String? _normalizeUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    final u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) {
      return u.replaceAll(RegExp(r'https?://(0\.0\.0\.0|localhost):\d+'), 'https://admin.yaari.me');
    }
    if (u.startsWith('/uploads')) {
      return 'https://admin.yaari.me$u';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;

    return Scaffold(
      backgroundColor: CallHistoryScreen.bg,
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
                    'Call History',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),

            // List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemBuilder: (context, index) => _CallItem(data: items[index]),
                separatorBuilder: (context, index) => const _ListDivider(),
                itemCount: items.length,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallItem extends StatelessWidget {
  final _CallData data;
  const _CallItem({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Avatar
          CircleAvatar(
            radius: 26,
            backgroundImage: data.avatarUrl != null
                ? NetworkImage(data.avatarUrl!)
                : const AssetImage('assets/images/Avtar.png') as ImageProvider,
            backgroundColor: Colors.transparent,
          ),

          const SizedBox(width: 12),

          // Status above name + attributes
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: data.direction == 'Incoming'
                            ? CallHistoryScreen.pillIncoming
                            : CallHistoryScreen.pillOutgoing,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        data.direction,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  data.name,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black),
                ),
                const SizedBox(height: 2),
                Text(
                  data.attributes,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ],
            ),
          ),

          // Time + duration
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                data.time,
                style: const TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                data.duration,
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ListDivider extends StatelessWidget {
  const _ListDivider();
  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, thickness: 1, color: CallHistoryScreen.divider);
  }
}

class _CallData {
  final String direction; // Outgoing or Incoming
  final String status; // completed, missed, etc.
  final String name;
  final String attributes;
  final String time;
  final String duration;
  final String? avatarUrl;
  const _CallData({
    required this.direction,
    required this.status,
    required this.name,
    required this.attributes,
    required this.time,
    required this.duration,
    this.avatarUrl,
  });
}