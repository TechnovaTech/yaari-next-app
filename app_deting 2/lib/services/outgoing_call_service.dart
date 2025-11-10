import 'dart:developer' as developer;
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
    developer.log('📞 Starting ${isVideo ? 'video' : 'audio'} call to $receiverId', name: 'OutgoingCall');
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user');
    if (userJson == null) {
      developer.log('❌ No user data found', name: 'OutgoingCall');
      return;
    }

    final userData = jsonDecode(userJson);
    final callerId = userData['id'] ?? userData['_id'];
    final callerDisplayName = userData['name'] ?? 'User';
    developer.log('👤 Caller: $callerDisplayName ($callerId)', name: 'OutgoingCall');

    _isRinging = true;

    // Listen for call responses
    _socket.on('call-accepted', (data) {
      developer.log('✅ Call accepted!', name: 'OutgoingCall');
      if (_isRinging) {
        _isRinging = false;
        Navigator.pop(context); // Close ringing dialog
        Navigator.pushNamed(context, isVideo ? '/video_call' : '/audio_call', arguments: {
          'name': callerName,
          'avatarUrl': callerAvatar,
          'channel': channel,
        });
      }
    });

    _socket.on('call-declined', (_) {
      developer.log('❌ Call declined', name: 'OutgoingCall');
      if (_isRinging) {
        _isRinging = false;
        Navigator.pop(context); // Close ringing dialog
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Call declined')),
        );
      }
    });

    _socket.on('call-busy', (data) {
      developer.log('📵 User is busy', name: 'OutgoingCall');
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