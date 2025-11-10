import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  IO.Socket? _socket;
  final ValueNotifier<bool> isConnected = ValueNotifier<bool>(false);
  final _listeners = <String, List<Function>>{};

  void connect(String userId) {
    if (_socket != null && _socket!.connected) {
      developer.log('⚠️ Socket already connected', name: 'SocketService');
      return;
    }

    developer.log('🔌 Connecting to Socket.IO server...', name: 'SocketService');
    _socket = IO.io('https://admin.yaari.me', <String, dynamic>{
      'transports': ['websocket', 'polling'],
      'timeout': 20000,
      'forceNew': true,
      'reconnection': true,
      'reconnectionDelay': 1000,
      'reconnectionAttempts': 5,
    });

    _socket!.onConnect((_) {
      developer.log('✅ Socket connected successfully', name: 'SocketService');
      isConnected.value = true;
      _socket!.emit('register', userId);
      _socket!.emit('user-online', {'userId': userId, 'status': 'online'});
      _socket!.emit('get-online-users');
      developer.log('📤 Emitted: register, user-online, get-online-users', name: 'SocketService');
    });

    _socket!.onDisconnect((_) {
      developer.log('🔌 Socket disconnected', name: 'SocketService');
      isConnected.value = false;
    });

    _socket!.onConnectError((data) {
      developer.log('❌ Socket connection error: $data', name: 'SocketService');
    });

    _socket!.onReconnect((attempt) {
      developer.log('🔄 Socket reconnected (attempt $attempt)', name: 'SocketService');
    });
  }

  void on(String event, Function callback) {
    developer.log('👂 Listening to event: $event', name: 'SocketService');
    _listeners.putIfAbsent(event, () => []).add(callback);
    _socket?.on(event, (data) {
      developer.log('📥 Received $event: $data', name: 'SocketService');
      callback(data);
    });
  }

  void emit(String event, dynamic data) {
    developer.log('📤 Emitting $event: $data', name: 'SocketService');
    _socket?.emit(event, data);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    isConnected.value = false;
  }
}
