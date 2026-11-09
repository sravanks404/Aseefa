import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

const List<String> kFlatTypeSuggestions = [
  'Studio',
  '1 BHK',
  '2 BHK',
  '3 BHK',
  '4 BHK',
  'Penthouse',
  'Other',
];

class PmColors {
  static const Color primary = Color(0xFF10299B);
  static const Color primaryDark = Color(0xFF0B1C6E);
  static const Color primaryMid = Color(0xFF4A6BCC);
  static const Color primarySoft = Color(0xFFEEF1FB);
  static const Color primaryTint = Color(0xFFD6DDF5);
  static const Color accent = Color(0xFFF59E0B);
  static const Color accentSoft = Color(0xFFFEF3DA);
  static const Color background = Color(0xFFF5F7FB);
  static const Color surface = Colors.white;
  static const Color ink = Color(0xFF111827);
  static const Color muted = Color(0xFF6B7280);
  static const Color hairline = Color(0xFFE5E7EB);
  static const Color green = Color(0xFF16A34A);
  static const Color greenSoft = Color(0xFFDFF6E6);
  static const Color red = Color(0xFFDC2626);
  static const Color redSoft = Color(0xFFFCE8E8);
}

class PmSpace {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
}

class PmRadius {
  static const double card = 16;
  static const double button = 12;
  static const double field = 12;
  static const double badge = 10;
}

class PmText {
  static const screenTitle = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w800,
    color: PmColors.ink,
    height: 1.15,
  );
  static const screenSubtitle = TextStyle(
    fontSize: 13,
    color: PmColors.muted,
    fontWeight: FontWeight.w500,
  );
  static const sectionTitle = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: PmColors.primaryDark,
  );
  static const sectionSubtitle = TextStyle(
    fontSize: 12,
    color: PmColors.muted,
  );
  static const cardTitle = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: PmColors.ink,
  );
  static const cardMeta = TextStyle(
    fontSize: 12,
    color: PmColors.muted,
    fontWeight: FontWeight.w500,
  );
  static const label = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: .3,
    color: PmColors.primaryMid,
  );
}

final _money = NumberFormat.currency(symbol: '', decimalDigits: 2);



/// Lightweight property summary from getPropertyInformation
class PropertySummary {
  final int id;
  final String propertyName;
  final String propertyCode;
  final String buildingName;
  final String unitNumber;
  final String floorNumber;
  final String unitType;
  final String propertyCategory;
  final String communityArea;
  final String city;

  PropertySummary({
    required this.id,
    required this.propertyName,
    required this.propertyCode,
    required this.buildingName,
    required this.unitNumber,
    required this.floorNumber,
    required this.unitType,
    required this.propertyCategory,
    required this.communityArea,
    required this.city,
  });

  factory PropertySummary.fromApi(Map<String, dynamic> item) {
    return PropertySummary(
      id: int.tryParse('${item['PropertyID'] ?? 0}') ?? 0,
      propertyName: item['PropertyName']?.toString() ?? '',
      propertyCode: item['PropertyCode']?.toString() ?? '',
      buildingName: item['BuildingName']?.toString() ?? '',
      unitNumber: item['UnitNumber']?.toString() ?? '',
      floorNumber: item['FloorNumber']?.toString() ?? '',
      unitType: item['UnitType']?.toString() ?? '',
      propertyCategory: item['PropertyCategory']?.toString() ?? '',
      communityArea: item['CommunityArea']?.toString() ?? '',
      city: item['City']?.toString() ?? '',
    );
  }

  String get fullLabel {
    if (propertyName.trim().isNotEmpty) return propertyName;
    if (propertyCode.trim().isNotEmpty) return propertyCode;
    return 'Property #$id';
  }

  String get locationLine {
    final parts = [communityArea, city].where((p) => p.trim().isNotEmpty).toList();
    return parts.isEmpty ? 'Location not set' : parts.join(', ');
  }

  String get buildingLine {
    final parts = <String>[];
    if (buildingName.trim().isNotEmpty) parts.add(buildingName);
    if (unitNumber.trim().isNotEmpty) parts.add('Unit $unitNumber');
    if (floorNumber.trim().isNotEmpty) parts.add('Floor $floorNumber');
    return parts.isEmpty ? 'No building details yet' : parts.join(' · ');
  }
}

class ChequeItem {
  String amount;
  String date; // yyyy-MM-dd

  ChequeItem({this.amount = '', this.date = ''});

  factory ChequeItem.empty() => ChequeItem(amount: '', date: '');

  Map<String, dynamic> toPayload() => {
    'Amount': amount.trim().isEmpty ? null : num.tryParse(amount),
    'Date': date.trim().isEmpty ? null : date,
  };
}

/// Row shape used in the list.
class PropertyRecordRow {
  final int recordId;
  final String flatNo;
  final String tenantName;
  final String flatType;
  final double rentalAmount;
  final double totalCheque;
  final double totalPaid;
  final double balanceDue;

  PropertyRecordRow({
    required this.recordId,
    required this.flatNo,
    required this.tenantName,
    required this.flatType,
    required this.rentalAmount,
    required this.totalCheque,
    required this.totalPaid,
    required this.balanceDue,
  });

