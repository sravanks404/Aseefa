import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:suitapps/config/design_tokens.dart';
import 'package:suitapps/config/api_config.dart';

import 'package:suitapps/core/session_store.dart';

const List<String> kOccupancyRecordTypes = ['Occupancy', 'Vacancy'];
const List<String> kInspectionStatuses = [
  'Pending',
  'Scheduled',
  'Completed',
  'Failed',
  'Not Required',
];
const List<String> kKeyHandoverStatuses = [ 
  'Not Handed Over',
  'Handed Over',
  'Returned',
  'Pending',
];

class OccupancyProperty {
  final int propertyId;
  final String propertyName;
  final String propertyCode;

  const OccupancyProperty({
    required this.propertyId,
    required this.propertyName,
    required this.propertyCode,
  });

  factory OccupancyProperty.fromJson(Map<String, dynamic> json) {
    return OccupancyProperty(
      propertyId: _toInt(json['PropertyID'] ?? json['propertyId'] ?? json['id']),
      propertyName: _toText(json['PropertyName'] ?? json['propertyName']),
      propertyCode: _toText(json['PropertyCode'] ?? json['propertyCode']),
    );
  }

  String get displayName {
    if (propertyName.trim().isNotEmpty) return propertyName.trim();
    if (propertyCode.trim().isNotEmpty) return propertyCode.trim();
    return 'Property #$propertyId';
  }
}

/// A unit / flat from `getPropertyMaster`, picked *inside* the occupancy
/// form (mirrors the Rental screen's in-form "Unit / Property Master"
/// dropdown). Selecting one supplies `RecordID` for the occupancy payload
/// and auto-fills the (read-only) Tenant Name field.
class OccupancyUnitOption {
  final int recordId;
  final String flatNo;
  final String flatType;
  final String tenantName;

  const OccupancyUnitOption({
    required this.recordId,
    required this.flatNo,
    required this.flatType,
    required this.tenantName,
  });

  factory OccupancyUnitOption.fromJson(Map<String, dynamic> json) {
    return OccupancyUnitOption(
      recordId: _toInt(json['RecordID']),
      flatNo: _toText(json['FlatNo']),
      flatType: _toText(json['FlatType']),
      tenantName: _toText(json['TenantName']),
    );
  }

  String get label {
    final parts = <String>[
      flatNo.trim().isNotEmpty ? flatNo : 'Record #$recordId',
    ];
    if (flatType.trim().isNotEmpty) parts.add(flatType);
    if (tenantName.trim().isNotEmpty) parts.add(tenantName);
    return parts.join(' - ');
  }
}

class OccupancyRecord {
  final int id;
  // PropertyMaster.RecordID — the unit this occupancy record is tied to,
  // chosen inside the form via the Unit / Property Master picker.
  final int recordId;
  final String recordType;
  final String tenantName;
  final String checkInDate;
  final String checkOutDate;
  final String inspectionStatus;
  final String keyHandoverStatus;
  final String accessCardDetails;
  final String notes;

  const OccupancyRecord({
    required this.id,
    required this.recordId,
    required this.recordType,
    required this.tenantName,
    required this.checkInDate,
    required this.checkOutDate,
    required this.inspectionStatus,
    required this.keyHandoverStatus,
    required this.accessCardDetails,
    required this.notes,
  });

  factory OccupancyRecord.fromJson(Map<String, dynamic> json) {
    return OccupancyRecord(
      id: _toInt(json['OccupancyID']),
      recordId: _toInt(json['RecordID'] ?? json['recordId']),
      recordType: _toText(json['RecordType']).isEmpty
          ? 'Occupancy'
          : _toText(json['RecordType']),
      tenantName: _toText(json['TenantName']),
      checkInDate: _dateOnly(json['CheckInDate']),
      checkOutDate: _dateOnly(json['CheckOutDate']),
      inspectionStatus: _toText(json['InspectionStatus']),
      keyHandoverStatus: _toText(json['KeyHandoverStatus']),
      accessCardDetails: _toText(json['AccessCardDetails']),
      notes: _toText(json['Notes']),
    );
  }
}

class OccupancyScreen extends StatelessWidget {
  const OccupancyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: PiColors.background,
      body: OccupancyBody(),
    );
  }
}

class OccupancyBody extends StatefulWidget {
  const OccupancyBody({super.key});

  @override
  State<OccupancyBody> createState() => _OccupancyBodyState();
}

class _OccupancyBodyState extends State<OccupancyBody> {
  List<OccupancyProperty> properties = [];
  List<OccupancyRecord> records = [];
  List<OccupancyUnitOption> occupancyUnits = [];

  OccupancyProperty? selectedProperty;

  bool loadingProperties = false;
  bool loadingRecords = false;
  bool loadingUnits = false;
  bool saving = false;
  bool deleting = false;
  bool showForm = false;

  String errorMessage = '';
  String searchTerm = '';

  String filterType = '';
  String filterInspection = '';
  String filterHandover = '';

  int occupancyId = 0;
  // PropertyMaster.RecordID — the unit selected inside the form via the
  // Unit / Property Master picker.
  int recordId = 0;
  String recordType = 'Occupancy';
  String checkInDate = '';
  String checkOutDate = '';
  String inspectionStatus = '';
  String keyHandoverStatus = '';

  final tenantNameController = TextEditingController();
  final accessCardController = TextEditingController();
  final notesController = TextEditingController();
  final searchController = TextEditingController();

  bool get isEditing => occupancyId > 0;

  @override
  void initState() {
    super.initState();
    loadProperties();
  }

  @override
  void dispose() {
    tenantNameController.dispose();
    accessCardController.dispose();
    notesController.dispose();
    searchController.dispose();
    super.dispose();
  }

  Future<int> _companyId() => SessionStore.getCompanyId();
  Future<int> _userId() => SessionStore.getUserId();

  void _notify(String message, {bool isError = false}) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;

