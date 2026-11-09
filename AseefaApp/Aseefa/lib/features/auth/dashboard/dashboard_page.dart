import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:suitapps/features/auth/settings/settings_page.dart';
import 'package:suitapps/features/auth/profile/profile_page.dart';

import '../login/login_page.dart';
import 'package:suitapps/shared/widgets/common_bottom_nav.dart';
import 'package:suitapps/shared/widgets/expandable_fab.dart';

import 'package:suitapps/shared/utils/responsive.dart';
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

import 'dashboard_constants.dart';
import 'widgets/dashboard_header.dart';
import 'widgets/overview_cards.dart';
import 'widgets/sales_orders_chart.dart';
import 'widgets/activity_timeline.dart';
import 'widgets/chart_data_screen.dart';
import 'package:suitapps/shared/widgets/app_drawer.dart';
import '../../customer/existing_customers_page.dart';
import 'package:suitapps/features/property_management/property_information_screen.dart';
import 'package:suitapps/features/property_management/rental_info_screen.dart';

class DashboardPage extends StatefulWidget {
  final Map<String, dynamic> userDecoded;
  final String sessionId;

  const DashboardPage({
    super.key,
    required this.userDecoded,
    required this.sessionId,
  });

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  int _bottomIndex = 0;

  String _name = "User";
  String? _profileUrl;
  final List<TimelineItemData> _recentCustomers = [];
  bool _loadingRecentCustomers = true;
  String? _recentCustomersError;

  @override
  void initState() {
    super.initState();

    final name = (widget.userDecoded['Name'] ?? '').toString().trim();
    _name = name.isEmpty ? "User" : name;

    final p = (widget.userDecoded['ProfileImage'] ?? '').toString().trim();
    _profileUrl = p.isEmpty ? null : p;

    _hydrateFromPrefs();
    _loadRecentCustomers();
  }

