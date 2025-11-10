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
        // Set earpiece when remote user joins
        Future.delayed(const Duration(milliseconds: 500), () {
          _setAudioRouting(false);
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
    // Set default audio routing to earpiece
    await _engine.setDefaultAudioRouteToSpeakerphone(false);
    await _engine.setAudioScenario(
      AudioScenarioType.audioScenarioDefault,
    );
    if (type == CallType.video) {
      await _engine.enableVideo();
    }
    _initialized = true;
  }

  Future<void> join({required String channel, CallType type = CallType.video, String token = ''}) async {
    await initialize(type: type);
    channelName = channel;
    if (type == CallType.video) {
      await _engine.startPreview();
    }
    final options = ChannelMediaOptions(
      clientRoleType: ClientRoleType.clientRoleBroadcaster,
      channelProfile: ChannelProfileType.channelProfileCommunication,
      publishCameraTrack: type == CallType.video,
      publishMicrophoneTrack: true,
    );
    await _engine.joinChannel(
      token: token,
      channelId: channel,
      uid: 0,
      options: options,
    );
    // Set earpiece immediately after joining
    Future.delayed(const Duration(milliseconds: 1000), () {
      _setAudioRouting(false);
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