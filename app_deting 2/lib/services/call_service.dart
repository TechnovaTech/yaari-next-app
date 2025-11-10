import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
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
  final ValueNotifier<bool> speakerOn = ValueNotifier<bool>(true);

  Future<void> initialize({required CallType type}) async {
    if (_initialized) return;
    _engine = createAgoraRtcEngine();
    await _engine.initialize(const RtcEngineContext(
      appId: AgoraConfig.appId,
      channelProfile: ChannelProfileType.channelProfileCommunication,
    ));

    _engine.registerEventHandler(RtcEngineEventHandler(
      onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
        joined.value = true;
      },
      onUserJoined: (RtcConnection connection, int uid, int elapsed) {
        remoteUid = uid;
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
    // Default route to speakerphone for clearer audio.
    try {
      await _engine.setEnableSpeakerphone(true);
      speakerOn.value = true;
    } catch (_) {}
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
    try {
      final bool next = !speakerOn.value;
      await _engine.setEnableSpeakerphone(next);
      speakerOn.value = next;
    } catch (_) {}
  }
}