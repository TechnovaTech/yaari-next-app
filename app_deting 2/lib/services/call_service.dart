import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../config/agora.dart';
import 'tokens_api.dart';

enum CallType { audio, video }

class CallService {
  CallService._();
  static final CallService instance = CallService._();

  late final RtcEngine _engine;
  bool _initialized = false;
  bool _joining = false;
  int? remoteUid;
  String? channelName;
  CallType _currentType = CallType.audio;
  final ValueNotifier<bool> joined = ValueNotifier<bool>(false);
  final ValueNotifier<bool> speakerOn = ValueNotifier<bool>(false);
  static const platform = MethodChannel('com.example.app_deting/audio');

  // Helper: initialize and configure Agora engine with proper defaults
  Future<void> initializeAgoraEngine({required CallType type}) async {
    if (_initialized) return;
    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(
      appId: AgoraConfig.appId,
      channelProfile: ChannelProfileType.channelProfileCommunication,
    ));

    _engine.registerEventHandler(RtcEngineEventHandler(
      onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
        debugPrint('🎉 [CallService] Joined channel successfully!');
        joined.value = true;
      },
      onUserJoined: (RtcConnection connection, int uid, int elapsed) {
        debugPrint('👤 [CallService] Remote user joined: $uid');
        remoteUid = uid;
        // Adjust audio routing shortly after remote join
        Future.delayed(const Duration(milliseconds: 500), () {
          _setAudioRouting(_currentType == CallType.video);
        });
      },
      onUserOffline: (RtcConnection connection, int uid, UserOfflineReasonType reason) {
        debugPrint('🚪 [CallService] User $uid offline: $reason');
        if (remoteUid == uid) remoteUid = null;
      },
      onLeaveChannel: (RtcConnection connection, RtcStats stats) {
        debugPrint('🚪 [CallService] Left channel');
        joined.value = false;
        remoteUid = null;
      },
      onConnectionLost: (RtcConnection connection) {
        debugPrint('⚠️ [CallService] Connection lost - attempting to reconnect');
      },
      onConnectionStateChanged: (RtcConnection connection, ConnectionStateType state, ConnectionChangedReasonType reason) {
        debugPrint('🔌 [CallService] Connection state: $state, reason: $reason');
      },
      onError: (ErrorCodeType err, String msg) {
        debugPrint('❌ [CallService] Error: $err - $msg');
      },
    ));

    await _engine.enableAudio();
    // Dating app default: route audio to speakerphone
    await _engine.setDefaultAudioRouteToSpeakerphone(true);
    await _engine.setAudioScenario(AudioScenarioType.audioScenarioMeeting);
    if (type == CallType.video) {
      await _engine.enableVideo();
    } else {
      // Explicitly disable video pipeline for audio-only to avoid decoder warnings
      try { await _engine.disableVideo(); } catch (_) {}
    }
    _currentType = type;
    _initialized = true;
  }

  // Backward-compatible wrapper used by existing callers
  Future<void> initialize({required CallType type}) => initializeAgoraEngine(type: type);

  Future<void> join({required String channel, CallType type = CallType.video, String token = '', int uid = 0}) async {
    await initializeAgoraEngine(type: type);
    if (_joining) {
      debugPrint('⚠️ [CallService] join ignored; already joining');
      return;
    }
    _joining = true;
    channelName = channel;
    _currentType = type;
    // Gate join on valid token: fetch from backend if missing
    if (token.isEmpty) {
      debugPrint('🔎 [CallService] Token empty; fetching via HTTP for channel=$channel');
      final fetched = await TokensApi.fetchRtcToken(channel);
      if (fetched == null || fetched.isEmpty) {
        debugPrint('❌ [CallService] Failed to fetch RTC token; aborting join');
        _joining = false;
        joined.value = false;
        return;
      }
      token = fetched;
      debugPrint('🔑 [CallService] Using fetched RTC token');
    }
    if (type == CallType.video) {
      try { await _engine.startPreview(); } catch (_) {}
    }
    final options = ChannelMediaOptions(
      clientRoleType: ClientRoleType.clientRoleBroadcaster,
      channelProfile: ChannelProfileType.channelProfileCommunication,
      publishCameraTrack: type == CallType.video,
      publishMicrophoneTrack: true,
    );
    debugPrint('🔗 [CallService] join: channel=$channel, uid=$uid, type=${type.name}, token=(provided)');
    try {
      await _engine.joinChannel(
        token: token,
        channelId: channel,
        uid: uid,
        options: options,
      );
      // Ensure audio streams are unmuted
      try { await _engine.muteLocalAudioStream(false); } catch (_) {}
      try { await _engine.muteAllRemoteAudioStreams(false); } catch (_) {}
    } catch (e) {
      debugPrint('❌ [CallService] joinChannel failed: $e');
      joined.value = false;
      _joining = false;
      return;
    }
    // Adjust audio route shortly after joining (speakerphone default)
    Future.delayed(const Duration(milliseconds: 800), () {
      _setAudioRouting(true);
    });
    _joining = false;
  }

  Future<void> leave() async {
    if (!_initialized || !joined.value) {
      debugPrint('⚠️ [CallService] Not in channel, skipping leave');
      return;
    }
    debugPrint('↩️ [CallService] Leaving channel...');
    try {
      await _engine.leaveChannel();
      try { await _engine.stopPreview(); } catch (_) {}
      joined.value = false;
      remoteUid = null;
      channelName = null;
      debugPrint('✅ [CallService] Left channel and stopped preview');
    } catch (e) {
      debugPrint('❌ [CallService] leave failed: $e');
    }
  }

  Future<void> dispose() async {
    debugPrint('🧹 [CallService] Disposing engine...');
    if (!_initialized) {
      debugPrint('⚠️ [CallService] Engine not initialized, skipping dispose');
      return;
    }
    try {
      await leave();
      // Reset audio mode to normal
      try { await platform.invokeMethod('resetAudio'); } catch (_) {}
      // Small delay to ensure leave completes
      await Future.delayed(const Duration(milliseconds: 300));
      await _engine.release();
      debugPrint('✅ [CallService] Engine released');
    } catch (e) {
      debugPrint('❌ [CallService] dispose failed: $e');
    }
    _initialized = false;
    channelName = null;
  }

  RtcEngine get engine => _engine;

  Future<void> toggleSpeaker() async {
    final bool next = !speakerOn.value;
    await _setAudioRouting(next);
  }

  Future<void> _setAudioRouting(bool useSpeaker) async {
    try {
      // Try routing via Agora engine too, for runtime switching
      try { await _engine.setDefaultAudioRouteToSpeakerphone(useSpeaker); } catch (_) {}
      if (useSpeaker) {
        await platform.invokeMethod('setSpeakerOn');
      } else {
        await platform.invokeMethod('setSpeakerOff');
      }
      speakerOn.value = useSpeaker;
      debugPrint('🔊 [CallService] Audio routing: ${useSpeaker ? "Speaker" : "Earpiece"}');
    } catch (e) {
      debugPrint('❌ [CallService] Audio routing failed: $e');
    }
  }

  // Lifecycle helpers to be called from screens
  Future<void> onLifecyclePaused() async {
    debugPrint('⏸️ [CallService] App paused: keeping connection alive');
    // DO NOT mute or stop - keep the call running in background
    // Only reduce quality if needed
    if (_currentType == CallType.video) {
      try { await _engine.muteLocalVideoStream(true); } catch (_) {}
    }
  }

  Future<void> onLifecycleResumed() async {
    debugPrint('▶️ [CallService] App resumed: restoring video');
    if (_currentType == CallType.video) {
      try { await _engine.muteLocalVideoStream(false); } catch (_) {}
      try { await _engine.startPreview(); } catch (_) {}
    }
  }
}