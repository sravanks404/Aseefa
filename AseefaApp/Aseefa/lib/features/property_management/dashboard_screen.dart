import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

class _PortfolioColors {
  static const primary = Color(0xFF2300C4);
  static const background = Color(0xFFF5F7FB);
  static const ink = Color(0xFF111827);
  static const muted = Color(0xFF6B7280);
  static const line = Color(0xFFE5E7EB);
  static const green = Color(0xFF16A34A);
  static const greenSoft = Color(0xFFDFF6E6);
  static const blue = Color(0xFF2563EB);
  static const blueSoft = Color(0xFFE0ECFF);
  static const amber = Color(0xFFF59E0B);
  static const amberSoft = Color(0xFFFEF3DA);
  static const red = Color(0xFFDC2626);
  static const redSoft = Color(0xFFFCE8E8);
}

class _RentalReportRow {
  final int propertyId;
  final String propertyName;
  final int rentalId;
  final String tenantName;
  final String status;
  final String unitLabel;
  final double monthlyRent;
  final double annualRent;
  final DateTime? leaseEnd;

  const _RentalReportRow({
    required this.propertyId,
    required this.propertyName,
    required this.rentalId,
    required this.tenantName,
    required this.status,
    required this.unitLabel,
    required this.monthlyRent,
    required this.annualRent,
    required this.leaseEnd,
  });

  factory _RentalReportRow.fromApi(Map<String, dynamic> item) {
    int number(dynamic value) => int.tryParse('$value') ?? 0;
    double amount(dynamic value) =>
        value is num ? value.toDouble() : double.tryParse('$value') ?? 0;
    final id = number(item['PropertyID']);
    final rawLeaseEnd = (item['LeaseEndDate'] ?? '').toString();
    return _RentalReportRow(
      propertyId: id,
      propertyName: (item['PropertyName'] ?? 'Property #$id').toString(),
      rentalId: number(item['RentalID']),
      tenantName: (item['TenantName'] ?? '').toString(),
      status: (item['RentalStatus'] ?? '').toString(),
      unitLabel: (item['UnitNumber'] ?? item['FlatNo'] ?? '').toString(),
      monthlyRent: amount(item['MonthlyRent']),
      annualRent: amount(item['AnnualRent']),
      leaseEnd: DateTime.tryParse(
        rawLeaseEnd.length >= 10 ? rawLeaseEnd.substring(0, 10) : rawLeaseEnd,
      ),
    );
  }

  bool get isRental => rentalId > 0;
  String get normalizedStatus => status.trim().toLowerCase();
}

class _PropertyDashboardData {
  final List<_RentalReportRow> rows;

  const _PropertyDashboardData(this.rows);

  int get propertyCount => rows
      .map((row) => row.propertyId > 0 ? 'id:${row.propertyId}' : row.propertyName)
      .toSet()
      .length;

  List<_RentalReportRow> get rentals =>
      rows.where((row) => row.isRental).toList();

  int get occupiedCount =>
      rentals.where((row) => row.normalizedStatus == 'occupied').length;
  int get vacantCount =>
      rentals.where((row) => row.normalizedStatus == 'vacant').length;
  int get reservedCount =>
      rentals.where((row) => row.normalizedStatus == 'reserved').length;
  int get maintenanceCount => rentals
      .where((row) => row.normalizedStatus.contains('maintenance'))
      .length;

  double get monthlyRent =>
      rentals.fold(0, (total, row) => total + row.monthlyRent);
  double get annualRent =>
      rentals.fold(0, (total, row) => total + row.annualRent);

  List<_RentalReportRow> get upcomingLeases {
    final today = DateTime.now();
    final cutoff = today.add(const Duration(days: 90));
    final result = rentals
        .where(
          (row) =>
              row.leaseEnd != null &&
              !row.leaseEnd!.isBefore(DateTime(today.year, today.month, today.day)) &&
              !row.leaseEnd!.isAfter(cutoff),
        )
        .toList()
      ..sort((a, b) => a.leaseEnd!.compareTo(b.leaseEnd!));
    return result.take(5).toList();
  }