    messenger
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.fixed,
          backgroundColor: isError ? PiColors.red : PiColors.ink,
          duration: const Duration(seconds: 3),
          content: Row(
            children: [
              Icon(
                isError
                    ? Icons.error_outline_rounded
                    : Icons.check_circle_outline_rounded,
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

  Map<String, dynamic> _json(String body) {
    final text = body.trim();
    if (text.isEmpty) throw const FormatException('Empty response from server');

    final decoded = jsonDecode(text);
    if (decoded is! Map) {
      throw FormatException(
        'Unexpected response format from server: ${decoded.runtimeType}',
      );
    }

    return Map<String, dynamic>.from(decoded);
  }

  String _failure(Object e, String action) {
    final text = e.toString();
    if (text.contains('<!DOCTYPE') || text.contains('<html')) {
      return 'Occupancy backend is not available for $action. Check the API route and backend server.';
    }
    if (text.contains('TimeoutException')) {
      return 'Server request timed out. Please try again.';
    }
    return text.startsWith('Exception: ')
        ? text.substring('Exception: '.length)
        : 'Failed to $action: $text';
  }

  List<Map<String, dynamic>> _rows(dynamic value) {
    if (value is! List) return const [];

    return value
        .whereType<Map>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList();
  }

  Future<void> loadProperties() async {
    final companyId = await _companyId();

    if (companyId == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() => loadingProperties = true);

    try {
      final uri = Uri.parse(
        '${ApiConfig.baseUrl}/getPropertyInformation',
      ).replace(
        queryParameters: {'CompanyID': '$companyId'},
      );

      final response = await http.get(uri);
      final data = _json(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          data['message']?.toString() ??
              data['error']?.toString() ??
              'HTTP ${response.statusCode}',
        );
      }

      if (data['success'] == true) {
        final list = _rows(data['data']);
        if (!mounted) return;

        setState(() {
          properties = list
              .map(OccupancyProperty.fromJson)
              .toList();
        });
      } else {
        setState(() => properties = []);
        _notify(
          data['message']?.toString() ?? 'Failed to load properties.',
          isError: true,
        );
      }
    } catch (e) {
      debugPrint('Load property error: $e');
      if (!mounted) return;
      setState(() => properties = []);
      _notify(_failure(e, 'load properties'), isError: true);
    } finally {
      if (mounted) setState(() => loadingProperties = false);
    }
  }

  Future<void> selectProperty(OccupancyProperty property) async {
    FocusScope.of(context).unfocus();

    setState(() {
      selectedProperty = property;
      showForm = false;
      errorMessage = '';
    });

    // Load the occupancy history for the list and the property's units
    // (for the form's unit picker) together, same as the Rental screen.
    await Future.wait([
      loadOccupancy(property.propertyId),
      loadOccupancyUnits(property.propertyId),
    ]);
  }

  void changeProperty() {
    if (saving || deleting) return;

    setState(() {
      selectedProperty = null;
      records = [];
      occupancyUnits = [];
      showForm = false;
      errorMessage = '';
    });
    _clearForm();
  }

  Future<void> loadOccupancy(int propertyId) async {
    final companyId = await _companyId();

    if (companyId == 0 || propertyId == 0) return;

    setState(() {
      loadingRecords = true;
      errorMessage = '';
    });

    try {
      final uri = Uri.parse(
        '${ApiConfig.baseUrl}/getPropertyOccupancy',
      ).replace(
        queryParameters: {
          'PropertyID': '$propertyId',
          'CompanyID': '$companyId',
        },
      );

      final response = await http.get(uri);
      final data = _json(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          data['message']?.toString() ??
              data['error']?.toString() ??
              'HTTP ${response.statusCode}',
        );
      }

      if (data['success'] == true) {
        final list = _rows(data['data']);

        if (!mounted) return;
        setState(() {
          records = list
              .map(OccupancyRecord.fromJson)
              .toList();
        });
      } else {
        _notify(
          data['message']?.toString() ??
              'Failed to load occupancy records.',
          isError: true,
        );
      }
    } catch (e) {
      debugPrint('Load occupancy error: $e');
      if (!mounted) return;
      _notify(_failure(e, 'load occupancy records'), isError: true);
    } finally {
      if (mounted) setState(() => loadingRecords = false);
    }
  }

  /// Loads the property's units from `getPropertyMaster`, used to populate
  /// the in-form "Unit / Property Master" picker — mirrors the Rental
  /// screen's `loadRentalUnits`.
  Future<void> loadOccupancyUnits(int propertyId) async {
    final companyId = await _companyId();

    if (companyId == 0 || propertyId == 0) return;

    setState(() => loadingUnits = true);

    try {
      final uri = Uri.parse(
        '$kAseefaWebUrl/getPropertyMaster',
      ).replace(
        queryParameters: {
          'PropertyID': '$propertyId',
          'CompanyID': '$companyId',
        },
      );

      final response = await http.get(uri);
      debugPrint('Load occupancy units → URL: $uri');
      debugPrint(
        'Load occupancy units → Status: ${response.statusCode}, '
        'Body (first 300 chars): '
        '${response.body.substring(0, response.body.length > 300 ? 300 : response.body.length)}',
      );

      final data = _json(response.body);

      if (data['success'] == true) {
        final list = _rows(data['data']);
        if (!mounted) return;

        setState(() {
          occupancyUnits = list.map(OccupancyUnitOption.fromJson).toList();
        });
      } else {
        if (!mounted) return;
        setState(() => occupancyUnits = []);
        debugPrint('Load occupancy units → server said: ${data['message']}');
      }
    } catch (e) {
      debugPrint('Load units error: $e');
      if (mounted) setState(() => occupancyUnits = []);
    } finally {
      if (mounted) setState(() => loadingUnits = false);
    }
  }

  OccupancyUnitOption? _findUnit(int id) {
    if (id == 0) return null;
    for (final u in occupancyUnits) {
      if (u.recordId == id) return u;
    }
    return null;
  }

  /// Called when the user picks a unit from the "Unit / Property Master"
  /// bottom sheet — stores its RecordID and, for Occupancy records,
  /// mirrors its tenant name into the (read-only) Tenant Name field.
  void selectOccupancyUnit(OccupancyUnitOption unit) {
    setState(() {
      recordId = unit.recordId;
      if (recordType == 'Occupancy') {
        tenantNameController.text = unit.tenantName;
      }
    });
  }

  void _clearForm() {
    occupancyId = 0;
    recordId = 0;
    recordType = 'Occupancy';
    checkInDate = '';
    checkOutDate = '';
    inspectionStatus = '';
    keyHandoverStatus = '';
    tenantNameController.clear();
    accessCardController.clear();
    notesController.clear();
  }

  void openCreate() {
    FocusScope.of(context).unfocus();
    _clearForm();

    setState(() {
      showForm = true;
      errorMessage = '';
    });
  }

  void openEdit(OccupancyRecord record) {
    FocusScope.of(context).unfocus();

    occupancyId = record.id;
    recordId = record.recordId;
    recordType = record.recordType;
    checkInDate = record.checkInDate;
    checkOutDate = record.checkOutDate;
    inspectionStatus = record.inspectionStatus;
    keyHandoverStatus = record.keyHandoverStatus;
    tenantNameController.text = record.tenantName;
    accessCardController.text = record.accessCardDetails;
    notesController.text = record.notes;

    setState(() {
      showForm = true;
      errorMessage = '';
    });
  }

  void backToList() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();

    setState(() {
      showForm = false;
      errorMessage = '';
    });
    _clearForm();
  }

