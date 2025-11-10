import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'socket_service.dart';

class OutgoingCallService {
  OutgoingCallService._();
  static final OutgoingCallService instance = OutgoingCallService._();

  final SocketService _socket = SocketService.instance;
  bool _isRinging = false;

  Future<void> startCall({
    required BuildContext context,
    required String receiverId,
    required String callerName,
    String? callerAvatar,
    required String channel,
    required bool isVideo,
  }) async {
    debugPrint('📞 [OutgoingCall] Starting ${isVideo ? 'video' : 'audio'} call to $receiverId');
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user');
    if (userJson == null) {
      debugPrint('❌ [OutgoingCall] No user data found');
      return;
    }

    final userData = jsonDecode(userJson);
    String? callerId;
    String callerDisplayName = 'User';
    try {
      if (userData is Map<String, dynamic>) {
        final Map<String, dynamic> root = userData;
        final Map<String, dynamic> inner = (root['user'] is Map<String, dynamic>)
            ? root['user'] as Map<String, dynamic>
            : (root['data'] is Map<String, dynamic>)
                ? root['data'] as Map<String, dynamic>
                : root;
        for (final k in const ['id', '_id', 'userId']) {
          final v = inner[k];
          if (v != null && v.toString().isNotEmpty) { callerId = v.toString(); break; }
        }
        callerDisplayName = (inner['name'] ?? inner['userName'] ?? root['name'] ?? 'User').toString();
      }
    } catch (_) {}
    debugPrint('👤 [OutgoingCall] Caller: $callerDisplayName (${callerId ?? 'unknown'})');

    _isRinging = true;

    // Listen for call responses
    _socket.on('call-accepted', (data) {
      debugPrint('✅ [OutgoingCall] Call accepted!');
      if (_isRinging) {
        _isRinging = false;
        Navigator.pop(context); // Close ringing dialog
        final token = (data is Map && (data['token'] != null || data['rtcToken'] != null))
            ? (data['token'] ?? data['rtcToken']).toString()
            : '';
        final ch = (data is Map && (data['channelName'] != null || data['channel'] != null))
            ? (data['channelName'] ?? data['channel']).toString()
            : channel;
        final uidArg = (data is Map && (data['uid'] != null || data['agoraUid'] != null || data['rtcUid'] != null))
            ? (data['uid'] ?? data['agoraUid'] ?? data['rtcUid']).toString()
            : null;
        debugPrint('🔑 [OutgoingCall] Accepted with channel=$ch, token=${token.isEmpty ? '(empty)' : '(provided)'}');
        Navigator.pushNamed(context, isVideo ? '/video_call' : '/audio_call', arguments: {
          'name': callerName,
          'avatarUrl': callerAvatar,
          'channel': ch,
          'token': token,
          if (uidArg != null) 'uid': uidArg,
        });
      }
    });

    _socket.on('call-declined', (_) {
      debugPrint('❌ [OutgoingCall] Call declined');
      if (_isRinging) {
        _isRinging = false;
        Navigator.pop(context); // Close ringing dialog
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Call declined')),
        );
      }
    });

    _socket.on('call-busy', (data) {
      debugPrint('📵 [OutgoingCall] User is busy');
      if (_isRinging) {
        _isRinging = false;
        Navigator.pop(context); // Close ringing dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? 'User is busy')),
        );
      }
    });

    // Emit call-user event
    _socket.emit('call-user', {
      'callerId': callerId,
      'callerName': callerDisplayName,
      'receiverId': receiverId,
      'callType': isVideo ? 'video' : 'audio',
      'channelName': channel,
    });

    // Show ringing UI
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _RingingDialog(
        name: callerName,
        avatarUrl: callerAvatar,
        onCancel: () {
          _isRinging = false;
          _socket.emit('end-call', {'userId': callerId, 'otherUserId': receiverId});
          Navigator.pop(ctx);
        },
      ),
    );
  }
}

class _RingingDialog extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  final VoidCallback onCancel;

  const _RingingDialog({required this.name, this.avatarUrl, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1A1A1A),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(
              radius: 48,
              backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl!) : const AssetImage('assets/images/Avtar.png') as ImageProvider,
            ),
            const SizedBox(height: 16),
            Text(name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Calling...', style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red, shape: const CircleBorder(), padding: const EdgeInsets.all(16)),
              onPressed: onCancel,
              child: const Icon(Icons.call_end, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}