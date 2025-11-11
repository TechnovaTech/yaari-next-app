import 'package:shared_preferences/shared_preferences.dart';

class AppTranslations {
  static String _currentLanguage = 'en';

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _currentLanguage = prefs.getString('language') ?? 'en';
  }

  static void setLanguage(String lang) {
    _currentLanguage = lang;
  }

  static String get(String key) {
    return _translations[_currentLanguage]?[key] ?? _translations['en']?[key] ?? key;
  }

  static final Map<String, Map<String, String>> _translations = {
    'en': {
      // Common
      'next': 'Next',
      'save': 'Save',
      'cancel': 'Cancel',
      'back': 'Back',
      'done': 'Done',
      'skip': 'Skip',
      'online': 'Online',
      'offline': 'Offline',
      'busy': 'Busy',
      
      // Language Screen
      'select_language': 'Select Language',
      'english': 'English',
      'hindi': 'हिंदी',
      
      // Gender Screen
      'select_gender': 'Select Gender',
      'male': 'Male',
      'female': 'Female',
      
      // Edit Profile
      'edit_profile': 'Edit Profile',
      'add_details': 'Add Details',
      'upload_picture': 'Upload Picture',
      'gender': 'Gender',
      'not_set': 'Not set',
      'user_name': 'User Name',
      'email': 'Email',
      'about_me': 'About me',
      'photo_gallery': 'Photo Gallery',
      'add_photos': 'Add Photos',
      'hobbies': 'Hobbies',
      'add_hobby': 'Add a hobby',
      'add': 'Add',
      'save_details': 'Save Details',
      'save_changes': 'Save Changes',
      'phone_locked': 'Phone number is locked after first save',
      'email_locked': 'Email is locked after first save',
      
      // Home Screen
      'home': 'Home',
      'yaari': 'Yaari',
      'no_ads_available': 'No ads available',
      'click_to_open': 'Click to open',
      'press_back_again': 'Press back again to exit',
      'no_call_access': 'No call access',
      'min': 'min',
      
      // Profile Screen
      'profile': 'Profile',
      'transaction_history': 'Transaction History',
      'call_history': 'Call History',
      'privacy_policy': 'Privacy Policy',
      'customer_support': 'Customer Support',
      'logout': 'Log Out',
      
      // Coins Screen
      'coins': 'Coins',
      'recharge': 'Recharge',
      'balance': 'Balance',
      'buy_coins': 'Buy Coins',
      
      // Call Dialogs
      'stay_connected': 'Stay connected',
      'recharge_message': 'Recharge now to continue your yaari moments!',
      'recharge_now': 'Recharge Now',
      'later': 'Later',
      'permission_required': 'Permission Required',
      'camera_permission': 'Camera and microphone access needed for video call',
      'microphone_permission': 'Microphone access needed for audio call',
      'allow': 'Allow',
      'deny': 'Deny',
      'confirm_call': 'Confirm Call',
      'video_call': 'Video Call',
      'audio_call': 'Audio Call',
      'rate': 'Rate',
      'start_call': 'Start Call',
      
      // Transaction History
      'transaction_history': 'Transaction History',
      'transaction': 'Transaction',
      'success': 'success',
      'coins_label': 'Coins',
      'need_help_transactions': 'Need help\nunderstanding\nyour ',
      'transactions_question': 'transactions?',
      'questions_unusual': 'If you have any questions or spot\nsomething unusual, please reach\nout to us at',
      'our_team_assist': 'Our team is here to assist you.',
      'please_login_transactions': 'Please login to view transactions',
      'failed_load_transactions': 'Failed to load transactions',
      
      // Call History
      'call_history': 'Call History',
      'incoming': 'Incoming',
      'outgoing': 'Outgoing',
      'completed': 'Completed',
      'missed': 'Missed',
      'no_call_history': 'You don\'t have any call history yet',
      'need_help_call_history': 'Need help\nunderstanding\nyour ',
      'call_history_question': 'Call history?',
      
      // Privacy & Terms
      'privacy_terms': 'Privacy & Terms',
      'privacy_policy': 'Privacy Policy',
      'terms_of_service': 'Terms of Service',
      
      // Customer Support
      'customer_support': 'Customer Support',
      'got_query': 'Got a query or need\n',
      'assistance': 'assistance?',
      'here_to_help': "We're here to help! Write to us at",
      'support_team_response': 'and our support team will get back to you\nas soon as possible.',
      
      // Messages
      'details_saved': 'Details saved successfully',
      'changes_saved': 'Changes saved successfully',
      'loading': 'Loading...',
    },
    'hi': {
      // Common
      'next': 'आगे',
      'save': 'सेव करें',
      'cancel': 'रद्द करें',
      'back': 'वापस',
      'done': 'हो गया',
      'skip': 'छोड़ें',
      'online': 'ऑनलाइन',
      'offline': 'ऑफलाइन',
      'busy': 'व्यस्त',
      
      // Language Screen
      'select_language': 'भाषा चुनें',
      'english': 'English',
      'hindi': 'हिंदी',
      
      // Gender Screen
      'select_gender': 'लिंग चुनें',
      'male': 'पुरुष',
      'female': 'महिला',
      
      // Edit Profile
      'edit_profile': 'प्रोफाइल एडिट करें',
      'add_details': 'विवरण जोड़ें',
      'upload_picture': 'फोटो अपलोड करें',
      'gender': 'लिंग',
      'not_set': 'सेट नहीं है',
      'user_name': 'नाम',
      'email': 'ईमेल',
      'about_me': 'मेरे बारे में',
      'photo_gallery': 'फोटो गैलरी',
      'add_photos': 'फोटो जोड़ें',
      'hobbies': 'शौक',
      'add_hobby': 'शौक जोड़ें',
      'add': 'जोड़ें',
      'save_details': 'विवरण सेव करें',
      'save_changes': 'बदलाव सेव करें',
      'phone_locked': 'पहली बार सेव करने के बाद फोन नंबर लॉक हो जाता है',
      'email_locked': 'पहली बार सेव करने के बाद ईमेल लॉक हो जाता है',
      
      // Home Screen
      'home': 'होम',
      'yaari': 'यारी',
      'no_ads_available': 'कोई विज्ञापन उपलब्ध नहीं',
      'click_to_open': 'खोलने के लिए क्लिक करें',
      'press_back_again': 'बाहर निकलने के लिए फिर से बैक दबाएं',
      'no_call_access': 'कॉल एक्सेस नहीं है',
      'min': 'मिनट',
      
      // Profile Screen
      'profile': 'प्रोफाइल',
      'transaction_history': 'लेनदेन इतिहास',
      'call_history': 'कॉल हिस्ट्री',
      'privacy_policy': 'गोपनीयता नीति',
      'customer_support': 'ग्राहक सहायता',
      'logout': 'लॉग आउट',
      
      // Coins Screen
      'coins': 'कॉइन्स',
      'recharge': 'रिचार्ज',
      'balance': 'बैलेंस',
      'buy_coins': 'कॉइन्स खरीदें',
      
      // Call Dialogs
      'stay_connected': 'जुड़े रहें',
      'recharge_message': 'अपने यारी के पलों को जारी रखने के लिए अभी रिचार्ज करें!',
      'recharge_now': 'अभी रिचार्ज करें',
      'later': 'बाद में',
      'permission_required': 'अनुमति आवश्यक',
      'camera_permission': 'वीडियो कॉल के लिए कैमरा और माइक्रोफोन एक्सेस चाहिए',
      'microphone_permission': 'ऑडियो कॉल के लिए माइक्रोफोन एक्सेस चाहिए',
      'allow': 'अनुमति दें',
      'deny': 'अस्वीकार करें',
      'confirm_call': 'कॉल कन्फर्म करें',
      'video_call': 'वीडियो कॉल',
      'audio_call': 'ऑडियो कॉल',
      'rate': 'दर',
      'start_call': 'कॉल शुरू करें',
      
      // Transaction History
      'transaction_history': 'लेनदेन इतिहास',
      'transaction': 'लेनदेन',
      'success': 'सफल',
      'coins_label': 'कॉइन्स',
      'need_help_transactions': 'अपने लेनदेन को\nसमझने में\nमदद चाहिए ',
      'transactions_question': '?',
      'questions_unusual': 'यदि आपके कोई प्रश्न हैं या कुछ\nअसामान्य दिखता है, तो कृपया\nहमसे संपर्क करें',
      'our_team_assist': 'हमारी टीम आपकी सहायता के लिए यहां है।',
      'please_login_transactions': 'लेनदेन देखने के लिए कृपया लॉगिन करें',
      'failed_load_transactions': 'लेनदेन लोड करने में विफल',
      
      // Call History
      'call_history': 'कॉल हिस्ट्री',
      'incoming': 'इनकमिंग',
      'outgoing': 'आउटगोइंग',
      'completed': 'पूर्ण',
      'missed': 'मिस्ड',
      'no_call_history': 'आपके पास अभी तक कोई कॉल हिस्ट्री नहीं है',
      'need_help_call_history': 'अपनी कॉल हिस्ट्री\nको समझने में\nमदद चाहिए ',
      'call_history_question': '?',
      
      // Privacy & Terms
      'privacy_terms': 'गोपनीयता और नियम',
      'privacy_policy': 'गोपनीयता नीति',
      'terms_of_service': 'सेवा की शर्तें',
      
      // Customer Support
      'customer_support': 'ग्राहक सहायता',
      'got_query': 'कोई प्रश्न है या\n',
      'assistance': 'सहायता चाहिए?',
      'here_to_help': 'हम मदद के लिए यहां हैं! हमें लिखें',
      'support_team_response': 'और हमारी सहायता टीम जल्द से जल्द\nआपसे संपर्क करेगी।',
      
      // Messages
      'details_saved': 'विवरण सफलतापूर्वक सेव हो गया',
      'changes_saved': 'बदलाव सफलतापूर्वक सेव हो गए',
      'loading': 'लोड हो रहा है...',
    },
  };
}