  Future<void> handleSave() async {
    if (saving || deleting) return;

    FocusScope.of(context).unfocus();

    final companyId = await _companyId();
    final userId = await _userId();
    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyId == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    if (userId == 0) {
      _notify('UserID not found. Please login again.', isError: true);
      return;
    }

    if (propertyId == 0) {
      _notify('Please select a property.', isError: true);
      return;
    }

    final validation = _validate();
    if (validation != null) {
      _notify(validation, isError: true);
      return;
    }

    setState(() => saving = true);

    try {
      final payload = {
        'OccupancyID': occupancyId,
        // PropertyMaster.RecordID — the unit chosen inside the form
        'RecordID': recordId,
        'PropertyID': propertyId,
        'CompanyID': companyId,
        'RecordType': recordType,
        'TenantName':
            recordType == 'Occupancy' ? tenantNameController.text.trim() : '',
        'CheckInDate': checkInDate.isEmpty ? null : checkInDate,
        'CheckOutDate': checkOutDate.isEmpty ? null : checkOutDate,
        'InspectionStatus':
            inspectionStatus.isEmpty ? null : inspectionStatus,
        'KeyHandoverStatus':
            keyHandoverStatus.isEmpty ? null : keyHandoverStatus,
        'AccessCardDetails': _nullable(accessCardController.text),
        'Notes': _nullable(notesController.text),
        'CreatedBy': occupancyId > 0 ? null : userId,
        'ModifiedBy': userId,
        'Action': occupancyId > 0 ? 'UPDATE' : 'INSERT',
      };

      // final response = await http.post(
      //   Uri.parse('${ApiConfig.baseUrl}/insertUpdatePropertyOccupancy'),
      //   headers: {'Content-Type': 'application/json'},
      //   body: jsonEncode(payload),
      // );

      // final data = _json(response.body);
            final url = Uri.parse('$kAseefaWebUrl/insertUpdatePropertyOccupancy');
      debugPrint('Saving Occupancy → URL: $url');
      debugPrint('Saving Occupancy → Payload: $payload');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      debugPrint('Save occupancy → Status: ${response.statusCode}');
      debugPrint(
        'Save occupancy → Body (first 500 chars): '
        '${response.body.substring(0, response.body.length > 500 ? 500 : response.body.length)}',
      );

      final data = _json(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          data['message']?.toString() ??
              data['error']?.toString() ??
              'HTTP ${response.statusCode}',
        );
      }

      if (data['success'] != true) {
        throw Exception(
          data['message']?.toString() ??
              'Unable to save occupancy record.',
        );
      }

      await loadOccupancy(propertyId);

      if (!mounted) return;
      setState(() => showForm = false);
      _clearForm();

      _notify(
        data['message']?.toString() ??
            (isEditing
                ? 'Occupancy record updated successfully.'
                : 'Occupancy record saved successfully.'),
      );
    } catch (e) {
      debugPrint('Save occupancy error: $e');
      _notify(_failure(e, 'save occupancy record'), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> handleDelete(OccupancyRecord record) async {
    if (deleting || saving || record.id == 0) return;

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => _DeleteSheet(
        label: record.tenantName.isEmpty
            ? 'this occupancy record'
            : record.tenantName,
      ),
    );

    if (confirmed != true) return;

    final companyId = await _companyId();
    final userId = await _userId();
    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyId == 0 || userId == 0) {
      _notify('Session expired. Please login again.', isError: true);
      return;
    }

    if (propertyId == 0) {
      _notify('Property not selected.', isError: true);
      return;
    }

    setState(() => deleting = true);

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/deletePropertyOccupancy'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'OccupancyID': record.id,
          'PropertyID': propertyId,
          'CompanyID': companyId,
          'ModifiedBy': userId,
        }),
      );
      final data = _json(response.body);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          data['message']?.toString() ??
              data['error']?.toString() ??
              'HTTP ${response.statusCode}',
        );
      }

      if (data['success'] != true) {
        throw Exception(
          data['message']?.toString() ??
              'Unable to delete occupancy record.',
        );
      }

      await loadOccupancy(propertyId);

      if (!mounted) return;
      _notify(
        data['message']?.toString() ??
            'Occupancy record deleted successfully.',
      );
    } catch (e) {
      debugPrint('Delete occupancy error: $e');
      _notify(_failure(e, 'delete occupancy record'), isError: true);
    } finally {
      if (mounted) setState(() => deleting = false);
    }
  }

  String? _validate() {
    if (recordId == 0) {
      return 'Please select a unit.';
    }

    if (recordType == 'Occupancy' &&
        tenantNameController.text.trim().isEmpty) {
      return 'Please enter tenant name.';
    }

    if (checkInDate.isEmpty) {
      return 'Please select check-in date.';
    }

    if (checkOutDate.isNotEmpty &&
        DateTime.tryParse(checkOutDate) != null &&
        DateTime.tryParse(checkInDate) != null &&
        DateTime.parse(checkOutDate).isBefore(DateTime.parse(checkInDate))) {
      return 'Check-out date cannot be before check-in date.';
    }

    return null;
  }

  List<OccupancyRecord> get filteredRecords {
    final term = searchTerm.trim().toLowerCase();

    final result = records.where((r) {
      if (filterType.isNotEmpty && r.recordType != filterType) return false;
      if (filterInspection.isNotEmpty &&
          r.inspectionStatus != filterInspection) {
        return false;
      }
      if (filterHandover.isNotEmpty &&
          r.keyHandoverStatus != filterHandover) {
        return false;
      }

      if (term.isEmpty) return true;

      return [
        r.tenantName,
        r.recordType,
        r.accessCardDetails,
      ].any((v) => v.toLowerCase().contains(term));
    }).toList();

    result.sort((a, b) => b.checkInDate.compareTo(a.checkInDate));
    return result;
  }

  OccupancyRecord? get currentTenant {
    for (final r in records) {
      if (r.recordType == 'Occupancy' && r.checkOutDate.isEmpty) {
        return r;
      }
    }
    return null;
  }

  int get activeFilterCount =>
      [filterType, filterInspection, filterHandover]
          .where((e) => e.isNotEmpty)
          .length;



  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(begin: const Offset(0, .03), end: Offset.zero)
              .animate(animation),
          child: child,
        ),
      ),
      child: showForm
          ? _buildForm(key: const ValueKey('form'))
          : selectedProperty == null
              ? _buildPropertyList(key: const ValueKey('list'))
              : _buildSummary(key: const ValueKey('summary')),
    );
  }


  Widget _buildPropertyList({Key? key}) {
    final term = searchTerm.trim().toLowerCase();
    final list = properties.where((p) {
      if (term.isEmpty) return true;
      return p.propertyName.toLowerCase().contains(term) ||
          p.propertyCode.toLowerCase().contains(term);
    }).toList();

    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: SafeArea(
        top: true,
        child: Column(
          children: [
            _propertyListHeader(list.length),
            Expanded(
              child: RefreshIndicator(
                color: PiColors.primary,
                onRefresh: loadProperties,
                child: loadingProperties
                    ? _loadingListPlaceholder()
                    : list.isEmpty
                        ? _propertyEmptyState()
                        : ListView.separated(
                            physics: const AlwaysScrollableScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                            itemCount: list.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, i) => _propertyCard(list[i]),
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _propertyListHeader(int visibleCount) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Occupancy Management', style: PiText.pageTitle),
          const SizedBox(height: 2),
          Text(
            loadingProperties
                ? 'Loading properties…'
                : 'Select a property to view its occupancy',
            style: PiText.pageSubtitle,
          ),
          const SizedBox(height: 14),
          _searchField(),
        ],
      ),
    );
  }

  Widget _searchField() {
    return TextField(
      controller: searchController,
      onChanged: (v) => setState(() => searchTerm = v),
      style: const TextStyle(fontSize: 13, color: PiColors.ink),
      decoration: InputDecoration(
        hintText: 'Search property...',
        prefixIcon: const Icon(Icons.search_rounded, color: PiColors.primary),
        suffixIcon: searchTerm.isEmpty
            ? null
            : IconButton(
                onPressed: () {
                  searchController.clear();
                  setState(() => searchTerm = '');
                },
                icon: const Icon(Icons.close_rounded),
              ),
        filled: true,
        fillColor: PiColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PiRadius.field),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PiRadius.field),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PiRadius.field),
          borderSide: const BorderSide(color: PiColors.primary, width: 1.3),
        ),
      ),
    );
  }

  Widget _propertyCard(OccupancyProperty property) {
    return Material(
      color: PiColors.surface,
      borderRadius: BorderRadius.circular(PiRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(PiRadius.card),
        onTap: () => selectProperty(property),
        child: Container(
          padding: const EdgeInsets.all(PiSpace.md),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(PiRadius.card),
            border: Border.all(color: PiColors.hairline),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: PiColors.primarySoft,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: const Icon(
                  Icons.home_work_rounded,
                  color: PiColors.primary,
                ),
              ),
              const SizedBox(width: PiSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      property.displayName,
                      style: PiText.sectionTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      property.propertyCode.isEmpty
                          ? 'Property #${property.propertyId}'
                          : property.propertyCode,
                      style: PiText.sectionSubtitle,
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: PiColors.primary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _loadingListPlaceholder() {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => Container(
        height: 76,
        decoration: BoxDecoration(
          color: PiColors.surface,
          borderRadius: BorderRadius.circular(PiRadius.card),
          border: Border.all(color: PiColors.hairline),
        ),
      ),
    );
  }

  Widget _propertyEmptyState() {
    final searching = searchTerm.trim().isNotEmpty;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(
          searching ? Icons.search_off_rounded : Icons.home_work_outlined,
          size: 52,
          color: PiColors.primarySoft,
        ),
        const SizedBox(height: PiSpace.lg),
        Text(
          searching ? 'No properties match' : 'No properties found',
          textAlign: TextAlign.center,
          style: PiText.sectionTitle,
        ),
        const SizedBox(height: 6),
        Text(
          searching
              ? 'Try a different search term.'
              : 'No properties are available for this company.',
          textAlign: TextAlign.center,
          style: PiText.sectionSubtitle,
        ),
      ],
    );
  }

 

  Widget _buildSummary({Key? key}) {
    final tenant = currentTenant;

    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: SafeArea(
        top: true,
        child: Column(
          children: [
            _summaryHeader(),
            Expanded(
              child: loadingRecords
                  ? Center(child: _loadingCard('Loading occupancy records...'))
                  : RefreshIndicator(
                      color: PiColors.primary,
                      onRefresh: () =>
                          loadOccupancy(selectedProperty!.propertyId),
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                        children: [
                          if (errorMessage.isNotEmpty) ...[
                            _buildErrorCard(),
                            const SizedBox(height: PiSpace.md),
                          ],
                          if (tenant != null)
                            _currentTenantCard(tenant)
                          else
                            _vacantCard(),
                          const SizedBox(height: PiSpace.lg),
                          _toolbar(),
                          const SizedBox(height: PiSpace.md),
                          _recordsList(),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 10, 16, 14),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: changeProperty,
            icon: const Icon(Icons.arrow_back_rounded, color: PiColors.ink),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Occupancy Management',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: PiColors.ink,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  selectedProperty?.displayName ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: PiText.pageSubtitle,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _currentTenantCard(OccupancyRecord r) {
    return Container(
      padding: const EdgeInsets.all(PiSpace.lg),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [PiColors.primary, PiColors.primaryDark],
        ),
        borderRadius: BorderRadius.circular(PiRadius.card),
      ),
      child: Wrap(
        spacing: 24,
        runSpacing: 16,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.person_rounded,
              color: Colors.white,
              size: 25,
            ),
          ),
          SizedBox(
            width: 240,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CURRENT TENANT',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  r.tenantName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  'Since ${r.checkInDate} • ${_dayDiff(r.checkInDate, r.checkOutDate)}',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          _whiteStat('Inspection', r.inspectionStatus),
          _whiteStat('Key Handover', r.keyHandoverStatus),
          _whiteStat('Access Card', r.accessCardDetails.isEmpty ? '—' : r.accessCardDetails),
        ],
      ),
    );
  }

  Widget _whiteStat(String label, String value) {
    return SizedBox(
      width: 120,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(color: Colors.white60, fontSize: 9),
          ),
          const SizedBox(height: 3),
          Text(
            value.isEmpty ? '—' : value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _vacantCard() {
    return Container(
      padding: const EdgeInsets.all(PiSpace.lg),
      decoration: BoxDecoration(
        color: PiColors.slateSoft,
        borderRadius: BorderRadius.circular(PiRadius.card),
      ),
      child: const Row(
        children: [
          Icon(Icons.house_outlined, color: PiColors.slate, size: 28),
          SizedBox(width: PiSpace.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Currently Vacant',
                  style: TextStyle(
                    color: PiColors.slate,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'No active tenant on record for this property.',
                  style: TextStyle(color: PiColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _toolbar() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          onChanged: (v) => setState(() => searchTerm = v),
          style: const TextStyle(fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Search tenant, access card...',
            prefixIcon: const Icon(Icons.search_rounded, size: 19),
            filled: true,
            fillColor: PiColors.primarySoft,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(PiRadius.field),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: PiSpace.sm),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _showFilters,
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.filter_alt_outlined, size: 18),
                    if (activeFilterCount > 0)
                      Positioned(
                        right: -7,
                        top: -7,
                        child: Container(
                          width: 16,
                          height: 16,
                          decoration: const BoxDecoration(
                            color: PiColors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '$activeFilterCount',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                label: const Text('Filters'),
              ),
            ),
            const SizedBox(width: PiSpace.sm),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: openCreate,
                icon: const Icon(Icons.add_rounded, size: 19),
                label: const Text(
                  'Add Record',
                  style: TextStyle(fontWeight: FontWeight.w800),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: PiColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(PiRadius.button),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _recordsList() {
    final list = filteredRecords;

    if (list.isEmpty) {
      return _emptyCard(
        Icons.history_rounded,
        'No occupancy records found',
        'Try adjusting your search or filters, or add a new record.',
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(color: PiColors.hairline),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: list.length,
        separatorBuilder: (_, __) =>
            const Divider(height: 1, color: PiColors.hairline),
        itemBuilder: (_, index) {
          final r = list[index];

          return InkWell(
            onTap: () => openEdit(r),
            child: Padding(
              padding: const EdgeInsets.all(PiSpace.md),
              child: Row(
                children: [
                  _typeBadge(r.recordType),
                  const SizedBox(width: PiSpace.md),
                  Expanded(
                    flex: 2,
                    child: _recordText(
                      r.tenantName.isEmpty ? 'Vacant' : r.tenantName,
                      r.checkInDate.isEmpty
                          ? 'No check-in date'
                          : 'Check-in: ${r.checkInDate}',
                    ),
                  ),
                  if (MediaQuery.sizeOf(context).width > 700)
                    Expanded(
                      child: _recordText(
                        'Check-out',
                        r.checkOutDate.isEmpty ? '—' : r.checkOutDate,
                      ),
                    ),
                  if (MediaQuery.sizeOf(context).width > 850)
                    Expanded(
                      child: _recordText(
                        'Duration',
                        _dayDiff(r.checkInDate, r.checkOutDate),
                      ),
                    ),
                  if (MediaQuery.sizeOf(context).width > 700)
                    _statusBadge(
                      r.inspectionStatus.isEmpty
                          ? '—'
                          : r.inspectionStatus,
                      _inspectionColor(r.inspectionStatus),
                    ),
                  const SizedBox(width: PiSpace.sm),
                  if (MediaQuery.sizeOf(context).width > 900)
                    _statusBadge(
                      r.keyHandoverStatus.isEmpty
                          ? '—'
                          : r.keyHandoverStatus,
                      _handoverColor(r.keyHandoverStatus),
                    ),
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: PiColors.muted,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _recordText(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: PiText.label),
          const SizedBox(height: 3),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: PiColors.ink,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _typeBadge(String value) {
    final occupancy = value == 'Occupancy';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: occupancy ? PiColors.primarySoft : PiColors.slateSoft,
        borderRadius: BorderRadius.circular(PiRadius.badge),
      ),
      child: Text(
        value,
        style: TextStyle(
          color: occupancy ? PiColors.primary : PiColors.slate,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  Widget _statusBadge(String value, _StatusColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: colors.soft,
        borderRadius: BorderRadius.circular(PiRadius.badge),
      ),
      child: Text(
        value,
        style: TextStyle(
          color: colors.main,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  _StatusColors _inspectionColor(String status) {
    switch (status) {
      case 'Completed':
        return const _StatusColors(PiColors.green, PiColors.greenSoft);
      case 'Scheduled':
        return const _StatusColors(PiColors.blue, PiColors.blueSoft);
      case 'Pending':
        return const _StatusColors(PiColors.amber, PiColors.amberSoft);
      case 'Failed':
        return const _StatusColors(PiColors.red, PiColors.redSoft);
      default:
        return const _StatusColors(PiColors.muted, PiColors.slateSoft);
    }
  }

  _StatusColors _handoverColor(String status) {
    switch (status) {
      case 'Handed Over':
        return const _StatusColors(PiColors.green, PiColors.greenSoft);
      case 'Returned':
        return const _StatusColors(PiColors.blue, PiColors.blueSoft);
      case 'Pending':
        return const _StatusColors(PiColors.amber, PiColors.amberSoft);
      default:
        return const _StatusColors(PiColors.muted, PiColors.slateSoft);
    }
  }

  Future<void> _showFilters() async {
    var tempType = filterType;
    var tempInspection = filterInspection;
    var tempHandover = filterHandover;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: PiSpace.lg,
                right: PiSpace.lg,
                top: PiSpace.lg,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + PiSpace.lg,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Filter Occupancy Records',
                          style: PiText.sectionTitle,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: PiSpace.md),
                  _modalPicker(
                    'Record Type',
                    tempType,
                    [''] + kOccupancyRecordTypes,
                    (v) => setModalState(() => tempType = v),
                  ),
                  const SizedBox(height: PiSpace.md),
                  _modalPicker(
                    'Inspection Status',
                    tempInspection,
                    [''] + kInspectionStatuses,
                    (v) => setModalState(() => tempInspection = v),
                  ),
                  const SizedBox(height: PiSpace.md),
                  _modalPicker(
                    'Key Handover Status',
                    tempHandover,
                    [''] + kKeyHandoverStatuses,
                    (v) => setModalState(() => tempHandover = v),
                  ),
                  const SizedBox(height: PiSpace.lg),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setModalState(() {
                              tempType = '';
                              tempInspection = '';
                              tempHandover = '';
                            });
                          },
                          child: const Text('Clear All'),
                        ),
                      ),
                      const SizedBox(width: PiSpace.sm),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              filterType = tempType;
                              filterInspection = tempInspection;
                              filterHandover = tempHandover;
                            });
                            Navigator.pop(ctx);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: PiColors.primary,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Apply Filters'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _modalPicker(
    String label,
    String value,
    List<String> options,
    ValueChanged<String> onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: PiText.label),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          decoration: _inputDecoration('All'),
          items: options
              .map(
                (v) => DropdownMenuItem(
                  value: v,
                  child: Text(v.isEmpty ? 'All' : v),
                ),
              )
              .toList(),
          onChanged: (v) => onChanged(v ?? ''),
        ),
      ],
    );
  }

  /// Bottom sheet for the in-form "Unit / Property Master" picker —
  /// mirrors the Rental screen's `_showUnitPicker`.
  Future<void> _showUnitPicker() async {
    if (saving || deleting || loadingUnits) return;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 4),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: PiColors.hairline,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(20, 14, 20, 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Select a unit',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: PiColors.ink,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: occupancyUnits.isEmpty
                    ? const Padding(
                        padding:
                            EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                        child: Text(
                          'No units found for this property. Add a flat in Property Master first.',
                          style: TextStyle(fontSize: 13, color: PiColors.muted),
                        ),
                      )
                    : ListView(
                        shrinkWrap: true,
                        padding: const EdgeInsets.only(bottom: 8),
                        children: occupancyUnits
                            .map(
                              (u) => ListTile(
                                onTap: () {
                                  Navigator.pop(ctx);
                                  selectOccupancyUnit(u);
                                },
                                title: Text(
                                  u.label,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: u.recordId == recordId
                                        ? PiColors.primary
                                        : PiColors.ink,
                                    fontWeight: u.recordId == recordId
                                        ? FontWeight.w700
                                        : FontWeight.w500,
                                  ),
                                ),
                                trailing: u.recordId == recordId
                                    ? const Icon(Icons.check_rounded,
                                        color: PiColors.primary, size: 20)
                                    : null,
                              ),
                            )
                            .toList(),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }



  Widget _buildForm({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: Column(
        children: [
          _formHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (errorMessage.isNotEmpty) ...[
                    _buildErrorCard(),
                    const SizedBox(height: PiSpace.md),
                  ],
                  _formSection(
                    icon: Icons.person_outline_rounded,
                    title: 'Tenancy Details',
                    subtitle:
                        'Which unit this covers and who occupied it (or the vacancy period) and for how long',
                    children: [
                      _responsiveFields([
                        _unitPickerField(
                          label: 'Unit / Property Master',
                          value: _findUnit(recordId)?.label ?? '',
                          placeholder: loadingUnits
                              ? 'Loading units…'
                              : 'Select a unit',
                          onTap: _showUnitPicker,
                          // Once created, the record stays tied to the
                          // unit it was created for, same as Rental.
                          disabled: isEditing,
                        ),
                        _pickerField(
                          'Record Type',
                          recordType,
                          kOccupancyRecordTypes,
                          (v) => setState(() {
                            recordType = v;
                            if (v == 'Vacancy') {
                              tenantNameController.clear();
                            } else {
                              final unit = _findUnit(recordId);
                              if (unit != null) {
                                tenantNameController.text = unit.tenantName;
                              }
                            }
                          }),
                        ),
                        if (recordType == 'Occupancy')
                          _field(
                            'Tenant Name',
                            tenantNameController,
                            placeholder: 'Comes from selected unit',
                            forceDisabled: true,
                          ),
                        _dateField(
                          'Check-in Date',
                          checkInDate,
                          (v) => setState(() => checkInDate = v),
                        ),
                        _dateField(
                          'Check-out Date',
                          checkOutDate,
                          (v) => setState(() => checkOutDate = v),
                        ),
                      ]),
                      if (checkOutDate.isEmpty)
                        const Text(
                          'Leave check-out date blank if the occupancy is still ongoing.',
                          style: PiText.hint,
                        ),
                    ],
                  ),
                  const SizedBox(height: PiSpace.lg),
                  _formSection(
                    icon: Icons.fact_check_outlined,
                    title: 'Inspection & Key Handover',
                    subtitle:
                        'Move-in / move-out inspection outcome and access handover',
                    children: [
                      _responsiveFields([
                        _pickerField(
                          'Inspection Status',
                          inspectionStatus,
                          kInspectionStatuses,
                          (v) => setState(() => inspectionStatus = v),
                          placeholder: 'Select status',
                        ),
                        _pickerField(
                          'Key Handover Status',
                          keyHandoverStatus,
                          kKeyHandoverStatuses,
                          (v) => setState(() => keyHandoverStatus = v),
                          placeholder: 'Select status',
                        ),
                      ]),
                      _field(
                        'Access Card Details',
                        accessCardController,
                        placeholder: 'e.g. Card #A-4471, 2 fobs issued',
                      ),
                    ],
                  ),
                  const SizedBox(height: PiSpace.lg),
                  _formSection(
                    icon: Icons.notes_rounded,
                    title: 'Notes',
                    subtitle: 'Any additional context for this record',
                    children: [
                      _field(
                        'Notes',
                        notesController,
                        placeholder:
                            'e.g. Move-in inspection passed with no defects noted.',
                        maxLines: 5,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          _formFooter(),
        ],
      ),
    );
  }

  Widget _formHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 10, 16, 14),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: saving || deleting ? null : backToList,
            icon: const Icon(Icons.arrow_back_rounded, color: PiColors.ink),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEditing ? 'Edit Occupancy Record' : 'Add Occupancy Record',
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: PiColors.ink,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  selectedProperty?.displayName ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: PiText.pageSubtitle,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _responsiveFields(List<Widget> fields) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final twoColumns = constraints.maxWidth >= 650;

        if (!twoColumns) {
          return Column(
            children: [
              for (int i = 0; i < fields.length; i++) ...[
                fields[i],
                if (i != fields.length - 1) const SizedBox(height: 14),
              ],
            ],
          );
        }

        return Wrap(
          spacing: PiSpace.md,
          runSpacing: 14,
          children: fields
              .map(
                (field) => SizedBox(
                  width: (constraints.maxWidth - PiSpace.md) / 2,
                  child: field,
                ),
              )
              .toList(),
        );
      },
    );
  }

  Widget _formSection({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(PiSpace.lg),
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(color: PiColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: PiColors.primarySoft,
                  borderRadius: BorderRadius.circular(PiRadius.badge),
                ),
                child: Icon(icon, color: PiColors.primary, size: 19),
              ),
              const SizedBox(width: PiSpace.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: PiText.sectionTitle),
                    Text(subtitle, style: PiText.sectionSubtitle),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: PiSpace.lg),
          ...children,
        ],
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController controller, {
    String? placeholder,
    int maxLines = 1,
    // When true, the field is always disabled regardless of saving/
    // deleting — used for the read-only Tenant Name field, which mirrors
    // whichever unit is selected above.
    bool forceDisabled = false,
  }) {
    final disabled = saving || deleting || forceDisabled;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          enabled: !disabled,
          maxLines: maxLines,
          style: const TextStyle(fontSize: 13.5, color: PiColors.ink),
          decoration: _inputDecoration(placeholder),
        ),
      ],
    );
  }

  Widget _pickerField(
    String label,
    String value,
    List<String> options,
    ValueChanged<String> onChanged, {
    String placeholder = 'Select',
  }) {
    final disabled = saving || deleting;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value.isEmpty ? null : value,
          isExpanded: true,
          decoration: _inputDecoration(placeholder),
          items: options
              .map(
                (v) => DropdownMenuItem(
                  value: v,
                  child: Text(v),
                ),
              )
              .toList(),
          onChanged: disabled ? null : (v) => onChanged(v ?? ''),
        ),
      ],
    );
  }

  /// Tappable field that opens the "Unit / Property Master" bottom sheet —
  /// mirrors the Rental screen's unit picker field.
  Widget _unitPickerField({
    required String label,
    required String value,
    required String placeholder,
    required VoidCallback onTap,
    bool disabled = false,
  }) {
    final isDisabled = disabled || saving || deleting || loadingUnits;
    final hasValue = value.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        const SizedBox(height: 6),
        InkWell(
          onTap: isDisabled ? null : onTap,
          borderRadius: BorderRadius.circular(PiRadius.field),
          child: InputDecorator(
            decoration: _inputDecoration(placeholder),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    hasValue ? value : placeholder,
                    style: TextStyle(
                      fontSize: 13.5,
                      color: hasValue ? PiColors.ink : PiColors.muted,
                      fontWeight:
                          hasValue ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
                const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: PiColors.muted,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _dateField(
    String label,
    String value,
    ValueChanged<String> onChanged,
  ) {
    final disabled = saving || deleting;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        const SizedBox(height: 6),
        InkWell(
          onTap: disabled
              ? null
              : () async {
                  DateTime initial = DateTime.now();

                  if (value.isNotEmpty) {
                    initial = DateTime.tryParse(value) ?? initial;
                  }

                  final picked = await showDatePicker(
                    context: context,
                    initialDate: initial,
                    firstDate: DateTime(2000),
                    lastDate: DateTime(2100),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: Theme.of(context).colorScheme.copyWith(
                                primary: PiColors.primary,
                              ),
                        ),
                        child: child!,
                      );
                    },
                  );

                  if (picked != null) {
                    final date =
                        '${picked.year.toString().padLeft(4, '0')}-'
                        '${picked.month.toString().padLeft(2, '0')}-'
                        '${picked.day.toString().padLeft(2, '0')}';
                    onChanged(date);
                  }
                },
          child: InputDecorator(
            decoration: _inputDecoration('Select date'),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value.isEmpty ? 'Select date' : value,
                    style: TextStyle(
                      fontSize: 13.5,
                      color:
                          value.isEmpty ? PiColors.muted : PiColors.ink,
                      fontWeight: value.isEmpty
                          ? FontWeight.w400
                          : FontWeight.w600,
                    ),
                  ),
                ),
                const Icon(
                  Icons.calendar_today_outlined,
                  color: PiColors.muted,
                  size: 18,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String? hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        fontSize: 13,
        color: PiColors.muted,
      ),
      filled: true,
      fillColor: PiColors.background,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 13,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(PiRadius.field),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(PiRadius.field),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(PiRadius.field),
        borderSide: const BorderSide(
          color: PiColors.primary,
          width: 1.3,
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Text(text.toUpperCase(), style: PiText.label);
  }

  Widget _formFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(top: BorderSide(color: PiColors.hairline)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: saving || deleting ? null : handleSave,
              icon: saving
                  ? const SizedBox(
                      width: 17,
                      height: 17,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check_circle_outline_rounded, size: 19),
              label: Text(
                saving
                    ? 'Saving...'
                    : isEditing
                        ? 'Update Record'
                        : 'Save Record',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: PiColors.primary,
                foregroundColor: Colors.white,
                disabledBackgroundColor: PiColors.primarySoft,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(PiRadius.button),
                ),
              ),
            ),
          ),
          if (isEditing) ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: saving || deleting
                    ? null
                    : () {
                        final record = records.firstWhere(
                          (r) => r.id == occupancyId,
                          orElse: () => OccupancyRecord(
                            id: occupancyId,
                            recordId: recordId,
                            recordType: recordType,
                            tenantName: tenantNameController.text,
                            checkInDate: checkInDate,
                            checkOutDate: checkOutDate,
                            inspectionStatus: inspectionStatus,
                            keyHandoverStatus: keyHandoverStatus,
                            accessCardDetails: accessCardController.text,
                            notes: notesController.text,
                          ),
                        );
                        handleDelete(record);
                      },
                icon: deleting
                    ? const SizedBox(
                        width: 17,
                        height: 17,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.delete_outline_rounded,
                        size: 18, color: PiColors.red),
                label: Text(
                  deleting ? 'Deleting...' : 'Delete this record',
                  style: const TextStyle(
                    color: PiColors.red,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      padding: const EdgeInsets.all(PiSpace.md),
      decoration: BoxDecoration(
        color: PiColors.redSoft,
        borderRadius: BorderRadius.circular(PiRadius.button),
        border: Border.all(color: const Color(0xFFF5B8B8)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: PiColors.red, size: 19),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              errorMessage,
              style: const TextStyle(
                color: PiColors.red,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _loadingCard(String text) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(color: PiColors.hairline),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
            strokeWidth: 2.5,
            color: PiColors.primary,
          ),
          const SizedBox(height: PiSpace.md),
          Text(text, style: PiText.sectionSubtitle),
        ],
      ),
    );
  }

  Widget _emptyCard(IconData icon, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(45),
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(color: PiColors.hairline),
      ),
      child: Column(
        children: [
          Icon(icon, color: PiColors.primarySoft, size: 42),
          const SizedBox(height: PiSpace.sm),
          Text(title, style: PiText.sectionTitle),
          const SizedBox(height: 4),
          Text(subtitle, style: PiText.sectionSubtitle),
        ],
      ),
    );
  }
}

class _StatusColors {
  final Color main;
  final Color soft;

  const _StatusColors(this.main, this.soft);
}

class _DeleteSheet extends StatelessWidget {
  final String label;

  const _DeleteSheet({required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(PiSpace.lg),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: PiColors.redSoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.delete_outline_rounded,
                color: PiColors.red,
              ),
            ),
            const SizedBox(height: PiSpace.md),
            const Text(
              'Delete Occupancy Record?',
              style: PiText.sectionTitle,
            ),
            const SizedBox(height: 6),
            Text(
              'Are you sure you want to delete $label? This action cannot be undone.',
              textAlign: TextAlign.center,
              style: PiText.sectionSubtitle,
            ),
            const SizedBox(height: PiSpace.lg),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: PiSpace.sm),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PiColors.red,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Delete'),
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

String _toText(dynamic value) => value?.toString() ?? '';

int _toInt(dynamic value) {
  if (value is int) return value;
  if (value is double) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

String _dateOnly(dynamic value) {
  if (value == null) return '';
  final text = value.toString();
  if (text.isEmpty) return '';
  return text.length >= 10 ? text.substring(0, 10) : text;
}

String? _nullable(String value) {
  final text = value.trim();
  return text.isEmpty ? null : text;
}

String _dayDiff(String start, String end) {
  if (start.isEmpty) return '—';

  final s = DateTime.tryParse(start);
  if (s == null) return '—';

  final e = end.isEmpty ? DateTime.now() : DateTime.tryParse(end);
  if (e == null) return '—';

  final days = e.difference(s).inDays.clamp(0, 999999);

  if (days < 30) {
    return '$days ${days == 1 ? 'day' : 'days'}';
  }

  if (days < 365) {
    return '${(days / 30).round()} mo';
  }

  return '${(days / 365).toStringAsFixed(1)} yr';
}