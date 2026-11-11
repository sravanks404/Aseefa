import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

class PropertyReportScreen extends StatefulWidget {
  const PropertyReportScreen({super.key});

  @override
  State<PropertyReportScreen> createState() => _PropertyReportScreenState();
}

class _PropertyReportScreenState extends State<PropertyReportScreen> {
  static const _primary = Color(0xFF2300C4);
  static const _background = Color(0xFFF5F7FB);
  static const _ink = Color(0xFF111827);
  static const _muted = Color(0xFF6B7280);

  final _searchController = TextEditingController();
  final _currencyFormat = NumberFormat.currency(
    locale: 'en_AE',
    symbol: 'AED ',
    decimalDigits: 0,
  );

  List<Map<String, dynamic>> _rows = [];
  String _search = '';
  String? _propertyFilter;
  String? _unitTypeFilter;
  String? _statusFilter;
  String? _errorMessage;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadReport() async {
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
      final response = await http.get(uri).timeout(
            const Duration(seconds: 30),
          );
      final body = response.body.trim();
      if (body.isEmpty || body.startsWith('<')) {
        throw const FormatException(
          'Property report API returned an invalid response.',
        );
      }
      final decoded = jsonDecode(body);
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = decoded is Map ? decoded['message']?.toString() : null;
        throw Exception(message ?? 'Property report request failed '
            '(${response.statusCode}).');
      }
      if (decoded is! Map ||
          (decoded['success'] != true &&
              decoded['success']?.toString().toLowerCase() != 'true')) {
        throw Exception(
          decoded is Map
              ? decoded['message']?.toString() ??
                  'Property report could not be loaded.'
              : 'Unexpected property report response.',
        );
      }

      final data = decoded['data'];
      if (data is! List) {
        throw const FormatException(
          'Property report response did not contain a data list.',
        );
      }
      final rows = data
          .whereType<Map>()
          .map((row) => Map<String, dynamic>.from(row))
          .toList();

