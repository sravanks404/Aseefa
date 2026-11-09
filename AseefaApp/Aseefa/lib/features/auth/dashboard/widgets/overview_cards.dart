import 'package:flutter/material.dart';

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

import '../dashboard_constants.dart';
import 'package:suitapps/shared/utils/ui_helpers.dart'; // EllipsizeText, FitText

/// Holds the three counts returned together by /getTodaySummery.
class _TodaySummary {
  const _TodaySummary({
    this.clientCount = 0,
    this.supplierCount = 0,
    this.requirementCount = 0,
  });
  final int clientCount;
  final int supplierCount;
  final int requirementCount;
}

class OverviewCards extends StatefulWidget {
  const OverviewCards({super.key});
  @override
  State<OverviewCards> createState() => _OverviewCardsState();
}

class _OverviewCardsState extends State<OverviewCards> {
  int clientCount = 0;
  int supplierCount = 0;
  int jobRoleCount = 0;
  int requirementCount = 0;
  bool loading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    _loadCounts();
  }

  /// Pulls a record count out of a response body whether the API returns a
  /// bare JSON array (`[ {...}, {...} ]`) or wraps it (`{"data": [...]}`).
  int _countFromBody(String body) {
    final decoded = jsonDecode(body);
    if (decoded is List) return decoded.length;
    if (decoded is Map) {
      for (final key in ['data', 'Data', 'result', 'Result']) {
        final value = decoded[key];
        if (value is List) return value.length;
      }
    }
    throw const FormatException('The API response did not contain a list.');
  }

  Future<int> _fetchCount(
    String endpointPath,
    Map<String, String> params,
  ) async {
    final base = Uri.parse('${ApiConfig.baseUrl}$endpointPath');
    final uri = params.isEmpty ? base : base.replace(queryParameters: params);
    final response = await http.get(uri).timeout(const Duration(seconds: 20));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Dashboard service returned ${response.statusCode}.');
    }
    return _countFromBody(response.body);
  }

  int _asInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v?.toString() ?? '') ?? 0;
  }

  /// Supports both API envelopes observed in this app (`summary` and `data`).
  Future<_TodaySummary> _fetchTodaySummary(Map<String, String> params) async {
    final base = Uri.parse(
      '${ApiConfig.baseUrl}${ApiConfig.getTodaySummery}',
    );
    final uri = params.isEmpty ? base : base.replace(queryParameters: params);
    final response = await http.get(uri).timeout(const Duration(seconds: 20));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Dashboard summary returned ${response.statusCode}.');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! Map ||
        (decoded['success'] != null &&
            decoded['success'] != true &&
            decoded['success']?.toString() != 'true')) {
      throw const FormatException('Dashboard summary could not be loaded.');
    }
    final summary = decoded['summary'] ?? decoded['Summary'] ?? decoded['data'] ?? decoded['Data'];
    if (summary is! Map) {
      throw const FormatException('Dashboard response did not contain summary data.');
    }
    final data = Map<String, dynamic>.from(summary);
    return _TodaySummary(
      clientCount: _asInt(data['TodayClientCount']),
      supplierCount: _asInt(data['TodaySupplierCount']),
      requirementCount: _asInt(data['TodayRequirementQuantity']),
    );
  }

  Future<void> _loadCounts() async {
    setState(() {
      loading = true;
      errorMessage = null;
    });
    try {
      final userId = await SessionStore.getUserId();
      final summary = await _fetchTodaySummary({'createdBy': '$userId'});
      final jobRoles = await _fetchCount(ApiConfig.getJobRoles, {
        'createdBy': '$userId',
      });

      if (!mounted) return;
      setState(() {
        clientCount = summary.clientCount;
        supplierCount = summary.supplierCount;
        requirementCount = summary.requirementCount;
        jobRoleCount = jobRoles;
        loading = false;
      });
    } catch (error) {
      debugPrint('Load dashboard overview error: $error');
      if (!mounted) return;
      setState(() {
        errorMessage = error.toString().replaceFirst('Exception: ', '');
        loading = false;
      });
    }
  }

  String _fmt(int n) => NumberFormat('#,##0').format(n);

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Parent scaling only for gaps / heading (not the card contents)
        final parentUi = _ParentUi(constraints);

        final headingSize = parentUi.font(16);
        final headingBottom = parentUi.pad(8);
        final rowGap = parentUi.pad(8);
        final colGap = parentUi.pad(8);

        // ✅ ALWAYS 2 columns (2 x 2 arrangement)
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: EdgeInsets.only(bottom: headingBottom),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      "Overview",
                      style: TextStyle(
                        fontSize: headingSize,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Refresh overview',
                    onPressed: loading ? null : _loadCounts,
                    icon: const Icon(Icons.refresh_rounded, size: 20),
                  ),
                ],
              ),
            ),
            if (errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                  errorMessage!,
                  style: const TextStyle(color: Colors.red, fontSize: 12),
                ),
              ),

            // Row 1
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: "Todays Total Clients",
                    value: loading ? '...' : errorMessage != null ? '—' : _fmt(clientCount),
                    icon: Icons.groups_rounded,
                    hero: true,
                  ),
                ),
                SizedBox(width: colGap),
                Expanded(
                  child: _StatCard(
                    title: "Todays Total Suppliers",
                    value: loading ? '...' : errorMessage != null ? '—' : _fmt(supplierCount),
                    icon: Icons.local_shipping_rounded,
                  ),
                ),
              ],
            ),

            SizedBox(height: rowGap),

            // Row 2
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: "Job Roles",
                    value: loading ? '...' : errorMessage != null ? '—' : _fmt(jobRoleCount),
                    icon: Icons.work_outline_rounded,
                  ),
                ),
                SizedBox(width: colGap),
                Expanded(
                  child: _StatCard(
                    title: "Todays Requirements",
                    value: loading ? '...' : errorMessage != null ? '—' : _fmt(requirementCount),
                    icon: Icons.assignment_outlined,
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

/* ------------------------------------------------------------ */
/* ✅ Parent UI scaler (just for heading + gaps)                  */
/* ------------------------------------------------------------ */
class _ParentUi {
  _ParentUi(this.c) {
    final w = c.maxWidth;
    s = (w / 390.0).clamp(0.85, 1.15);
  }
  final BoxConstraints c;
  late final double s;

  double pad(double v) => v * s;
  double font(double v) => (v * (0.6 + 0.4 * s)).clamp(v * 0.9, v * 1.1);
}

/* ------------------------------------------------------------ */
/* ✅ Card UI scaler (based on *card width*)                      */
/* ------------------------------------------------------------ */
class _CardUi {
  _CardUi(this.c) {
    final w = c.maxWidth;

    // When 2 columns on phones, card width is often 160~200.
    // Scale from a "comfortable card width" baseline.
    final base = 200.0;

    // Clamp hard so tiny cards still look ok.
    s = (w / base).clamp(0.78, 1.05);

    // Extra squeeze for very narrow cards
    tight = w < 175;
  }

  final BoxConstraints c;
  late final double s;
  late final bool tight;

  double pad(double v) => (v * s).clamp(v * 0.75, v);
  double size(double v) => v * s;
  double radius(double v) => v * s;

  double font(double v) {
    // Damp fonts a bit more than padding
    final f = v * (0.65 + 0.35 * s);
    return f.clamp(v * 0.78, v * 1.02);
  }
}

/* ------------------------------------------------------------ */
/* 🟦 STAT CARD — one reusable card for all 4 counts              */
/*    hero = true  -> blue gradient (same brand gradient as before)*/
/*    hero = false -> white card with brand-blue icon chip         */
/* ------------------------------------------------------------ */
class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    this.hero = false,
  });

  final String title;
  final String value;
  final IconData icon;
  final bool hero;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final ui = _CardUi(constraints);

        final double minH = ui.size(ui.tight ? 96.0 : 110.0);
        final double pad = ui.pad(ui.tight ? 8.0 : 10.0);
        final double radius = ui.radius(16.0);

        final double titleSize = ui.font(ui.tight ? 11.5 : 12.5);
        final double valueSize = ui.font(ui.tight ? 22.0 : 26.0);

        final double shadowBlur = ui.size(hero ? 10.0 : 8.0);
        final double shadowY = ui.size(4.0);

        final titleColor = hero ? Colors.white : Colors.black87;
        final valueColor = hero ? Colors.white : Colors.black;

        return Container(
          constraints: BoxConstraints(minHeight: minH),
          padding: EdgeInsets.all(pad),
          decoration: BoxDecoration(
            color: hero ? null : Colors.white,
            borderRadius: BorderRadius.circular(radius),
            gradient: hero
                ? const LinearGradient(
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                    colors: [Color(0xFF1433C3), Color(0xFF6F7FDB)],
                  )
                : null,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: hero ? 0.14 : 0.05),
                blurRadius: shadowBlur,
                offset: Offset(0, shadowY),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // TITLE + ICON
              Row(
                children: [
                  Expanded(
                    child: EllipsizeText(
                      title,
                      maxLines: 1,
                      style: TextStyle(
                        color: titleColor,
                        fontSize: titleSize,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  SizedBox(width: ui.pad(6)),
                  _RoundIcon(
                    icon: icon,
                    iconColor: hero
                        ? const Color(0xFF1433C3)
                        : DashboardConstants.brandBlue,
                    bgColor: hero
                        ? Colors.white
                        : DashboardConstants.brandBlue.withValues(alpha: 0.12),
                    box: ui.size(ui.tight ? 26.0 : 30.0),
                    iconSize: ui.size(ui.tight ? 14.0 : 16.0),
                  ),
                ],
              ),

              SizedBox(height: ui.pad(6)),

              // ✅ overflow-safe big count
              FitText(
                value,
                style: TextStyle(
                  color: valueColor,
                  fontSize: valueSize,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/* ------------------------------------------------------------ */
/* 🔘 ROUND ICON                                                  */
/* ------------------------------------------------------------ */
class _RoundIcon extends StatelessWidget {
  const _RoundIcon({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.box,
    required this.iconSize,
  });

  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final double box;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: box,
      height: box,
      decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
      child: Icon(icon, size: iconSize, color: iconColor),
    );
  }
}
