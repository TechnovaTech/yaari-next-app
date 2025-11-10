import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:app_deting/models/profile_store.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  static const Color bg = Color(0xFFFEF8F4);
  static const Color accent = Color(0xFFFF8547);

  final TextEditingController nameController = TextEditingController(text: 'User Name');
  final TextEditingController phoneController = TextEditingController(text: '+91 9879879877');
  final TextEditingController emailController = TextEditingController(text: 'user@example.com');
  final TextEditingController addressController = TextEditingController();
  final TextEditingController aboutController = TextEditingController();
  final TextEditingController hobbyController = TextEditingController();
  Uint8List? _avatarBytes;
  String? _gender; // 'male' or 'female'
  final List<Uint8List> _gallery = [];
  final List<String> _hobbies = [];

  @override
  void initState() {
    super.initState();
    // Prefill gender from ProfileStore so it reflects previously selected value
    final current = ProfileStore.instance.notifier.value;
    _gender = current.gender;
    // Optionally prefill avatar
    _avatarBytes = current.avatarBytes;
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

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    final bool addMode = args is Map<String, dynamic> && ((args['mode'] == 'add') || (args['onboarding'] == true));
    final ImageProvider avatarProvider = _avatarBytes != null
        ? MemoryImage(_avatarBytes!)
        : const AssetImage('assets/images/Avtar.png');

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              // Back
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => Navigator.pop(context),
              ),
              const SizedBox(height: 6),

              Text(
                addMode ? 'Add Details' : 'Edit Profile',
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
                                CircleAvatar(
                                  radius: 48,
                                  backgroundImage: avatarProvider,
                                  backgroundColor: Colors.transparent,
                                ),
                                if (_avatarBytes != null)
                                  Positioned(
                                    top: -4,
                                    right: -4,
                                    child: InkWell(
                                      onTap: () {
                                        setState(() {
                                          _avatarBytes = null;
                                        });
                                      },
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
                              child: const Text(
                                'Upload Picture',
                                style: TextStyle(
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
                      const Text(
                        'Gender',
                        style: TextStyle(fontWeight: FontWeight.w700),
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
                              ? 'Not set'
                              : (_gender == 'male' ? 'Male' : 'Female'),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),

                      const SizedBox(height: 18),

                      _InputField(controller: nameController, hint: 'User Name'),
                      const SizedBox(height: 14),
                      _InputField(
                        controller: phoneController,
                        hint: '+91 9879879877',
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 14),
                      _InputField(
                        controller: emailController,
                        hint: 'Email',
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 14),
                      _InputField(
                        controller: aboutController,
                        hint: 'About me',
                        keyboardType: TextInputType.multiline,
                        maxLines: 5,
                      ),

                      const SizedBox(height: 22),
                      // Gallery
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Photo Gallery',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                          ),
                          OutlinedButton(
                            onPressed: _addPhotos,
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: accent),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                            child: const Text('Add Photos', style: TextStyle(color: accent, fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _GalleryGrid(
                        images: _gallery,
                        onRemove: (i) => setState(() => _gallery.removeAt(i)),
                        onAdd: _addPhotos,
                      ),

                      const SizedBox(height: 22),
                      // Hobbies
                      const Text(
                        'Hobbies',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _InputField(controller: hobbyController, hint: 'Add a hobby'),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: _addHobby,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: accent,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            ),
                            child: const Text('Add'),
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
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  onPressed: () {
                    final current = ProfileStore.instance.notifier.value;
                    final data = ProfileData(
                      name: nameController.text.trim().isEmpty ? 'User Name' : nameController.text.trim(),
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
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(addMode ? 'Details saved successfully' : 'Changes saved successfully')),
                    );
                    if (addMode) {
                      Navigator.pushNamed(context, '/home');
                    } else {
                      Navigator.pop(context);
                    }
                  },
                  child: Text(
                    addMode ? 'Save Details' : 'Save Changes',
                    style: const TextStyle(
                      color: Colors.white,
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
                    child: Image.memory(
                      images[index],
                      fit: BoxFit.cover,
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

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final TextInputType? keyboardType;
  final int? maxLines;
  const _InputField({
    required this.controller,
    required this.hint,
    this.keyboardType,
    this.maxLines,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines ?? 1,
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
      ),
    );
  }
}