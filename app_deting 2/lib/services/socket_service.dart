import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  IO.Socket? _socket;
  final ValueNotifier<bool> isConnected = ValueNotifier<bool>(false);
  final _listeners = <String, List<Function>>{};
  final Set<String> _attachedEvents = <String>{};

  void connect(String userId) {
    if (_socket != null && _socket!.connected) {
      debugPrint('⚠️ [SocketService] Socket already connected');
      return;
    }

    debugPrint('🔌 [SocketService] Connecting to Socket.IO server...');
    _socket = IO.io('https://admin.yaari.me', <String, dynamic>{
      'transports': ['websocket', 'polling'],
      'timeout': 20000,
      'forceNew': false,
      'reconnection': true,
      'reconnectionDelay': 500,
      'reconnectionDelayMax': 2000,
      'reconnectionAttempts': 10,
      'autoConnect': true,
    });

    // Attach any previously registered event listeners immediately
    _attachStoredListeners();

    _socket!.onConnect((_) {
      debugPrint('✅ [SocketService] Socket connected successfully');
      isConnected.value = true;
      _socket!.emit('register', userId);
      _socket!.emit('user-online', {'userId': userId, 'status': 'online'});
      _socket!.emit('get-online-users');
      debugPrint('📤 [SocketService] Emitted: register, user-online, get-online-users');
    });

    _socket!.onDisconnect((_) {
      debugPrint('🔌 [SocketService] Socket disconnected');
      isConnected.value = false;
    });

    _socket!.onConnectError((data) {
      debugPrint('❌ [SocketService] Socket connection error: $data');
    });

    _socket!.onReconnect((attempt) {
      debugPrint('🔄 [SocketService] Socket reconnected (attempt $attempt)');
      isConnected.value = true;
      // Re-register user after reconnection
      _socket!.emit('register', userId);
      _socket!.emit('user-online', {'userId': userId, 'status': 'online'});
    });

    _socket!.onReconnectAttempt((attempt) {
      debugPrint('🔄 [SocketService] Reconnection attempt $attempt');
    });

    _socket!.onReconnectError((data) {
      debugPrint('❌ [SocketService] Reconnection error: $data');
    });
  }

  void on(String event, Function callback) {
    debugPrint('👂 [SocketService] Listening to event: $event');
    _listeners.putIfAbsent(event, () => []).add(callback);
    // Ensure the event handler is attached to the socket exactly once
    if (_socket != null && !_attachedEvents.contains(event)) {
      _socket!.on(event, (data) {
        debugPrint('📥 [SocketService] Received $event: $data');
        for (final listener in _listeners[event] ?? []) {
          listener(data);
        }
      });
      _attachedEvents.add(event);
    }
  }

  // Remove listener(s) for an event. If callback is provided, remove only that one; otherwise remove all.
  void off(String event, [Function? callback]) {
    final existing = _listeners[event];
    if (existing == null || existing.isEmpty) return;
    if (callback != null) {
      existing.removeWhere((fn) => fn == callback);
      if (existing.isEmpty) {
        _listeners.remove(event);
      } else {
        _listeners[event] = existing;
      }
    } else {
      _listeners.remove(event);
    }
    // If there are no listeners left for this event, detach from the socket
    final hasAny = _listeners.containsKey(event) && (_listeners[event]?.isNotEmpty ?? false);
    if (_socket != null && !hasAny) {
      _socket!.off(event);
      _attachedEvents.remove(event);
    }
  }

  void emit(String event, dynamic data) {
    debugPrint('📤 [SocketService] Emitting $event: $data');
    _socket?.emit(event, data);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    isConnected.value = false;
    _attachedEvents.clear();
  }

  void _attachStoredListeners() {
    if (_socket == null) return;
    for (final event in _listeners.keys) {
      if (_attachedEvents.contains(event)) continue;
      _socket!.on(event, (data) {
        debugPrint('📥 [SocketService] Received $event: $data');
        for (final listener in _listeners[event] ?? []) {
          listener(data);
        }
      });
      _attachedEvents.add(event);
    }
  }
}
