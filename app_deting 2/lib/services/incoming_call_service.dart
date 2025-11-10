import 'dart:async';
import 'dart:developer' as developer;
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
      developer.log('⚠️ Already started', name: 'IncomingCall');
      return;
    }
    developer.log('🔔 Starting incoming call service', name: 'IncomingCall');
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
      final uid = (userData['id'] ?? userData['_id'] ?? userData['userId'])?.toString();
      if (uid == null || uid.isEmpty) return;
      
      _currentUserId = uid;
      _socket.connect(uid);

      _socket.on('incoming-call', (data) {
        developer.log('📞 Incoming call from ${data['callerName']}', name: 'IncomingCall');
        final callerId = data['callerId']?.toString() ?? '';
        final callerName = data['callerName']?.toString() ?? 'User';
        final callType = data['callType']?.toString() ?? 'audio';
        final channelName = data['channelName']?.toString() ?? '';

        final nav = _navKey?.currentState;
        if (nav == null) {
          developer.log('❌ Navigator not available', name: 'IncomingCall');
          return;
        }

        dialogs.showIncomingCallDialog(
          nav.context,
          type: callType == 'video' ? dialogs.CallType.video : dialogs.CallType.audio,
          displayName: callerName,
          avatarUrl: null,
          onAccept: () {
            developer.log('✅ Accepting call', name: 'IncomingCall');
            _socket.emit('accept-call', {
              'callerId': callerId,
              'channelName': channelName,
              'callType': callType,
            });
            
            final route = callType == 'video' ? '/video_call' : '/audio_call';
            nav.pushNamed(route, arguments: {
              'name': callerName,
              'avatarUrl': null,
              'channel': channelName,
            });
          },
          onDecline: () {
            developer.log('❌ Declining call', name: 'IncomingCall');
            _socket.emit('decline-call', {'callerId': callerId});
          },
        );
      });
    } catch (e) {
      developer.log('❌ Error connecting socket: $e', name: 'IncomingCall');
    }
  }

  Future<void> dispose() async {
    _socket.disconnect();
    _started = false;
  }
}