  factory PropertyRecordRow.fromApi(Map<String, dynamic> item) {
    final recordId = _toInt(item['RecordID']);

    final cheques = extractCheques(item, null);
    final totalCheque = cheques.fold<double>(
      0,
      (sum, c) => sum + (double.tryParse(c.amount) ?? 0),
    );

    final cashReceived = _toDouble(item['CashReceived']);
    final rentalAmount = _toDouble(item['RentalAmount']);

    final totalPaid = item['TotalPaid'] != null
        ? _toDouble(item['TotalPaid'])
        : totalCheque + cashReceived;

    final balanceDue = item['BalanceDue'] != null
        ? _toDouble(item['BalanceDue'])
        : rentalAmount - totalPaid;

    return PropertyRecordRow(
      recordId: recordId,
      flatNo: (item['FlatNo'] ?? '').toString(),
      tenantName: (item['TenantName'] ?? '').toString(),
      flatType: (item['FlatType'] ?? '').toString(),
      rentalAmount: rentalAmount,
      totalCheque: totalCheque,
      totalPaid: totalPaid,
      balanceDue: balanceDue,
    );
  }
}

/// Mutable state used by the form.
class PropertyRecordForm {
  int recordId;
  String flatNo;
  String tenantName;
  String flatType;
  String rentalAmount;
  List<ChequeItem> cheques;
  String cashReceived;
  String remarks;

  PropertyRecordForm({
    this.recordId = 0,
    this.flatNo = '',
    this.tenantName = '',
    this.flatType = '',
    this.rentalAmount = '',
    List<ChequeItem>? cheques,
    this.cashReceived = '',
    this.remarks = '',
  }) : cheques = cheques ?? [ChequeItem.empty()];

  factory PropertyRecordForm.empty() => PropertyRecordForm();

  factory PropertyRecordForm.fromApi(
    Map<String, dynamic>? data,
    List<dynamic>? chequesArray,
  ) {
    if (data == null) return PropertyRecordForm.empty();

    final cheques = extractCheques(data, chequesArray);

    return PropertyRecordForm(
      recordId: _toInt(data['RecordID']),
      flatNo: (data['FlatNo'] ?? '').toString(),
      tenantName: (data['TenantName'] ?? '').toString(),
      flatType: (data['FlatType'] ?? '').toString(),
      rentalAmount: data['RentalAmount'] == null ? '' : data['RentalAmount'].toString(),
      cheques: cheques.isEmpty ? [ChequeItem.empty()] : cheques,
      cashReceived: data['CashReceived'] == null ? '' : data['CashReceived'].toString(),
      remarks: (data['Remarks'] ?? '').toString(),
    );
  }

  double get totalChequeAmount => cheques.fold<double>(
    0,
    (sum, c) => sum + (double.tryParse(c.amount) ?? 0),
  );

  double get totalPaid => totalChequeAmount + (double.tryParse(cashReceived) ?? 0);

  double get balanceDue => (double.tryParse(rentalAmount) ?? 0) - totalPaid;

  Map<String, dynamic> toSavePayload({
    required int propertyId,
    required int companyId,
    required int userId,
  }) {
    return {
      'RecordID': recordId,
      'PropertyID': propertyId,
      'FlatNo': flatNo.trim().isEmpty ? null : flatNo.trim(),
      'TenantName': tenantName.trim().isEmpty ? null : tenantName.trim(),
      'FlatType': flatType.trim().isEmpty ? null : flatType.trim(),
      'RentalAmount': rentalAmount.trim().isEmpty ? null : num.tryParse(rentalAmount),
      'CashReceived': cashReceived.trim().isEmpty ? null : num.tryParse(cashReceived),
      'TotalChequeAmount': totalChequeAmount,
      'TotalPaid': totalPaid,
      'BalanceDue': balanceDue,
      'Remarks': remarks.trim().isEmpty ? null : remarks.trim(),
      'CompanyID': companyId,
      'UserID': userId,
      'Cheques': cheques.map((c) => c.toPayload()).toList(),
    };
  }
}

// ---------- shared mapping helpers ----------

List<ChequeItem> extractCheques(
  Map<String, dynamic>? item,
  List<dynamic>? chequesArray,
) {
  if (chequesArray != null && chequesArray.isNotEmpty) {
    final sorted = [...chequesArray]..sort((a, b) {
      final sa = _toInt((a as Map)['SequenceNo']);
      final sb = _toInt((b as Map)['SequenceNo']);
      return sa.compareTo(sb);
    });

    return sorted.map((c) {
      final m = c as Map<String, dynamic>;
      final amount = m['ChequeAmount'] ?? m['Amount'] ?? m['amount'];
      final date = m['ChequeDate'] ?? m['Date'] ?? m['date'];
      return ChequeItem(
        amount: amount == null ? '' : amount.toString(),
        date: _dateOnly(date),
      );
    }).toList();
  }

  if (item == null) return [ChequeItem.empty()];

  final itemCheques = item['Cheques'];
  if (itemCheques is List && itemCheques.isNotEmpty) {
    return itemCheques.map((c) {
      final m = c as Map<String, dynamic>;
      final amount = m['Amount'] ?? m['amount'];
      final date = m['Date'] ?? m['date'];
      return ChequeItem(
        amount: amount == null ? '' : amount.toString(),
        date: _dateOnly(date),
      );
    }).toList();
  }

  final legacy = <ChequeItem>[];
  var n = 1;
  while (item.containsKey('Cheque${n}Amount') ||
      item.containsKey('Cheque${n}Date')) {
    final amount = item['Cheque${n}Amount'];
    final date = item['Cheque${n}Date'];
    legacy.add(ChequeItem(
      amount: amount == null ? '' : amount.toString(),
      date: _dateOnly(date),
    ));
    n += 1;
  }

  return legacy.isNotEmpty ? legacy : [ChequeItem.empty()];
}

