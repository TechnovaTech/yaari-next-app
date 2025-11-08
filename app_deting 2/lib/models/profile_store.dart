import 'dart:typed_data';
import 'package:flutter/foundation.dart';

class ProfileData {
  final String name;
  final String phone;
  final String? email;
  final String? address;
  final String? about;
  final String? gender; // 'male' or 'female'
  final Uint8List? avatarBytes;
  final List<Uint8List> gallery;
  final List<String> hobbies;

  const ProfileData({
    this.name = 'User Name',
    this.phone = '+91 9879879877',
    this.email,
    this.address,
    this.about,
    this.gender,
    this.avatarBytes,
    this.gallery = const [],
    this.hobbies = const [],
  });

  ProfileData copyWith({
    String? name,
    String? phone,
    String? email,
    String? address,
    String? about,
    String? gender,
    Uint8List? avatarBytes,
    List<Uint8List>? gallery,
    List<String>? hobbies,
  }) {
    return ProfileData(
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      about: about ?? this.about,
      gender: gender ?? this.gender,
      avatarBytes: avatarBytes ?? this.avatarBytes,
      gallery: gallery ?? this.gallery,
      hobbies: hobbies ?? this.hobbies,
    );
  }
}

class ProfileStore {
  ProfileStore._();
  static final ProfileStore instance = ProfileStore._();

  final ValueNotifier<ProfileData> notifier = ValueNotifier<ProfileData>(const ProfileData());

  void update(ProfileData data) {
    notifier.value = data;
  }
}