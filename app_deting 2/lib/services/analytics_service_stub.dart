// Stub for CleverTap on web platform
class CleverTapPlugin {
  static void setDebugLevel(int level) {}
  static Future<void> onUserLogin(Map<String, dynamic> profile) async {}
  static void recordEvent(String event, Map<String, dynamic> props) {}
}
