import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import '../services/call_service.dart';
import '../services/socket_service.dart';
import '../services/tokens_api.dart';

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
  String _token = '';
  int _uid = 0;
  bool _initialized = false;
  String? _callerId;
  String? _receiverId;
  bool _endListenerAdded = false;
  bool _acceptedListenerAdded = false;

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
        _start();
      });
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
          debugPrint('🔚 [VideoCall] Peer ended call, closing screen');
          await _service.dispose();
          if (mounted) Navigator.pop(context);
        }
      } catch (_) {}
    });
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
    WidgetsBinding.instance.removeObserver(this);
    // Don't auto-dispose here - only dispose when user explicitly ends call
    // _service.dispose() is called in button handlers
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
          'Video Call',
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
                  : const AssetImage('assets/images/Avtar.png');
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
                Icon(Icons.videocam, color: accent),
                SizedBox(width: 6),
                Text('Video Call', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
              ],
            ),

            const SizedBox(height: 16),
            Expanded(
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF202020),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Stack(
                  children: [
                    Positioned.fill(
                      child: ValueListenableBuilder<bool>(
                        valueListenable: _service.joined,
                        builder: (_, joined, __) {
                          if (!joined) {
                            return const Center(child: CircularProgressIndicator());
                          }
                          return AgoraVideoView(
                            controller: VideoViewController(
                              rtcEngine: _service.engine,
                              canvas: const VideoCanvas(uid: 0),
                            ),
                          );
                        },
                      ),
                    ),
                    Positioned(
                      right: 12,
                      bottom: 12,
                      width: 120,
                      height: 160,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Builder(builder: (context) {
                          if (_service.remoteUid == null) {
                            return const Center(
                              child: Text('Waiting remote...', style: TextStyle(color: Colors.white70)),
                            );
                          }
                          return AgoraVideoView(
                            controller: VideoViewController.remote(
                              rtcEngine: _service.engine,
                              canvas: VideoCanvas(uid: _service.remoteUid!),
                              connection: RtcConnection(channelId: _service.channelName ?? _channel),
                            ),
                          );
                        }),
                      ),
                    ),
                  ],
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
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () async {
                        // Notify server and leave
                        SocketService.instance.emit('end-call', {
                          'userId': _callerId,
                          'otherUserId': _receiverId,
                          'channelName': _channel,
                        });
                        await _service.leave();
                        if (mounted) Navigator.pop(context);
                      },
                      icon: const Icon(Icons.call_end, color: Colors.white),
                      label: const Text('End Call'),
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