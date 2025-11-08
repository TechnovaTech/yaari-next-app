import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import '../widgets/call_dialogs.dart';
import '../services/users_api.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<UserListItem> _users = const [];
  int _coinBalance = 100;
  Settings _settings = const Settings();
  bool _loading = true;
  AdItem? _ad; // legacy single-ad usage
  List<AdItem> _ads = const [];
  int _adIndex = 0;
  Timer? _adTimer;
  String? _userGender; // male | female

  @override
  void initState() {
    super.initState();
    _initData();
  }

  Future<void> _initData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _userGender = (prefs.getString('gender') ?? '').toLowerCase();
      // Try to read user balance from stored profile
      final raw = prefs.getString('user');
      if (raw != null) {
        try {
          final m = UsersApiSettingsHelper.tryDecode(raw);
          final bal = m['balance'] ?? m['coins'] ?? m['amount'];
          if (bal is int) _coinBalance = bal; else if (bal is String) _coinBalance = int.tryParse(bal) ?? _coinBalance;
          // If API is available, prefer live balance
          final uid = _extractUserId(m);
          if (uid != null && uid.isNotEmpty) {
            final liveBal = await UsersApi.fetchBalance(uid);
            if (liveBal != null) {
              _coinBalance = liveBal;
            }
          }
        } catch (_) {}
      }

      final settings = await UsersApi.fetchSettings();
      final users = await UsersApi.fetchUsersList();
      final ads = await UsersApi.fetchAds();
      // Gender-based filtering: show opposite gender only
      final filtered = () {
        if (_userGender == 'male') {
          return users.where((u) => (u.gender ?? '').toLowerCase() == 'female').toList();
        }
        if (_userGender == 'female') {
          return users.where((u) => (u.gender ?? '').toLowerCase() == 'male').toList();
        }
        return users; // if not set, show all
      }();

      if (!mounted) return;
      setState(() {
        _settings = settings;
        _users = filtered;
        _ads = ads;
        _ad = ads.isNotEmpty ? ads.first : null;
        _loading = false;
      });
      _configureAdAutoProgress();
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  void _configureAdAutoProgress() {
    _adTimer?.cancel();
    if (_ads.length > 1) {
      final current = _ads[_adIndex];
      if ((current.mediaType ?? 'photo') == 'photo') {
        _adTimer = Timer(const Duration(seconds: 5), () {
          if (!mounted) return;
          setState(() {
            _adIndex = (_adIndex + 1) % _ads.length;
          });
          // Re-arm timer based on new ad type
          _configureAdAutoProgress();
        });
      }
    }
  }

  @override
  void dispose() {
    _adTimer?.cancel();
    super.dispose();
  }

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
            child: _CoinChip(onTap: () => Navigator.pushNamed(context, '/coins'), balance: _coinBalance),
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
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _AdBanner(
                  ads: _ads,
                  currentIndex: _adIndex,
                  onIndexChange: (i) {
                    setState(() {
                      _adIndex = i % (_ads.isEmpty ? 1 : _ads.length);
                    });
                    _configureAdAutoProgress();
                  },
                ),
                const SizedBox(height: 16),
                if (_users.isEmpty) ...[
                  // Fallback to static cards if network list is empty
                  const _UserCard(status: 'Online', name: 'User Name', attributes: 'Singer • 25 • Hindi'),
                ] else ...[
                  for (final u in _users) ...[
                    _UserCard(
                      status: u.status,
                      name: u.name,
                      attributes: u.attributes,
                      avatarUrl: u.avatarUrl,
                      videoRate: _settings.videoCallRate,
                      audioRate: _settings.audioCallRate,
                      balance: _coinBalance,
                    ),
                    const SizedBox(height: 12),
                  ],
                ],
              ],
            ),
    );
  }
}

