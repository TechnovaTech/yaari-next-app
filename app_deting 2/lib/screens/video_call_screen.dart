import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import '../services/call_service.dart';
import '../services/socket_service.dart';
import '../services/tokens_api.dart';
import '../services/call_log_api.dart';
import '../services/analytics_service.dart';
import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/users_api.dart';

class VideoCallScreen extends StatefulWidget {
  const VideoCallScreen({super.key});

  @override
  State<VideoCallScreen> createState() => _VideoCallScreenState();
}

class _VideoCallScreenState extends State<VideoCallScreen> with WidgetsBindingObserver {
  
  static const Color accent = Color(0xFFFF8547);
  final _service = CallService.instance;
  String _channel = 'yarri_${DateTime.now().millisecondsSinceEpoch}';
  String _displayName = 'User Name';
  String? _avatarUrl;
  String? _gender;
  String _token = '';
  int _uid = 0;
  bool _initialized = false;
  String? _callerId;
  String? _receiverId;
  bool _endListenerAdded = false;
  bool _acceptedListenerAdded = false;
  bool _peerEndSubscribed = false;
  bool _closing = false;
  DateTime? _joinedAt;
  String _callDuration = '00:00';
  Timer? _timer;
  // In-call controls
  bool _micMuted = false;
  bool _videoMuted = false;
  // Coins and rate handling
  int _ratePerMin = 0; // coins per minute for video
  int _remainingBalance = 0;
  double _coinAccumulator = 0.0;
  bool _deductInFlight = false;
  String? _currentUserId;
  bool _isCaller = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map) {
        final n = args['name']?.toString();
        if (n != null && n.isNotEmpty) _displayName = n;
        final ch = args['channel']?.toString();
        if (ch != null && ch.isNotEmpty) _channel = ch;
        final av = args['avatarUrl']?.toString();
        if (av != null && av.isNotEmpty) _avatarUrl = av;
        final gn = args['gender']?.toString();
        if (gn != null && gn.isNotEmpty) _gender = gn;
        final tk = args['token']?.toString() ?? args['rtcToken']?.toString();
        if (tk != null && tk.isNotEmpty) _token = tk;
        final uidArg = args['uid']?.toString();
        final parsed = int.tryParse(uidArg ?? '');
        if (parsed != null) _uid = parsed;
        final cId = args['callerId']?.toString();
        final rId = args['receiverId']?.toString();
        if (cId != null && cId.isNotEmpty) _callerId = cId;
        if (rId != null && rId.isNotEmpty) _receiverId = rId;
      }
      _initialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _initBillingContext().then((_) => _start());
      });
    }
  }

  Future<void> _initBillingContext() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('user');
      String? uid;
      if (raw != null && raw.isNotEmpty) {
        try {
          final obj = jsonDecode(raw);
          if (obj is Map<String, dynamic>) {
            final inner = (obj['user'] is Map<String, dynamic>)
                ? obj['user'] as Map<String, dynamic>
                : (obj['data'] is Map<String, dynamic>)
                    ? obj['data'] as Map<String, dynamic>
                    : obj;
            uid = (inner['id'] ?? inner['_id'] ?? inner['userId'])?.toString();
          }
        } catch (_) {}
      }
      _currentUserId = uid;
      _isCaller = (_callerId != null && uid != null && _callerId == uid);

      final settings = await UsersApi.fetchSettings();
      _ratePerMin = settings.videoCallRate;
      if (uid != null) {
        final bal = await UsersApi.fetchBalance(uid);
        if (bal != null) _remainingBalance = bal;
      }

      // In-call billing: start call normally; auto-end occurs when coins run out
    } catch (e) {
      debugPrint('⚠️ [VideoCall] init billing error: $e');
    }
  }

  Future<void> _start() async {
    await [Permission.camera, Permission.microphone].request();
    // Gate join on valid token fetched from backend
    if (_token.isEmpty) {
      debugPrint('🔎 [VideoCall] Token empty; fetching from backend');
      final tok = await TokensApi.fetchRtcToken(_channel);
      if (tok == null || tok.isEmpty) {
        debugPrint('❌ [VideoCall] Failed to fetch RTC token; not joining');
        return;
      }
      _token = tok;
      debugPrint('🔑 [VideoCall] Using fetched RTC token');
    }
    debugPrint('🎥 [VideoCall] Joining channel: $_channel with token: (provided)');
    await _service.join(channel: _channel, type: CallType.video, token: _token, uid: _uid);
    if (mounted) setState(() {});
    _maybeAddEndListener();
    _maybeAddAcceptedListener();
    _maybeSubscribePeerEnded();
    _maybeSubscribeJoinedForLogging('video');
  }

  void _maybeAddEndListener() {
    if (_endListenerAdded) return;
    _endListenerAdded = true;
    SocketService.instance.on('end-call', (data) async {
      try {
        final Map m = (data is Map) ? data : {};
        final ch = (m['channelName'] ?? m['channel'])?.toString() ?? '';
        final u1 = m['userId']?.toString();
        final u2 = m['otherUserId']?.toString();
        final matchesChannel = ch.isNotEmpty && ch == _channel;
        final matchesUser = (_callerId != null && (u1 == _callerId || u2 == _callerId)) ||
                            (_receiverId != null && (u1 == _receiverId || u2 == _receiverId));
        if (_closing) return; // avoid double-handling
        if (matchesChannel || matchesUser) {
          debugPrint('🔚 [VideoCall] Peer ended call, closing to Home');
          await _closeToHome();
        }
      } catch (_) {}
    });
  }

  void _maybeSubscribePeerEnded() {
    if (_peerEndSubscribed) return;
    _peerEndSubscribed = true;
    _service.peerEnded.addListener(() {
      if (_service.peerEnded.value) {
        _handlePeerEnded();
      }
    });
  }

  void _maybeSubscribeJoinedForLogging(String callType) {
    // Log call start exactly once when join succeeds
    if (_joinedAt != null) return;
    _service.joined.addListener(() async {
      if (_service.joined.value && _joinedAt == null) {
        _joinedAt = DateTime.now();
        _startTimer();
        final callerId = _callerId ?? '';
        final receiverId = _receiverId ?? '';
        if (callerId.isNotEmpty && receiverId.isNotEmpty) {
          await CallLogApi.logStart(
            callerId: callerId,
            receiverId: receiverId,
            callType: callType,
            channelName: _channel,
          );
        } else {
          debugPrint('⚠️ [VideoCall] Missing IDs for start log');
        }
      }
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (_) async {
      if (_joinedAt != null && mounted) {
        final elapsed = DateTime.now().difference(_joinedAt!);
        setState(() {
          _callDuration = '${elapsed.inMinutes.toString().padLeft(2, '0')}:${(elapsed.inSeconds % 60).toString().padLeft(2, '0')}';
        });

        if (_isCaller && _ratePerMin > 0 && _currentUserId != null) {
          _coinAccumulator += (_ratePerMin / 60.0);
          final int toCharge = _coinAccumulator.floor();
          if (toCharge >= 1 && !_deductInFlight) {
            _deductInFlight = true;
            try {
              final newBal = await UsersApi.deductCoins(
                userId: _currentUserId!,
                coins: toCharge,
                callType: 'video',
              );
              _coinAccumulator -= toCharge;
              if (newBal != null) {
                _remainingBalance = newBal;
              } else {
                _remainingBalance -= toCharge;
              }
              if (_remainingBalance <= 0) {
                debugPrint('⛔ [VideoCall] Coins exhausted, ending call');
                _endDueToNoCoins();
              }
            } catch (err) {
              debugPrint('❌ [VideoCall] Deduct coins failed: $err');
              _endDueToNoCoins();
            } finally {
              _deductInFlight = false;
            }
          }
        }
      }
    });
  }

  Future<void> _endDueToNoCoins() async {
    SocketService.instance.emit('end-call', {
      'userId': _callerId,
      'otherUserId': _receiverId,
      'channelName': _channel,
    });
    try {
      final start = _joinedAt;
      final durationSec = start != null ? DateTime.now().difference(start).inSeconds : 0;
      final callerId = _callerId ?? '';
      final receiverId = _receiverId ?? '';
      if (callerId.isNotEmpty && receiverId.isNotEmpty) {
        await CallLogApi.logEnd(
          callerId: callerId,
          receiverId: receiverId,
          callType: 'video',
          durationSeconds: durationSec,
        );
        AnalyticsService.instance.trackCallEvent(
          action: 'ended_no_coins',
          callType: 'video',
          callerId: callerId,
          receiverId: receiverId,
          channelName: _channel,
          durationSeconds: durationSec,
        );
      }
    } catch (_) {}
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Call ended: insufficient coins')),
      );
    }
    await _closeToHome();
  }

  Future<void> _handlePeerEnded() async {
    if (!mounted) return;
    debugPrint('🏁 [VideoCall] Detected peer end via Agora, closing');
    await _closeToHome();
  }

  void _maybeAddAcceptedListener() {
    if (_acceptedListenerAdded) return;
    _acceptedListenerAdded = true;
    SocketService.instance.on('call-accepted', (data) async {
      try {
        final Map m = (data is Map) ? data : {};
        final tok = (m['token'] ?? m['rtcToken'])?.toString() ?? '';
        final ch = (m['channelName'] ?? m['channel'])?.toString() ?? '';
        final uidArg = (m['uid']?.toString() ?? m['agoraUid']?.toString() ?? m['rtcUid']?.toString());
        final parsedUid = int.tryParse(uidArg ?? '');
        if (ch.isEmpty || ch != _channel) return;
        if (tok.isEmpty) return;
        debugPrint('🔑 [VideoCall] Received late token; rejoining channel');
        _token = tok;
        if (parsedUid != null) _uid = parsedUid;
        await _service.leave();
        await _service.join(channel: _channel, type: CallType.video, token: _token, uid: _uid);
        if (mounted) setState(() {});
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _endListenerAdded = false;
    _acceptedListenerAdded = false;
    _peerEndSubscribed = false;
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _service.onLifecyclePaused();
    } else if (state == AppLifecycleState.resumed) {
      // Respect current camera state: only resume preview if not manually muted
      if (!_videoMuted) {
        _service.onLifecycleResumed();
      }
    }
  }

  

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Prevent accidental back press - require explicit End Call button
        return false;
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Stack(
            children: [
              // Main video area: remote if available, else local preview
              Positioned.fill(
                child: ValueListenableBuilder<bool>(
                  valueListenable: _service.joined,
                  builder: (_, joined, __) {
                    if (!joined || _service.engine == null) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    return ValueListenableBuilder<int?>(
                      valueListenable: _service.remoteUidNotifier,
                      builder: (_, remoteUid, __) {
                        final engine = _service.engine!;
                        if (remoteUid != null) {
                          return AgoraVideoView(
                            controller: VideoViewController.remote(
                              rtcEngine: engine,
                              canvas: VideoCanvas(uid: remoteUid),
                              connection: RtcConnection(channelId: _service.channelName ?? _channel),
                            ),
                          );
                        }
                        return AgoraVideoView(
                          controller: VideoViewController(
                            rtcEngine: engine,
                            canvas: const VideoCanvas(uid: 0),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),

              // Top center: name and timer
              Positioned(
                top: 16,
                left: 0,
                right: 0,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _displayName,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _callDuration,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),

              // Local PiP with switch camera overlay
              ValueListenableBuilder<int?>(
                valueListenable: _service.remoteUidNotifier,
                builder: (_, remoteUid, __) {
                  if (_service.engine == null) return const SizedBox();
                  // Only show local PiP if remote user is present
                  if (remoteUid != null) {
                    return Positioned(
                      bottom: 100, // Adjust as needed
                      right: 16, // Adjust as needed
                      width: 90,
                      height: 120,
                      child: GestureDetector(
                        onTap: () {
                          // Handle tap on local PiP if needed
                        },
                        child: Stack(
                          children: [
                            _videoMuted
                                ? Container(color: Colors.black)
                                : AgoraVideoView(
                                    controller: VideoViewController(
                                      rtcEngine: _service.engine!,
                                      canvas: const VideoCanvas(uid: 0),
                                    ),
                                  ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: _roundControl(
                                icon: Icons.switch_camera,
                                onPressed: _switchCamera,
                                background: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  return const SizedBox();
                },
              ),

              // Bottom controls bar
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(24, 14, 24, 24),
                  decoration: const BoxDecoration(
                    color: Color(0xFF0E1621),
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(18),
                      topRight: Radius.circular(18),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _roundControl(
                        icon: _micMuted ? Icons.mic_off : Icons.mic,
                        background: const Color(0xFF2B3643),
                        onPressed: _toggleMic,
                      ),
                      _roundControl(
                        icon: Icons.call_end,
                        background: const Color(0xFFE04E4E),
                        onPressed: () async {
                          SocketService.instance.emit('end-call', {
                            'userId': _callerId,
                            'otherUserId': _receiverId,
                            'channelName': _channel,
                          });
                          try {
                            final start = _joinedAt;
                            final durationSec = start != null ? DateTime.now().difference(start).inSeconds : 0;
                            final callerId = _callerId ?? '';
                            final receiverId = _receiverId ?? '';
                          if (callerId.isNotEmpty && receiverId.isNotEmpty) {
                              await CallLogApi.logEnd(
                                callerId: callerId,
                                receiverId: receiverId,
                                callType: 'video',
                                durationSeconds: durationSec,
                              );
                              AnalyticsService.instance.trackCallEvent(
                                action: 'ended',
                                callType: 'video',
                                callerId: callerId,
                                receiverId: receiverId,
                                channelName: _channel,
                                durationSeconds: durationSec,
                              );
                            }
                          } catch (_) {}
                          await _closeToHome();
                        },
                      ),
                      _roundControl(
                        icon: _videoMuted ? Icons.videocam_off : Icons.videocam,
                        background: const Color(0xFF2B3643),
                        onPressed: _toggleVideo,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _closeToHome() async {
    if (_closing) return;
    _closing = true;
    try { await _service.dispose(); } catch (_) {}
    if (!mounted) return;
    try {
      Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
    } catch (_) {
      try { Navigator.pop(context); } catch (_) {}
    }
  }

  // Helpers for controls
  Widget _roundControl({required IconData icon, required Color background, required VoidCallback onPressed}) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(36),
      child: Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(color: background, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
    );
  }

  void _toggleMic() async {
    _micMuted = !_micMuted;
    try { await _service.engine?.muteLocalAudioStream(_micMuted); } catch (_) {}
    if (mounted) setState(() {});
  }

  void _toggleVideo() async {
    _videoMuted = !_videoMuted;
    try { await _service.engine?.muteLocalVideoStream(_videoMuted); } catch (_) {}
    if (!_videoMuted) { try { await _service.engine?.startPreview(); } catch (_) {} }
    if (mounted) setState(() {});
  }

  void _switchCamera() async {
    try { await _service.engine?.switchCamera(); } catch (_) {}
  }
}