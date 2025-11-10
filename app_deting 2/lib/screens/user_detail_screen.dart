import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:app_deting/models/profile_store.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../widgets/call_dialogs.dart';
import '../services/users_api.dart';
import '../services/outgoing_call_service.dart';
import '../widgets/recharge_prompt.dart';

class UserDetailScreen extends StatefulWidget {
  const UserDetailScreen({super.key});

  static const Color bg = Color(0xFFFEF8F4);
  static const Color accent = Color(0xFFFF8547);

  @override
  State<UserDetailScreen> createState() => _UserDetailScreenState();
}

class _UserDetailScreenState extends State<UserDetailScreen> {
  int _coinBalance = 100;
  Settings _settings = const Settings();
  String _callAccess = 'full';

  @override
  void initState() {
    super.initState();
    _loadAndFetchUser();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('user');
      String? userId;
      if (raw != null) {
        try {
          final m = jsonDecode(raw);
          final bal = m['balance'] ?? m['coins'] ?? m['amount'];
          if (bal is int) _coinBalance = bal; else if (bal is String) _coinBalance = int.tryParse(bal) ?? _coinBalance;
          userId = (m['_id'] ?? m['id'] ?? m['userId'])?.toString();
          if (userId != null && userId.isNotEmpty) {
            final liveBal = await UsersApi.fetchBalance(userId);
            if (liveBal != null) _coinBalance = liveBal;
          }
        } catch (_) {}
      }
      
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map && args['id'] != null) {
        userId = args['id'].toString();
      } else if (args is String && args.isNotEmpty) {
        userId = args;
      }
      
      if (userId != null && userId.isNotEmpty) {
        final users = await UsersApi.fetchUsersList();
        final user = users.firstWhere((u) => u.id == userId, orElse: () => UserListItem(id: '', name: '', status: '', attributes: '', callAccess: 'full'));
        _callAccess = user.callAccess;
      }
      