// Helper to decode user JSON safely
class UsersApiSettingsHelper {
  static Map<String, dynamic> tryDecode(String raw) {
    try {
      final m = jsonDecode(raw);
      return m is Map<String, dynamic> ? m : <String, dynamic>{};
    } catch (_) {
      return <String, dynamic>{};
    }
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
  final String? imageUrl;
  final VoidCallback? onTap;
  const _HeroCard({this.imageUrl, this.onTap});
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap ?? () => Navigator.pushNamed(context, '/user_detail'),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 150,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: imageUrl == null
              ? const LinearGradient(
                  colors: [Color(0xFFFFE0CC), Color(0xFFFFF1E9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          image: imageUrl != null
              ? DecorationImage(
                  image: NetworkImage(imageUrl!),
                  fit: BoxFit.cover,
                )
              : null,
        ),
      ),
    );
  }
}

class _AdBanner extends StatefulWidget {
  final List<AdItem> ads;
  final int currentIndex;
  final ValueChanged<int>? onIndexChange;
  const _AdBanner({required this.ads, this.currentIndex = 0, this.onIndexChange});
  @override
  State<_AdBanner> createState() => _AdBannerState();
}

class _AdBannerState extends State<_AdBanner> {
  double? _dragStartX;
  double? _dragEndX;
  VideoPlayerController? _videoController;
  VoidCallback? _videoListener;
  bool _videoReady = false;

  @override
  void initState() {
    super.initState();
    _setupMediaForCurrentAd();
  }

