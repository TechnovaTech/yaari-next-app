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
  bool _awaitingAcceptedNavigate = false;
  String? _pendingCallerName;
  String? _pendingAvatarUrl;
  String _pendingCallType = 'audio';
  String? _pendingChannelName;
  String? _pendingCallerId;

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

        // Cache pending details for accept-driven navigation
        _pendingCallerName = callerName;
        _pendingCallerId = callerId;
        _pendingAvatarUrl = data['avatarUrl']?.toString();
        _pendingCallType = callType;
        _pendingChannelName = channelName;

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
              
              _socket.emit('accept-call', {
                'callerId': callerId,
                'channelName': channelName,
                'callType': callType,
              });
              // If token already provided in invite, navigate immediately; otherwise wait for call-accepted
              final tokenFromInvite = (data['token'] ?? data['rtcToken'])?.toString() ?? '';
              final uidFromInvite = (data['uid'] ?? data['agoraUid'] ?? data['rtcUid'])?.toString();
              if (tokenFromInvite.isNotEmpty) {
                final route = callType == 'video' ? '/video_call' : '/audio_call';
                nav.pushNamed(route, arguments: {
                  'name': callerName,
                  'avatarUrl': data['avatarUrl'],
                  'channel': channelName,
                  'token': tokenFromInvite,
                  'callerId': callerId,
                  if (uidFromInvite != null) 'uid': uidFromInvite,
                });
              } else {
                _awaitingAcceptedNavigate = true;
                // Fallback: if server doesn't emit call-accepted promptly, navigate with empty token
                Future.delayed(const Duration(seconds: 3), () {
                  final nav2 = _navKey?.currentState;
                  if (!_awaitingAcceptedNavigate || nav2 == null || !nav2.mounted) return;
                  final route = callType == 'video' ? '/video_call' : '/audio_call';
                  debugPrint('⏳ [IncomingCall] call-accepted not received, navigating with empty token');
                  nav2.pushNamed(route, arguments: {
                    'name': callerName,
                    'avatarUrl': data['avatarUrl'],
                    'channel': channelName,
                    'token': '',
                    'callerId': callerId,
                    if (uidFromInvite != null) 'uid': uidFromInvite,
                  });
                  _awaitingAcceptedNavigate = false;
                });
              }
            },
            onDecline: () {
              debugPrint('❌ [IncomingCall] Declining call');
              _socket.emit('decline-call', {'callerId': callerId});
            },
          );
        });
      });
      
      // Navigate upon server acceptance when token is generated server-side
      _socket.on('call-accepted', (data) {
        try {
          if (!_awaitingAcceptedNavigate) return;
          final nav = _navKey?.currentState;
          if (nav == null || !nav.mounted) return;
          final token = (data is Map && (data['token'] != null || data['rtcToken'] != null))
              ? (data['token'] ?? data['rtcToken']).toString()
              : '';
          final ch = (data is Map && (data['channelName'] != null || data['channel'] != null))
              ? (data['channelName'] ?? data['channel']).toString()
              : (_pendingChannelName ?? '');
          final uidArg = (data is Map && (data['uid'] != null || data['agoraUid'] != null || data['rtcUid'] != null))
              ? (data['uid'] ?? data['agoraUid'] ?? data['rtcUid']).toString()
              : null;
          if (token.isEmpty || ch.isEmpty) {
            debugPrint('❌ [IncomingCall] call-accepted missing token/channel');
            return;
          }
          final route = _pendingCallType == 'video' ? '/video_call' : '/audio_call';
          nav.pushNamed(route, arguments: {
            'name': _pendingCallerName ?? 'User',
            'avatarUrl': _pendingAvatarUrl,
            'channel': ch,
            'token': token,
            'callerId': _pendingCallerId,
            if (uidArg != null) 'uid': uidArg,
          });
        } finally {
          _awaitingAcceptedNavigate = false;
        }
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