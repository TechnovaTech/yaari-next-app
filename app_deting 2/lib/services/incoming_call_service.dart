import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/call_dialogs.dart' as dialogs;
import 'socket_service.dart';

class IncomingCallService {
  IncomingCallService._();
  static final IncomingCallService instance = IncomingCallService._();

  final SocketService _socket = SocketService.instance;
  GlobalKey<NavigatorState>? _navKey;
  String? _currentUserId;
  bool _started = false;

  Future<void> start({required GlobalKey<NavigatorState> navigatorKey}) async {
    if (_started) {
      debugPrint('⚠️ [IncomingCall] Already started');
      return;
    }
    debugPrint('🔔 [IncomingCall] Starting incoming call service');
    _navKey = navigatorKey;
    _started = true;
    await _connectSocket();
  }

  Future<void> _connectSocket() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user');
    if (raw == null || raw.isEmpty) return;

    try {
      final Map<String, dynamic> userData = jsonDecode(raw);
      final uid = _extractUserId(userData);
      if (uid == null || uid.isEmpty) return;
      
      _currentUserId = uid;
      debugPrint('👤 [IncomingCall] Setting up listener for user: $uid');

      // Ensure socket is connected
      if (!_socket.isConnected.value) {
        debugPrint('⚠️ [IncomingCall] Socket not connected, connecting...');
        _socket.connect(uid);
        // Wait a bit for connection
        await Future.delayed(const Duration(milliseconds: 500));
      }

      _socket.on('incoming-call', (data) {
        debugPrint('🔔 [IncomingCall] Incoming call received!');
        debugPrint('📞 [IncomingCall] Data: $data');
        
        if (data == null) {
          debugPrint('❌ [IncomingCall] Null data received');
          return;
        }

        final callerId = data['callerId']?.toString() ?? '';
        final callerName = data['callerName']?.toString() ?? 'User';
        final callType = data['callType']?.toString() ?? 'audio';
        final channelName = data['channelName']?.toString() ?? '';

        if (callerId.isEmpty || channelName.isEmpty) {
          debugPrint('❌ [IncomingCall] Missing required data');
          return;
        }

        final nav = _navKey?.currentState;
        if (nav == null || !nav.mounted) {
          debugPrint('❌ [IncomingCall] Navigator not available');
          return;
        }

        // Use post frame callback to ensure UI is ready
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!nav.mounted) return;
          
          dialogs.showIncomingCallDialog(
            nav.context,
            type: callType == 'video' ? dialogs.CallType.video : dialogs.CallType.audio,
            displayName: callerName,
            avatarUrl: null,
            onAccept: () {
              debugPrint('✅ [IncomingCall] Accepting call');
              debugPrint('📞 [IncomingCall] Channel: $channelName, Type: $callType');
              Navigator.of(nav.context).pop(); // Close dialog first
              
              _socket.emit('accept-call', {
                'callerId': callerId,
                'channelName': channelName,
                'callType': callType,
              });
              
              final route = callType == 'video' ? '/video_call' : '/audio_call';
              nav.pushNamed(route, arguments: {
                'name': callerName,
                'avatarUrl': data['avatarUrl'],
                'channel': channelName,
                'token': data['token'] ?? '',
              });
            },
            onDecline: () {
              debugPrint('❌ [IncomingCall] Declining call');
              Navigator.of(nav.context).pop(); // Close dialog first
              _socket.emit('decline-call', {'callerId': callerId});
            },
          );
        });
      });
      debugPrint('✅ [IncomingCall] Incoming call listener registered successfully');
    } catch (e) {
      debugPrint('❌ [IncomingCall] Error setting up listener: $e');
    }
  }

  String? _extractUserId(Map<String, dynamic> m) {
    // Try top-level first
    for (final k in const ['id', '_id', 'userId']) {
      final v = m[k];
      if (v != null && v.toString().isNotEmpty) return v.toString();
    }
    // Nested common containers
    final nestedKeys = ['user', 'data'];
    for (final nk in nestedKeys) {
      final inner = m[nk];
      if (inner is Map<String, dynamic>) {
        for (final k in const ['id', '_id', 'userId']) {
          final v = inner[k];
          if (v != null && v.toString().isNotEmpty) return v.toString();
        }
      }
    }
    return null;
  }

  Future<void> dispose() async {
    _socket.disconnect();
    _started = false;
  }
}