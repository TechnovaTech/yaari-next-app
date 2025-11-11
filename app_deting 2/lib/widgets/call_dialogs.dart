import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

enum CallType { video, audio }

const Color _accent = Color(0xFFFF8547);
const Color _bg = Color(0xFFFEF8F4);

IconData _iconFor(CallType type) => type == CallType.video ? Icons.videocam : Icons.call;
String _labelFor(CallType type) => type == CallType.video ? 'Video Call' : 'Audio Call';

Future<void> showPermissionDialog(
  BuildContext context, {
  required CallType type,
  required VoidCallback onAllow,
}) async {
  // Check if permissions already granted
  final bool isVideo = type == CallType.video;
  final micStatus = await Permission.microphone.status;
  final camStatus = isVideo ? await Permission.camera.status : PermissionStatus.granted;
  
  // If already granted, skip dialog and proceed
  if (micStatus.isGranted && camStatus.isGranted) {
    onAllow();
    return;
  }
  
  await showDialog(
    context: context,
    barrierDismissible: true,
    builder: (ctx) {
      final String title = isVideo ? 'Camera & Microphone\nAccess' : 'Microphone Access';
      final String description = isVideo
          ? 'Yaari needs access to your camera and microphone to make video calls.'
          : 'Yaari needs access to your microphone to make audio calls.';

      return Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.black38),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ),
              // Icon circle to match reference design
              Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(color: _bg, shape: BoxShape.circle),
                child: Icon(isVideo ? Icons.videocam : Icons.mic, color: _accent, size: 32),
              ),
              const SizedBox(height: 16),
              Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(description, textAlign: TextAlign.center, style: const TextStyle(color: Colors.black54)),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        side: const BorderSide(color: Color(0xFFE0DFDD)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Not Now', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _accent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () async {
                        Navigator.of(ctx).pop();
                        // Request actual system permissions
                        if (isVideo) {
                          await Permission.camera.request();
                          await Permission.microphone.request();
                        } else {
                          await Permission.microphone.request();
                        }
                        onAllow();
                      },
                      child: const Text('Allow'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
}

Future<void> showIncomingCallDialog(
  BuildContext context, {
  required CallType type,
  required String displayName,
  String? avatarUrl,
  String? gender,
  required VoidCallback onAccept,
  required VoidCallback onDecline,
}) async {
  await showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) {
      return Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.black38),
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    onDecline();
                  },
                ),
              ),
              Builder(builder: (context) {
                final String url = avatarUrl ?? '';
                final ImageProvider<Object> avatarImage = url.isNotEmpty
                    ? NetworkImage(url)
                    : AssetImage(gender == 'male' ? 'assets/images/Avtar.png' : 'assets/images/favatar.png');
                return CircleAvatar(
                  radius: 38,
                  backgroundColor: Colors.transparent,
                  backgroundImage: avatarImage,
                );
              }),
              const SizedBox(height: 12),
              Text(
                displayName,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(_iconFor(type), color: _accent),
                  const SizedBox(width: 6),
                  Text(
                    '${_labelFor(type)} Incoming',
                    style: const TextStyle(color: Colors.black54, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9F9F9),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE0DFDD)),
                ),
                child: const Text(
                  'User is calling you. Accept to start the call.',
                  style: TextStyle(color: Colors.black54),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        side: const BorderSide(color: Color(0xFFE0DFDD)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        onDecline();
                      },
                      child: const Text('Decline'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _accent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        onAccept();
                      },
                      child: const Text('Accept'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
}

Future<void> showCallConfirmDialog(
  BuildContext context, {
  required CallType type,
  required VoidCallback onStart,
  String rateLabel = '₹10/min',
  String balanceLabel = '₹250',
  String displayName = 'User Name',
  String? avatarUrl,
  String? gender,
}) async {
  await showDialog(
    context: context,
    barrierDismissible: true,
    builder: (ctx) {
      return Dialog(
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.black38),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ),
              Builder(builder: (context) {
                final String url = avatarUrl ?? '';
                final ImageProvider<Object> avatarImage = url.isNotEmpty
                    ? NetworkImage(url)
                    : AssetImage(gender == 'male' ? 'assets/images/Avtar.png' : 'assets/images/favatar.png');
                return CircleAvatar(
                  radius: 38,
                  backgroundColor: Colors.transparent,
                  backgroundImage: avatarImage,
                );
              }),
              const SizedBox(height: 10),
              Text(displayName, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(_iconFor(type), color: _accent),
                  const SizedBox(width: 8),
                  Text(_labelFor(type), style: const TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF1E9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: const Text('Rate', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
                    ),
                    Text(rateLabel, style: const TextStyle(color: _accent, fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF1E9),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text('Your Balance', style: TextStyle(color: Colors.black54, fontWeight: FontWeight.w600)),
                    ),
                    Text(balanceLabel, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w800)),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'You will be charged $rateLabel for this call',
                style: const TextStyle(color: Colors.black45),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        side: const BorderSide(color: Color(0xFFE0DFDD)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Cancel', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _accent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        onStart();
                      },
                      child: const Text('Start Call'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
}