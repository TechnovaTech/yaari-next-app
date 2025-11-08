import 'package:flutter/material.dart';
import '../widgets/call_dialogs.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFEF8F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        leadingWidth: 48,
        leading: const SizedBox.shrink(),
        titleSpacing: 0,
        title: Row(
          children: [
            const Text('❤️', style: TextStyle(fontSize: 20, color: Color(0xFFFF8547))),
            const SizedBox(width: 8),
            Text(
              'Yaari',
              style: GoogleFonts.getFont(
                'Baloo Tammudu 2',
                textStyle: const TextStyle(
                  color: Color(0xFFFF8547),
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: _CoinChip(onTap: () => Navigator.pushNamed(context, '/coins'), balance: 100),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: InkWell(
              onTap: () => Navigator.pushNamed(context, '/profile'),
              child: const CircleAvatar(
                radius: 16,
                backgroundImage: AssetImage('assets/images/Avtar.png'),
                backgroundColor: Colors.transparent,
              ),
            ),
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _HeroCard(),
          SizedBox(height: 16),
          _UserCard(status: 'Online', name: 'User Name', attributes: 'Singer • 25 • Hindi'),
          SizedBox(height: 12),
          _UserCard(status: 'Online', name: 'Neha', attributes: 'Dancer • 22 • English'),
          SizedBox(height: 12),
          _UserCard(status: 'Busy', name: 'Aarav', attributes: 'Guitarist • 27 • Hindi'),
          SizedBox(height: 12),
          _UserCard(status: 'Offline', name: 'Riya', attributes: 'Chef • 24 • Marathi'),
          SizedBox(height: 12),
          _UserCard(status: 'Online', name: 'Kunal', attributes: 'Photographer • 26 • Hindi'),
          SizedBox(height: 12),
          _UserCard(status: 'Busy', name: 'Priya', attributes: 'Artist • 23 • English'),
          SizedBox(height: 12),
          _UserCard(status: 'Offline', name: 'Vihan', attributes: 'Singer • 25 • Gujarati'),
          SizedBox(height: 12),
          _UserCard(status: 'Online', name: 'Anya', attributes: 'Model • 21 • Hindi'),
        ],
      ),
    );
  }
}

class _CoinChip extends StatelessWidget {
  final int balance;
  final VoidCallback onTap;
  const _CoinChip({required this.onTap, required this.balance});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFFFEFE6),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Image.asset('assets/images/coin.png', width: 18, height: 18),
            const SizedBox(width: 6),
            Text(
              '$balance',
              style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard();
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, '/user_detail'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 150,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Color(0xFFFFE0CC), Color(0xFFFFF1E9)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final String status;
  final String name;
  final String attributes;
  const _UserCard({required this.status, this.name = 'User Name', this.attributes = 'Attributes'});

  Color get _statusColor {
    switch (status) {
      case 'Online':
        return const Color(0xFF28C76F);
      case 'Busy':
        return const Color(0xFFFF5B5B);
      default:
        return const Color(0xFF9E9E9E);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFFFE0CC)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Avatar with overlapping status chip at bottom-left
          Stack(
            clipBehavior: Clip.none,
            children: [
              // Ensures perfect round crop and full cover of avatar image
              InkWell(
                onTap: () => Navigator.pushNamed(context, '/user_detail'),
                child: SizedBox(
                  width: 80,
                  height: 80,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/Avtar.png',
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: -4,
                bottom: -6,
                child: _StatusChip(text: status, color: _statusColor),
              ),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(
                  onTap: () => Navigator.pushNamed(context, '/user_detail'),
                  child: Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFFF8547),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  attributes,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.black54),
                ),
                const SizedBox(height: 12),
                // Buttons align inline on wide screens and wrap underneath on narrow
                Row(
                  children: [
                    Expanded(
                      child: _PriceButton(
                        label: '10 min',
                        icon: Icons.videocam,
                        onPressed: () async {
                          await showPermissionDialog(
                            context,
                            type: CallType.video,
                            onAllow: () async {
                              await showCallConfirmDialog(
                                context,
                                type: CallType.video,
                                onStart: () => Navigator.pushNamed(context, '/video_call'),
                              );
                            },
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _PriceButton(
                        label: '5 min',
                        icon: Icons.call,
                        onPressed: () async {
                          await showPermissionDialog(
                            context,
                            type: CallType.audio,
                            onAllow: () async {
                              await showCallConfirmDialog(
                                context,
                                type: CallType.audio,
                                onStart: () => Navigator.pushNamed(context, '/audio_call'),
                              );
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String text;
  final Color color;
  const _StatusChip({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE6E6E6)),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 2, offset: Offset(0, 1)),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(Icons.circle, size: 10, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PriceButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;
  const _PriceButton({required this.label, required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFFF8547),
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        // Ensure height while letting width flex inside Expanded
        minimumSize: const Size(0, 42),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      onPressed: onPressed,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.center,
        child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white),
          const SizedBox(width: 6),
          ...() {
            final tokens = label.split(' ');
            final amount = tokens.isNotEmpty ? tokens.first : label;
            final hasMin = label.toLowerCase().contains('min');
            final rest = hasMin
                ? '/min'
                : (tokens.length > 1 ? ' ${tokens.sublist(1).join(' ')}' : '');
            return [
              Text(
                amount,
                maxLines: 1,
                softWrap: false,
                overflow: TextOverflow.visible,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 4),
              Image.asset('assets/images/coin.png', width: 13, height: 13),
              if (rest.isNotEmpty) ...[
                const SizedBox(width: 4),
                Text(
                  rest,
                  maxLines: 1,
                  softWrap: false,
                  overflow: TextOverflow.visible,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ],
            ];
          }(),
        ],
        ),
      ),
    );
  }
}