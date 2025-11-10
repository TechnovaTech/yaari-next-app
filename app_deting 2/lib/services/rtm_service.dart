import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:agora_rtm/agora_rtm.dart';
import '../config/agora.dart';

class RtmService {
  RtmService._();
  static final RtmService instance = RtmService._();

  RtmClient? _client;
  bool _loggedIn = false;
  String? _uid;

  final ValueNotifier<bool> isConnected = ValueNotifier<bool>(false);
  final List<void Function(Map<String, dynamic> message)> _listeners = [];

  Future<void> initialize() async {
    if (_client != null) return;
    // RtmClient is created during login with user-bound config in v2 API.
  }

  Future<void> login(String uid, {String? token}) async {
    await initialize();
    if (_loggedIn && _uid == uid) return;
    // Create client with appId and userId for v2 API
    final created = await RTM(AgoraConfig.appId, uid);
    _client = created.$2; // (RtmStatus, RtmClient)
    if (_client == null) {
      throw StateError('Failed to create RTM client');
    }
    // Listen for messages
    _client!.addListener(message: (MessageEvent event) {
      try {
        final dynamic payload = event.message;
        String? text;
        if (payload is String) {
          text = payload;
        } else if (payload is Uint8List) {
          text = utf8.decode(payload);
        }
        if (text == null) return;
        final Map<String, dynamic> m = jsonDecode(text);
        for (final l in _listeners) {
          l({...m, 'channel': event.channelName});
        }
      } catch (_) {}
    });

    // Login with RTM token
    await _client!.login(token ?? '');

    _loggedIn = true;
    _uid = uid;

    // Subscribe to user-specific channel to receive peer messages
    await _client!.subscribe(_userChannel(uid), withMessage: true);
  }

  Future<void> logout() async {
    if (_client == null || !_loggedIn) return;
    try {
      await _client!.logout();
      await _client!.release();
    } catch (_) {}
    _loggedIn = false;
    _uid = null;
    _client = null;
  }

  Future<void> sendPeerMessage(String peerId, Map<String, dynamic> message) async {
    if (_client == null) return;
    final text = jsonEncode(message);
    await _client!.publish(_userChannel(peerId), text, channelType: RtmChannelType.message, storeInHistory: true);
  }

  String _userChannel(String uid) => 'user_$uid';

  void addListener(void Function(Map<String, dynamic>) listener) {
    _listeners.add(listener);
  }

  void removeListener(void Function(Map<String, dynamic>) listener) {
    _listeners.remove(listener);
  }

  String? get currentUserId => _uid;
}