      if (!mounted) return;
      setState(() {
        _rows = rows;
        _loading = false;
      });
    } catch (error) {
      debugPrint('Load property report error: $error');
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  List<String> _options(String primaryKey, [String? fallbackKey]) {
    final values = _rows
        .map((row) => (row[primaryKey] ?? row[fallbackKey] ?? '').toString().trim())
        .where((value) => value.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    return values;
  }

  List<Map<String, dynamic>> get _filteredRows {
    final term = _search.trim().toLowerCase();
    return _rows.where((row) {
      final propertyName = (row['PropertyName'] ?? '').toString();
      final unitNumber =
          (row['UnitNumber'] ?? row['FlatNo'] ?? '').toString();
      final unitType = (row['UnitType'] ?? row['FlatType'] ?? '').toString();
      final tenantName = (row['TenantName'] ?? '').toString();
      final status = (row['RentalStatus'] ?? '').toString();

      final matchesSearch = term.isEmpty ||
          [propertyName, unitNumber, unitType, tenantName]
              .any((value) => value.toLowerCase().contains(term));
      final matchesProperty =
          _propertyFilter == null || propertyName == _propertyFilter;
      final matchesUnitType =
          _unitTypeFilter == null || unitType == _unitTypeFilter;
      final matchesStatus = _statusFilter == null ||
          (_statusFilter == 'Occupied'
              ? status == 'Occupied'
              : status.isEmpty || status == 'Vacant');
      return matchesSearch &&
          matchesProperty &&
          matchesUnitType &&
          matchesStatus;
    }).toList();
  }

  double _amount(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  double _annualRent(Map<String, dynamic> row) {
    final annual = _amount(row['AnnualRent']);
    return annual > 0 ? annual : _amount(row['MonthlyRent']) * 12;
  }

  String _money(num value) => _currencyFormat.format(value);

  int _countStatus(List<Map<String, dynamic>> rows, String status) =>
      rows.where((row) => row['RentalStatus'] == status).length;

  void _clearFilters() {
    _searchController.clear();
    setState(() {
      _search = '';
      _propertyFilter = null;
      _unitTypeFilter = null;
      _statusFilter = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final rows = _filteredRows;
    final occupiedCount = _countStatus(rows, 'Occupied');
    final vacantCount = rows
        .where((row) =>
            row['RentalStatus'] == null ||
            row['RentalStatus'].toString().isEmpty ||
            row['RentalStatus'] == 'Vacant')
        .length;
    final contractRent = rows.fold<double>(
      0,
      (total, row) => total + _annualRent(row),
    );
    final cashReceived = rows.fold<double>(
      0,
      (total, row) => total + _amount(row['CashReceived']),
    );

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        title: const Text('Property Report'),
        backgroundColor: Colors.white,
        foregroundColor: _ink,
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _loading ? null : _loadReport,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadReport,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 120),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_errorMessage != null)
              _buildError()
            else ...[
              _buildSummary(
                propertyCount: rows
                    .map((row) => row['PropertyID']?.toString() ??
                        row['PropertyName']?.toString() ??
                        '')
                    .where((id) => id.isNotEmpty)
                    .toSet()
                    .length,
                unitCount: rows.length,
                occupiedCount: occupiedCount,
                vacantCount: vacantCount,
                contractRent: contractRent,
                cashReceived: cashReceived,
              ),
              const SizedBox(height: 16),
              _buildFilters(),
              const SizedBox(height: 16),
              if (rows.isEmpty)
                _buildEmptyState()
              else
                ...rows.map(_buildReportRow),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummary({
    required int propertyCount,
    required int unitCount,
    required int occupiedCount,
    required int vacantCount,
    required double contractRent,
    required double cashReceived,
  }) {
    final cards = [
      ('Properties', '$propertyCount', Icons.apartment_outlined),
      ('Units', '$unitCount', Icons.meeting_room_outlined),
      ('Occupied', '$occupiedCount', Icons.people_outline),
      ('Vacant', '$vacantCount', Icons.door_front_door_outlined),
      ('Contract rent', _money(contractRent), Icons.payments_outlined),
      ('Cash received', _money(cashReceived), Icons.account_balance_wallet_outlined),
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: cards.map((card) {
        return SizedBox(
          width: 165,
          child: Card(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(card.$3, color: _primary, size: 20),
                  const SizedBox(height: 10),
                  Text(
                    card.$2,
                    style: const TextStyle(
                      color: _ink,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(card.$1, style: const TextStyle(color: _muted)),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFilters() {
    final properties = _options('PropertyName');
    final unitTypes = _options('UnitType', 'FlatType');
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _search = value),
              decoration: InputDecoration(
                labelText: 'Search property, unit or tenant',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.isEmpty
                    ? null
                    : IconButton(
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _search = '');
                        },
                        icon: const Icon(Icons.clear),
                      ),
                border: const OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: properties.contains(_propertyFilter)
                  ? _propertyFilter
                  : null,
              decoration: const InputDecoration(
                labelText: 'Property',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('All properties')),
                ...properties.map(
                  (value) => DropdownMenuItem(value: value, child: Text(value)),
                ),
              ],
              onChanged: (value) => setState(() => _propertyFilter = value),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: unitTypes.contains(_unitTypeFilter)
                        ? _unitTypeFilter
                        : null,
                    decoration: const InputDecoration(
                      labelText: 'Unit type',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text('All types'),
                      ),
                      ...unitTypes.map(
                        (value) =>
                            DropdownMenuItem(value: value, child: Text(value)),
                      ),
                    ],
                    onChanged: (value) =>
                        setState(() => _unitTypeFilter = value),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _statusFilter,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('All statuses')),
                      DropdownMenuItem(
                        value: 'Occupied',
                        child: Text('Occupied'),
                      ),
                      DropdownMenuItem(value: 'Vacant', child: Text('Vacant')),
                    ],
                    onChanged: (value) => setState(() => _statusFilter = value),
                  ),
                ),
              ],
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: _clearFilters,
                icon: const Icon(Icons.filter_alt_off_outlined),
                label: const Text('Clear filters'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportRow(Map<String, dynamic> row) {
    final propertyName =
        (row['PropertyName'] ?? 'Property').toString().trim();
    final unitNumber =
        (row['UnitNumber'] ?? row['FlatNo'] ?? '').toString().trim();
    final unitType =
        (row['UnitType'] ?? row['FlatType'] ?? '').toString().trim();
    final tenantName = (row['TenantName'] ?? '').toString().trim();
    final status = (row['RentalStatus'] ?? 'Vacant').toString();
    final monthlyRent = _amount(row['MonthlyRent']);
    final securityDeposit = _amount(row['SecurityDeposit']);
    final cashReceived = _amount(row['CashReceived']);
    final leaseEnd = (row['LeaseEndDate'] ?? '').toString();
    final isOccupied = status == 'Occupied';

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE5E7EB)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    propertyName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: _ink,
                    ),
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isOccupied
                        ? const Color(0xFFDFF6E6)
                        : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: isOccupied
                          ? const Color(0xFF16A34A)
                          : _muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              [
                if (unitNumber.isNotEmpty) 'Unit $unitNumber',
                if (unitType.isNotEmpty) unitType,
              ].join(' · ').isEmpty
                  ? 'Unit details unavailable'
                  : [
                      if (unitNumber.isNotEmpty) 'Unit $unitNumber',
                      if (unitType.isNotEmpty) unitType,
                    ].join(' · '),
              style: const TextStyle(color: _muted),
            ),
            if (tenantName.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text('Tenant: $tenantName', style: const TextStyle(color: _ink)),
            ],
            const Divider(height: 24),
            Wrap(
              spacing: 22,
              runSpacing: 12,
              children: [
                _reportValue('Annual rent', _money(_annualRent(row))),
                _reportValue('Monthly rent', _money(monthlyRent)),
                _reportValue('Security deposit', _money(securityDeposit)),
                _reportValue('Cash received', _money(cashReceived)),
                if (leaseEnd.isNotEmpty)
                  _reportValue('Lease ends', _dateOnly(leaseEnd)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _reportValue(String label, String value) => SizedBox(
        width: 145,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: _muted, fontSize: 12)),
            const SizedBox(height: 3),
            Text(
              value,
              style: const TextStyle(
                color: _ink,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      );

  String _dateOnly(String value) =>
      value.length >= 10 ? value.substring(0, 10) : value;

  Widget _buildEmptyState() => Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            const Icon(Icons.assessment_outlined, size: 48, color: _muted),
            const SizedBox(height: 12),
            const Text(
              'No report details match the selected filters.',
              textAlign: TextAlign.center,
              style: TextStyle(color: _muted),
            ),
            TextButton(
              onPressed: _clearFilters,
              child: const Text('Clear filters'),
            ),
          ],
        ),
      );

  Widget _buildError() => Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            const Icon(Icons.error_outline, size: 44, color: Colors.red),
            const SizedBox(height: 12),
            Text(_errorMessage!, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _loadReport,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
}
