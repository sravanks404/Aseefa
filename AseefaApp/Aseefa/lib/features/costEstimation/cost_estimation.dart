

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/api_config.dart';


class _DS {
  // Colors
  static const Color primary = Color.fromARGB(255, 35, 0, 196); // #1433C3
  static const Color secondary = Color(0xFF6F7FDB);
  static const Color primaryTint = Color(0xFFEEF1FB);
  static const Color primaryTintBorder = Color(0xFFD5DBEF);
  static const Color background = Color(0xFFF5F7FB);
  static const Color surface = Colors.white;
  static const Color border = Color(0xFFE5E7EB);
  static const Color textDark = Color(0xFF111827); // Text Primary
  static const Color muted = Color(0xFF6B7280); // Text Secondary
  static const Color danger = Color(0xFFDC2626); // Error
  static const Color dangerTint = Color(0xFFFDECEC);
  static const Color dangerTintBorder = Color(0xFFF6C7C7);
  static const Color success = Color(0xFF16A34A);
  static const Color successTint = Color(0xFFE8F7ED);
  static const Color successTintBorder = Color(0xFFBEE7CB);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningTint = Color(0xFFFEF3E0);
  static const Color warningTintBorder = Color(0xFFFBDFA8);

  // Spacing
  static const double xs = 4, sm = 8, md = 12, lg = 16, xl = 24, xxl = 32;

  // Radius
  static const double radiusCard = 16, radiusField = 12, radiusButton = 12, radiusBadge = 16;

  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: Colors.black.withOpacity(0.05),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];

  // Typography (Inter)
  static TextStyle pageTitle() => GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Colors.white,
      );

  static TextStyle sectionTitle() => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w800,
        color: textDark,
      );

  static TextStyle label() => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: muted,
        letterSpacing: 0.3,
      );

  static TextStyle statValue({Color? color}) => GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w900,
        color: color ?? textDark,
      );

  static TextStyle buttonText({Color? color}) => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: color,
      );

  static TextStyle inputText() => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: textDark,
      );

  static TextStyle caption() => GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.w400,
        color: muted,
      );
}

class _TabInfo {
  final String label;
  final IconData icon;
  const _TabInfo(this.label, this.icon);
}

/// One "trade" row inside Trade & Manpower Setup.
class _TradeEntry {
  final int uid;
  int? roleId;
  String roleName;

  final TextEditingController qtyCtrl;
  final TextEditingController clientRateCtrl;
  final TextEditingController supplierRateCtrl;
  final TextEditingController hoursCtrl;

  _TradeEntry(this.uid)
      : roleName = '',
        qtyCtrl = TextEditingController(text: '0'),
        clientRateCtrl = TextEditingController(text: '0'),
        supplierRateCtrl = TextEditingController(text: '0'),
        hoursCtrl = TextEditingController(text: '0');

  double get quantity => double.tryParse(qtyCtrl.text) ?? 0;
  double get clientRate => double.tryParse(clientRateCtrl.text) ?? 0;
  double get supplierRate => double.tryParse(supplierRateCtrl.text) ?? 0;
  double get hours => double.tryParse(hoursCtrl.text) ?? 0;

  double get revenue => quantity * clientRate * hours;
  double get supplierCost => quantity * supplierRate * hours;
  double get grossMargin => revenue - supplierCost;
  double get hourlyCost => hours == 0 ? 0 : supplierCost / hours;
  double get hourlyCostPerEmp => quantity == 0 ? 0 : hourlyCost / quantity;

  void dispose() {
    qtyCtrl.dispose();
    clientRateCtrl.dispose();
    supplierRateCtrl.dispose();
    hoursCtrl.dispose();
  }
}

/// One supplier overview row (Suppliers page). Purely informational —
/// mirrors the web app's Supplier Overview tab, not used in calculations.
class _SupplierEntry {
  final int uid;
  int? supplierDetailId;
  final TextEditingController nameCtrl;
  final TextEditingController tradeCtrl;
  final TextEditingController employeesCtrl;
  final TextEditingController hourlyRateCtrl;
  final TextEditingController monthlyRateCtrl;

  _SupplierEntry(this.uid)
      : nameCtrl = TextEditingController(),
        tradeCtrl = TextEditingController(),
        employeesCtrl = TextEditingController(text: '0'),
        hourlyRateCtrl = TextEditingController(text: '0'),
        monthlyRateCtrl = TextEditingController(text: '0');

  void dispose() {
    nameCtrl.dispose();
    tradeCtrl.dispose();
    employeesCtrl.dispose();
    hourlyRateCtrl.dispose();
    monthlyRateCtrl.dispose();
  }
}

class CostEstimationPage extends StatefulWidget {
  const CostEstimationPage({super.key});

  @override
  State<CostEstimationPage> createState() => _CostEstimationPageState();
}

class _CostEstimationPageState extends State<CostEstimationPage> {
  int? companyId;
  int? estimationId;
  bool isEstimationSubmitted = false;

  // ---- Client / Project ----
  List<dynamic> customers = [];
  List<dynamic> projects = [];
  int? selectedCustomerId;
  int? selectedProjectId;
  bool isLoadingCustomers = true;
  bool isLoadingProjects = false;
  bool isCheckingEstimation = false;

  // ---- Roles (for the Trade dropdown) ----
  List<dynamic> roles = [];
  bool isLoadingRoles = false;

  // ---- Trades (repeatable) ----
  final List<_TradeEntry> trades = [];
  int _tradeUidCounter = 0;

  // ---- Suppliers (repeatable) ----
  final List<_SupplierEntry> suppliers = [];
  int _supplierUidCounter = 0;

  // ---- Monthly amount ----
  final TextEditingController accommodationCtrl = TextEditingController(text: '0');
  final TextEditingController transportationCtrl = TextEditingController(text: '0');
  final TextEditingController foodCtrl = TextEditingController(text: '0');

  // ---- One time expenses ----
  final TextEditingController gatePassCtrl = TextEditingController(text: '0');
  final TextEditingController fuelCtrl = TextEditingController(text: '0');
  final TextEditingController medicalInsuranceCtrl = TextEditingController(text: '0');
  final TextEditingController safetyEquipmentCtrl = TextEditingController(text: '0');

  // ---- Own camp expenses ----
  final TextEditingController electricityCtrl = TextEditingController(text: '0');
  final TextEditingController acCtrl = TextEditingController(text: '0');
  final TextEditingController bedCtrl = TextEditingController(text: '0');
  final TextEditingController sewageCtrl = TextEditingController(text: '0');