      final settings = await UsersApi.fetchSettings();
      if (mounted) setState(() => _settings = settings);
    } catch (_) {}
  }

  Future<void> _loadAndFetchUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString('user');
      String? userId;
      String? localName;
      String? localPhone;
      String? localAbout;
      String? localGender;

      if (raw != null && raw.isNotEmpty) {
        try {
          final m = jsonDecode(raw);
          if (m is Map<String, dynamic>) {
            userId = (m['_id'] ?? m['id'] ?? m['userId'])?.toString();
            localName = (m['name'] ?? m['username'])?.toString();
            localPhone = (m['phone'] ?? '')?.toString();
            localAbout = (m['about'] ?? '')?.toString();
            localGender = (m['gender'] ?? m['sex'])?.toString();
          }
        } catch (_) {}
      }

      // Allow overriding via route arguments: pass a map {'id': '...'}
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map && args['id'] != null) {
        userId = args['id'].toString();
      } else if (args is String && args.isNotEmpty) {
        userId = args;
      }

      if (userId == null || userId.isEmpty) {
        // Update with local-only data to avoid blank UI
        ProfileStore.instance.update(
          ProfileData(
            name: localName ?? 'User Name',
            phone: localPhone ?? '+91 9879879877',
            about: (localAbout != null && localAbout.isNotEmpty) ? localAbout : null,
            gender: localGender,
          ),
        );
        return;
      }

      // Fetch user profile
      final userRes = await http.get(Uri.parse('https://admin.yaari.me/api/users/$userId'));
      Map<String, dynamic> userData = {};
      if (userRes.statusCode == 200) {
        try {
          final m = jsonDecode(userRes.body);
          userData = m is Map<String, dynamic> ? (m['data'] ?? m) as Map<String, dynamic> : {};
        } catch (_) {}
      }

      // Profile picture and gallery
      String? profilePic = _normalizeUrl((userData['profilePic'] ?? userData['avatar'] ?? userData['image'])?.toString());
      List<String> galleryUrls = [];
      final g = userData['gallery'];
      if (g is List) {
        galleryUrls = g
            .map((e) => _normalizeUrl(e?.toString()))
            .where((u) => (u ?? '').isNotEmpty)
            .cast<String>()
            .toList();
      }

      // Fallback to images endpoint if needed
      if ((profilePic == null || profilePic.isEmpty) || galleryUrls.isEmpty) {
        try {
          final imgRes = await http.get(Uri.parse('https://admin.yaari.me/api/users/$userId/images'));
          if (imgRes.statusCode == 200) {
            final m = jsonDecode(imgRes.body);
            final data = m is Map<String, dynamic> ? (m['data'] ?? m) as Map<String, dynamic> : <String, dynamic>{};
            profilePic = _normalizeUrl((data['profilePic'] ?? '')?.toString()) ?? profilePic;
            final gal = (data['gallery'] ?? []) as List<dynamic>;
            if (gal.isNotEmpty) {
              galleryUrls = gal
                  .map((e) => _normalizeUrl(e?.toString()))
                  .where((u) => (u ?? '').isNotEmpty)
                  .cast<String>()
                  .toList();
            }
          }
        } catch (_) {}
      }

      // Download images as bytes for the existing UI
      Uint8List? avatarBytes;
      if (profilePic != null && profilePic.isNotEmpty) {
        avatarBytes = await _downloadBytes(profilePic);
      }
      final List<Uint8List> galleryBytes = [];
      for (final url in _dedupeByCanonical(galleryUrls)) {
        final b = await _downloadBytes(url);
        if (b != null) galleryBytes.add(b);
      }

      final name = (userData['name'] ?? localName ?? 'User Name').toString();
      final phone = (userData['phone'] ?? localPhone ?? '+91 9879879877').toString();
      final about = (userData['about'] ?? localAbout ?? '').toString();
      final gender = (userData['gender'] ?? localGender)?.toString();
      final hobbies = _extractHobbies(userData);

      ProfileStore.instance.update(
        ProfileData(
          name: name,
          phone: phone,
          about: about.isNotEmpty ? about : null,
          gender: gender,
          avatarBytes: avatarBytes,
          gallery: galleryBytes,
          hobbies: hobbies,
        ),
      );
    } catch (_) {
      // Keep defaults if network fails
    }
  }

  String? _normalizeUrl(String? url) {
    if (url == null || url.isEmpty) return url;
    if (url.startsWith('/uploads/')) return 'https://admin.yaari.me$url';
    return url.replaceAll(RegExp(r'https?://(localhost|0\.0\.0\.0):\d+'), 'https://admin.yaari.me');
  }

  List<String> _dedupeByCanonical(List<String> urls) {
    final out = <String>[];
    final seen = <String>{};
    String keyOf(String u) {
      final base = u.split('?').first;
      final idx = base.lastIndexOf('/');
      return idx >= 0 ? base.substring(idx + 1).toLowerCase() : base.toLowerCase();
    }
    for (final url in urls) {
      if (url.isEmpty) continue;
      final k = keyOf(url);
      if (seen.contains(k)) continue;
      seen.add(k);
      out.add(url);
    }
    return out;
  }

  Future<Uint8List?> _downloadBytes(String url) async {
    try {
      final res = await http.get(Uri.parse(url));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        return res.bodyBytes;
      }
    } catch (_) {}
    return null;
  }

  List<String> _extractHobbies(Map<String, dynamic> m) {
    List<String> out = [];
    void addMany(dynamic v) {
      if (v is List) {
        out.addAll(v.map((e) => e?.toString() ?? '').where((s) => s.trim().isNotEmpty).map((s) => s.trim()));
      } else if (v is String) {
        final raw = v.trim();
        if (raw.isEmpty) return;
        final parts = raw.split(RegExp(r"[,•|]\s*"));
        out.addAll(parts.map((s) => s.trim()).where((s) => s.isNotEmpty));
      }
    }

    addMany(m['hobbies']);
    addMany(m['hobby']);
    addMany(m['interests']);
    addMany(m['tags']);

    // Dedupe case-insensitively, preserve first occurrence casing
    final seen = <String, String>{};
    for (final h in out) {
      final key = h.toLowerCase();
      seen.putIfAbsent(key, () => h);
    }
    return seen.values.toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: UserDetailScreen.bg,
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        child: Builder(
          builder: (context) {
            final bool allowVideo = _callAccess == 'video' || _callAccess == 'full';
            final bool allowAudio = _callAccess == 'audio' || _callAccess == 'full';
            
            final List<Widget> buttons = [];
            
            if (allowVideo) {
              buttons.add(
                Expanded(
                  child: _PriceButton(
                    label: '${_settings.videoCallRate} min',
                    icon: Icons.videocam,
                    onPressed: () async {
                      if (_coinBalance < _settings.videoCallRate) {
                        await showRechargePrompt(
                          context,
                          title: 'Stay connected',
                          message: 'Recharge now to continue your yaari moments!',
                          onRecharge: () {
                            Navigator.pushReplacementNamed(context, '/coins');
                          },
                        );
                        return;
                      }
                      await showPermissionDialog(
                        context,
                        type: CallType.video,
                        onAllow: () async {
                          final channel = 'yarri_${DateTime.now().millisecondsSinceEpoch}';
                          await showCallConfirmDialog(
                            context,
                            type: CallType.video,
                            rateLabel: '₹${_settings.videoCallRate}/min',
                            balanceLabel: '₹$_coinBalance',
                            displayName: (ProfileStore.instance.notifier.value.name),
                            onStart: () {
                              final args = ModalRoute.of(context)?.settings.arguments;
                              String receiverId = '';
                              if (args is Map && args['id'] != null) {
                                receiverId = args['id'].toString();
                              } else if (args is String && args.isNotEmpty) {
                                receiverId = args;
                              }
                              OutgoingCallService.instance.startCall(
                                context: context,
                                receiverId: receiverId,
                                callerName: (ProfileStore.instance.notifier.value.name),
                                callerAvatar: null,
                                channel: channel,
                                isVideo: true,
                              );
                            },
                          );
                        },
                      );
                    },
                  ),
                ),
              );
            }
            
            if (allowVideo && allowAudio) {
              buttons.add(const SizedBox(width: 12));
            }
            
            if (allowAudio) {
              buttons.add(
                Expanded(
                  child: _PriceButton(
                    label: '${_settings.audioCallRate} min',
                    icon: Icons.call,
                    onPressed: () async {
                      if (_coinBalance < _settings.audioCallRate) {
                        await showRechargePrompt(
                          context,
                          title: 'Stay connected',
                          message: 'Recharge now to continue your yaari moments!',
                          onRecharge: () {
                            Navigator.pushReplacementNamed(context, '/coins');
                          },
                        );
                        return;
                      }
                      await showPermissionDialog(
                        context,
                        type: CallType.audio,
                        onAllow: () async {
                          final channel = 'yarri_${DateTime.now().millisecondsSinceEpoch}';
                          await showCallConfirmDialog(
                            context,
                            type: CallType.audio,
                            rateLabel: '₹${_settings.audioCallRate}/min',
                            balanceLabel: '₹$_coinBalance',
                            displayName: (ProfileStore.instance.notifier.value.name),
                            onStart: () {
                              final args = ModalRoute.of(context)?.settings.arguments;
                              String receiverId = '';
                              if (args is Map && args['id'] != null) {
                                receiverId = args['id'].toString();
                              } else if (args is String && args.isNotEmpty) {
                                receiverId = args;
                              }
                              OutgoingCallService.instance.startCall(
                                context: context,
                                receiverId: receiverId,
                                callerName: (ProfileStore.instance.notifier.value.name),
                                callerAvatar: null,
                                channel: channel,
                                isVideo: false,
                              );
                            },
                          );
                        },
                      );
                    },
                  ),
                ),
              );
            }
            
            if (buttons.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'No call access',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.black54, fontSize: 14, fontWeight: FontWeight.w600),
                ),
              );
            }
            
            return Row(children: buttons);
          },
        ),
      ),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'User Detail',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
      ),
      body: SafeArea(
        child: ValueListenableBuilder<ProfileData>(
          valueListenable: ProfileStore.instance.notifier,
          builder: (context, profile, _) {
            final ImageProvider avatarProvider = profile.avatarBytes != null
                ? MemoryImage(profile.avatarBytes!)
                : const AssetImage('assets/images/Avtar.png');

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 34,
                      backgroundImage: avatarProvider,
                      backgroundColor: Colors.transparent,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            profile.name,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Time buttons moved to bottomNavigationBar
                const SizedBox(height: 20),
                if (profile.about != null && profile.about!.isNotEmpty) ...[
                  const Text(
                    'About',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    profile.about!,
                    style: const TextStyle(color: Colors.black87),
                  ),
                  const SizedBox(height: 16),
                ],

                if (profile.hobbies.isNotEmpty) ...[
                  const Text(
                    'Hobbies',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: profile.hobbies
                        .map(
                          (h) => Chip(
                            label: Text(h),
                            backgroundColor: const Color(0xFFF3EFEA),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 16),
                ],

                const Text(
                  'Photo Gallery',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                _GalleryGrid(images: profile.gallery),
              ],
            );
          },
        ),
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

class _GalleryGrid extends StatelessWidget {
  final List<Uint8List> images;
  const _GalleryGrid({required this.images});

  @override
  Widget build(BuildContext context) {
    if (images.isEmpty) {
      return Container(
        height: 100,
        decoration: BoxDecoration(
          color: const Color(0xFFF3EFEA),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFDEDEDE)),
        ),
        child: const Center(child: Text('No photos yet')),
      );
    }
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1.0,
      ),
      itemCount: images.length,
      itemBuilder: (context, index) {
        return AspectRatio(
          aspectRatio: 1,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFDEDEDE), width: 1),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.memory(images[index], fit: BoxFit.cover),
            ),
          ),
        );
      },
    );
  }
}

// Legacy duplicate implementation removed to avoid conflicts.
