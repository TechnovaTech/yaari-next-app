import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'socket_service.dart';
import 'tokens_api.dart';

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

    // Ensure socket connectivity before emitting/handling events
    if (!_socket.isConnected.value) {
      if (callerId != null && callerId.isNotEmpty) {
        _socket.connect(callerId);
        await Future.delayed(const Duration(milliseconds: 500));
      }
    }

    // Listen for call responses from server (handle both variants)
    bool handledAcceptance = false;

    Future<void> handleAccepted(dynamic data) async {
      if (handledAcceptance) return; // prevent double handling
      try {
        final Map m = (data is Map) ? data : {};
        final ch = (m['channelName'] ?? m['channel'])?.toString() ?? channel;
        if (ch.isEmpty || ch != channel) {
          // Not for this call attempt
          return;
        }

        String tok = (m['token'] ?? m['rtcToken'])?.toString() ?? '';
        if (tok.isEmpty) {
          try {
            final fetched = await TokensApi.fetchRtcToken(ch);
            if (fetched != null && fetched.isNotEmpty) {
              tok = fetched;
              debugPrint('🔑 [OutgoingCall] Fetched RTC token client-side for channel $ch');
            } else {
              debugPrint('⚠️ [OutgoingCall] Token not provided and fetch failed; proceeding (screen will fetch)');
            }
          } catch (e) {
            debugPrint('❌ [OutgoingCall] Token fetch error: $e');
          }
        }

        handledAcceptance = true;
        debugPrint('✅ [OutgoingCall] Call accepted! Channel: $ch');

        // Close the ringing dialog if visible
        if (_isRinging) {
          _isRinging = false;
          try { Navigator.of(context, rootNavigator: true).pop(); } catch (_) {}
        }

        final route = isVideo ? '/video_call' : '/audio_call';
        WidgetsBinding.instance.addPostFrameCallback((_) {
          try {
            Navigator.pushNamed(context, route, arguments: {
              'name': callerName,
              'avatarUrl': callerAvatar,
              'channel': ch,
              'token': tok, // Screen will fetch if empty
              'callerId': callerId,
              'receiverId': receiverId,
            });
          } catch (e) {
            debugPrint('❌ [OutgoingCall] Navigation failed: $e');
          }
        });
      } catch (e) {
        debugPrint('❌ [OutgoingCall] Error handling acceptance: $e');
      }
    }

    _socket.on('call-accepted', handleAccepted);
    _socket.on('accept-call', handleAccepted);

    _socket.on('call-declined', (_) {
      debugPrint('❌ [OutgoingCall] Call declined');
      if (_isRinging) {
        _isRinging = false;
        // Close via rootNavigator to ensure the dialog is dismissed
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Call declined')),
        );
      }
    });

    _socket.on('call-busy', (data) {
      debugPrint('📵 [OutgoingCall] User is busy');
      if (_isRinging) {
        _isRinging = false;
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(data['message'] ?? 'User is busy')),
        );
      }
    });

    // Emit call-user event (backend should notify receiver via 'incoming-call')
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