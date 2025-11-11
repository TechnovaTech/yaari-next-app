import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/call_dialogs.dart' as dialogs;
import 'socket_service.dart';
import 'tokens_api.dart';
import 'analytics_service.dart';

class IncomingCallService {
  IncomingCallService._();
  static final IncomingCallService instance = IncomingCallService._();

  final SocketService _socket = SocketService.instance;
  GlobalKey<NavigatorState>? _navKey;
  String? _currentUserId;
  bool _started = false;
  bool _incomingDialogActive = false;
  String? _incomingCallerId;
  String? _incomingChannelName;
  
  void _closeIncomingDialog() {
    final nav = _navKey?.currentState;
    if (nav != null && nav.mounted) {
      try {
        // Use rootNavigator to match showDialog default behavior
        Navigator.of(nav.context, rootNavigator: true).pop();
      } catch (_) {}
    }
    _incomingDialogActive = false;
    _incomingCallerId = null;
    _incomingChannelName = null;
  }

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
        final callerGender = data['callerGender']?.toString();

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

          // Track active incoming dialog to support cancellation
          _incomingDialogActive = true;
          _incomingCallerId = callerId;
          _incomingChannelName = channelName;

          // Track incoming ring
          AnalyticsService.instance.trackCallEvent(
            action: 'initiated',
            callType: callType == 'video' ? 'video' : 'audio',
            callerId: callerId,
            receiverId: _currentUserId,
            channelName: channelName,
          );

          dialogs.showIncomingCallDialog(
            nav.context,
            type: callType == 'video' ? dialogs.CallType.video : dialogs.CallType.audio,
            displayName: callerName,
            avatarUrl: data['avatarUrl'],
            gender: callerGender,
            onAccept: () async {
              debugPrint('✅ [IncomingCall] Accepting call');
              _incomingDialogActive = false;

              AnalyticsService.instance.trackCallEvent(
                action: 'accepted',
                callType: callType == 'video' ? 'video' : 'audio',
                callerId: callerId,
                receiverId: _currentUserId,
                channelName: channelName,
              );

              _socket.emit('accept-call', {
                'callerId': callerId,
                'channelName': channelName,
                'callType': callType,
              });

              // ✅ FIX: Always fetch fresh token before navigating
              final token = await TokensApi.fetchRtcToken(channelName);
              if (token == null || token.isEmpty) {
                debugPrint('❌ [IncomingCall] Failed to get token');
                ScaffoldMessenger.of(nav.context).showSnackBar(
                  const SnackBar(content: Text('Failed to connect. Please try again.')),
                );
                return;
              }

              final route = callType == 'video' ? '/video_call' : '/audio_call';
              debugPrint('🔑 [IncomingCall] Got token, navigating to $route');
              // Schedule navigation on next frame to avoid Navigator lock
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (!nav.mounted) return;
                try {
                  nav.pushNamed(route, arguments: {
                    'name': callerName,
                    'avatarUrl': data['avatarUrl'],
                    'gender': callerGender,
                    'channel': channelName,
                    'token': token, // ✅ Valid token
                    'callerId': callerId,
                    'receiverId': _currentUserId,
                  });
                } catch (e) {
                  debugPrint('❌ [IncomingCall] Navigation failed: $e');
                }
              });
            },
            onDecline: () {
              debugPrint('❌ [IncomingCall] Declining call');
              _incomingDialogActive = false;
              AnalyticsService.instance.trackCallEvent(
                action: 'declined',
                callType: callType == 'video' ? 'video' : 'audio',
                callerId: callerId,
                receiverId: _currentUserId,
                channelName: channelName,
              );
              _socket.emit('decline-call', {'callerId': callerId});
            },
          );
        });
      });

      // Listen for caller cancelling/ending before accept and close dialog
      _socket.on('end-call', (data) {
        try {
          final Map m = (data is Map) ? data : {};
          final u1 = m['userId']?.toString();
          final u2 = m['otherUserId']?.toString();
          final ch = (m['channelName'] ?? m['channel'])?.toString() ?? '';
          // Narrow matching: only close if caller matches or channel matches the active incoming dialog
          final matchesCaller = _incomingCallerId != null && (u1 == _incomingCallerId || u2 == _incomingCallerId);
          final matchesChannel = _incomingChannelName != null && ch.isNotEmpty && ch == _incomingChannelName;
          if (_incomingDialogActive && (matchesCaller || matchesChannel)) {
            debugPrint('🔚 [IncomingCall] Caller ended/cancelled — closing incoming dialog');
            _closeIncomingDialog();
          }
        } catch (_) {}
      });

      // Also close on explicit declined/cancelled variants
      for (final evt in const ['call-declined', 'call-cancelled', 'call-canceled']) {
        _socket.on(evt, (data) {
          try {
            final Map m = (data is Map) ? data : {};
            final u1 = m['userId']?.toString();
            final u2 = m['otherUserId']?.toString();
            final matchesCaller = _incomingCallerId != null && (u1 == _incomingCallerId || u2 == _incomingCallerId);
            if (_incomingDialogActive && matchesCaller) {
              debugPrint('🔚 [IncomingCall] $evt received — closing incoming dialog');
              _closeIncomingDialog();
            }
          } catch (_) {}
        });
      }

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