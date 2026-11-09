import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suitapps/services/auth_session_service.dart';
// import 'package:shared_preferences/shared_preferences.dart';

import '../dashboard/dashboard_page.dart';
import 'package:suitapps/shared/utils/responsive.dart';

// import 'package:suitapps/config/api_config.dart';
import '../../../config/api_config.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  static const brandBlue = Color(0xFF2300C4);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class CompanyItem {
  final String id;
  final String name;

  CompanyItem({required this.id, required this.name});

  factory CompanyItem.fromJson(Map<String, dynamic> json) {
    return CompanyItem(
      id: json['CompanyId'].toString(),
      name: (json['CompanyName'] ?? '').toString(),
    );
  }
}

class _LoginPageState extends State<LoginPage> {


  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  List<CompanyItem> _companies = [];
  CompanyItem? _selectedCompany;

  bool _loadingCompanies = true;
  bool _loggingIn = false;
  bool _obscure = true;

  String? _companyError;
  String? _usernameError;
  String? _passwordError;

  String? _apiError;

  @override
  void initState() {
    super.initState();
    _fetchCompanies();
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _clearFieldErrors() {
    _companyError = null;
    _usernameError = null;
    _passwordError = null;
  }

  void _clearApiError() {
    _apiError = null;
  }

  String _makeSessionId() {
    final rnd = Random.secure();
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    final suffix = List.generate(
      12,
      (_) => chars[rnd.nextInt(chars.length)],
    ).join();
    return 'sess_$suffix';
  }

  // -----------------------------
  // ✅ API: COMPANIES
  // -----------------------------
  Future<void> _fetchCompanies() async {
    setState(() {
      _loadingCompanies = true;
      _apiError = null;
    });

    try {
      print('Fetching companies from: ${ApiConfig.baseUrl}${ApiConfig.companiesUrl}');
      final res = await http
          .get(Uri.parse('${ApiConfig.baseUrl}${ApiConfig.companiesUrl}'))
          .timeout(const Duration(seconds: 20));

      print('Response Status: ${res.statusCode}');
      print('Response Body: ${res.body}');

      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw Exception('Failed to load companies (${res.statusCode})');
      }

      final decoded = jsonDecode(res.body);
      print("LOGIN RESPONSE:");
      print(decoded);
      print('Decoded Type: ${decoded.runtimeType}');
      print('Decoded Data: $decoded');
      final List list = (decoded['data'] ?? []) as List;
      final items = list.map((e) => CompanyItem.fromJson(e)).toList();

      if (!mounted) return;
      setState(() {
        _companies = items;
        _selectedCompany = _companies.isNotEmpty ? _companies.first : null;
      });
    } catch (e, stackTrace) {
      print('ERROR FETCHING COMPANIES: $e');
      print('Stack Trace: $stackTrace');
      if (!mounted) return;
      setState(() => _apiError = 'Company load failed: $e');
    } finally {
      if (mounted) setState(() => _loadingCompanies = false);
    }
  }

  bool _validateFields() {
    _clearFieldErrors();
    bool ok = true;

    if (_selectedCompany == null) {
      _companyError = 'Please select a company';
      ok = false;
    }
    if (_usernameCtrl.text.trim().isEmpty) {
      _usernameError = 'Username is required';
      ok = false;
    }
    if (_passwordCtrl.text.isEmpty) {
      _passwordError = 'Password is required';
      ok = false;
    }

    return ok;
  }

  // -----------------------------
  // ✅ PERMISSIONS
  // -----------------------------
  Future<void> _showInfoDialog(String title, String message) async {
    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<bool> _ensureLocationPermissionAndService() async {
    LocationPermission perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }

    if (perm == LocationPermission.denied) {
      await _showInfoDialog(
        'Location Permission Required',
        'Please allow location permission to continue.',
      );
      return false;
    }

    if (perm == LocationPermission.deniedForever) {
      await _showInfoDialog(
        'Location Permission Blocked',
        'Location permission is permanently denied.\n\nPlease enable it from Settings.',
      );
      await Geolocator.openAppSettings();
      return false;
    }

    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      await _showInfoDialog(
        'Enable GPS',
        'Please turn ON Location (GPS) to continue.',
      );
      await Geolocator.openLocationSettings();
      return await Geolocator.isLocationServiceEnabled();
    }

