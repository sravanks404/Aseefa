import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suitapps/core/session_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  test('reads user and company IDs from session data', () async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', jsonEncode({
      'UserId': '456',
      'CompanyID': '789',
    }));
    await prefs.setString('CompanyID', '789');
    await prefs.setInt('UserId', 456);

    expect(await SessionStore.getUserId(), 456);
    expect(await SessionStore.getCompanyId(), 789);
  });
}
