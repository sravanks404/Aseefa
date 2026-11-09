import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SessionStore {
  static const _kIsLoggedIn = 'isLoggedIn';
  static const _kLoginDate = 'loginDate';
  static const _kSessionId = 'sessionId';
  static const _kUser = 'user';

  static const _kSelectedCompanyId = 'SelectedCompanyId';
  static const _kSelectedCompanyName = 'SelectedCompanyName';

  static String today() => DateFormat('yyyy-MM-dd').format(DateTime.now());

  static Future<bool> isValidForToday() async {
    final prefs = await SharedPreferences.getInstance();
    final isLoggedIn = prefs.getBool(_kIsLoggedIn) ?? false;
    final savedDate = prefs.getString(_kLoginDate) ?? '';
    return isLoggedIn && savedDate == today();
  }

  static Future<Map<String, dynamic>> getUserDecoded() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(_kUser) ?? '{}';
    try {
      return jsonDecode(userStr) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  static Future<String> getSessionId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_kSessionId) ?? '';
  }

  static Future<Map<String, String>> getCompany() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      "id": prefs.getString(_kSelectedCompanyId) ?? '',
      "name": prefs.getString(_kSelectedCompanyName) ?? '',
    };
  }

  static Future<int> getCompanyId() async {
    final prefs = await SharedPreferences.getInstance();

    final decoded = await getUserDecoded();
    final sessionCompanyId = decoded['CompanyID'] ?? decoded['companyId'];
    final values = [
      sessionCompanyId,
      prefs.get('CompanyID'),
      prefs.get(_kSelectedCompanyId),
    ];

    for (final value in values) {
      final parsed = _parseInt(value);
      if (parsed != null && parsed != 0) return parsed;
    }

    return 0;
  }

  static Future<int> getUserId() async {
    final prefs = await SharedPreferences.getInstance();

    final decoded = await getUserDecoded();
    final sessionUserId = decoded['UserId'] ?? decoded['userId'];
    final values = [
      sessionUserId,
      prefs.get('UserId'),
    ];

    for (final value in values) {
      final parsed = _parseInt(value);
      if (parsed != null && parsed != 0) return parsed;
    }

    return 0;
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty) return null;
      return int.tryParse(trimmed);
    }
    return int.tryParse(value.toString());
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kIsLoggedIn);
    await prefs.remove(_kLoginDate);
    await prefs.remove(_kSessionId);
    await prefs.remove(_kUser);

    await prefs.remove(_kSelectedCompanyId);
    await prefs.remove(_kSelectedCompanyName);

    // (Optional) keep other keys if you want, or remove them too.
    await prefs.remove('CompanyID');
    await prefs.remove('Username');
    await prefs.remove('Name');
    await prefs.remove('UserId');
    await prefs.remove('UserRoleId');
  }
}