    return true;
  }

  // -----------------------------
  // ✅ DYNAMIC DATA COLLECTORS
  // -----------------------------
  Future<String> _getPublicIp() async {
    try {
      final res = await http
          .get(Uri.parse('https://api.ipify.org?format=json'))
          .timeout(const Duration(seconds: 15));
      if (res.statusCode >= 200 && res.statusCode < 300) {
        final j = jsonDecode(res.body);
        return (j['ip'] ?? '').toString();
      }
    } catch (_) {}
    return '';
  }

  /// ✅ Works on both iOS + Android (your previous version was Android-only)
  Future<String> _getUserAgent() async {
    try {
      final info = DeviceInfoPlugin();

      if (Platform.isAndroid) {
        final android = await info.androidInfo;
        final model = android.model;
        final brand = android.brand;
        final sdk = android.version.sdkInt;
        final release = android.version.release;
        return 'Android $release (SDK $sdk) • $brand $model • Flutter';
      }

      if (Platform.isIOS) {
        final ios = await info.iosInfo;
        final name = ios.name; // Manu’s iPhone
        final systemVersion = ios.systemVersion; // 17.x / 18.x
        final machine = ios.utsname.machine; // iPhone17,2 etc.
        return 'iOS $systemVersion • $machine • $name • Flutter';
      }

      // Fallback for other platforms
      return 'Flutter';
    } catch (_) {
      return 'Flutter';
    }
  }

  Future<Position?> _getPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(const Duration(seconds: 15));
    } catch (_) {
      return null;
    }
  }

  Future<String> _reverseGeocode(double lat, double lng) async {
    try {
      final places = await placemarkFromCoordinates(
        lat,
        lng,
      ).timeout(const Duration(seconds: 15));
      if (places.isEmpty) return '';
      final p = places.first;

      final parts = <String>[
        if ((p.name ?? '').trim().isNotEmpty) p.name!.trim(),
        if ((p.street ?? '').trim().isNotEmpty) p.street!.trim(),
        if ((p.subLocality ?? '').trim().isNotEmpty) p.subLocality!.trim(),
        if ((p.locality ?? '').trim().isNotEmpty) p.locality!.trim(),
        if ((p.administrativeArea ?? '').trim().isNotEmpty)
          p.administrativeArea!.trim(),
        if ((p.postalCode ?? '').trim().isNotEmpty) p.postalCode!.trim(),
        if ((p.country ?? '').trim().isNotEmpty) p.country!.trim(),
      ];

      return parts.join(', ');
    } catch (_) {
      return '';
    }
  }

  Future<void> _sendLoginLog(
    Map<String, dynamic> loginDecoded, {
    required String sessionId,
  }) async {
    final userId = loginDecoded['UserId'] is int
        ? loginDecoded['UserId']
        : int.tryParse((loginDecoded['UserId'] ?? '0').toString()) ?? 0;

    final roleId = loginDecoded['UserRoleId'] is int
        ? loginDecoded['UserRoleId']
        : int.tryParse((loginDecoded['UserRoleId'] ?? '0').toString()) ?? 0;

    final ip = await _getPublicIp();
    final userAgent = await _getUserAgent();
    final pos = await _getPosition();

    String geoLocation = '';
    String geoPlace = '';

    if (pos != null) {
      geoLocation = '${pos.latitude},${pos.longitude}';
      geoPlace = await _reverseGeocode(pos.latitude, pos.longitude);
    }

    final payload = <String, dynamic>{
      "EmployeeCode": userId,
      "UserRoleId": roleId,
      "EmployeeName": (loginDecoded['Name'] ?? '').toString(),
      "LoginUserName": (loginDecoded['Username'] ?? '').toString(),
      "IPAddress": ip,
      "LoginStatus": true,
      "UserAgent": userAgent,
      "SessionID": sessionId,
      "GeoLocation": geoLocation,
      "GeoPlace": geoPlace,
    };

    try {
      await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}${ApiConfig.insertLoginLogUrl}'),
            headers: {"Content-Type": "application/json"},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 20));
    } catch (_) {}
  }

  /// Fetch route info (RouteId, RouteName) for the given employee for today
  // Future<void> _fetchAndSaveRoute(int empId) async {
  //   try {
  //     final dateStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
  //     final uri = Uri.parse('${ApiConfig.baseUrl}${ApiConfig.getrootNameUrl}?empId=$empId&date=$dateStr');
  //     final res = await http.get(uri).timeout(const Duration(seconds: 20));
  //     if (res.statusCode < 200 || res.statusCode >= 300) return;

  //     final decoded = jsonDecode(res.body);
  //     String routeId = '';
  //     String routeName = '';

  //     if (decoded is Map<String, dynamic>) {
  //       if (decoded.containsKey('RouteId')) routeId = decoded['RouteId']?.toString() ?? '';
  //       if (decoded.containsKey('RouteID')) routeId = decoded['RouteID']?.toString() ?? routeId;
  //       if (decoded.containsKey('rootID')) routeId = decoded['rootID']?.toString() ?? routeId;
  //       if (decoded.containsKey('RouteName')) routeName = decoded['RouteName']?.toString() ?? '';
  //       if (decoded.containsKey('rootName')) routeName = decoded['rootName']?.toString() ?? routeName;

  //       // If server returns a data list
  //       if ((routeId.isEmpty || routeName.isEmpty) && decoded['data'] is List && decoded['data'].isNotEmpty) {
  //         final first = decoded['data'][0] as Map<String, dynamic>;
  //         routeId = routeId.isEmpty
  //             ? (first['RouteId']?.toString() ?? first['RouteID']?.toString() ?? first['rootID']?.toString() ?? '')
  //             : routeId;
  //         routeName = routeName.isEmpty
  //             ? (first['RouteName']?.toString() ?? first['rootName']?.toString() ?? '')
  //             : routeName;
  //       }
  //     }

  //     if (routeId.isNotEmpty || routeName.isNotEmpty) {
  //       print('Fetched login route info: routeId=$routeId, routeName=$routeName');
  //       final authSvc = AuthSessionService();
  //       await authSvc.setRouteInfo(routeId: routeId, routeName: routeName);
  //     } else {
  //       print('No route info returned for empId=$empId date=$dateStr');
  //     }
  //   } catch (error) {
  //     print('Failed to fetch route info: $error');
  //   }
  // }
  // Future<void> _fetchAndSaveRoute(int empId) async {
  //   try {
  //     final dateStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

  //     final uri = Uri.parse(
  //       '${ApiConfig.baseUrl}${ApiConfig.getrootNameUrl}?EmpID=$empId&Date=$dateStr',
  //     );

  //     print('Route API URL: $uri');

  //     final res = await http.get(uri).timeout(const Duration(seconds: 20));

  //     print('Route Status: ${res.statusCode}');
  //     print('Route Response: ${res.body}');

  //     if (res.statusCode < 200 || res.statusCode >= 300) {
  //       return;
  //     }

  //     final decoded = jsonDecode(res.body);

  //     String routeId = '';
  //     String routeName = '';

  //     if (decoded['success'] == true &&
  //         decoded['data'] is List &&
  //         (decoded['data'] as List).isNotEmpty) {
  //       final first = decoded['data'][0];

  //       routeId = first['RootID']?.toString() ?? '';
  //       routeName = first['RootName']?.toString().trim() ?? '';

  //       final authSvc = AuthSessionService();

  //       await authSvc.setRouteInfo(routeId: routeId, routeName: routeName);

  //       print('Route saved');
  //       print('RouteId = $routeId');
  //       print('RouteName = $routeName');

  //       await authSvc.printRouteInfo();
  //     } else {
  //       print('No route data found');
  //     }
  //   } catch (e) {
  //     print('Failed to fetch route info: $e');
  //   }
  // }

  // -----------------------------
  // ✅ LOGIN
  // -----------------------------
  Future<void> _login() async {
    setState(() {
      _clearApiError();
      _clearFieldErrors();
    });

    if (!_validateFields()) {
      setState(() {});
      return;
    }

    setState(() => _loggingIn = true);

    try {
      final okPerm = await _ensureLocationPermissionAndService();
      if (!okPerm) {
        if (mounted) setState(() => _loggingIn = false);
        return;
      }

      final loginPayload = {
        "CompanyID": _selectedCompany!.id,
        "Username": _usernameCtrl.text.trim(),
        "Password": _passwordCtrl.text,
      };

      final res = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}${ApiConfig.loginEndpoint}'),
            headers: {"Content-Type": "application/json"},
            body: jsonEncode(loginPayload),
          )
          .timeout(const Duration(seconds: 25));

      if (res.statusCode < 200 || res.statusCode >= 300) {
        throw Exception('Login failed (${res.statusCode})');
      }

      final decoded = jsonDecode(res.body);

      print("=========== LOGIN RESPONSE ===========");
      print(decoded);
      print("UserId = ${decoded['UserId']}");
      print("UserRoleId = ${decoded['UserRoleId']}");
      print("CompanyID = ${decoded['CompanyID']}");
      final bool success = decoded['success'] == true;

      if (!success) {
        if (!mounted) return;
        setState(() {
          _apiError =
              (decoded['message'] ??
                      decoded['Message'] ??
                      'Invalid username or password')
                  .toString();
        });
        return;
      }

      final sessionId = _makeSessionId();

      // Save login date + time
      final now = DateTime.now();
      final loginDate = DateFormat('yyyy-MM-dd').format(now);
      final loginTime = DateFormat('hh:mm a').format(now);

      // await _sendLoginLog(decoded, sessionId: sessionId);
      _sendLoginLog(decoded, sessionId: sessionId);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isLoggedIn', true);
      await prefs.setString('loginDate', loginDate);
      await prefs.setString('loginTime', loginTime);
      await prefs.setString('sessionId', sessionId);

      // Company for drawer
      await prefs.setString('SelectedCompanyId', _selectedCompany!.id);
      await prefs.setString('SelectedCompanyName', _selectedCompany!.name);

      // User details
      await prefs.setString('CompanyID', decoded['CompanyID'].toString());
      await prefs.setString('Username', (decoded['Username'] ?? '').toString());
      await prefs.setString('Name', (decoded['Name'] ?? '').toString());

      await prefs.setString(
        'UserRoleName',
        (decoded['UserRoleName'] ?? decoded['RoleName'] ?? '').toString(),
      );

      print("Saved UserId = ${decoded['UserId']}");
      print("Saved UserRoleId = ${decoded['UserRoleId']}");
      print("Saved CompanyID = ${decoded['CompanyID']}");

      await prefs.setInt(
        'UserId',
        decoded['UserId'] is int
            ? decoded['UserId']
            : int.tryParse(decoded['UserId'].toString()) ?? 0,
      );
      await prefs.setInt(
        'UserRoleId',
        decoded['UserRoleId'] is int
            ? decoded['UserRoleId']
            : int.tryParse(decoded['UserRoleId'].toString()) ?? 0,
      );

      await prefs.setString('user', jsonEncode(decoded));

      // Fetch route info for this employee for today and save in session
      // try {
      //   final int userId = decoded['UserId'] is int
      //       ? decoded['UserId']
      //       : int.tryParse(decoded['UserId'].toString()) ?? 0;
      //   // await _fetchAndSaveRoute(userId);
      // } catch (_) {}

      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => DashboardPage(
            userDecoded: (decoded is Map<String, dynamic>) ? decoded : {},
            sessionId: sessionId,
          ),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _apiError = 'Login failed. Please try again.');
    } finally {
      if (mounted) setState(() => _loggingIn = false);
    }
  }

  void _forgotPassword() {}

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Responsive padding
    final double padH = Responsive.pad(context, 18.0);
    final double padV = Responsive.pad(context, 18.0);

    // ✅ Auto width: a % of screen, clamped (works phone + tablet)
    final double screenW = Responsive.w(context);
    final double maxWidth = (screenW * 0.92).clamp(340.0, 440.0);

    return Scaffold(
      body: Stack(
        children: [
          Image.asset(
            'assets/images/login-bg-1.jpg',
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          ),
          Container(color: Colors.black.withValues(alpha: 0.25)),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: padH, vertical: padV),
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: maxWidth),
                  child: _card(theme),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _card(ThemeData theme) {
    final double cardPadL = Responsive.pad(context, 18.0);
    final double cardPadT = Responsive.pad(context, 18.0);
    final double cardPadR = Responsive.pad(context, 18.0);
    final double cardPadB = Responsive.pad(context, 14.0);

    final double cardRadius = Responsive.radius(context, 26.0);
    final double fieldRadius = Responsive.radius(context, 14.0);

    final double logoH = Responsive.scale(context, 50.0);
    final double gap12 = Responsive.pad(context, 12.0);
    final double gap16 = Responsive.pad(context, 16.0);
    final double gap14 = Responsive.pad(context, 14.0);
    final double gap10 = Responsive.pad(context, 10.0);

    final double footerFont = Responsive.font(context, 11.5);
    final double errorFont = Responsive.font(context, 12.5);

    return Container(
      padding: EdgeInsets.fromLTRB(cardPadL, cardPadT, cardPadR, cardPadB),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(cardRadius),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.20),
            blurRadius: Responsive.scale(context, 30.0),
            offset: Offset(0, Responsive.scale(context, 16.0)),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Image.asset('assets/images/sp-logo.png', height: logoH),
          SizedBox(height: gap12),
          Text(
            'Please sign in to continue',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: Colors.black54,
              fontSize: Responsive.font(context, 14.0),
            ),
          ),
          SizedBox(height: gap16),

          _label('Company'),
          SizedBox(height: Responsive.pad(context, 8.0)),
          _companyDropdown(fieldRadius: fieldRadius),
          if (_companyError != null) ...[
            SizedBox(height: Responsive.pad(context, 6.0)),
            _fieldError(_companyError!, fontSize: errorFont),
          ],

          SizedBox(height: gap14),

          _label('Username'),
          SizedBox(height: Responsive.pad(context, 8.0)),
          _input(
            fieldRadius: fieldRadius,
            controller: _usernameCtrl,
            hintText: 'Enter the username',
            prefixIcon: Icons.person_outline,
            errorText: _usernameError,
            onChanged: (_) => setState(() => _usernameError = null),
            errorFontSize: errorFont,
          ),

          SizedBox(height: gap14),

          Row(
            children: [
              Expanded(child: _label('Password')),
              GestureDetector(
                onTap: _forgotPassword,
                child: Text(
                  'Forgot your password?',
                  style: TextStyle(
                    color: LoginPage.brandBlue.withValues(alpha: 0.95),
                    fontWeight: FontWeight.w800,
                    decoration: TextDecoration.none,
                    fontSize: Responsive.font(context, 12.8),
                  ),
                ),
              ),
            ],
          ),

          SizedBox(height: Responsive.pad(context, 8.0)),

          _input(
            fieldRadius: fieldRadius,
            controller: _passwordCtrl,
            hintText: 'Enter the password',
            prefixIcon: Icons.lock_outline,
            obscureText: _obscure,
            errorText: _passwordError,
            onChanged: (_) => setState(() => _passwordError = null),
            errorFontSize: errorFont,
            suffix: IconButton(
              onPressed: () => setState(() => _obscure = !_obscure),
              icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
              iconSize: Responsive.scale(context, 22.0),
              color: LoginPage.brandBlue.withValues(alpha: 0.85),
            ),
          ),

          SizedBox(height: gap14),

          SizedBox(
            width: double.infinity,
            height: Responsive.scale(context, 50.0),
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: LoginPage.brandBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    Responsive.radius(context, 16.0),
                  ),
                ),
                elevation: 0,
              ),
              onPressed: _loggingIn ? null : _login,
              child: _loggingIn
                  ? SizedBox(
                      height: Responsive.scale(context, 22.0),
                      width: Responsive.scale(context, 22.0),
                      child: const CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Log in',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: Responsive.font(context, 14.5),
                      ),
                    ),
            ),
          ),

          if (_apiError != null) ...[
            SizedBox(height: gap10),
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: Responsive.pad(context, 10.0),
              ),
              child: Text(
                _apiError!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w800,
                  fontSize: Responsive.font(context, 13.0),
                ),
              ),
            ),
          ],

          SizedBox(height: gap12),

          Text(
            'MICROTECH SOFTWARE SOLUTIONS',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: footerFont,
              fontWeight: FontWeight.w800,
              color: Colors.black54,
            ),
          ),
        ],
      ),
    );
  }

  Widget _companyDropdown({required double fieldRadius}) {
    if (_loadingCompanies) {
      return Container(
        height: Responsive.scale(context, 54.0),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFFF6F7FF),
          borderRadius: BorderRadius.circular(fieldRadius),
          border: Border.all(
            color: LoginPage.brandBlue.withValues(alpha: 0.22),
          ),
        ),
        child: SizedBox(
          height: Responsive.scale(context, 18.0),
          width: Responsive.scale(context, 18.0),
          child: const CircularProgressIndicator(
            strokeWidth: 2.2,
            color: LoginPage.brandBlue,
          ),
        ),
      );
    }

    final bool hasError = _companyError != null;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: Responsive.pad(context, 12.0)),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F7FF),
        borderRadius: BorderRadius.circular(fieldRadius),
        border: Border.all(
          color: hasError
              ? Colors.red
              : LoginPage.brandBlue.withValues(alpha: 0.30),
          width: hasError ? 1.4 : 1.0,
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<CompanyItem>(
          isExpanded: true,
          value: _selectedCompany,
          icon: Icon(
            Icons.arrow_drop_down,
            color: LoginPage.brandBlue,
            size: Responsive.scale(context, 24.0),
          ),
          items: _companies
              .map(
                (c) => DropdownMenuItem(
                  value: c,
                  child: Text(
                    c.name,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: Responsive.font(context, 13.8),
                    ),
                  ),
                ),
              )
              .toList(),
          onChanged: (v) => setState(() {
            _selectedCompany = v;
            _companyError = null;
          }),
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: TextStyle(
          fontWeight: FontWeight.w800,
          color: const Color(0xFF1F2A2E),
          fontSize: Responsive.font(context, 13.5),
        ),
      ),
    );
  }

  Widget _fieldError(String text, {required double fontSize}) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: TextStyle(
          color: Colors.red,
          fontWeight: FontWeight.w800,
          fontSize: fontSize,
        ),
      ),
    );
  }

  Widget _input({
    required TextEditingController controller,
    required String hintText,
    required IconData prefixIcon,
    required double fieldRadius,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffix,
    String? errorText,
    ValueChanged<String>? onChanged,
    required double errorFontSize,
  }) {
    final bool hasError = errorText != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          cursorColor: LoginPage.brandBlue,
          onChanged: onChanged,
          style: TextStyle(fontSize: Responsive.font(context, 14.5)),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: TextStyle(
              fontSize: Responsive.font(context, 13.0),
              color: Colors.black.withValues(alpha: 0.45),
              fontWeight: FontWeight.w600,
            ),
            prefixIcon: Icon(
              prefixIcon,
              color: LoginPage.brandBlue.withValues(alpha: 0.85),
              size: Responsive.scale(context, 20.0),
            ),
            suffixIcon: suffix,
            filled: true,
            fillColor: const Color(0xFFF6F7FF),
            contentPadding: EdgeInsets.symmetric(
              horizontal: Responsive.pad(context, 14.0),
              vertical: Responsive.pad(context, 14.0),
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(fieldRadius),
              borderSide: BorderSide(
                color: hasError
                    ? Colors.red
                    : LoginPage.brandBlue.withValues(alpha: 0.22),
                width: hasError ? 1.4 : 1.0,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(fieldRadius),
              borderSide: BorderSide(
                color: hasError
                    ? Colors.red
                    : LoginPage.brandBlue.withValues(alpha: 0.22),
                width: hasError ? 1.4 : 1.0,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(fieldRadius),
              borderSide: BorderSide(
                color: hasError
                    ? Colors.red
                    : LoginPage.brandBlue.withValues(alpha: 0.45),
                width: hasError ? 1.4 : 1.2,
              ),
            ),
          ),
        ),
        if (errorText != null) ...[
          SizedBox(height: Responsive.pad(context, 6.0)),
          _fieldError(errorText, fontSize: errorFontSize),
        ],
      ],
    );
  }
}
