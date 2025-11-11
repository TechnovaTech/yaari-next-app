import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/call_service.dart';
import '../services/socket_service.dart';
import '../services/tokens_api.dart';
import '../services/call_log_api.dart';
import 'dart:async';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/users_api.dart';
import '../services/analytics_service.dart';

class AudioCallScreen extends StatefulWidget {
  const AudioCallScreen({super.key});

  @override
  State<AudioCallScreen> createState() => _AudioCallScreenState();
}

class _AudioCallScreenState extends State<AudioCallScreen> with WidgetsBindingObserver {

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
  DateTime? _joinedAt;
  String _callDuration = '00:00';
  Timer? _timer;
  // Coins and rate handling
  int _ratePerMin = 0; // coins per minute for audio
  int _remainingBalance = 0;
  double _coinAccumulator = 0.0; // accumulate fractional coins per second
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
      // Load current user id
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

      // Fetch settings and balance
      final settings = await UsersApi.fetchSettings();
      _ratePerMin = settings.audioCallRate;
      if (uid != null) {
        final bal = await UsersApi.fetchBalance(uid);
        if (bal != null) _remainingBalance = bal;
      }

      // In-call billing: allow call to start; auto-end handled elsewhere when coins run out
    } catch (e) {
      debugPrint('⚠️ [AudioCall] init billing error: $e');
    }
  }

  Future<void> _start() async {
    await Permission.microphone.request();
    // Gate join on valid token fetched from backend
    if (_token.isEmpty) {
      debugPrint('🔎 [AudioCall] Token empty; fetching from backend');
      final tok = await TokensApi.fetchRtcToken(_channel);
      if (tok == null || tok.isEmpty) {
        debugPrint('❌ [AudioCall] Failed to fetch RTC token; not joining');
        return;
      }
      _token = tok;
      debugPrint('🔑 [AudioCall] Using fetched RTC token');
    }
    debugPrint('🎤 [AudioCall] Joining channel: $_channel with token: (provided)');
    
    try {
      await _service.join(channel: _channel, type: CallType.audio, token: _token, uid: _uid);
      if (mounted) setState(() {});
      _maybeAddEndListener();
      _maybeAddAcceptedListener();
      _maybeSubscribePeerEnded();
      _maybeSubscribeJoinedForLogging('audio');
    } catch (e) {
      debugPrint('❌ [AudioCall] Join failed: $e, retrying...');
      // Wait a bit and retry once
      await Future.delayed(const Duration(milliseconds: 500));
      try {
        await _service.join(channel: _channel, type: CallType.audio, token: _token, uid: _uid);
        if (mounted) setState(() {});
        _maybeAddEndListener();
        _maybeAddAcceptedListener();
        _maybeSubscribePeerEnded();
        _maybeSubscribeJoinedForLogging('audio');
      } catch (e2) {
        debugPrint('❌ [AudioCall] Retry failed: $e2');
      }
    }
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
        if (matchesChannel || matchesUser) {
          debugPrint('🔚 [AudioCall] Peer ended call, closing screen');
          await _service.dispose();
          if (mounted) Navigator.pop(context);
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
          debugPrint('⚠️ [AudioCall] Missing IDs for start log');
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

        // Per-second coin deduction for caller
        if (_isCaller && _ratePerMin > 0 && _currentUserId != null) {
          _coinAccumulator += (_ratePerMin / 60.0);
          final int toCharge = _coinAccumulator.floor();
          if (toCharge >= 1 && !_deductInFlight) {
            _deductInFlight = true;
            try {
              final newBal = await UsersApi.deductCoins(
                userId: _currentUserId!,
                coins: toCharge,
                callType: 'audio',
              );
              _coinAccumulator -= toCharge;
              if (newBal != null) {
                _remainingBalance = newBal;
              } else {
                _remainingBalance -= toCharge;
              }
              if (_remainingBalance <= 0) {
                debugPrint('⛔ [AudioCall] Coins exhausted, ending call');
                _endDueToNoCoins();
              }
            } catch (err) {
              debugPrint('❌ [AudioCall] Deduct coins failed: $err');
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
          callType: 'audio',
          durationSeconds: durationSec,
        );
        AnalyticsService.instance.trackCallEvent(
          action: 'ended_no_coins',
          callType: 'audio',
          callerId: callerId,
          receiverId: receiverId,
          channelName: _channel,
          durationSeconds: durationSec,
        );
      }
    } catch (_) {}
    await _service.dispose();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Call ended: insufficient coins')),
      );
      Navigator.pop(context);
    }
  }

  Future<void> _handlePeerEnded() async {
    if (!mounted) return;
    debugPrint('🏁 [AudioCall] Detected peer end via Agora, closing');
    await _service.dispose();
    if (mounted) Navigator.pop(context);
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
        debugPrint('🔑 [AudioCall] Received late token; rejoining channel');
        _token = tok;
        if (parsedUid != null) _uid = parsedUid;
        await _service.leave();
        await _service.join(channel: _channel, type: CallType.audio, token: _token, uid: _uid);
        if (mounted) setState(() {});
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    // Reset listener flags so next call can register them again
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
      _service.onLifecycleResumed();
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
      backgroundColor: const Color(0xFFFEF8F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () async {
            await _service.dispose();
            if (mounted) Navigator.pop(context);
          },
        ),
        title: const Text(
          'Audio Call',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Colors.black),
        ),
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 16),
            Builder(builder: (context) {
              final String url = _avatarUrl ?? '';
              final ImageProvider<Object> avatarImage = url.isNotEmpty
                  ? NetworkImage(url)
                  : AssetImage(_gender == 'male' ? 'assets/images/Avtar.png' : 'assets/images/favatar.png');
              return CircleAvatar(
                radius: 42,
                backgroundColor: Colors.transparent,
                backgroundImage: avatarImage,
              );
            }),
            const SizedBox(height: 8),
            Text(_displayName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.call, color: accent),
                SizedBox(width: 6),
                Text('Audio Call', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
              ],
            ),
            const SizedBox(height: 4),
            Text(_callDuration, style: const TextStyle(fontSize: 16, color: Colors.black54, fontWeight: FontWeight.w600)),

            const SizedBox(height: 16),
            Expanded(
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3EFEA),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Center(
                  child: Icon(Icons.graphic_eq, size: 72, color: Colors.black26),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
              child: Row(
                children: [
                  Expanded(
                    child: ValueListenableBuilder<bool>(
                      valueListenable: _service.speakerOn,
                      builder: (context, on, _) {
                        return OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                            side: const BorderSide(color: Color(0xFFE0DFDD)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: () => _service.toggleSpeaker(),
                          icon: Icon(on ? Icons.volume_up : Icons.hearing, color: Colors.black87),
                          label: Text(on ? 'Speaker' : 'Earpiece', style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.w700)),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ValueListenableBuilder<bool>(
                      valueListenable: _service.joined,
                      builder: (context, hasJoined, _) {
                        return ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: accent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: hasJoined ? () async {
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
                                  callType: 'audio',
                                  durationSeconds: durationSec,
                                );
                                AnalyticsService.instance.trackCallEvent(
                                  action: 'ended',
                                  callType: 'audio',
                                  callerId: callerId,
                                  receiverId: receiverId,
                                  channelName: _channel,
                                  durationSeconds: durationSec,
                                );
                              }
                            } catch (_) {}
                            await _service.dispose();
                            if (mounted) Navigator.pop(context);
                          } : null,
                          icon: const Icon(Icons.call_end, color: Colors.white),
                          label: const Text('End Call'),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}