  // ---- Overhead & camp running cost ----
  final TextEditingController overheadCtrl = TextEditingController(text: '0');
  final TextEditingController campRunningCostCtrl = TextEditingController(text: '0');

  // ---- Commission ----
  final TextEditingController commissionCtrl = TextEditingController(text: '0');

  // ---- Multiscreen flow control ----
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool saving = false;
  bool submitting = false;

  final List<_TabInfo> _tabs = const [
    _TabInfo('Trade Setup', Icons.groups_rounded),
    _TabInfo('Results', Icons.bar_chart_rounded),
    _TabInfo('Abstract', Icons.layers_rounded),
    _TabInfo('Suppliers', Icons.local_shipping_rounded),
  ];

  @override
  void initState() {
    super.initState();
    trades.add(_TradeEntry(_tradeUidCounter++));
    suppliers.add(_SupplierEntry(_supplierUidCounter++));
    loadCustomers();
  }

  @override
  void dispose() {
    for (final t in trades) {
      t.dispose();
    }
    for (final s in suppliers) {
      s.dispose();
    }
    accommodationCtrl.dispose();
    transportationCtrl.dispose();
    foodCtrl.dispose();
    gatePassCtrl.dispose();
    fuelCtrl.dispose();
    medicalInsuranceCtrl.dispose();
    safetyEquipmentCtrl.dispose();
    electricityCtrl.dispose();
    acCtrl.dispose();
    bedCtrl.dispose();
    sewageCtrl.dispose();
    overheadCtrl.dispose();
    campRunningCostCtrl.dispose();
    commissionCtrl.dispose();
    _pageController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------
  // Prefs helper
  // ---------------------------------------------------------------------

  /// Reads a SharedPreferences value that may have been stored as int,
  /// double, or String, and safely returns it as a String (or null).
  /// Calling `prefs.getString(key)` directly throws
  /// `type 'int' is not a subtype of type 'String?'` if the value was
  /// actually stored with `setInt`/`setDouble` instead of `setString`
  /// (e.g. UserId is stored as an int at login).
  String? _prefsAsString(SharedPreferences prefs, String key) {
    final value = prefs.get(key);
    if (value == null) return null;
    return value.toString();
  }

  // ---------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------

  Future<void> loadCustomers() async {
    setState(() {
      isLoadingCustomers = true;
      customers = [];
    });

    final prefs = await SharedPreferences.getInstance();
    final companyValue = (_prefsAsString(prefs, 'CompanyID') ??
            _prefsAsString(prefs, 'SelectedCompanyId') ??
            '')
        .trim();

    companyId = int.tryParse(companyValue);

    if (companyId == null || companyId == 0) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('CompanyID not found')));
      setState(() => isLoadingCustomers = false);
      return;
    }

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}${ApiConfig.getCustomers}/$companyId');
      final response = await http.get(uri).timeout(const Duration(seconds: 25));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final parsed = _extractList(decoded);
        if (!mounted) return;
        setState(() {
          customers = parsed;
          isLoadingCustomers = false;
        });
      } else {
        if (!mounted) return;
        setState(() => isLoadingCustomers = false);
      }
    } catch (e) {
      debugPrint('CostEstimation -> customers error: $e');
      if (!mounted) return;
      setState(() => isLoadingCustomers = false);
    }

    loadRoles();
  }

  Future<void> loadProjects(int clientId) async {
    setState(() {
      isLoadingProjects = true;
      projects = [];
      selectedProjectId = null;
    });

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}${ApiConfig.getprojectsbyclient}').replace(
        queryParameters: {
          'ClientID': clientId.toString(),
          'CompanyId': companyId?.toString() ?? '',
        },
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 25));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final parsed = _extractList(decoded);
        if (!mounted) return;
        setState(() => projects = parsed);
      }
    } catch (e) {
      debugPrint('CostEstimation -> projects error: $e');
    }

    if (!mounted) return;
    setState(() => isLoadingProjects = false);
  }

  Future<void> loadRoles() async {
    if (companyId == null || companyId == 0) return;

    setState(() {
      isLoadingRoles = true;
      roles = [];
    });

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}${ApiConfig.getRolesLists}')
          .replace(queryParameters: {'CompanyID': companyId.toString()});
      final response = await http.get(uri).timeout(const Duration(seconds: 25));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final parsed = _extractList(decoded);
        if (!mounted) return;
        setState(() => roles = parsed);
      }
    } catch (e) {
      debugPrint('CostEstimation -> roles error: $e');
    }

    if (!mounted) return;
    setState(() => isLoadingRoles = false);
  }

  /// Fired when both client + project are selected: pulls any existing
  /// saved estimation for that project, or resets to a blank draft.
  Future<void> loadProjectEstimation() async {
    if (companyId == null || selectedCustomerId == null || selectedProjectId == null) return;

    setState(() => isCheckingEstimation = true);

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}${ApiConfig.getProjectEstimationByProject}')
          .replace(queryParameters: {
        'CompanyID': companyId.toString(),
        'ClientID': selectedCustomerId.toString(),
        'ProjectID': selectedProjectId.toString(),
      });

      final response = await http.get(uri).timeout(const Duration(seconds: 25));
      if (response.statusCode != 200) {
        _resetEstimationOnly();
        return;
      }

      final json = jsonDecode(response.body);
      if (json['success'] != true || json['exists'] == false) {
        _resetEstimationOnly();
        return;
      }

      setState(() {
        estimationId = json['EstimationID'];
        isEstimationSubmitted = json['IsSubmitted'] == true || json['Submitted'] == true || json['Status'] == 'Submitted';
        commissionCtrl.text = (json['Commission'] ?? 0).toString();

        for (final t in trades) {
          t.dispose();
        }
        trades.clear();
        for (final item in (json['trades'] ?? [])) {
          final trade = _TradeEntry(_tradeUidCounter++);
          // Trade *name* is the source of truth (mirrors the React app).
          // RoleID is stored opportunistically for the dropdown's initial
          // value, but is never allowed to block validation/save if the
          // backend omits it or returns it as a string instead of an int.
          trade.roleName = (item['Trade'] ?? item['RoleName'] ?? '').toString();
          final rawRoleId = item['RoleID'];
          trade.roleId = rawRoleId is int
              ? rawRoleId
              : int.tryParse(rawRoleId?.toString() ?? '');
          trade.qtyCtrl.text = (item['Quantity'] ?? 0).toString();
          trade.clientRateCtrl.text = (item['ClientRate'] ?? 0).toString();
          trade.supplierRateCtrl.text = (item['SupplierRate'] ?? 0).toString();
          trade.hoursCtrl.text = (item['Hours'] ?? 0).toString();
          trades.add(trade);
        }
        if (trades.isEmpty) trades.add(_TradeEntry(_tradeUidCounter++));

        final cost = json['projectCosts'] ?? {};
        accommodationCtrl.text = (cost['Accomodation'] ?? cost['Accommodation'] ?? 0).toString();
        transportationCtrl.text = (cost['Transportation'] ?? 0).toString();
        foodCtrl.text = (cost['Food'] ?? 0).toString();
        gatePassCtrl.text = (cost['GatePass'] ?? 0).toString();
        fuelCtrl.text = (cost['Fuel'] ?? 0).toString();
        medicalInsuranceCtrl.text = (cost['MedicalInsurance'] ?? 0).toString();
        safetyEquipmentCtrl.text = (cost['SafetyEquipment'] ?? 0).toString();
        electricityCtrl.text = (cost['Electricity'] ?? 0).toString();
        acCtrl.text = (cost['AC'] ?? 0).toString();
        bedCtrl.text = (cost['Bed'] ?? 0).toString();
        sewageCtrl.text = (cost['Sewage'] ?? 0).toString();
        overheadCtrl.text = (cost['OverHead'] ?? 0).toString();
        campRunningCostCtrl.text = (cost['CampRunningCost'] ?? 0).toString();

        for (final s in suppliers) {
          s.dispose();
        }
        suppliers.clear();
        for (final item in (json['suppliers'] ?? [])) {
          final s = _SupplierEntry(_supplierUidCounter++);
          s.supplierDetailId = item['SupplierDetailID'];
          s.nameCtrl.text = (item['SupplierName'] ?? '').toString();
          s.tradeCtrl.text = (item['Trade'] ?? '').toString();
          s.employeesCtrl.text = (item['NoOfEmployees'] ?? 0).toString();
          s.hourlyRateCtrl.text = (item['HourlyRate'] ?? 0).toString();
          s.monthlyRateCtrl.text = (item['MonthlyRate'] ?? 0).toString();
          suppliers.add(s);
        }
        if (suppliers.isEmpty) suppliers.add(_SupplierEntry(_supplierUidCounter++));
      });
    } catch (e) {
      debugPrint('loadProjectEstimation error: $e');
      _resetEstimationOnly();
    } finally {
      if (mounted) setState(() => isCheckingEstimation = false);
    }
  }

  /// Blank draft for a project with no saved estimation yet — keeps the
  /// client/project selection intact.
  void _resetEstimationOnly() {
    if (!mounted) return;
    setState(() {
      estimationId = null;
      isEstimationSubmitted = false;
      commissionCtrl.text = '0';
      for (final t in trades) {
        t.dispose();
      }
      trades
        ..clear()
        ..add(_TradeEntry(_tradeUidCounter++));
      for (final s in suppliers) {
        s.dispose();
      }
      suppliers
        ..clear()
        ..add(_SupplierEntry(_supplierUidCounter++));
      for (final c in [
        accommodationCtrl,
        transportationCtrl,
        foodCtrl,
        gatePassCtrl,
        fuelCtrl,
        medicalInsuranceCtrl,
        safetyEquipmentCtrl,
        electricityCtrl,
        acCtrl,
        bedCtrl,
        sewageCtrl,
        overheadCtrl,
        campRunningCostCtrl,
      ]) {
        c.text = '0';
      }
      isCheckingEstimation = false;
    });
  }

  List<dynamic> _extractList(dynamic decoded) {
    if (decoded is List) return decoded;
    if (decoded is Map) {
      for (final key in ['data', 'result', 'items', 'customers', 'projects', 'roles', 'value']) {
        final value = decoded[key];
        if (value is List) return value;
      }
    }
    return [];
  }

  // ---------------------------------------------------------------------
  // Field extraction helpers (tolerant of differing API key names)
  // ---------------------------------------------------------------------

  int? _customerId(dynamic c) {
    final raw = c['CustomerID'] ?? c['CustomerId'] ?? c['AccountID'] ?? c['AccountId'] ?? c['Id'];
    if (raw is int) return raw;
    return int.tryParse(raw?.toString() ?? '');
  }

  String _customerName(dynamic c) =>
      (c['CustomerName'] ?? c['AccountName'] ?? c['Name'] ?? 'Unknown').toString();

  int? _projectId(dynamic p) {
    final raw = p['UnitID'] ?? p['UnitId'] ?? p['RequirementID'] ?? p['ProjectID'] ?? p['Id'];
    if (raw is int) return raw;
    return int.tryParse(raw?.toString() ?? '');
  }

  String _projectName(dynamic p) =>
      (p['UnitName'] ?? p['ProjectName'] ?? p['Name'] ?? 'Unknown').toString();

  int? _roleId(dynamic r) {
    final raw = r['RoleID'] ??
        r['RoleId'] ??
        r['JobRoleID'] ??
        r['JobRoleId'] ??
        r['TradeID'] ??
        r['TradeId'] ??
        r['Id'];
    if (raw is int) return raw;
    return int.tryParse(raw?.toString() ?? '');
  }

  String _roleName(dynamic r) =>
      (r['RoleName'] ?? r['JobRoleName'] ?? r['TradeName'] ?? r['Name'] ?? 'Unknown').toString();

  /// Best-effort lookup of a role's ID purely from its display name.
  /// Used as a fallback when a saved trade's RoleID didn't survive the
  /// round-trip from the backend (missing, null, or returned as a string),
  /// so the dropdown can still show the correct selection.
  int? _findRoleIdByName(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return null;
    for (final r in roles) {
      if (_roleName(r) == trimmed) return _roleId(r);
    }
    return null;
  }

  // ---------------------------------------------------------------------
  // Trade / Supplier row management
  // ---------------------------------------------------------------------

  void _addTrade() => setState(() => trades.add(_TradeEntry(_tradeUidCounter++)));

  void _removeTrade(_TradeEntry entry) => setState(() {
        entry.dispose();
        trades.remove(entry);
      });

  /// Roles still available to pick, i.e. not already used by *another* row.
  /// Matches by trade *name* (like the React app's `usedTrades`) rather
  /// than roleId, so a row whose roleId failed to resolve on reload still
  /// correctly excludes/includes roles based on what's actually selected.
  List<dynamic> _availableRolesFor(_TradeEntry current) {
    final takenByOthers = trades
        .where((t) => t.uid != current.uid && t.roleName.trim().isNotEmpty)
        .map((t) => t.roleName.trim())
        .toSet();
    return roles.where((r) => !takenByOthers.contains(_roleName(r))).toList();
  }

  /// A trade row is "blank" if the user never touched it — no role picked
  /// and every number still at its default 0. Projects that don't need any
  /// trade/manpower rows (e.g. camp-cost-only estimations) always carry one
  /// of these because a row is auto-added in initState / after loading, so
  /// blank rows must never block validation or be sent to the backend.
  ///
  /// NOTE: this checks `roleName`, not `roleId`. The name is what actually
  /// round-trips reliably through the backend (see loadProjectEstimation);
  /// relying on roleId here caused reloaded/updated rows with a valid trade
  /// name but a null/unparsed RoleID to be wrongly treated as unselected.
  bool _isBlankTrade(_TradeEntry t) =>
      t.roleName.trim().isEmpty && t.quantity == 0 && t.hours == 0 && t.clientRate == 0 && t.supplierRate == 0;

  void _addSupplier() => setState(() => suppliers.add(_SupplierEntry(_supplierUidCounter++)));

  void _removeSupplier(_SupplierEntry entry) => setState(() {
        entry.dispose();
        suppliers.remove(entry);
      });

  // ---------------------------------------------------------------------
  // Totals (mirrors the React web app's calculation logic exactly)
  // ---------------------------------------------------------------------

  double get totalManpower => trades.fold(0, (sum, t) => sum + t.quantity);
  double get totalRevenue => trades.fold(0, (sum, t) => sum + t.revenue);
  double get totalSupplierCost => trades.fold(0, (sum, t) => sum + t.supplierCost);
  double get totalGrossMargin => trades.fold(0, (sum, t) => sum + t.grossMargin);

  // Direct cost (shared, project-wide): Accommodation + Transportation + Food + Gate Pass + Fuel
  double get directCost =>
      (double.tryParse(accommodationCtrl.text) ?? 0) +
      (double.tryParse(transportationCtrl.text) ?? 0) +
      (double.tryParse(foodCtrl.text) ?? 0) +
      (double.tryParse(gatePassCtrl.text) ?? 0) +
      (double.tryParse(fuelCtrl.text) ?? 0);

  // Indirect cost (shared, project-wide): Medical + Safety + Electricity + AC + Bed + Sewage + OverHead + CampRunningCost
  double get indirectCost =>
      (double.tryParse(medicalInsuranceCtrl.text) ?? 0) +
      (double.tryParse(safetyEquipmentCtrl.text) ?? 0) +
      (double.tryParse(electricityCtrl.text) ?? 0) +
      (double.tryParse(acCtrl.text) ?? 0) +
      (double.tryParse(bedCtrl.text) ?? 0) +
      (double.tryParse(sewageCtrl.text) ?? 0) +
      (double.tryParse(overheadCtrl.text) ?? 0) +
      (double.tryParse(campRunningCostCtrl.text) ?? 0);

  double get commission => double.tryParse(commissionCtrl.text) ?? 0;

  // totalCost = supplier cost across all trades + shared direct cost + shared indirect cost
  double get totalCost => totalSupplierCost + directCost + indirectCost;

  // totalResult = total revenue - totalCost
  double get totalResult => totalRevenue - totalCost;

  // netProfitLoss = totalResult - commission
  double get netProfitLoss => totalResult - commission;

  bool get _readyForEstimation => selectedCustomerId != null && selectedProjectId != null;

  String _fmt(double v) => '₹${v.toStringAsFixed(0)}';

  // ---------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------

  void _goToPage(int index) {
    if (index < 0 || index >= _tabs.length) return;
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeInOut,
    );
  }

  void _clearAll() {
    setState(() {
      selectedCustomerId = null;
      selectedProjectId = null;
      projects = [];
      estimationId = null;

      for (final t in trades) {
        t.dispose();
      }
      trades
        ..clear()
        ..add(_TradeEntry(_tradeUidCounter++));

      for (final s in suppliers) {
        s.dispose();
      }
      suppliers
        ..clear()
        ..add(_SupplierEntry(_supplierUidCounter++));

      for (final c in [
        accommodationCtrl,
        transportationCtrl,
        foodCtrl,
        gatePassCtrl,
        fuelCtrl,
        medicalInsuranceCtrl,
        safetyEquipmentCtrl,
        electricityCtrl,
        acCtrl,
        bedCtrl,
        sewageCtrl,
        overheadCtrl,
        campRunningCostCtrl,
        commissionCtrl,
      ]) {
        c.text = '0';
      }
    });
    _goToPage(0);
  }

  /// Validates using trade *name*, not roleId — this is what the React
  /// app does (`Field label="Trade" required` gates on `trade.Trade`), and
  /// it's the only value that reliably survives a save -> reload round-trip.
  bool _validateSelections() {
    if (selectedCustomerId == null || selectedProjectId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Please select Client and Project')));
      return false;
    }

    final activeTrades = trades.where((t) => !_isBlankTrade(t)).toList();

    if (activeTrades.any((t) => t.roleName.trim().isEmpty)) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Please select a trade for every row')));
      return false;
    }

    // Same trade can only be used once. If it's already picked in one
    // row, don't allow it to be picked again in another (this also guards
    // against duplicates that arrive already baked into saved data).
    final seenNames = <String>{};
    for (final t in activeTrades) {
      final name = t.roleName.trim();
      if (name.isNotEmpty && !seenNames.add(name)) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('$name is already added. Please choose a different trade for that row.')));
        return false;
      }
    }

    return true;
  }

  Map<String, dynamic> _buildPayload() {
    return {
      'EstimationID': estimationId,
      'CompanyID': companyId,
      'ClientID': selectedCustomerId,
      'ProjectID': selectedProjectId,
      'Commission': commission,
      'Trades': trades
          .where((t) => !_isBlankTrade(t))
          .map((t) => {
                'RoleID': t.roleId,
                'Trade': t.roleName,
                'Quantity': t.quantity,
                'ClientRate': t.clientRate,
                'SupplierRate': t.supplierRate,
                'Hours': t.hours,
              })
          .toList(),
      'ProjectCosts': {
        'Accomodation': double.tryParse(accommodationCtrl.text) ?? 0,
        'Transportation': double.tryParse(transportationCtrl.text) ?? 0,
        'Food': double.tryParse(foodCtrl.text) ?? 0,
        'GatePass': double.tryParse(gatePassCtrl.text) ?? 0,
        'Fuel': double.tryParse(fuelCtrl.text) ?? 0,
        'MedicalInsurance': double.tryParse(medicalInsuranceCtrl.text) ?? 0,
        'SafetyEquipment': double.tryParse(safetyEquipmentCtrl.text) ?? 0,
        'Electricity': double.tryParse(electricityCtrl.text) ?? 0,
        'AC': double.tryParse(acCtrl.text) ?? 0,
        'Bed': double.tryParse(bedCtrl.text) ?? 0,
        'Sewage': double.tryParse(sewageCtrl.text) ?? 0,
        'OverHead': double.tryParse(overheadCtrl.text) ?? 0,
        'CampRunningCost': double.tryParse(campRunningCostCtrl.text) ?? 0,
      },
      'Suppliers': suppliers
          .map((s) => {
                'SupplierDetailID': s.supplierDetailId,
                'SupplierName': s.nameCtrl.text,
                'Trade': s.tradeCtrl.text,
                'NoOfEmployees': double.tryParse(s.employeesCtrl.text) ?? 0,
                'HourlyRate': double.tryParse(s.hourlyRateCtrl.text) ?? 0,
                'MonthlyRate': double.tryParse(s.monthlyRateCtrl.text) ?? 0,
              })
          .toList(),
    };
  }

  Future<void> _saveEstimation() async {
    if (!_validateSelections()) return;

    if (isEstimationSubmitted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot update: This estimation has been submitted and is locked.')),
      );
      return;
    }

    setState(() => saving = true);
    try {
      final uri = Uri.parse('${ApiConfig.webUrl}${ApiConfig.insertUpdateProjectEstimation}');
      final prefs = await SharedPreferences.getInstance();
      final payload = _buildPayload()
        ..['UserID'] = _prefsAsString(prefs, 'UserId');

      debugPrint('Saving estimation with payload: ${jsonEncode(payload)}');

      debugPrint('Saving estimation with payload: ${jsonEncode(payload)}');

      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final respBody = response.body.length > 500 ? response.body.substring(0, 500) : response.body;
      debugPrint('Save response status: ${response.statusCode}');
      debugPrint('Save response body: $respBody');

      if (response.statusCode == 409) {
        throw Exception(
          'Conflict: The estimation may already be submitted/locked, or another user is editing it. '
          'Please refresh and try again. Server: ${response.body}',
        );
      }

      if (response.statusCode != 200) {
        throw Exception('Save failed (${response.statusCode}): ${response.body}');
      }

      Map<String, dynamic> json;
      try {
        json = jsonDecode(response.body);
      } catch (e) {
        throw Exception('Invalid response format: ${response.body}');
      }

      if (json['success'] == true) {
        setState(() => estimationId = json['EstimationID'] ?? estimationId);
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Estimation saved')));
      } else {
        throw Exception(json['message'] ?? 'Save failed');
      }
    } catch (e) {
      debugPrint('Save estimation error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed to save estimation: $e')));
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> _submitEstimation() async {
    if (!_validateSelections()) return;
    if (estimationId == null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Save the estimation before submitting')));
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit Estimation'),
        content: const Text('Submitting will lock this estimation for editing. Continue?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Submit')),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => submitting = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final uri = Uri.parse('${ApiConfig.webUrl}${ApiConfig.submitProjectEstimation}');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'EstimationID': estimationId,
          'UserID': _prefsAsString(prefs, 'UserId'),
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Submit failed (${response.statusCode}): ${response.body}');
      }

      Map<String, dynamic> json;
      try {
        json = jsonDecode(response.body);
      } catch (e) {
        throw Exception('Invalid response format: ${response.body}');
      }

      if (json['success'] == true) {
        setState(() => isEstimationSubmitted = true);
        if (!mounted) return;
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Estimation submitted')));
      } else {
        throw Exception(json['message'] ?? 'Submit failed');
      }
    } catch (e) {
      debugPrint('Submit estimation error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Failed to submit estimation: $e')));
    } finally {
      if (mounted) setState(() => submitting = false);
    }
  }

  // ---------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _DS.background,
      appBar: AppBar(
        title: Text('Project Cost Estimation', style: _DS.pageTitle()),
        centerTitle: true,
        backgroundColor: _DS.primary,
        foregroundColor: Colors.white,
      ),
      body: isLoadingCustomers
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: Column(
                children: [
                  if (_readyForEstimation) _buildTabStrip(),
                  if (isCheckingEstimation)
                    const LinearProgressIndicator(minHeight: 2, color: _DS.primary),
                  Expanded(
                    child: PageView(
                      controller: _pageController,
                      physics: const NeverScrollableScrollPhysics(),
                      onPageChanged: (i) => setState(() => _currentPage = i),
                      children: [
                        _buildTradeSetupPage(),
                        _buildResultsPage(),
                        _buildAbstractPage(),
                        _buildSupplierPage(),
                      ],
                    ),
                  ),
                  if (_readyForEstimation) _buildBottomBar(),
                ],
              ),
            ),
    );
  }

  // ---- Tab strip (top) -------------------------------------------------

  Widget _buildTabStrip() {
    return Container(
      color: _DS.surface,
      child: Row(
        children: List.generate(_tabs.length, (i) {
          final active = _currentPage == i;
          final tab = _tabs[i];
          int? badge;
          if (i == 0) badge = trades.length;
          if (i == 3) badge = suppliers.length;

          return Expanded(
            child: InkWell(
              onTap: () => _goToPage(i),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: active ? _DS.primary : Colors.transparent,
                      width: 2.5,
                    ),
                  ),
                ),
                child: Column(
                  children: [
                    Icon(tab.icon, size: 18, color: active ? _DS.primary : _DS.muted),
                    const SizedBox(height: 3),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Flexible(
                          child: Text(
                            tab.label,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: active ? FontWeight.w700 : FontWeight.w500,
                              color: active ? _DS.primary : _DS.muted,
                            ),
                          ),
                        ),
                        if (badge != null && badge > 0) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: active ? _DS.primary : _DS.muted,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              '$badge',
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ---- Page 1: Trade Setup ---------------------------------------------

  Widget _buildTradeSetupPage() {
    final customerIds = <int>{};
    final customerItems = <DropdownMenuItem<int>>[];
    for (final c in customers) {
      final id = _customerId(c);
      if (id == null || !customerIds.add(id)) continue;
      customerItems.add(DropdownMenuItem(value: id, child: Text(_customerName(c))));
    }

    final projectIds = <int>{};
    final projectItems = <DropdownMenuItem<int>>[];
    for (final p in projects) {
      final id = _projectId(p);
      if (id == null || !projectIds.add(id)) continue;
      projectItems.add(DropdownMenuItem(value: id, child: Text(_projectName(p))));
    }

    final safeCustomerValue = customerIds.contains(selectedCustomerId) ? selectedCustomerId : null;
    final safeProjectValue = projectIds.contains(selectedProjectId) ? selectedProjectId : null;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<int>(
            value: safeCustomerValue,
            isExpanded: true,
            decoration: _fieldDecoration('Client'),
            items: customerItems,
            onChanged: (value) {
              if (value == null) return;
              setState(() => selectedCustomerId = value);
              loadProjects(value);
            },
          ),
          const SizedBox(height: 14),
          isLoadingProjects
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Center(child: CircularProgressIndicator()),
                )
              : DropdownButtonFormField<int>(
                  value: safeProjectValue,
                  isExpanded: true,
                  decoration: _fieldDecoration('Project'),
                  items: projectItems,
                  onChanged: (value) async {
                    if (value == null) return;
                    setState(() => selectedProjectId = value);
                    await loadProjectEstimation();
                  },
                ),
          const SizedBox(height: 20),
          if (!_readyForEstimation)
            _emptyStatePrompt()
          else ...[
            _sectionHeader(
              'Trade-wise Cost Input',
              trailing: TextButton.icon(
                onPressed: isLoadingRoles ? null : _addTrade,
                icon: const Icon(Icons.add, size: 16),
                label: Text('Add Trade', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                style: TextButton.styleFrom(foregroundColor: _DS.primary),
              ),
            ),
            Text(
              'Add each trade with its manpower rates. Shared project expenses are entered once below.',
              style: GoogleFonts.inter(color: _DS.muted, fontSize: 12),
            ),
            const SizedBox(height: 12),
            if (isLoadingRoles)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Center(child: CircularProgressIndicator()),
              )
            else
              ...trades.map((t) => _tradeCard(t)),
            const SizedBox(height: 8),
            _sectionHeader('Monthly Amount'),
            _expenseGrid([
              _expenseField('Accommodation', accommodationCtrl),
              _expenseField('Transportation', transportationCtrl),
              _expenseField('Food', foodCtrl),
            ]),
            const SizedBox(height: 20),
            _sectionHeader('One Time Expenses (Total Monthly Cost)'),
            _expenseGrid([
              _expenseField('Gate Pass', gatePassCtrl),
              _expenseField('Fuel', fuelCtrl),
              _expenseField('Medical Insurance', medicalInsuranceCtrl),
              _expenseField('Safety Equipment', safetyEquipmentCtrl),
            ]),
            const SizedBox(height: 20),
            _sectionHeader('Own Camp Expenses (Total Monthly Cost)'),
            _expenseGrid([
              _expenseField('Electricity', electricityCtrl),
              _expenseField('AC', acCtrl),
              _expenseField('Bed', bedCtrl),
              _expenseField('Sewage', sewageCtrl),
            ]),
            const SizedBox(height: 20),
            _sectionHeader('Overhead & Camp Running Cost'),
            _expenseGrid([
              _expenseField('Over Head', overheadCtrl),
              _expenseField('Camp Running Cost', campRunningCostCtrl),
            ]),
            const SizedBox(height: 20),
            _sectionHeader('Totals'),
            _totalsSection(),
          ],
        ],
      ),
    );
  }

  /// Totals card shown at the bottom of the Trade Setup tab — mirrors the
  /// React web app's "Totals" SectionCard exactly (same fields, same math).
  Widget _totalsSection() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _DS.surface,
        borderRadius: BorderRadius.circular(_DS.radiusCard),
        border: Border.all(color: _DS.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _statGrid([
            _StatData('Total Manpower', totalManpower.toStringAsFixed(0)),
            _StatData('Total Revenue', _fmt(totalRevenue)),
            _StatData('Total Cost', _fmt(totalCost)),
            _StatData('Total Result', _fmt(totalResult),
                positive: totalResult >= 0, danger: totalResult < 0),
          ], columns: 2),
          const SizedBox(height: 8),
          _statGrid([
            _StatData('Supplier Cost', _fmt(totalSupplierCost)),
            _StatData('Direct Cost (shared)', _fmt(directCost)),
            _StatData('Indirect Cost (shared)', _fmt(indirectCost)),
          ], columns: 3),
        ],
      ),
    );
  }

  // ---- Page 2: Results ---------------------------------------------------

  Widget _buildResultsPage() {
    if (!_readyForEstimation) return _emptyStatePrompt(padTop: 48);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Cost & Revenue Results'),
          Text(
            'Revenue and supplier cost per trade. Direct/indirect costs are shared project-wide.',
            style: GoogleFonts.inter(color: _DS.muted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          _resultsTable(),
          const SizedBox(height: 20),
          _sectionHeader('Project-wide Result (incl. shared costs)'),
          const SizedBox(height: 8),
          _statGrid([
            _StatData('Direct Cost', _fmt(directCost)),
            _StatData('Indirect Cost', _fmt(indirectCost)),
            _StatData('Total Cost', _fmt(totalCost)),
            _StatData('Total Result', _fmt(totalResult),
                positive: totalResult >= 0, danger: totalResult < 0),
          ]),
        ],
      ),
    );
  }

  Widget _resultsTable() {
    return Container(
      decoration: BoxDecoration(
        color: _DS.surface,
        border: Border.all(color: _DS.border),
        borderRadius: BorderRadius.circular(_DS.radiusCard),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(_DS.primaryTint),
          columns: [
            'Trade', 'Qty', 'Supplier Rate', 'Revenue', 'Supplier Cost', 'Gross Margin'
          ]
              .map((h) => DataColumn(
                    label: Text(h,
                        style: GoogleFonts.inter(
                            fontSize: 11, fontWeight: FontWeight.w700, color: _DS.primary)),
                  ))
              .toList(),
          rows: [
            ...trades.map((t) => DataRow(cells: [
                  DataCell(Text(t.roleName.isEmpty ? 'Trade' : t.roleName)),
                  DataCell(Text(t.quantity.toStringAsFixed(0))),
                  DataCell(Text(_fmt(t.supplierRate))),
                  DataCell(Text(_fmt(t.revenue))),
                  DataCell(Text(_fmt(t.supplierCost))),
                  DataCell(Text(
                    _fmt(t.grossMargin),
                    style: TextStyle(
                        color: t.grossMargin >= 0 ? _DS.success : _DS.danger,
                        fontWeight: FontWeight.w700),
                  )),
                ])),
            DataRow(
              color: MaterialStateProperty.all(_DS.primaryTint),
              cells: [
                DataCell(Text('Totals', style: GoogleFonts.inter(fontWeight: FontWeight.w700))),
                DataCell(Text(totalManpower.toStringAsFixed(0),
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700))),
                const DataCell(Text('')),
                DataCell(Text(_fmt(totalRevenue), style: GoogleFonts.inter(fontWeight: FontWeight.w700))),
                DataCell(Text(_fmt(totalSupplierCost),
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700))),
                DataCell(Text(_fmt(totalGrossMargin),
                    style: GoogleFonts.inter(
                        fontWeight: FontWeight.w700,
                        color: totalGrossMargin >= 0 ? _DS.success : _DS.danger))),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---- Page 3: Abstract ---------------------------------------------------

  Widget _buildAbstractPage() {
    if (!_readyForEstimation) return _emptyStatePrompt(padTop: 48);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Abstract Summary'),
          Text(
            'Trade-wise revenue, supplier cost, and hourly cost breakdown.',
            style: GoogleFonts.inter(color: _DS.muted, fontSize: 12),
          ),
          const SizedBox(height: 12),
          ...trades.map((t) => _abstractCard(t)),
          const SizedBox(height: 12),
          _sectionHeader('Overall Profit & Loss'),
          const SizedBox(height: 10),
          TextField(
            controller: commissionCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            onChanged: (_) => setState(() {}),
            decoration: _fieldDecoration('Commission'),
          ),
          const SizedBox(height: 14),
          _statGrid([
            _StatData('Total Result', _fmt(totalResult),
                positive: totalResult >= 0, danger: totalResult < 0),
            _StatData('Net Profit / Loss', _fmt(netProfitLoss),
                positive: netProfitLoss >= 0, danger: netProfitLoss < 0, sub: 'After commission'),
          ]),
        ],
      ),
    );
  }

  Widget _abstractCard(_TradeEntry t) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _DS.surface,
        borderRadius: BorderRadius.circular(_DS.radiusCard),
        border: Border.all(color: _DS.border, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(color: _DS.primary, borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.groups_rounded, size: 16, color: Colors.white),
              ),
              const SizedBox(width: 8),
              Text(t.roleName.isEmpty ? 'Trade' : t.roleName, style: _DS.sectionTitle()),
            ],
          ),
          const SizedBox(height: 10),
          _statGrid([
            _StatData('Supplier Cost', _fmt(t.supplierCost)),
            _StatData('Revenue', _fmt(t.revenue)),
            _StatData('Gross Margin', _fmt(t.grossMargin),
                positive: t.grossMargin >= 0, danger: t.grossMargin < 0),
            _StatData('Hourly Cost', _fmt(t.hourlyCost)),
          ], columns: 2),
          const SizedBox(height: 8),
          _statGrid([_StatData('Hourly Cost / Employee', _fmt(t.hourlyCostPerEmp))], columns: 1),
        ],
      ),
    );
  }

  // ---- Page 4: Suppliers ---------------------------------------------------

  Widget _buildSupplierPage() {
    if (!_readyForEstimation) return _emptyStatePrompt(padTop: 48);

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader(
            'Supplier Overview',
            trailing: TextButton.icon(
              onPressed: _addSupplier,
              icon: const Icon(Icons.add, size: 16),
              label: Text('Add Supplier', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              style: TextButton.styleFrom(foregroundColor: _DS.primary),
            ),
          ),
          Text('Manpower suppliers considered for this project.',
              style: GoogleFonts.inter(color: _DS.muted, fontSize: 12)),
          const SizedBox(height: 12),
          if (suppliers.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 28),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: _DS.border, width: 1.5, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(_DS.radiusCard),
              ),
              child: Text('No suppliers added yet',
                  style: GoogleFonts.inter(color: _DS.muted, fontSize: 13)),
            )
          else
            ...suppliers.map((s) => _supplierCard(s)),
        ],
      ),
    );
  }

  Widget _supplierCard(_SupplierEntry s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: _DS.surface,
        border: Border.all(color: _DS.border, width: 1.5),
        borderRadius: BorderRadius.circular(_DS.radiusField),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: s.nameCtrl,
                  decoration: _fieldDecoration('Supplier Name', dense: true),
                ),
              ),
              const SizedBox(width: 8),
              if (suppliers.length > 1)
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: _DS.danger),
                  onPressed: () => _removeSupplier(s),
                  tooltip: 'Remove supplier',
                ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(controller: s.tradeCtrl, decoration: _fieldDecoration('Trade', dense: true)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: s.employeesCtrl,
                  keyboardType: TextInputType.number,
                  decoration: _fieldDecoration('No. of Employees', dense: true),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: s.hourlyRateCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: _fieldDecoration('Hourly Rate', dense: true),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: s.monthlyRateCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: _fieldDecoration('Monthly Rate', dense: true),
          ),
        ],
      ),
    );
  }

  // ---- Bottom action bar (Clear/Save/Submit + Prev/Next) ------------------

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      decoration: BoxDecoration(
        color: _DS.surface,
        border: Border(top: BorderSide(color: _DS.border)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _clearAll,
                    style: OutlinedButton.styleFrom(
                      textStyle: _DS.buttonText(),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(_DS.radiusButton)),
                    ),
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: saving ? null : _saveEstimation,
                    style: OutlinedButton.styleFrom(
                      textStyle: _DS.buttonText(),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(_DS.radiusButton)),
                    ),
                    icon: saving
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.save_outlined, size: 16),
                    label: Text(saving ? 'Saving…' : 'Save'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                if (_currentPage > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _goToPage(_currentPage - 1),
                      style: OutlinedButton.styleFrom(
                        textStyle: _DS.buttonText(),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(_DS.radiusButton)),
                      ),
                      child: const Text('← Previous'),
                    ),
                  ),
                if (_currentPage > 0) const SizedBox(width: 8),
                if (_currentPage < _tabs.length - 1)
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _DS.primary,
                        textStyle: _DS.buttonText(color: Colors.white),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(_DS.radiusButton)),
                      ),
                      onPressed: () => _goToPage(_currentPage + 1),
                      child: const Text('Next →'),
                    ),
                  )
                else
                  Expanded(
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _DS.primary,
                        textStyle: _DS.buttonText(color: Colors.white),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(_DS.radiusButton)),
                      ),
                      onPressed: submitting ? null : _submitEstimation,
                      icon: submitting
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.check_circle_outline, size: 16),
                      label: Text(submitting ? 'Submitting…' : 'Submit Estimation'),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------
  // Small reusable widgets
  // ---------------------------------------------------------------------

  Widget _emptyStatePrompt({double padTop = 0}) {
    return SingleChildScrollView(
      padding: EdgeInsets.only(top: padTop),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 16),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.arrow_upward_rounded, size: 32, color: Colors.grey.shade400),
              const SizedBox(height: 12),
              Text(
                'Select a client and project on the\nTrade Setup tab to unlock this section',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: _DS.muted, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sectionHeader(String title, {Widget? trailing}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(child: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15))),
          if (trailing != null) trailing,
        ],
      ),
    );
  }

  InputDecoration _fieldDecoration(String label, {bool dense = false}) {
    return InputDecoration(
      labelText: label,
      isDense: dense,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(_DS.radiusField)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_DS.radiusField),
        borderSide: const BorderSide(color: _DS.primary, width: 1.5),
      ),
    );
  }

  Widget _tradeCard(_TradeEntry entry) {
    final availableRoles = _availableRolesFor(entry);
    final roleIds = <int>{};
    final roleItems = <DropdownMenuItem<int>>[];
    for (final r in availableRoles) {
      final id = _roleId(r);
      if (id == null || !roleIds.add(id)) continue;
      roleItems.add(DropdownMenuItem(value: id, child: Text(_roleName(r))));
    }

    // Prefer the stored roleId if it's still a valid option; otherwise try
    // to resolve it from the trade's name (covers reloaded/updated rows
    // whose RoleID didn't survive the round-trip from the backend).
    final resolvedRoleId = roleIds.contains(entry.roleId)
        ? entry.roleId
        : (entry.roleId == null ? _findRoleIdByName(entry.roleName) : null);
    final safeRoleValue = roleIds.contains(resolvedRoleId) ? resolvedRoleId : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: _DS.surface,
        borderRadius: BorderRadius.circular(_DS.radiusCard),
        border: Border.all(color: _DS.border, width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    entry.roleName.isEmpty ? 'New Trade' : entry.roleName,
                    style: GoogleFonts.inter(fontWeight: FontWeight.w600),
                  ),
                ),
                Text('Qty ${entry.quantity.toStringAsFixed(0)} · ${entry.hours.toStringAsFixed(0)} hrs',
                    style: GoogleFonts.inter(color: _DS.muted, fontSize: 12)),
                if (trades.length > 1)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: _DS.danger),
                    onPressed: () => _removeTrade(entry),
                    tooltip: 'Remove trade',
                  ),
              ],
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int>(
              value: safeRoleValue,
              isExpanded: true,
              decoration: _fieldDecoration('Trade', dense: true),
              items: roleItems,
              onChanged: (value) {
                if (value == null) return;
                final chosen = availableRoles.firstWhere((r) => _roleId(r) == value);
                setState(() {
                  entry.roleId = value;
                  entry.roleName = _roleName(chosen);
                });
              },
            ),
            const SizedBox(height: 10),
            _fieldRow([
              _numberField('Quantity', entry.qtyCtrl),
              _numberField('Hours', entry.hoursCtrl),
            ]),
            const SizedBox(height: 10),
            _fieldRow([
              _numberField('Client Rate', entry.clientRateCtrl),
              _numberField('Supplier Rate', entry.supplierRateCtrl),
            ]),
            const SizedBox(height: 12),
            _statGrid([
              _StatData('Revenue', _fmt(entry.revenue)),
              _StatData('Supplier Cost', _fmt(entry.supplierCost)),
              _StatData('Gross Margin', _fmt(entry.grossMargin),
                  positive: entry.grossMargin >= 0, danger: entry.grossMargin < 0),
              _StatData('Hourly Cost / Emp', _fmt(entry.hourlyCostPerEmp)),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _fieldRow(List<Widget> children) {
    return Row(
      children: [
        for (int i = 0; i < children.length; i++) ...[
          if (i > 0) const SizedBox(width: 10),
          Expanded(child: children[i]),
        ],
      ],
    );
  }

  Widget _numberField(String label, TextEditingController controller) {
    return TextField(
      controller: controller,
      style: _DS.inputText(),
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      onChanged: (_) => setState(() {}),
      decoration: _fieldDecoration(label, dense: true),
    );
  }

  Widget _expenseField(String label, TextEditingController controller) => _numberField(label, controller);

  Widget _expenseGrid(List<Widget> fields) {
    final rows = <Widget>[];
    for (int i = 0; i < fields.length; i += 2) {
      final pair = <Widget>[fields[i]];
      if (i + 1 < fields.length) pair.add(fields[i + 1]);
      rows.add(Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _fieldRow(pair.length == 1 ? [pair[0], const SizedBox()] : pair),
      ));
    }
    return Column(children: rows);
  }

  Widget _statGrid(List<_StatData> items, {int columns = 2}) {
    final rows = <Widget>[];
    for (int i = 0; i < items.length; i += columns) {
      final chunk = items.sublist(i, (i + columns).clamp(0, items.length));
      rows.add(Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          children: [
            for (int j = 0; j < columns; j++) ...[
              if (j > 0) const SizedBox(width: 8),
              Expanded(child: j < chunk.length ? _statBox(chunk[j]) : const SizedBox()),
            ],
          ],
        ),
      ));
    }
    return Column(children: rows);
  }

  Widget _statBox(_StatData data) {
    final bg = data.danger ? _DS.dangerTint : data.positive ? _DS.successTint : _DS.background;
    final border = data.danger ? _DS.dangerTintBorder : data.positive ? _DS.successTintBorder : _DS.border;
    final fg = data.danger ? _DS.danger : data.positive ? _DS.success : _DS.textDark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(_DS.radiusField),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(data.label.toUpperCase(), style: _DS.label()),
          const SizedBox(height: 4),
          Text(data.value, style: _DS.statValue(color: fg)),
          if (data.sub != null) ...[
            const SizedBox(height: 2),
            Text(data.sub!, style: GoogleFonts.inter(fontSize: 11, color: _DS.muted)),
          ],
        ],
      ),
    );
  }
}

class _StatData {
  final String label;
  final String value;
  final bool positive;
  final bool danger;
  final String? sub;
  _StatData(this.label, this.value, {this.positive = false, this.danger = false, this.sub});
}