  Future<void> _loadRecentCustomers() async {
    if (mounted) {
      setState(() {
        _loadingRecentCustomers = true;
        _recentCustomersError = null;
      });
    }

    try {
      final companyId = await SessionStore.getCompanyId();
      if (companyId <= 0) {
        throw Exception('Company context is missing. Please sign in again.');
      }

      final uri = Uri.parse(
        '${ApiConfig.baseUrl}${ApiConfig.getClientDetails}',
      ).replace(queryParameters: {'CompanyId': '$companyId'});
      final response = await http
          .get(uri, headers: const {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 20));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('Customer service returned ${response.statusCode}.');
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! Map ||
          (decoded['success'] != true &&
              decoded['success']?.toString() != 'true')) {
        throw Exception(
          decoded is Map
              ? decoded['message']?.toString() ??
                    'Customer activity could not be loaded.'
              : 'Unexpected customer response.',
        );
      }

      final rows = decoded['data'];
      if (rows is! List) {
        throw const FormatException(
          'Customer response did not contain a data list.',
        );
      }

      final customerRows =
          rows
              .whereType<Map>()
              .map((row) => Map<String, dynamic>.from(row))
              .toList()
            ..sort((a, b) {
              final aDate = DateTime.tryParse(
                (a['CreatedDate'] ?? a['CreatedOn'] ?? a['CreatedAt'] ?? '')
                    .toString(),
              );
              final bDate = DateTime.tryParse(
                (b['CreatedDate'] ?? b['CreatedOn'] ?? b['CreatedAt'] ?? '')
                    .toString(),
              );
              if (aDate == null) return bDate == null ? 0 : 1;
              if (bDate == null) return -1;
              return bDate.compareTo(aDate);
            });
      final items = customerRows
          .map((customer) {
            final createdValue =
                customer['CreatedDate'] ??
                customer['CreatedOn'] ??
                customer['CreatedAt'];
            final createdDate = DateTime.tryParse(
              createdValue?.toString() ?? '',
            );
            final email = (customer['Email'] ?? customer['Phone'] ?? '')
                .toString();
            return TimelineItemData(
              title: 'Customer',
              time: createdDate == null
                  ? ''
                  : DateFormat('dd MMM yyyy, hh:mm a').format(createdDate),
              showProfile: true,
              name: (customer['CompanyName'] ?? customer['Name'] ?? 'Customer')
                  .toString(),
              email: email,
            );
          })
          .take(5)
          .toList();

      if (!mounted) return;
      setState(() {
        _recentCustomers
          ..clear()
          ..addAll(items);
        _loadingRecentCustomers = false;
      });
    } catch (error) {
      debugPrint('Load recent customers error: $error');
      if (!mounted) return;
      setState(() {
        _recentCustomersError = error.toString().replaceFirst(
          'Exception: ',
          '',
        );
        _loadingRecentCustomers = false;
      });
    }
  }

  Future<void> _hydrateFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final name = (prefs.getString('Name') ?? '').trim();
      final userJson = (prefs.getString('user') ?? '').trim();

      String? profile;
      if (userJson.isNotEmpty) {
        try {
          final decoded = jsonDecode(userJson);
          if (decoded is Map<String, dynamic>) {
            final p = (decoded['ProfileImage'] ?? '').toString().trim();
            profile = p.isEmpty ? null : p;
          }
        } catch (_) {}
      }

      if (!mounted) return;
      setState(() {
        _name = name.isEmpty ? _name : name;
        _profileUrl = profile ?? _profileUrl;
      });
    } catch (_) {}
  }

  void _openDrawer() => _scaffoldKey.currentState?.openDrawer();

  void _openProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const ProfilePage()),
    );
  }

  void _openSettings() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const SettingsPage()),
    );
  }

  String _formatDateTime(DateTime dt) {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    int hour = dt.hour;
    final ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour == 0) hour = 12;

    return "${dt.day} ${months[dt.month - 1]} ${dt.year}, "
        "${hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')} $ampm";
  }

  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();

    if (!context.mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final dateText = _formatDateTime(DateTime.now());
    const appLogoForHeaderFallback = "assets/icon/sp-logo.png";

    final double outerRadius = Responsive.radius(context, 32);

    return Scaffold(
      key: _scaffoldKey,
      drawer: AppDrawer(
        profileUrl: _profileUrl,
        onLogout: () => _logout(context),
      ),
      backgroundColor: DashboardConstants.bg,

      floatingActionButton: Padding(
        padding: EdgeInsets.only(bottom: Responsive.pad(context, 70)),
        child: ExpandableFab(
          onRentalRegistrationTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const RentalRegistrationScreen(),
              ),
            );
          },
          onExistingClientTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ExistingCustomersPage()),
            );
          },

          onAddPropertyTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    const PropertyInformationScreen(openCreate: true),
              ),
            );
          },
        ),
      ),
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                Container(
                  margin: EdgeInsets.fromLTRB(
                    Responsive.pad(context, 8),
                    Responsive.pad(context, 8),
                    Responsive.pad(context, 8),
                    Responsive.pad(context, 6),
                  ),
                  decoration: BoxDecoration(
                    color: DashboardConstants.brandBlue,
                    borderRadius: BorderRadius.circular(outerRadius),
                  ),
                  child: Column(
                    children: [
                      DashboardHeader(
                        name: _name,
                        dateText: dateText,
                        profileImageUrl: _profileUrl,
                        profileImageAssetPath: appLogoForHeaderFallback,
                        onMenuTap: _openDrawer,

                        onProfileTap: _openProfile,
                      ),
                      Padding(
                        padding: EdgeInsets.fromLTRB(
                          Responsive.pad(context, 8),
                          Responsive.pad(context, 8),
                          Responsive.pad(context, 8),
                          Responsive.pad(context, 8),
                        ),
                        child: Container(
                          width: double.infinity,
                          padding: EdgeInsets.all(Responsive.pad(context, 16)),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(
                              Responsive.radius(context, 28),
                            ),
                          ),
                          child: const OverviewCards(),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(
                      Responsive.pad(context, 14),
                      Responsive.pad(context, 8),
                      Responsive.pad(context, 14),
                      Responsive.pad(context, 120),
                    ),

                    child: Column(
                      children: [
                        const SalesOrdersChart(),

                        SizedBox(height: Responsive.pad(context, 14)),

                        const ChartDataScreen(),

                        SizedBox(height: Responsive.pad(context, 14)),

                        _buildRecentCustomers(),

                        SizedBox(height: Responsive.pad(context, 14)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          Align(
            alignment: Alignment.bottomCenter,
            child: CommonBottomNav(
              index: _bottomIndex,
              onChanged: (i) => setState(() => _bottomIndex = i),
              activeColor: DashboardConstants.brandBlue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentCustomers() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(Responsive.pad(context, 16)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE6E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Recent customers',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                ),
              ),
              IconButton(
                tooltip: 'Refresh customer activity',
                onPressed: _loadingRecentCustomers
                    ? null
                    : _loadRecentCustomers,
                icon: const Icon(Icons.refresh_rounded, size: 20),
              ),
            ],
          ),
          if (_loadingRecentCustomers)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 22),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_recentCustomersError != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: Colors.red),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_recentCustomersError!)),
                  TextButton(
                    onPressed: _loadRecentCustomers,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          else if (_recentCustomers.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 18),
              child: Center(
                child: Text(
                  'No customer activity available.',
                  style: TextStyle(color: Colors.black54),
                ),
              ),
            )
          else
            ActivityTimeline(items: _recentCustomers),
        ],
      ),
    );
  }
}