  @override
  void didUpdateWidget(covariant _AdBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex || oldWidget.ads != widget.ads) {
      _setupMediaForCurrentAd();
    }
  }

  @override
  void dispose() {
    _disposeVideo();
    super.dispose();
  }

  void _disposeVideo() {
    if (_videoController != null) {
      if (_videoListener != null) {
        _videoController!.removeListener(_videoListener!);
      }
      _videoController!.dispose();
    }
    _videoController = null;
    _videoListener = null;
    _videoReady = false;
  }

  void _setupMediaForCurrentAd() async {
    _disposeVideo();
    if (widget.ads.isEmpty) return;
    final ad = widget.ads[widget.currentIndex];
    final mediaType = (ad.mediaType ?? 'photo').toLowerCase();
    final videoUrl = ad.videoUrl ?? '';
    if (mediaType == 'video' && videoUrl.isNotEmpty) {
      try {
        final uri = Uri.tryParse(videoUrl);
        if (uri == null) return;
        final ctl = VideoPlayerController.networkUrl(uri);
        _videoController = ctl;
        await ctl.initialize();
        await ctl.setLooping(false);
        await ctl.setVolume(0.0); // mute by default
        _videoReady = true;
        // Advance when the video finishes
        _videoListener = () {
          final value = ctl.value;
          if (value.isInitialized && !value.isPlaying) {
            // If we've reached (or exceeded) duration, consider it ended
            final dur = value.duration;
            final pos = value.position;
            if (dur != Duration.zero && pos >= dur) {
              if (widget.ads.length > 1) {
                final next = (widget.currentIndex + 1) % widget.ads.length;
                widget.onIndexChange?.call(next);
              }
            }
          }
        };
        ctl.addListener(_videoListener!);
        await ctl.play();
        if (mounted) setState(() {});
      } catch (_) {
        // Fallback handled by gradient background
      }
    } else {
      // photo case: nothing to set up here
      if (mounted) setState(() {});
    }
  }

  void _handleSwipe() {
    if (_dragStartX == null || _dragEndX == null) return;
    final distance = _dragStartX! - _dragEndX!;
    final isLeftSwipe = distance > 50;
    final isRightSwipe = distance < -50;
    if (widget.ads.length > 1) {
      if (isLeftSwipe) {
        widget.onIndexChange?.call((widget.currentIndex + 1) % widget.ads.length);
      } else if (isRightSwipe) {
        final prev = widget.currentIndex == 0 ? widget.ads.length - 1 : widget.currentIndex - 1;
        widget.onIndexChange?.call(prev);
      }
    }
  }

  Future<void> _openLink(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.ads.isEmpty) {
      return Container(
        height: 160,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Color(0xFFFFE0CC), Color(0xFFFFF1E9)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        alignment: Alignment.center,
        child: const Text(
          'No ads available',
          style: TextStyle(color: Color(0xFFCC5A2D), fontWeight: FontWeight.w600),
        ),
      );
    }

    final ad = widget.ads[widget.currentIndex];
    final mediaType = (ad.mediaType ?? 'photo').toLowerCase();

    return GestureDetector(
      onHorizontalDragStart: (d) => _dragStartX = d.localPosition.dx,
      onHorizontalDragUpdate: (d) => _dragEndX = d.localPosition.dx,
      onHorizontalDragEnd: (_) => _handleSwipe(),
      child: InkWell(
        onTap: () => _openLink(ad.linkUrl),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          height: 160,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(16)),
          clipBehavior: Clip.hardEdge,
          child: Stack(
            children: [
              // Media layer: photo or video
              Positioned.fill(
                child: () {
                  if (mediaType == 'photo' && (ad.imageUrl ?? '').isNotEmpty) {
                    return Image.network(ad.imageUrl!, fit: BoxFit.cover);
                  }
                  if (mediaType == 'video' && _videoController != null && _videoReady && _videoController!.value.isInitialized) {
                    return FittedBox(
                      fit: BoxFit.cover,
                      clipBehavior: Clip.hardEdge,
                      child: SizedBox(
                        width: _videoController!.value.size.width,
                        height: _videoController!.value.size.height,
                        child: VideoPlayer(_videoController!),
                      ),
                    );
                  }
                  // Fallback gradient if media not available
                  return Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFFFF9A62), Color(0xFFFF5E0E)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  );
                }(),
              ),
              // subtle overlay for readability
              Positioned.fill(
                child: Container(color: Colors.black.withOpacity(0.2)),
              ),
              // content
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if ((ad.title ?? '').isNotEmpty)
                        Text(
                          ad.title!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            shadows: [Shadow(color: Colors.black54, blurRadius: 4)],
                          ),
                        ),
                      if ((ad.description ?? '').isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2.0),
                          child: Text(
                            ad.description!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              shadows: [Shadow(color: Colors.black54, blurRadius: 3)],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if ((ad.linkUrl ?? '').isNotEmpty)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      'Click to open',
                      style: TextStyle(color: Colors.white, fontSize: 10),
                    ),
                  ),
                ),
            ],
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
  final String? avatarUrl;
  final int videoRate;
  final int audioRate;
  final int balance;
  const _UserCard({
    required this.status,
    this.name = 'User Name',
    this.attributes = 'Attributes',
    this.avatarUrl,
    this.videoRate = 10,
    this.audioRate = 10,
    this.balance = 250,
  });

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
                      child: () {
                        final url = avatarUrl ?? '';
                        if (url.isNotEmpty) {
                          return Image.network(url, fit: BoxFit.cover);
                        }
                        return Image.asset('assets/images/Avtar.png', fit: BoxFit.cover);
                      }(),
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
                        label: '${videoRate} min',
                        icon: Icons.videocam,
                        onPressed: () async {
                          await showPermissionDialog(
                            context,
                            type: CallType.video,
                            onAllow: () async {
                              await showCallConfirmDialog(
                                context,
                                type: CallType.video,
                                rateLabel: '₹${videoRate}/min',
                                balanceLabel: '₹${balance}',
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
                        label: '${audioRate} min',
                        icon: Icons.call,
                        onPressed: () async {
                          await showPermissionDialog(
                            context,
                            type: CallType.audio,
                            onAllow: () async {
                              await showCallConfirmDialog(
                                context,
                                type: CallType.audio,
                                rateLabel: '₹${audioRate}/min',
                                balanceLabel: '₹${balance}',
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

// Helpers
String? _extractUserId(Map<String, dynamic> m) {
  final keys = ['_id', 'id', 'userId'];
  for (final k in keys) {
    final v = m[k];
    if (v != null && v.toString().isNotEmpty) return v.toString();
  }
  return null;
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