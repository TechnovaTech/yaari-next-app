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

  RtcEngine? _engine;
  bool _initialized = false;
  bool _joining = false;
  int? remoteUid;
  // Notify UI when remote user joins/leaves so video view can update
  final ValueNotifier<int?> remoteUidNotifier = ValueNotifier<int?>(null);
  String? channelName;
  CallType _currentType = CallType.audio;
  final ValueNotifier<bool> joined = ValueNotifier<bool>(false);
  final ValueNotifier<bool> speakerOn = ValueNotifier<bool>(false);
  final ValueNotifier<bool> muted = ValueNotifier<bool>(false);
  // Notifies when remote peer ends the call (detected via Agora callbacks)
  final ValueNotifier<bool> peerEnded = ValueNotifier<bool>(false);
  static const platform = MethodChannel('com.example.app_deting/audio');

  // Helper: initialize and configure Agora engine with proper defaults
  Future<void> initializeAgoraEngine({required CallType type}) async {
    if (!_initialized) {
      try {
        _engine = createAgoraRtcEngine();
        await _engine!.initialize(const RtcEngineContext(
          appId: AgoraConfig.appId,
          channelProfile: ChannelProfileType.channelProfileCommunication,
        ));
      } catch (e) {
        debugPrint('❌ [CallService] Engine initialization failed: $e');
        _initialized = false;
        rethrow;
      }

      _engine!.registerEventHandler(RtcEngineEventHandler(
      onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
        debugPrint('🎉 [CallService] Joined channel successfully!');
        joined.value = true;
      },
      onUserJoined: (RtcConnection connection, int uid, int elapsed) {
        debugPrint('👤 [CallService] Remote user joined: $uid');
        remoteUid = uid;
        remoteUidNotifier.value = uid;
        // Ensure remote video is actively subscribed and unmuted
        try { _engine?.muteRemoteVideoStream(uid: uid, mute: false); } catch (_) {}
        try { _engine?.setRemoteVideoStreamType(uid: uid, streamType: VideoStreamType.videoStreamHigh); } catch (_) {}
        // Adjust audio routing shortly after remote join
        Future.delayed(const Duration(milliseconds: 500), () {
          _setAudioRouting(_currentType == CallType.video);
        });
      },
      onUserOffline: (RtcConnection connection, int uid, UserOfflineReasonType reason) {
        debugPrint('🚪 [CallService] User $uid offline: $reason');
        if (remoteUid == uid) {
          remoteUid = null;
          remoteUidNotifier.value = null;
        }
        // If the remote user quit the channel, mark peerEnded so UI can auto-close
        if (reason == UserOfflineReasonType.userOfflineQuit) {
          debugPrint('🏁 [CallService] Remote user ended call');
          peerEnded.value = true;
        }
      },
      onLeaveChannel: (RtcConnection connection, RtcStats stats) {
        debugPrint('🚪 [CallService] Left channel');
        joined.value = false;
        remoteUid = null;
        remoteUidNotifier.value = null;
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

      await _engine!.enableAudio();
      // Use meeting scenario for wide device compatibility
      try { await _engine!.setAudioScenario(AudioScenarioType.audioScenarioMeeting); } catch (_) {}
      // Default route: speakerphone
      try { await _engine!.setDefaultAudioRouteToSpeakerphone(true); } catch (_) {}
      _initialized = true;
    }
    // Always apply current call type to media pipeline, even if engine already initialized
    _currentType = type;
    if (type == CallType.video) {
      try { await _engine?.enableVideo(); } catch (_) {}
      try { await _engine?.startPreview(); } catch (_) {}
    } else {
      // Explicitly disable video pipeline for audio-only to avoid decoder warnings
      try { await _engine?.disableVideo(); } catch (_) {}
    }
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
    peerEnded.value = false; // reset any previous end state
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
      try { await _engine?.startPreview(); } catch (_) {}
    }
    final options = ChannelMediaOptions(
      clientRoleType: ClientRoleType.clientRoleBroadcaster,
      channelProfile: ChannelProfileType.channelProfileCommunication,
      publishCameraTrack: type == CallType.video,
      publishMicrophoneTrack: true,
    );
    debugPrint('🔗 [CallService] join: channel=$channel, uid=$uid, type=${type.name}, token=(provided)');
    try {
      await _engine!.joinChannel(
        token: token,
        channelId: channel,
        uid: uid,
        options: options,
      );
      // Ensure audio streams are unmuted
      try { await _engine!.enableLocalAudio(true); } catch (_) {}
      try { await _engine!.muteLocalAudioStream(false); } catch (_) {}
      try { await _engine!.muteAllRemoteAudioStreams(false); } catch (_) {}
      muted.value = false;
      // Actively route to speaker
      try { await _engine!.setEnableSpeakerphone(true); } catch (_) {}
      try { await _engine!.setDefaultAudioRouteToSpeakerphone(true); } catch (_) {}
      speakerOn.value = true;
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
      await _engine?.leaveChannel();
      try { await _engine?.stopPreview(); } catch (_) {}
      joined.value = false;
      remoteUid = null;
      channelName = null;
      peerEnded.value = false;
      debugPrint('✅ [CallService] Left channel and stopped preview');
    } catch (e) {
      debugPrint('❌ [CallService] leave failed: $e');
    }
  }

  bool _disposing = false;

  Future<void> dispose() async {
    if (_disposing) {
      debugPrint('⚠️ [CallService] Already disposing, skipping');
      return;
    }
    _disposing = true;
    debugPrint('🧹 [CallService] Disposing engine...');
    if (!_initialized) {
      debugPrint('⚠️ [CallService] Engine not initialized, skipping dispose');
      _disposing = false;
      return;
    }
    try {
      if (joined.value) {
        await leave();
      }
      // Small delay to ensure leave completes
      await Future.delayed(const Duration(milliseconds: 300));
      await _engine?.release();
      _engine = null;
      _initialized = false;
      debugPrint('✅ [CallService] Engine released');
    } catch (e) {
      debugPrint('❌ [CallService] dispose failed: $e');
      _engine = null;
      _initialized = false;
    }
    channelName = null;
    speakerOn.value = false;
    muted.value = false;
    remoteUid = null;
    remoteUidNotifier.value = null;
    peerEnded.value = false;
    _disposing = false;
  }

  RtcEngine? get engine => _engine;

  Future<void> toggleSpeaker() async {
    final bool next = !speakerOn.value;
    await _setAudioRouting(next);
  }

  Future<void> _setAudioRouting(bool useSpeaker) async {
    try {
      // Try routing via Agora engine too, for runtime switching
      try { await _engine?.setEnableSpeakerphone(useSpeaker); } catch (_) {}
      try { await _engine?.setDefaultAudioRouteToSpeakerphone(useSpeaker); } catch (_) {}
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

  Future<void> toggleMute() async {
    final bool next = !muted.value;
    try { await _engine?.muteLocalAudioStream(next); } catch (_) {}
    muted.value = next;
    debugPrint('🎙️ [CallService] Local mic ${next ? "muted" : "unmuted"}');
  }

  // Lifecycle helpers to be called from screens
  Future<void> onLifecyclePaused() async {
    debugPrint('⏸️ [CallService] App paused: keeping connection alive');
    // DO NOT mute or stop - keep the call running in background
    // Only reduce quality if needed
    if (_currentType == CallType.video) {
      try { await _engine?.muteLocalVideoStream(true); } catch (_) {}
    }
  }

  Future<void> onLifecycleResumed() async {
    debugPrint('▶️ [CallService] App resumed: restoring video');
    if (_currentType == CallType.video) {
      try { await _engine?.muteLocalVideoStream(false); } catch (_) {}
      try { await _engine?.startPreview(); } catch (_) {}
    }
  }
}