String _dateOnly(dynamic value) {
  if (value == null) return '';
  final s = value.toString();
  return s.length >= 10 ? s.substring(0, 10) : s;
}

int _toInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  return int.tryParse(value.toString()) ?? 0;
}

double _toDouble(dynamic value) {
  if (value == null) return 0;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString()) ?? 0;
}

// ============================================================
// MAIN PAGE
// ============================================================

class PropertyMasterPage extends StatefulWidget {
  const PropertyMasterPage({super.key});

  @override
  State<PropertyMasterPage> createState() => _PropertyMasterPageState();
}

class _PropertyMasterPageState extends State<PropertyMasterPage> {
  final _searchController = TextEditingController();

  // Property list (using same endpoint as specification)
  List<PropertySummary> _properties = [];
  bool _propertiesLoading = false;
  PropertySummary? _selectedProperty;

  // Records for selected property
  List<PropertyRecordRow> _records = [];
  bool _loadingRecords = false;
  String _searchTerm = '';

  // Form state
  bool _showForm = false;
  PropertyRecordForm _form = PropertyRecordForm.empty();
  bool _loadingRecord = false;
  bool _saving = false;
  bool _deleting = false;

  // Controllers for text fields in form
  late Map<String, TextEditingController> _formControllers;

  @override
  void initState() {
    super.initState();
    _formControllers = {
      'flatNo': TextEditingController(),
      'tenantName': TextEditingController(),
      'rentalAmount': TextEditingController(),
      'cashReceived': TextEditingController(),
      'remarks': TextEditingController(),
    };
    _loadProperties();
    _searchController.addListener(() {
      setState(() => _searchTerm = _searchController.text.trim().toLowerCase());
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    for (final c in _formControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  bool get _isEdit => _form.recordId > 0;

  void _syncControllersFromForm() {
    _formControllers['flatNo']!.text = _form.flatNo;
    _formControllers['tenantName']!.text = _form.tenantName;
    _formControllers['rentalAmount']!.text = _form.rentalAmount;
    _formControllers['cashReceived']!.text = _form.cashReceived;
    _formControllers['remarks']!.text = _form.remarks;
  }

  void _collectControllersIntoForm() {
    _form.flatNo = _formControllers['flatNo']!.text;
    _form.tenantName = _formControllers['tenantName']!.text;
    _form.rentalAmount = _formControllers['rentalAmount']!.text;
    _form.cashReceived = _formControllers['cashReceived']!.text;
    _form.remarks = _formControllers['remarks']!.text;
  }

  // ---------------- API Helpers (matching specification pattern) ----------------

  Future<int> _getCompanyId() async => SessionStore.getCompanyId();
  Future<int> _getUserId() async => SessionStore.getUserId();

  String _apiFailureMessage(Object error, String action) {
    final text = error.toString();
    if (text.contains('<!DOCTYPE') || text.contains('<html')) {
      return 'Property backend is not available for $action. Check the API route and backend server.';
    }
    return 'Failed to $action.';
  }

  Map<String, dynamic> _decodeJsonBody(String body, String action) {
    final trimmed = body.trim();
    if (trimmed.isEmpty) {
      throw const FormatException('Empty response from server');
    }
    if (trimmed.startsWith('<') || trimmed.startsWith('http')) {
      throw FormatException(
        'Unexpected non-JSON response for $action: ${trimmed.substring(0, trimmed.length > 180 ? 180 : trimmed.length)}',
      );
    }
    return jsonDecode(trimmed) as Map<String, dynamic>;
  }

  /// Tolerant success check — some backends return `success` as a real
  /// boolean, others return it as the string "true"/"false". Using
  /// `data['success'] == true` in that second case always evaluates to
  /// false, which was making genuinely successful saves show up as a red
  /// error toast.
  // bool _isSuccess(dynamic value) {
  //   if (value == true) return true;
  //   return value?.toString().toLowerCase() == 'true';
  // }
  bool _isSuccess(dynamic value) {
  if (value == true) return true;

  if (value is int && value == 1) return true;

  final text = value?.toString().toLowerCase();

  return text == 'true' || text == '1';
}

  void _notify(String message, {bool isError = false}) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.fixed,
        backgroundColor: isError ? PmColors.red : PmColors.green,
        duration: const Duration(seconds: 3),
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.check_circle_outline,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------- Data Loading ----------------

  // NOTE: Property picker load is UNCHANGED — still goes through ApiConfig.baseUrl.
  Future<void> _loadProperties() async {
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }
    setState(() => _propertiesLoading = true);
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/getPropertyInformation')
          .replace(queryParameters: {'CompanyID': '$companyID'});
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load properties');
      if (_isSuccess(data['success'])) {
        final List list = data['data'] is List ? data['data'] : [];
        if (!mounted) return;
        setState(() {
          _properties = list
              .map((e) => PropertySummary.fromApi(Map<String, dynamic>.from(e)))
              .toList();
        });
      } else {
        if (!mounted) return;
        setState(() => _properties = []);
        _notify(data['message']?.toString() ?? 'Failed to load properties.',
            isError: true);
      }
    } catch (e) {
      debugPrint('Load property error: $e');
      _notify(_apiFailureMessage(e, 'load properties'), isError: true);
    } finally {
      if (mounted) setState(() => _propertiesLoading = false);
    }
  }

  // Property Master records list — now uses kAseefaWebUrl.
  Future<void> _loadRecords() async {
    final property = _selectedProperty;
    if (property == null) return;
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() => _loadingRecords = true);
    try {
      final uri = Uri.parse('$kAseefaWebUrl/getPropertyMaster')
          .replace(queryParameters: {
        'CompanyID': '$companyID',
        'PropertyID': '${property.id}',
      });
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load records');
      if (!_isSuccess(data['success'])) {
        _notify(data['message']?.toString() ?? 'Failed to load records.',
            isError: true);
        setState(() => _records = []);
        return;
      }
      final List list = data['data'] is List ? data['data'] : [];
      setState(() {
        _records = list
            .map((e) => PropertyRecordRow.fromApi(Map<String, dynamic>.from(e)))
            .toList();
      });
    } catch (e) {
      debugPrint('Load records error: $e');
      _notify(_apiFailureMessage(e, 'load records'), isError: true);
      setState(() => _records = []);
    } finally {
      if (mounted) setState(() => _loadingRecords = false);
    }
  }

  // Single record fetch (for edit) — now uses kAseefaWebUrl.
  Future<void> _loadRecord(int recordId) async {
    final property = _selectedProperty;
    if (property == null) return;
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() => _loadingRecord = true);
    try {
      final uri = Uri.parse('$kAseefaWebUrl/getPropertyMasterByID')
          .replace(queryParameters: {
        'RecordID': '$recordId',
        'CompanyID': '$companyID',
        'PropertyID': '${property.id}',
      });
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load record');
      if (!_isSuccess(data['success'])) {
        _notify(data['message']?.toString() ?? 'Failed to load record.',
            isError: true);
        return;
      }
      setState(() {
        _form = PropertyRecordForm.fromApi(
          data['data'] as Map<String, dynamic>?,
          data['cheques'] as List?,
        );
        _syncControllersFromForm();
      });
      // Sanity check: if this ever prints 0 for an edit, the API isn't
      // returning RecordID correctly and a subsequent save will INSERT
      // instead of UPDATE.
      debugPrint('Loaded record for edit -> RecordID: ${_form.recordId}');
    } catch (e) {
      debugPrint('Load record error: $e');
      _notify(_apiFailureMessage(e, 'load record'), isError: true);
    } finally {
      if (mounted) setState(() => _loadingRecord = false);
    }
  }

