import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../config/agora.dart';

enum CallType { audio, video }

class CallService {
  CallService._();
  static final CallService instance = CallService._();

  late final RtcEngine _engine;
  bool _initialized = false;
  int? remoteUid;
  String? channelName;
  CallType _currentType = CallType.audio;
  final ValueNotifier<bool> joined = ValueNotifier<bool>(false);
  final ValueNotifier<bool> speakerOn = ValueNotifier<bool>(false);
  static const platform = MethodChannel('com.example.app_deting/audio');

  Future<void> initialize({required CallType type}) async {
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
        if (remoteUid == uid) remoteUid = null;
      },
      onLeaveChannel: (RtcConnection connection, RtcStats stats) {
        joined.value = false;
        remoteUid = null;
      },
    ));

    await _engine.enableAudio();
    // Set default audio routing based on call type
    await _engine.setDefaultAudioRouteToSpeakerphone(type == CallType.video);
    await _engine.setAudioScenario(
      AudioScenarioType.audioScenarioCommunication,
    );
    if (type == CallType.video) {
      await _engine.enableVideo();
    }
    _currentType = type;
    _initialized = true;
  }

  Future<void> join({required String channel, CallType type = CallType.video, String token = '', int uid = 0}) async {
    await initialize(type: type);
    channelName = channel;
    _currentType = type;
    if (type == CallType.video) {
      await _engine.startPreview();
    }
    final options = ChannelMediaOptions(
      clientRoleType: ClientRoleType.clientRoleBroadcaster,
      channelProfile: ChannelProfileType.channelProfileCommunication,
      publishCameraTrack: type == CallType.video,
      publishMicrophoneTrack: true,
    );
    debugPrint('🔗 [CallService] join: channel=$channel, uid=$uid, type=${type.name}, token=${token.isEmpty ? '(empty)' : '(provided)'}');
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
      return;
    }
    // Adjust audio route shortly after joining
    Future.delayed(const Duration(milliseconds: 1000), () {
      _setAudioRouting(_currentType == CallType.video);
    });
  }

  Future<void> leave() async {
    try {
      await _engine.leaveChannel();
      await _engine.stopPreview();
      joined.value = false;
      remoteUid = null;
    } catch (_) {}
  }

  Future<void> dispose() async {
    try {
      await leave();
      await _engine.release();
    } catch (_) {}
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
}