import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../services/call_service.dart';

class AudioCallScreen extends StatefulWidget {
  const AudioCallScreen({super.key});

  @override
  State<AudioCallScreen> createState() => _AudioCallScreenState();
}

class _AudioCallScreenState extends State<AudioCallScreen> {

  static const Color accent = Color(0xFFFF8547);
  final _service = CallService.instance;
  String _channel = 'yarri_${DateTime.now().millisecondsSinceEpoch}';
  String _displayName = 'User Name';
  String? _avatarUrl;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
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
      }
      _initialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _start();
      });
    }
  }

  Future<void> _start() async {
    await Permission.microphone.request();
    await _service.join(channel: _channel, type: CallType.audio, token: '');
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _service.leave();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
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
                Icon(Icons.call, color: accent),
                SizedBox(width: 6),
                Text('Audio Call', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
              ],
            ),

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
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: accent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () async {
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
    );
  }
}