  // ---------------- Property Selection ----------------

  void _onPropertyChanged(PropertySummary? property) {
    setState(() {
      _selectedProperty = property;
      _records = [];
      _showForm = false;
      _searchController.clear();
    });
    if (property != null) _loadRecords();
  }

  List<PropertyRecordRow> get _filteredRecords {
    if (_searchTerm.isEmpty) return _records;
    return _records.where((r) {
      return r.flatNo.toLowerCase().contains(_searchTerm) ||
          r.tenantName.toLowerCase().contains(_searchTerm) ||
          r.flatType.toLowerCase().contains(_searchTerm);
    }).toList();
  }

  // ---------------- Form Actions ----------------

  void _openCreate() {
    setState(() {
      _form = PropertyRecordForm.empty();
      _syncControllersFromForm();
      _showForm = true;
    });
  }

  Future<void> _openEdit(int recordId) async {
    setState(() {
      _showForm = true;
      _form = PropertyRecordForm.empty();
      _syncControllersFromForm();
    });
    await _loadRecord(recordId);
  }

  void _backToList() {
    if (_saving || _deleting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _showForm = false;
      _form = PropertyRecordForm.empty();
    });
  }

  void _addCheque() => setState(() => _form.cheques.add(ChequeItem.empty()));

  void _removeCheque(int index) {
    if (_form.cheques.length <= 1) return;
    setState(() => _form.cheques.removeAt(index));
  }

  // ---------------- Save / Delete / Reset ----------------

  // Add / Update — now uses kAseefaWebUrl.
  // FIX 1 (double-submit): the busy flag is set synchronously, immediately
  // after the guard check and before any `await`, so a fast double-tap on
  // Save/Update can't slip through and fire two POSTs.
  // FIX 2 (false error toast): uses _isSuccess() instead of a strict
  // `== true` check, so a backend returning "true" as a string is still
  // recognized as success.
  Future<void> _handleSave() async {
    if (_saving || _deleting) return;
    setState(() => _saving = true); // lock immediately, before any await

    try {
      final companyID = await _getCompanyId();
      final userID = await _getUserId();
      if (companyID == 0) {
        _notify('CompanyID not found. Please login again.', isError: true);
        return;
      }
      if (userID == 0) {
        _notify('UserID not found. Please login again.', isError: true);
        return;
      }
      if (_selectedProperty == null) {
        _notify('Please select a property.', isError: true);
        return;
      }

      _collectControllersIntoForm();

      if (_form.flatNo.trim().isEmpty) {
        _notify('Please enter the Flat No.', isError: true);
        return;
      }
      if (_form.tenantName.trim().isEmpty) {
        _notify('Please enter the Tenant Name.', isError: true);
        return;
      }

      final payload = _form.toSavePayload(
        propertyId: _selectedProperty!.id,
        companyId: companyID,
        userId: userID,
      );
      debugPrint('Saving Property Record: $payload');

      final response = await http.post(
        Uri.parse('$kAseefaWebUrl/insertUpdatePropertyMaster'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      debugPrint('API RESPONSE: ${response.body}');
      final data = _decodeJsonBody(response.body, 'save record');
      debugPrint(
        'Save response success field: ${data['success']} (${data['success'].runtimeType})',
      );
      if (!_isSuccess(data['success'])) {
        _notify(data['message']?.toString() ?? 'Record could not be saved.',
            isError: true);
        return;
      }
      _notify(data['message']?.toString() ??
          (_isEdit ? 'Record updated successfully.' : 'Record saved successfully.'));
      if (!mounted) return;
      setState(() {
        _showForm = false;
        _form = PropertyRecordForm.empty();
      });
      await _loadRecords();
    } catch (e) {
      debugPrint('Save record error: $e');
      _notify(_apiFailureMessage(e, 'save record'), isError: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  // Delete — now uses kAseefaWebUrl.
  // FIX: same class of bug as save — the busy flag is now set immediately
  // after the guard check, before the (async) confirmation bottom sheet is
  // even shown. Previously a fast double-tap on the delete icon could open
  // two confirmation sheets / fire two delete requests before `_deleting`
  // was ever flipped to true. Also uses _isSuccess() for the same
  // string/bool tolerance as save.
  Future<void> _handleDelete(int recordId) async {
    if (_deleting || _saving) return;
    final property = _selectedProperty;
    if (property == null || recordId == 0) return;

    setState(() => _deleting = true); // lock immediately, before the confirm dialog

    try {
      final confirmed = await showModalBottomSheet<bool>(
        context: context,
        backgroundColor: Colors.white,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
        ),
        builder: (ctx) => _DeleteConfirmSheet(
          recordLabel: _form.flatNo.isNotEmpty ? 'Flat $_form.flatNo' : 'this record',
        ),
      );
      if (confirmed != true) return;

      final companyID = await _getCompanyId();
      final userID = await _getUserId();
      if (companyID == 0 || userID == 0) {
        _notify('Session expired. Please login again.', isError: true);
        return;
      }

      final request = http.Request(
        'POST',
        Uri.parse('$kAseefaWebUrl/deletePropertyMaster'),
      );
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'RecordID': recordId,
        'PropertyID': property.id,
        'CompanyID': companyID,
        'UserID': userID,
      });
      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      final data = _decodeJsonBody(response.body, 'delete record');
      if (!_isSuccess(data['success'])) {
        _notify(data['message']?.toString() ?? 'Record could not be deleted.',
            isError: true);
        return;
      }
      _notify(data['message']?.toString() ?? 'Record deleted successfully.');
      if (!mounted) return;
      setState(() {
        _showForm = false;
        _form = PropertyRecordForm.empty();
      });
      await _loadRecords();
    } catch (e) {
      debugPrint('Delete record error: $e');
      _notify(_apiFailureMessage(e, 'delete record'), isError: true);
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Future<void> _handleReset() async {
    if (_form.recordId > 0) {
      await _loadRecord(_form.recordId);
      _syncControllersFromForm();
    } else {
      setState(() {
        _form = PropertyRecordForm.empty();
        _syncControllersFromForm();
      });
    }
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PmColors.background,
      appBar: AppBar(
        title: Text(
          !_showForm
              ? 'Property Master'
              : (_isEdit ? 'Edit Record' : 'Add Record'),
        ),
        backgroundColor: PmColors.primary,
        foregroundColor: Colors.white,
        leading: _showForm
            ? IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: (_saving || _deleting) ? null : _backToList,
        )
            : null,
      ),
      floatingActionButton: (!_showForm && _selectedProperty != null)
          ? FloatingActionButton.extended(
        onPressed: _openCreate,
        backgroundColor: PmColors.primary,
        icon: const Icon(Icons.add),
        label: const Text('Add Record'),
      )
          : null,
      bottomNavigationBar: _showForm ? _buildFooter() : null,
      body: Column(
        children: [
          if (!_showForm) _buildPropertyPicker(),
          Expanded(
            child: _showForm
                ? _buildForm()
                : (_selectedProperty == null ? _buildEmptyState() : _buildRecordsList()),
          ),
        ],
      ),
    );
  }

  // ---------------- Property Picker ----------------

  Widget _buildPropertyPicker() {
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 12, 14, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: PmColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: PmColors.hairline),
        boxShadow: [
          BoxShadow(
            color: PmColors.primary.withOpacity(0.06),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButtonFormField<PropertySummary>(
          value: _selectedProperty,
          isExpanded: true,
          itemHeight: null,
          decoration: const InputDecoration(
            labelText: 'Property',
            labelStyle: TextStyle(
              color: PmColors.primaryDark,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
            border: InputBorder.none,
          ),
          hint: Text(_propertiesLoading ? 'Loading properties…' : 'Select a property'),
          selectedItemBuilder: (context) {
            return _properties.map((p) {
              return Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  p.fullLabel,
                  style: const TextStyle(fontSize: 14, color: PmColors.ink),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              );
            }).toList();
          },
          items: _properties.map((p) {
            return DropdownMenuItem(
              value: p,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(p.fullLabel, style: const TextStyle(fontSize: 14)),
                    if (p.locationLine.isNotEmpty)
                      Text(
                        p.locationLine,
                        style: const TextStyle(fontSize: 11, color: PmColors.muted),
                      ),
                  ],
                ),
              ),
            );
          }).toList(),
          onChanged: _propertiesLoading ? null : _onPropertyChanged,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.apartment_rounded, size: 52, color: PmColors.primaryTint),
            const SizedBox(height: 10),
            const Text(
              'Select a property to view its records',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: PmColors.primaryDark,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            const Text(
              'Flat, tenant and cheque records are tied to a specific property.',
              style: TextStyle(color: PmColors.muted, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // ---------------- Records List ----------------

  Widget _buildRecordsList() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 4, 14, 8),
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by flat no, tenant or flat type',
              prefixIcon: const Icon(Icons.search, color: PmColors.primary, size: 20),
              filled: true,
              fillColor: PmColors.primarySoft,
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(9),
                borderSide: const BorderSide(color: PmColors.hairline),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(9),
                borderSide: const BorderSide(color: PmColors.hairline),
              ),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadRecords,
            color: PmColors.primary,
            child: _loadingRecords
                ? const Center(child: CircularProgressIndicator(color: PmColors.primary))
                : _filteredRecords.isEmpty
                ? ListView(
              padding: const EdgeInsets.symmetric(vertical: 80),
              children: [
                Center(
                  child: Text(
                    _records.isEmpty
                        ? 'No records for this property yet.\nTap + to add one.'
                        : 'No matching records found.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: PmColors.muted),
                  ),
                ),
              ],
            )
                : ListView.builder(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 90),
              itemCount: _filteredRecords.length,
              itemBuilder: (context, index) {
                final record = _filteredRecords[index];
                return _RecordCard(
                  record: record,
                  onTap: () => _openEdit(record.recordId),
                  onDelete: () => _handleDelete(record.recordId),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  // ---------------- Form ----------------

  Widget _buildForm() {
    final busy = _saving || _deleting;
    if (_loadingRecord) {
      return const Center(child: CircularProgressIndicator(color: PmColors.primary));
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 24),
      children: [
        Text(
          'Property: ${_selectedProperty?.fullLabel ?? ''}',
          style: const TextStyle(color: PmColors.muted, fontSize: 12.5),
        ),
        const SizedBox(height: 16),
        _sectionCard(
          icon: Icons.home_outlined,
          title: 'Flat & Tenant Details',
          subtitle: 'Basic occupancy details',
          children: [
            _textField(
              label: 'Flat No',
              key: 'flatNo',
              placeholder: 'e.g. A-101',
              readOnly: _isEdit && _form.flatNo.isNotEmpty,
              enabled: !busy,
            ),
            const SizedBox(height: 12),
            _textField(
              label: 'Tenant Name',
              key: 'tenantName',
              placeholder: 'Tenant full name',
              enabled: !busy,
            ),
            const SizedBox(height: 12),
            _flatTypeField(busy),
            const SizedBox(height: 12),
            _textField(
              label: 'Rental Amount',
              key: 'rentalAmount',
              placeholder: 'e.g. 45000',
              enabled: !busy,
              numeric: true,
            ),
          ],
        ),
        const SizedBox(height: 18),
        _sectionCard(
          icon: Icons.account_balance_outlined,
          title: 'Cheque Details',
          subtitle: 'Add as many post-dated cheques as needed',
          trailing: TextButton.icon(
            onPressed: busy ? null : _addCheque,
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Add Cheque'),
            style: TextButton.styleFrom(
              foregroundColor: PmColors.primary,
              backgroundColor: PmColors.primarySoft,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            ),
          ),
          children: [
            for (int i = 0; i < _form.cheques.length; i++) _chequeRow(i, busy)
          ],
        ),
        const SizedBox(height: 18),
        _sectionCard(
          icon: Icons.payments_outlined,
          title: 'Payment Summary',
          subtitle: 'Cash received and totals',
          children: [
            _textField(
              label: 'Cash Received',
              key: 'cashReceived',
              placeholder: 'e.g. 5000',
              enabled: !busy,
              numeric: true,
            ),
            const SizedBox(height: 14),
            _summaryRow(),
          ],
        ),
        const SizedBox(height: 18),
        _sectionCard(
          icon: Icons.chat_bubble_outline,
          title: 'Remarks',
          subtitle: 'Any additional notes for this record',
          children: [
            _textField(
              label: '',
              key: 'remarks',
              placeholder: 'Optional remarks',
              enabled: !busy,
              maxLines: 4,
              showLabel: false,
            ),
          ],
        ),
      ],
    );
  }

  Widget _sectionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Widget> children,
    Widget? trailing,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PmColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: PmColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: PmColors.primarySoft,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, color: PmColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: PmText.sectionTitle),
                    Text(subtitle, style: PmText.sectionSubtitle),
                  ],
                ),
              ),
              if (trailing != null) trailing,
            ],
          ),
          const Divider(height: 22, color: PmColors.hairline),
          ...children,
        ],
      ),
    );
  }

  Widget _textField({
    required String label,
    required String key,
    String? placeholder,
    bool enabled = true,
    bool readOnly = false,
    bool numeric = false,
    int maxLines = 1,
    bool showLabel = true,
  }) {
    final controller = _formControllers[key]!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showLabel && label.isNotEmpty) ...[
          Text(
            label.toUpperCase(),
            style: PmText.label,
          ),
          const SizedBox(height: 6),
        ],
        TextFormField(
          controller: controller,
          enabled: enabled && !readOnly,
          readOnly: readOnly,
          maxLines: maxLines,
          keyboardType: numeric
              ? const TextInputType.numberWithOptions(decimal: true)
              : TextInputType.text,
          style: const TextStyle(fontSize: 14, color: PmColors.ink),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(fontSize: 13, color: PmColors.muted),
            filled: true,
            fillColor: readOnly ? const Color(0xFFF5F6FA) : PmColors.background,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(PmRadius.field),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(PmRadius.field),
              borderSide: const BorderSide(color: PmColors.primary, width: 1.4),
            ),
          ),
        ),
      ],
    );
  }

  Widget _flatTypeField(bool busy) {
    final readOnly = _isEdit && _form.flatType.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('FLAT TYPE', style: PmText.label),
        const SizedBox(height: 6),
        if (readOnly)
          TextFormField(
            initialValue: _form.flatType,
            enabled: false,
            style: const TextStyle(fontSize: 14, color: PmColors.ink),
            decoration: InputDecoration(
              filled: true,
              fillColor: const Color(0xFFF5F6FA),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(PmRadius.field),
                borderSide: const BorderSide(color: PmColors.hairline),
              ),
            ),
          )
        else
          Autocomplete<String>(
            initialValue: TextEditingValue(text: _form.flatType),
            optionsBuilder: (textEditingValue) {
              if (textEditingValue.text.isEmpty) return kFlatTypeSuggestions;
              return kFlatTypeSuggestions.where(
                    (s) => s.toLowerCase().contains(
                  textEditingValue.text.toLowerCase(),
                ),
              );
            },
            onSelected: (v) => setState(() => _form.flatType = v),
            fieldViewBuilder: (context, controller, focusNode, onSubmit) {
              controller.text = _form.flatType;
              return TextFormField(
                controller: controller,
                focusNode: focusNode,
                enabled: !busy,
                style: const TextStyle(fontSize: 14, color: PmColors.ink),
                onChanged: (v) => setState(() => _form.flatType = v),
                decoration: InputDecoration(
                  hintText: 'e.g. 2 BHK',
                  hintStyle: const TextStyle(fontSize: 13, color: PmColors.muted),
                  filled: true,
                  fillColor: PmColors.background,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(PmRadius.field),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(PmRadius.field),
                    borderSide: const BorderSide(color: PmColors.primary, width: 1.4),
                  ),
                ),
              );
            },
            optionsViewBuilder: (context, onSelected, options) {
              return Align(
                alignment: Alignment.topLeft,
                child: Material(
                  elevation: 3,
                  borderRadius: BorderRadius.circular(9),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 220),
                    child: ListView(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      children: options.map((o) {
                        return ListTile(
                          dense: true,
                          title: Text(o),
                          onTap: () => onSelected(o),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _chequeRow(int index, bool busy) {
    final cheque = _form.cheques[index];

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: PmColors.primarySoft.withOpacity(.5),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: PmColors.hairline),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 12,
            backgroundColor: PmColors.primaryTint,
            child: Text(
              '${index + 1}',
              style: const TextStyle(fontSize: 11, color: PmColors.primaryDark),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 4,
            child: TextFormField(
              initialValue: cheque.amount,
              enabled: !busy,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              onChanged: (v) => setState(() => cheque.amount = v),
              style: const TextStyle(fontSize: 14, color: PmColors.ink),
              decoration: InputDecoration(
                isDense: true,
                hintText: 'Amount',
                hintStyle: const TextStyle(fontSize: 13, color: PmColors.muted),
                filled: true,
                fillColor: PmColors.background,
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(PmRadius.field),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // FIX: date field replaced with a tappable read-only display
          // instead of a `TextFormField(initialValue: ...)`. Because the
          // cheque rows in this `for` loop don't carry a unique `key`,
          // Flutter was reusing the same TextFormField State across
          // rebuilds, so `initialValue` was only read once — the picked
          // date updated `cheque.date` in the model but never repainted
          // the field. It only appeared correct after Save/Update because
          // that flow rebuilds the whole form fresh from the API response.
          // A plain Text driven directly by `cheque.date` always repaints
          // on setState, so the picked date now shows immediately.
          Expanded(
            flex: 5,
            child: InkWell(
              borderRadius: BorderRadius.circular(PmRadius.field),
              onTap: busy
                  ? null
                  : () async {
                final initial = DateTime.tryParse(cheque.date) ?? DateTime.now();
                final picked = await showDatePicker(
                  context: context,
                  initialDate: initial,
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                );
                if (picked != null) {
                  setState(() => cheque.date = DateFormat('yyyy-MM-dd').format(picked));
                }
              },
              child: Container(
                height: 42,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  color: PmColors.background,
                  borderRadius: BorderRadius.circular(PmRadius.field),
                ),
                alignment: Alignment.centerLeft,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.calendar_today_outlined, size: 14, color: PmColors.muted),
                    const SizedBox(width: 6),
                    Text(
                      cheque.date.isEmpty ? 'YYYY-MM-DD' : cheque.date,
                      style: TextStyle(
                        fontSize: 13.5,
                        color: cheque.date.isEmpty ? PmColors.muted : PmColors.ink,
                        fontWeight: cheque.date.isEmpty ? FontWeight.normal : FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          IconButton(
            onPressed: busy || _form.cheques.length <= 1 ? null : () => _removeCheque(index),
            icon: const Icon(Icons.close, size: 18, color: PmColors.red),
            tooltip: 'Remove this cheque',
          ),
        ],
      ),
    );
  }

  Widget _summaryRow() {
    final balancePositive = _form.balanceDue <= 0;
    return Row(
      children: [
        Expanded(child: _summaryCard('Total Cheque', _form.totalChequeAmount, PmColors.primarySoft, PmColors.primaryDark)),
        const SizedBox(width: 8),
        Expanded(child: _summaryCard('Total Paid', _form.totalPaid, PmColors.greenSoft, PmColors.green)),
        const SizedBox(width: 8),
        Expanded(
          child: _summaryCard(
            'Balance Due',
            _form.balanceDue,
            balancePositive ? PmColors.greenSoft : PmColors.redSoft,
            balancePositive ? PmColors.green : PmColors.red,
          ),
        ),
      ],
    );
  }

  Widget _summaryCard(String label, double value, Color bg, Color fg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
              color: PmColors.muted,
              letterSpacing: .3,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            _money.format(value),
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: fg),
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    final busy = _saving || _deleting;
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
        decoration: const BoxDecoration(
          color: PmColors.surface,
          border: Border(top: BorderSide(color: PmColors.hairline)),
        ),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: ElevatedButton.icon(
                onPressed: busy || _loadingRecord ? null : _handleSave,
                icon: Icon(
                  _saving ? Icons.hourglass_top_rounded : Icons.check_circle_outline,
                ),
                label: Text(_saving ? 'Saving...' : (_isEdit ? 'Update' : 'Save')),
                style: ElevatedButton.styleFrom(
                  backgroundColor: PmColors.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: PmColors.primaryTint,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            if (_isEdit)
              Expanded(
                child: OutlinedButton(
                  onPressed: busy ? null : () => _handleDelete(_form.recordId),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: PmColors.red,
                    side: const BorderSide(color: PmColors.redSoft),
                    backgroundColor: PmColors.redSoft,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: Icon(_deleting ? Icons.hourglass_top_rounded : Icons.delete_outline),
                ),
              )
            else
              Expanded(
                child: OutlinedButton(
                  onPressed: busy ? null : _handleReset,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: PmColors.primary,
                    side: const BorderSide(color: PmColors.hairline),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('Reset'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// RECORD CARD (list item)
// ============================================================

class _RecordCard extends StatelessWidget {
  final PropertyRecordRow record;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _RecordCard({
    required this.record,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final balancePositive = record.balanceDue <= 0;

    return Dismissible(
      key: ValueKey(record.recordId),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        onDelete();
        return false;
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: PmColors.redSoft,
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Icon(Icons.delete_outline, color: PmColors.red),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: PmColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: PmColors.hairline),
          boxShadow: [
            BoxShadow(
              color: PmColors.primary.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            record.flatNo.isEmpty ? '—' : record.flatNo,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: PmColors.primaryDark,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            record.tenantName.isEmpty ? '—' : record.tenantName,
                            style: const TextStyle(color: PmColors.muted, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    if (record.flatType.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: PmColors.primarySoft,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          record.flatType,
                          style: const TextStyle(
                            color: PmColors.primary,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _statTile('Rental', record.rentalAmount, PmColors.primaryDark),
                    _statTile('Paid', record.totalPaid, PmColors.green),
                    _statTile('Balance', record.balanceDue, balancePositive ? PmColors.green : PmColors.red),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _statTile(String label, double value, Color color) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: PmColors.muted,
              letterSpacing: .4,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            _money.format(value),
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// DELETE CONFIRM SHEET (matching specification pattern)
// ============================================================

class _DeleteConfirmSheet extends StatelessWidget {
  final String recordLabel;
  const _DeleteConfirmSheet({required this.recordLabel});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.only(bottom: 18),
                decoration: BoxDecoration(
                  color: PmColors.hairline,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: PmColors.redSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(
                Icons.delete_outline_rounded,
                color: PmColors.red,
                size: 26,
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Delete record?',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: PmColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'The record for "$recordLabel" will be permanently removed. This can\'t be undone.',
              style: const TextStyle(
                fontSize: 13,
                color: PmColors.muted,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: PmColors.ink,
                      side: const BorderSide(color: PmColors.hairline),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(PmRadius.field),
                      ),
                    ),
                    child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: PmSpace.md),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PmColors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(PmRadius.field),
                      ),
                    ),
                    child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}