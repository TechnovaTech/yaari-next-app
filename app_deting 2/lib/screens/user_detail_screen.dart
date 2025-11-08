import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:app_deting/models/profile_store.dart';

class UserDetailScreen extends StatelessWidget {
  const UserDetailScreen({super.key});

  static const Color bg = Color(0xFFFEF8F4);
  static const Color accent = Color(0xFFFF8547);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bg,
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: accent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {},
                icon: const Icon(Icons.videocam, size: 18),
                label: const Text('10 min'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: accent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {},
                icon: const Icon(Icons.call, size: 18),
                label: const Text('5 min'),
              ),
            ),
          ],
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
                          const SizedBox(height: 4),
                          Text(
                            profile.phone,
                            style: const TextStyle(color: Colors.black54),
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

class _TimeButton extends StatelessWidget {
  final String label;
  const _TimeButton({required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: UserDetailScreen.accent,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
        onPressed: () {},
        child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
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
