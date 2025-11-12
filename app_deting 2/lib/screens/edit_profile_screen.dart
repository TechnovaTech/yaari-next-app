import 'dart:typed_data';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:app_deting/models/profile_store.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:app_deting/utils/translations.dart';
import 'package:app_deting/main.dart';
import 'package:app_deting/services/analytics_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  static const Color bg = Color(0xFFFEF8F4);
  static const Color accent = Color(0xFFFF8547);

  final TextEditingController nameController = TextEditingController();
  final TextEditingController phoneController = TextEditingController(text: '+91 9879879877');
  final TextEditingController emailController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController aboutController = TextEditingController();
  final TextEditingController hobbyController = TextEditingController();
  Uint8List? _avatarBytes;
  String? _profilePicUrl; // remote profile pic URL
  String? _gender; // 'male' or 'female'
  final List<Uint8List> _gallery = [];
  // Keep remote URLs aligned with _gallery for server operations
  final List<String> _galleryUrls = [];
  final List<String> _hobbies = [];
  bool _saving = false;
  String _language = 'en';
  // Lock phone/email after first successful save
  bool _phoneLocked = false;
  bool _emailLocked = false;
  bool _hobbyFieldEmpty = true;
  bool _nameFieldEmpty = true;

  @override
  void initState() {
    super.initState();
    nameController.addListener(() {
      final isEmpty = nameController.text.trim().isEmpty;
      if (_nameFieldEmpty != isEmpty) {
        setState(() => _nameFieldEmpty = isEmpty);
      }
    });
    hobbyController.addListener(() {
      final isEmpty = hobbyController.text.trim().isEmpty;
      if (_hobbyFieldEmpty != isEmpty) {
        setState(() => _hobbyFieldEmpty = isEmpty);
      }
    });
    _loadInitialState();
    
    // Track profile clicked event
    AnalyticsService.instance.track('profileClicked');
  }

  Future<void> _loadInitialState() async {
    // Prefill gender from ProfileStore so it reflects previously selected value
    final current = ProfileStore.instance.notifier.value;
    _gender = current.gender;
    _avatarBytes = current.avatarBytes;

    // Load user from SharedPreferences and prefill fields
    final prefs = await SharedPreferences.getInstance();
    final userJson = prefs.getString('user');
    final savedLang = prefs.getString('language');
    if (savedLang != null && savedLang.isNotEmpty) {
      _language = savedLang;
    }
    if (userJson != null && userJson.isNotEmpty) {
      try {
        final m = jsonDecode(userJson);
        final data = m is Map<String, dynamic> ? (m['user'] ?? m) : {};
        if (data is Map<String, dynamic>) {
          nameController.text = (data['name'] ?? '').toString();
          phoneController.text = (data['phone'] ?? phoneController.text).toString();
          emailController.text = (data['email'] ?? '').toString();
          // Determine lock state based on existing persisted values
          final existingPhone = (data['phone'] ?? '').toString().trim();
          final existingEmail = (data['email'] ?? '').toString().trim();
          _phoneLocked = existingPhone.isNotEmpty;
          _emailLocked = existingEmail.isNotEmpty;
          aboutController.text = (data['about'] ?? '').toString();
          _gender = _gender ?? (data['gender']?.toString());
          final List<dynamic> hobbies = (data['hobbies'] ?? []) as List<dynamic>;
          _hobbies.clear();
          _hobbies.addAll(hobbies.map((e) => e.toString()).where((s) => s.trim().isNotEmpty));
          // Profile picture and gallery
          _profilePicUrl = _normalizeUrl((data['profilePic'] ?? data['avatar'] ?? data['image'])?.toString());
          final g = data['gallery'];
          if (g is List) {
            // Load gallery images from URLs into bytes for existing UI components
            _gallery.clear();
            _galleryUrls.clear();
            await _loadGalleryBytes(
              g.map((e) => e?.toString()).where((u) => (u ?? '').isNotEmpty).cast<String>().toList(),
            );
          }
          // Fallback to images endpoint if needed
          final id = data['id']?.toString() ?? data['_id']?.toString();
          if (id != null && id.isNotEmpty) {
            await _refreshImagesFromServer(id);
          }
        }
      } catch (_) {}
    }
    if (mounted) setState(() {});
  }

  String? _normalizeUrl(String? url) {
    if (url == null || url.isEmpty) return null;
    final u = url.trim();
    if (u.startsWith('http://') || u.startsWith('https://')) {
      // Canonicalize localhost to admin domain
      return u.replaceAll(RegExp(r'https?://(0\.0\.0\.0|localhost):\d+'), 'https://admin.yaari.me');
    }
    if (u.startsWith('/uploads')) {
      return 'https://admin.yaari.me$u';
    }
    return null;
  }

  Future<void> _loadGalleryBytes(List<String> urls) async {
    for (final url in urls) {
      final n = _normalizeUrl(url);
      if (n == null) continue;
      try {
        final res = await http.get(Uri.parse(n));
        if (res.statusCode == 200) {
          _gallery.add(Uint8List.fromList(res.bodyBytes));
          _galleryUrls.add(n);
        }
      } catch (_) {}
    }
  }

  Future<void> _refreshImagesFromServer(String userId) async {
    try {
      final res = await http.get(Uri.parse('https://admin.yaari.me/api/users/$userId/images'));
      if (res.statusCode == 200) {
        final m = jsonDecode(res.body);
        final data = m is Map<String, dynamic> ? (m['data'] ?? m) as Map<String, dynamic> : <String, dynamic>{};
        final p = _normalizeUrl((data['profilePic'] ?? '')?.toString());
        if (p != null && p.isNotEmpty) {
          _profilePicUrl = p;
          try {
            final imgRes = await http.get(Uri.parse(p));
            if (imgRes.statusCode == 200) {
              _avatarBytes = Uint8List.fromList(imgRes.bodyBytes);
            }
          } catch (_) {}
        }
        final gal = (data['gallery'] ?? []) as List<dynamic>;
        if (gal.isNotEmpty) {
          _gallery.clear();
          _galleryUrls.clear();
          await _loadGalleryBytes(
            gal.map((e) => e?.toString()).where((u) => (u ?? '').isNotEmpty).cast<String>().toList(),
          );
        }
      }
    } catch (_) {}
  }

  Future<void> _pickImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800);
      if (file != null) {
        final bytes = await file.readAsBytes();
        setState(() {
          _avatarBytes = bytes;
        });
        await _uploadPhoto(bytes, isProfilePic: true);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Image select ma issue: $e')),
      );
    }
  }

  Future<void> _addPhotos() async {
    try {
      final ImagePicker picker = ImagePicker();
      final List<XFile> files = await picker.pickMultiImage(maxWidth: 1024);
      if (files.isEmpty) return;
      final List<Uint8List> newImages = [];
      for (final f in files) {
        final bytes = await f.readAsBytes();
        newImages.add(bytes);
      }
      setState(() {
        _gallery.addAll(newImages);
      });
      for (final b in newImages) {
        final url = await _uploadPhoto(b, isProfilePic: false);
        if (url != null && url.isNotEmpty) {
          setState(() => _galleryUrls.add(url));
        }
      }
    } catch (e) {
      // Fallback: single image picker
      try {
        final ImagePicker picker = ImagePicker();
        final XFile? file = await picker.pickImage(source: ImageSource.gallery, maxWidth: 1024);
        if (file != null) {
          final bytes = await file.readAsBytes();
          setState(() {
            _gallery.add(bytes);
          });
          final url = await _uploadPhoto(bytes, isProfilePic: false);
          if (url != null && url.isNotEmpty) {
            setState(() => _galleryUrls.add(url));
          }
        }
      } catch (err) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Photo gallery add ma issue: $err')),
        );
      }
    }
  }

  void _addHobby() {
    final text = hobbyController.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _hobbies.add(text);
      hobbyController.clear();
    });
  }

  void _removeHobby(String h) {
    setState(() {
      _hobbies.remove(h);
    });
  }

  Future<String?> _uploadPhoto(Uint8List bytes, {required bool isProfilePic}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      String? userId;
      if (userJson != null && userJson.isNotEmpty) {
        try {
          final m = jsonDecode(userJson);
          final data = m is Map<String, dynamic> ? (m['user'] ?? m) : {};
          if (data is Map<String, dynamic>) {
            userId = data['id']?.toString() ?? data['_id']?.toString();
          }
        } catch (_) {}
      }
      if (userId == null || userId.isEmpty) return null;

      final request = http.MultipartRequest('POST', Uri.parse('https://admin.yaari.me/api/upload-photo'));
      request.fields['userId'] = userId;
      request.fields['isProfilePic'] = isProfilePic.toString();
      request.files.add(http.MultipartFile.fromBytes('photo', bytes, filename: 'photo.jpg'));
      final resp = await request.send();
      if (resp.statusCode == 200) {
        final body = await resp.stream.bytesToString();
        final m = jsonDecode(body);
        final url = _normalizeUrl((m['photoUrl'] ?? m['url'] ?? '')?.toString());
        if (isProfilePic && url != null && url.isNotEmpty) {
          _profilePicUrl = url;
          // Persist to local user
          final uj = prefs.getString('user');
          if (uj != null) {
            try {
              final obj = jsonDecode(uj);
              Map<String, dynamic> data = obj is Map<String, dynamic> ? obj : <String, dynamic>{};
              data = data;
              data['profilePic'] = url;
              await prefs.setString('user', jsonEncode(data));
            } catch (_) {}
          }
        }
        return url;
      }
    } catch (_) {}
    return null;
  }

  Future<void> _removeProfilePicture() async {
    final url = _profilePicUrl;
    setState(() {
      _avatarBytes = null;
      _profilePicUrl = null;
    });

    if (url == null || url.isEmpty) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      String? userId;
      if (userJson != null && userJson.isNotEmpty) {
        try {
          final m = jsonDecode(userJson);
          final data = m is Map<String, dynamic> ? (m['user'] ?? m) : {};
          if (data is Map<String, dynamic>) {
            userId = data['id']?.toString() ?? data['_id']?.toString();
          }
        } catch (_) {}
      }
      if (userId == null || userId.isEmpty) return;

      final normalized = _normalizeUrl(url) ?? url;
      final res = await http.delete(
        Uri.parse('https://admin.yaari.me/api/delete-photo'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': userId, 'photoUrl': url, 'normalizedPhotoUrl': normalized, 'isProfilePic': true}),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (userJson != null) {
          try {
            final obj = jsonDecode(userJson);
            if (obj is Map<String, dynamic>) {
              final inner = (obj['user'] is Map<String, dynamic>) ? obj['user'] as Map<String, dynamic> : obj;
              inner['profilePic'] = null;
              if (obj['user'] is Map<String, dynamic>) {
                obj['user'] = inner;
              }
              await prefs.setString('user', jsonEncode(obj));
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  Future<void> _deletePhotoAt(int index) async {
    if (index < 0 || index >= _gallery.length) return;
    final String? url = (index < _galleryUrls.length) ? _galleryUrls[index] : null;
    setState(() {
      _gallery.removeAt(index);
      if (index < _galleryUrls.length) _galleryUrls.removeAt(index);
    });

    if (url == null || url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Local image removed. Server URL missing.')),
      );
      return;
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      String? userId;
      if (userJson != null && userJson.isNotEmpty) {
        try {
          final m = jsonDecode(userJson);
          final data = m is Map<String, dynamic> ? (m['user'] ?? m) : {};
          if (data is Map<String, dynamic>) {
            userId = data['id']?.toString() ?? data['_id']?.toString();
          }
        } catch (_) {}
      }
      if (userId == null || userId.isEmpty) return;

      final normalized = _normalizeUrl(url) ?? url;
      final res = await http.delete(
        Uri.parse('https://admin.yaari.me/api/delete-photo'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': userId, 'photoUrl': url, 'normalizedPhotoUrl': normalized}),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Update local user gallery list
        if (userJson != null) {
          try {
            final obj = jsonDecode(userJson);
            if (obj is Map<String, dynamic>) {
              final inner = (obj['user'] is Map<String, dynamic>) ? obj['user'] as Map<String, dynamic> : obj;
              final gallery = (inner['gallery'] is List)
                  ? (inner['gallery'] as List).map((e) => e.toString()).toList()
                  : <String>[];
              inner['gallery'] = gallery.where((u) => u != url).toList();
              if (obj['user'] is Map<String, dynamic>) {
                obj['user'] = inner;
              }
              await prefs.setString('user', jsonEncode(obj));
            }
          } catch (_) {}
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Delete failed: ${res.statusCode}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: $e')),
      );
    }
  }

  Future<void> _saveProfileToServer() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user');
      String? userId;
      Map<String, dynamic> base = <String, dynamic>{};
      if (userJson != null && userJson.isNotEmpty) {
        try {
          final obj = jsonDecode(userJson);
          if (obj is Map<String, dynamic>) {
            final inner = (obj['user'] is Map<String, dynamic>) ? obj['user'] as Map<String, dynamic> : obj;
            userId = inner['id']?.toString() ?? inner['_id']?.toString();
            base = inner;
          }
        } catch (_) {}
      }
      if (userId == null || userId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('User ID missing, cannot save')),
        );
        return;
      }

      final payload = <String, dynamic>{
        'name': nameController.text.trim().isEmpty ? null : nameController.text.trim(),
        // If locked, keep existing value from base; otherwise allow first-time set
        'phone': _phoneLocked ? base['phone'] : phoneController.text.trim(),
        'email': _emailLocked
            ? (base['email']?.toString().trim().isEmpty == true ? null : base['email'])
            : (emailController.text.trim().isEmpty ? null : emailController.text.trim()),
        'about': aboutController.text.trim().isEmpty ? null : aboutController.text.trim(),
        'gender': _gender,
        'hobbies': _hobbies,
        'language': _language,
        if (_profilePicUrl != null) 'profilePic': _profilePicUrl,
      };
      final res = await http.put(
        Uri.parse('https://admin.yaari.me/api/users/$userId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Merge and persist
        try {
          final server = jsonDecode(res.body);
          Map<String, dynamic> updated = {};
          if (server is Map<String, dynamic>) {
            updated = (server['data'] is Map<String, dynamic>) ? server['data'] as Map<String, dynamic> : server;
          }
          if (userJson != null) {
            final obj = jsonDecode(userJson);
            if (obj is Map<String, dynamic>) {
              if (obj['user'] is Map<String, dynamic>) {
                obj['user'] = {...(obj['user'] as Map<String, dynamic>), ...payload, ...updated};
              } else {
                obj.addAll(payload);
                obj.addAll(updated);
              }
              await prefs.setString('user', jsonEncode(obj));
            }
          }
          // After successful save, lock fields if they have values
          setState(() {
            if ((payload['phone']?.toString().trim().isNotEmpty ?? false)) {
              _phoneLocked = true;
            }
            final emailed = payload['email']?.toString().trim();
            if (emailed != null && emailed.isNotEmpty) {
              _emailLocked = true;
            }
          });
        } catch (_) {}
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Save failed: ${res.statusCode}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Network error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    final bool addMode = args is Map<String, dynamic> && ((args['mode'] == 'add') || (args['onboarding'] == true));
    final String defaultAvatar = (_gender?.toLowerCase() == 'female') ? 'assets/images/favatar.png' : 'assets/images/Avtar.png';

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              // Back button and language toggle
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.black),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Row(
                    children: [
                      _LanguageButton(
                        label: 'HIN',
                        selected: _language == 'hi',
                        onTap: () async {
                          setState(() => _language = 'hi');
                          AppTranslations.setLanguage('hi');
                          MyApp.languageNotifier.value = 'hi';
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.setString('language', 'hi');
                        },
                      ),
                      const SizedBox(width: 8),
                      _LanguageButton(
                        label: 'ENG',
                        selected: _language == 'en',
                        onTap: () async {
                          setState(() => _language = 'en');
                          AppTranslations.setLanguage('en');
                          MyApp.languageNotifier.value = 'en';
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.setString('language', 'en');
                        },
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 6),

              Text(
                addMode ? AppTranslations.get('add_details') : AppTranslations.get('edit_profile'),
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
              ),

              const SizedBox(height: 12),

              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          SizedBox(
                            width: 96,
                            height: 96,
                            child: Stack(
                              clipBehavior: Clip.none,
                              children: [
                                Container(
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(color: Colors.white, width: 3),
                                  ),
                                  child: ClipOval(
                                    child: _avatarBytes != null
                                        ? Image.memory(
                                            _avatarBytes!,
                                            fit: BoxFit.cover,
                                            width: 96,
                                            height: 96,
                                          )
                                        : Image.asset(
                                            defaultAvatar,
                                            fit: BoxFit.cover,
                                            width: 96,
                                            height: 96,
                                          ),
                                  ),
                                ),
                                if (_avatarBytes != null)
                                  Positioned(
                                    top: -4,
                                    right: -4,
                                    child: InkWell(
                                      onTap: _removeProfilePicture,
                                      borderRadius: BorderRadius.circular(12),
                                      child: Container(
                                        width: 28,
                                        height: 28,
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          shape: BoxShape.circle,
                                          boxShadow: const [
                                            BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
                                          ],
                                        ),
                                        child: const Icon(Icons.close, size: 16, color: Colors.black54),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          SizedBox(
                            width: 160,
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: accent),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              onPressed: _pickImage,
                              child: Text(
                                AppTranslations.get('upload_picture'),
                                style: const TextStyle(
                                  color: accent,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 18),

                      // Gender (fixed to previously selected value, non-editable here)
                      Text(
                        AppTranslations.get('gender'),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3EFEA),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFDEDEDE)),
                        ),
                        child: Text(
                          _gender == null
                              ? AppTranslations.get('not_set')
                              : (_gender == 'male' ? AppTranslations.get('male') : AppTranslations.get('female')),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),

                      const SizedBox(height: 18),

                      _InputField(
                        controller: nameController,
                        hint: 'User Name',
                        required: addMode,
                      ),
                      const SizedBox(height: 14),
                      _InputField(
                        controller: phoneController,
                        hint: '+91 9879879877',
                        keyboardType: TextInputType.phone,
                        enabled: !_phoneLocked,
                        helperText: _phoneLocked ? AppTranslations.get('phone_locked') : null,
                      ),
                      const SizedBox(height: 14),
                      _InputField(
                        controller: emailController,
                        hint: AppTranslations.get('email'),
                        keyboardType: TextInputType.emailAddress,
                        enabled: !_emailLocked,
                        helperText: _emailLocked ? AppTranslations.get('email_locked') : null,
                      ),
                      const SizedBox(height: 14),
                      _InputField(
                        controller: aboutController,
                        hint: AppTranslations.get('about_me'),
                        keyboardType: TextInputType.multiline,
                        maxLines: 5,
                      ),

                      const SizedBox(height: 22),
                      // Gallery
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            AppTranslations.get('photo_gallery'),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                          OutlinedButton(
                            onPressed: _addPhotos,
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: accent),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                            child: Text(AppTranslations.get('add_photos'), style: const TextStyle(color: accent, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _GalleryGrid(
                        images: _gallery,
                        onRemove: (i) => _deletePhotoAt(i),
                        onAdd: _addPhotos,
                      ),

                      const SizedBox(height: 22),
                      // Hobbies
                      Text(
                        AppTranslations.get('hobbies'),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _InputField(controller: hobbyController, hint: AppTranslations.get('add_hobby')),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: _hobbyFieldEmpty ? null : _addHobby,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: accent,
                              disabledBackgroundColor: Colors.grey.shade300,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            ),
                            child: Text(AppTranslations.get('add'), style: TextStyle(color: _hobbyFieldEmpty ? Colors.grey.shade600 : Colors.white)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _hobbies
                            .map(
                              (h) => Chip(
                                label: Text(h),
                                deleteIcon: const Icon(Icons.close, size: 16),
                                onDeleted: () => _removeHobby(h),
                                backgroundColor: const Color(0xFFF3EFEA),
                              ),
                            )
                            .toList(),
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: accent,
                    disabledBackgroundColor: Colors.grey.shade300,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: (addMode && nameController.text.trim().isEmpty) ? null : () async {
                    if (_saving) return;
                    setState(() => _saving = true);
                    final current = ProfileStore.instance.notifier.value;
                    final data = ProfileData(
                      name: nameController.text.trim(),
                      phone: phoneController.text.trim().isEmpty ? '+91 9879879877' : phoneController.text.trim(),
                      email: emailController.text.trim().isEmpty ? null : emailController.text.trim(),
                      // Keep existing address; field removed from UI
                      address: current.address,
                      about: aboutController.text.trim().isEmpty ? null : aboutController.text.trim(),
                      gender: _gender,
                      avatarBytes: _avatarBytes,
                      gallery: List<Uint8List>.from(_gallery),
                      hobbies: List<String>.from(_hobbies),
                    );
                    ProfileStore.instance.update(data);
                    // Persist to backend like Yarri app
                    await _saveProfileToServer();
                    
                    // Track registration done event if in add mode
                    if (addMode) {
                      final prefs = await SharedPreferences.getInstance();
                      final userJson = prefs.getString('user');
                      String? userId;
                      if (userJson != null && userJson.isNotEmpty) {
                        try {
                          final m = jsonDecode(userJson);
                          final d = m is Map<String, dynamic> ? (m['user'] ?? m) : {};
                          if (d is Map<String, dynamic>) {
                            userId = d['id']?.toString() ?? d['_id']?.toString();
                          }
                        } catch (_) {}
                      }
                      AnalyticsService.instance.track('registrationDone', {
                        'userId': userId ?? '',
                        'method': 'phone',
                      });
                    }
                    
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(addMode ? AppTranslations.get('details_saved') : AppTranslations.get('changes_saved'))),
                      );
                      if (addMode) {
                        Navigator.pushNamed(context, '/home');
                      } else {
                        Navigator.pop(context);
                      }
                    }
                    if (mounted) setState(() => _saving = false);
                  },
                  child: Text(
                    addMode ? AppTranslations.get('save_details') : AppTranslations.get('save_changes'),
                    style: TextStyle(
                      color: (addMode && nameController.text.trim().isEmpty) ? Colors.grey.shade600 : Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _GenderChoice extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _GenderChoice({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final accent = _EditProfileScreenState.accent;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFFFEDE2) : const Color(0xFFFEF8F4),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: accent.withOpacity(0.7)),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.black : accent,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

class _GalleryGrid extends StatelessWidget {
  final List<Uint8List> images;
  final void Function(int index)? onRemove;
  final VoidCallback? onAdd;
  const _GalleryGrid({required this.images, this.onRemove, this.onAdd});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final width = constraints.maxWidth;
      int count;
      if (width < 360) {
        count = 2; // small mobile
      } else if (width < 600) {
        count = 3; // mobile / phablet
      } else if (width < 900) {
        count = 4; // tablet / small desktop
      } else if (width < 1200) {
        count = 5; // desktop
      } else {
        count = 6; // large desktop
      }
      const spacing = 10.0; // 8–12px gap

      return GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: count,
          crossAxisSpacing: spacing,
          mainAxisSpacing: spacing,
          childAspectRatio: 1.0,
        ),
        itemCount: images.length + (onAdd != null ? 1 : 0),
        itemBuilder: (context, index) {
          // If onAdd is provided and this is the last tile, show the add tile
          final isAddTile = onAdd != null && index == images.length;
          if (isAddTile) {
            return AspectRatio(
              aspectRatio: 1,
              child: InkWell(
                onTap: onAdd,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3EFEA),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFDEDEDE), width: 1),
                    boxShadow: const [
                      BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
                    ],
                  ),
                  child: const Center(
                    child: Icon(Icons.add, color: Colors.black45),
                  ),
                ),
              ),
            );
          }

          return AspectRatio(
            aspectRatio: 1,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Square tile with subtle light border; image fully covers box
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFDEDEDE), width: 1),
                    boxShadow: const [
                      BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: double.infinity,
                      height: double.infinity,
                      decoration: BoxDecoration(
                        image: DecorationImage(
                          image: MemoryImage(images[index]),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ),
                if (onRemove != null)
                  Positioned(
                    top: -6,
                    right: -6,
                    child: InkWell(
                      onTap: () => onRemove!(index),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
                          ],
                        ),
                        child: const Icon(Icons.close, size: 14, color: Colors.black54),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      );
    });
  }
}

class _LanguageButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _LanguageButton({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final accent = _EditProfileScreenState.accent;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? accent : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: accent, width: 1.5),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : accent,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final int? maxLines;
  final bool enabled;
  final String? helperText;
  final bool required;
  const _InputField({
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.maxLines,
    this.enabled = true,
    this.helperText,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (required)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(
              children: [
                Text(
                  hint,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const Text(
                  ' *',
                  style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600, fontSize: 14),
                ),
              ],
            ),
          ),
        TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines ?? 1,
      enabled: enabled,
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: const Color(0xFFF3EFEA),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFDEDEDE)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFBFBFBF)),
        ),
        suffixIcon: enabled ? null : const Icon(Icons.lock, size: 18, color: Colors.black45),
      ),
        ),
        if ((helperText ?? '').isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6, left: 4),
            child: Text(
              helperText!,
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ),
      ],
    );
  }
}