  List<MapEntry<String, double>> get propertyIncome {
    final totals = <String, double>{};
    for (final rental in rentals) {
      totals.update(
        rental.propertyName,
        (value) => value + rental.monthlyRent,
        ifAbsent: () => rental.monthlyRent,
      );
    }
    final entries = totals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    return entries.take(5).toList();
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  _PropertyDashboardData? _dashboard;
  bool _loading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });
    try {
      final companyId = await SessionStore.getCompanyId();
      if (companyId <= 0) {
        throw Exception('Company context is missing. Please sign in again.');
      }

      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyReport')
          .replace(queryParameters: {'CompanyID': '$companyId'});
      final response = await http.get(uri).timeout(const Duration(seconds: 20));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('Property report returned ${response.statusCode}.');
      }

      final decoded = jsonDecode(response.body);
      if (decoded is! Map ||
          (decoded['success'] != true &&
              decoded['success']?.toString() != 'true')) {
        throw Exception(
          decoded is Map
              ? decoded['message']?.toString() ??
                  'Property report could not be loaded.'
              : 'Unexpected property report response.',
        );
      }
      final responseRows = decoded['data'];
      if (responseRows is! List) {
        throw const FormatException(
          'Property report did not contain a data list.',
        );
      }

      final rows = responseRows
          .whereType<Map>()
          .map(
            (row) => _RentalReportRow.fromApi(
              Map<String, dynamic>.from(row),
            ),
          )
          .toList();
      if (!mounted) return;
      setState(() {
        _dashboard = _PropertyDashboardData(rows);
        _loading = false;
      });
    } catch (error) {
      debugPrint('Load property dashboard error: $error');
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  String _currency(num value) => NumberFormat.currency(
        locale: 'en_AE',
        symbol: 'AED ',
        decimalDigits: 0,
      ).format(value);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _PortfolioColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: _PortfolioColors.primary,
          onRefresh: _loadDashboard,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            children: [
              _buildHeader(),
              const SizedBox(height: 18),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_errorMessage != null)
                _buildError()
              else if (_dashboard == null || _dashboard!.rows.isEmpty)
                _buildEmptyState()
              else ...[
                _buildSummary(_dashboard!),
                const SizedBox(height: 16),
                _buildIncomeCard(_dashboard!),
                const SizedBox(height: 16),
                _buildLeaseCard(_dashboard!),
                const SizedBox(height: 16),
                _buildPropertyIncomeCard(_dashboard!),
                const SizedBox(height: 16),
                _buildRentalList(_dashboard!),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        IconButton(
          tooltip: 'Back',
          onPressed: () => Navigator.maybePop(context),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                'Portfolio overview',
                style: TextStyle(
                  color: _PortfolioColors.ink,
                  fontSize: 23,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Live property and rental report',
                style: TextStyle(color: _PortfolioColors.muted, fontSize: 13),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Refresh portfolio report',
          onPressed: _loading ? null : _loadDashboard,
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
    );
  }

  Widget _buildError() {
    return _card(
      child: Column(
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            size: 38,
            color: _PortfolioColors.red,
          ),
          const SizedBox(height: 10),
          const Text(
            'Could not load portfolio data',
            style: TextStyle(
              color: _PortfolioColors.ink,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _errorMessage ?? '',
            textAlign: TextAlign.center,
            style: const TextStyle(color: _PortfolioColors.muted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          FilledButton.icon(
            onPressed: _loadDashboard,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Try again'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return _card(
      child: const Column(
        children: [
          Icon(
            Icons.apartment_outlined,
            size: 42,
            color: _PortfolioColors.primary,
          ),
          SizedBox(height: 12),
          Text(
            'No property report data yet',
            style: TextStyle(
              color: _PortfolioColors.ink,
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          SizedBox(height: 5),
          Text(
            'Properties and rental summaries will appear here when the web API has records.',
            textAlign: TextAlign.center,
            style: TextStyle(color: _PortfolioColors.muted, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildSummary(_PropertyDashboardData data) {
    final statuses = [
      ('Occupied', data.occupiedCount, _PortfolioColors.green, _PortfolioColors.greenSoft),
      ('Vacant', data.vacantCount, _PortfolioColors.red, _PortfolioColors.redSoft),
      ('Reserved', data.reservedCount, _PortfolioColors.amber, _PortfolioColors.amberSoft),
      ('Maintenance', data.maintenanceCount, _PortfolioColors.blue, _PortfolioColors.blueSoft),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: _metricCard(
                'Properties',
                '${data.propertyCount}',
                Icons.apartment_rounded,
                _PortfolioColors.primary,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _metricCard(
                'Rental contracts',
                '${data.rentals.length}',
                Icons.key_rounded,
                _PortfolioColors.green,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        _card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Rental status',
                style: TextStyle(
                  color: _PortfolioColors.ink,
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: statuses
                    .map(
                      (status) => _statusChip(
                        status.$1,
                        status.$2,
                        status.$3,
                        status.$4,
                      ),
                    )
                    .toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIncomeCard(_PropertyDashboardData data) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Rental income',
            style: TextStyle(
              color: _PortfolioColors.ink,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _incomeValue(
                  'Monthly rent',
                  _currency(data.monthlyRent),
                  Icons.calendar_month_rounded,
                ),
              ),
              Container(width: 1, height: 44, color: _PortfolioColors.line),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(left: 14),
                  child: _incomeValue(
                    'Annual rent',
                    _currency(data.annualRent),
                    Icons.account_balance_wallet_outlined,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          const Text(
            'Totals reflect rental rows returned by the property report.',
            style: TextStyle(color: _PortfolioColors.muted, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaseCard(_PropertyDashboardData data) {
    final leases = data.upcomingLeases;
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(
            'Leases ending soon',
            'Within the next 90 days',
            Icons.event_available_outlined,
          ),
          const SizedBox(height: 12),
          if (leases.isEmpty)
            const Text(
              'No upcoming lease end dates in the report.',
              style: TextStyle(color: _PortfolioColors.muted, fontSize: 12),
            )
          else
            ...leases.map(
              (row) => _detailRow(
                title: row.tenantName.isEmpty ? row.propertyName : row.tenantName,
                subtitle: row.propertyName,
                trailing: DateFormat('dd MMM yyyy').format(row.leaseEnd!),
                icon: Icons.schedule_rounded,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPropertyIncomeCard(_PropertyDashboardData data) {
    final incomeRows = data.propertyIncome;
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(
            'Income by property',
            'Monthly rent from report rows',
            Icons.bar_chart_rounded,
          ),
          const SizedBox(height: 12),
          if (incomeRows.isEmpty)
            const Text(
              'No rental income data is available.',
              style: TextStyle(color: _PortfolioColors.muted, fontSize: 12),
            )
          else
            ...incomeRows.map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        entry.key,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: _PortfolioColors.ink,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      _currency(entry.value),
                      style: const TextStyle(
                        color: _PortfolioColors.primary,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRentalList(_PropertyDashboardData data) {
    final rentals = data.rentals;
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(
            'Rental register',
            '${rentals.length} contracts in report',
            Icons.receipt_long_outlined,
          ),
          const SizedBox(height: 12),
          if (rentals.isEmpty)
            const Text(
              'No rental records were returned.',
              style: TextStyle(color: _PortfolioColors.muted, fontSize: 12),
            )
          else
            ...rentals.take(10).map(
              (row) => _detailRow(
                title: row.tenantName.isEmpty ? row.propertyName : row.tenantName,
                subtitle: [
                  row.propertyName,
                  if (row.unitLabel.trim().isNotEmpty) row.unitLabel,
                ].join(' · '),
                trailing: _currency(row.monthlyRent),
                icon: Icons.person_outline_rounded,
                status: row.status,
              ),
            ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title, String subtitle, IconData icon) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: const Color(0xFFEDEBFB),
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(icon, size: 19, color: _PortfolioColors.primary),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: _PortfolioColors.ink,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  color: _PortfolioColors.muted,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _detailRow({
    required String title,
    required String subtitle,
    required String trailing,
    required IconData icon,
    String? status,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: _PortfolioColors.line)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: _PortfolioColors.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _PortfolioColors.ink,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: _PortfolioColors.muted,
                    fontSize: 10.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                trailing,
                style: const TextStyle(
                  color: _PortfolioColors.ink,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (status != null && status.trim().isNotEmpty)
                Text(
                  status,
                  style: const TextStyle(
                    color: _PortfolioColors.muted,
                    fontSize: 10,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metricCard(String title, String value, IconData icon, Color color) {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              color: _PortfolioColors.ink,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(color: _PortfolioColors.muted, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _statusChip(String label, int value, Color color, Color background) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$label  $value',
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _incomeValue(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: _PortfolioColors.primary, size: 16),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(
                color: _PortfolioColors.muted,
                fontSize: 11,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Text(
            value,
            style: const TextStyle(
              color: _PortfolioColors.ink,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(17),
        border: Border.all(color: _PortfolioColors.line),
      ),
      child: child,
    );
  }
}
