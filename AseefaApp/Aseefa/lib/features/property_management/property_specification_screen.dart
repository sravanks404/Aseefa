import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:http/http.dart' as http;

import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

class PsColors {
  static const Color primary = Color.fromARGB(255, 35, 0, 196);
  static const Color primaryDark = Color(0xFF17008C);
  static const Color primaryMid = Color(0xFF6F7FDB); // primaryLight
  static const Color primarySoft = Color(0xFFEDEBFB);
  static const Color primaryTint = Color(0xFFDAD5F6);
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

class PsSpace {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
}

class PsRadius {
  static const double card = 16;
  static const double button = 12;
  static const double field = 12;
  static const double badge = 10;
}

class PsText {
  static const screenTitle = TextStyle(
      fontSize: 22, fontWeight: FontWeight.w800, color: PsColors.ink, height: 1.15);
  static const screenSubtitle =
      TextStyle(fontSize: 13, color: PsColors.muted, fontWeight: FontWeight.w500);
  static const sectionTitle = TextStyle(
      fontSize: 15, fontWeight: FontWeight.w700, color: PsColors.primaryDark);
  static const sectionSubtitle = TextStyle(fontSize: 12, color: PsColors.muted);
  static const cardTitle =
      TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: PsColors.ink);
  static const cardMeta =
      TextStyle(fontSize: 12, color: PsColors.muted, fontWeight: FontWeight.w500);
  static const label = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: .3,
      color: PsColors.primaryMid);
}

// ============================================================
// CONSTANTS
// ============================================================

const List<String> kSpecUnitTypes = [
  'Studio',
  '1 BHK',
  '2 BHK',
  '3 BHK',
  'Penthouse',
  'Villa',
  'Commercial',
  'Warehouse',
  'Office',
];

const List<String> kSpecPropertyCategories = ['Residential', 'Commercial'];

const List<String> kAreaUnits = ['sq.ft.', 'sq.m.'];
const List<String> kKitchenTypes = ['Open', 'Closed'];
const List<String> kFurnishingStatuses = [
  'Fully Furnished',
  'Semi Furnished',
  'Unfurnished',
];
const List<String> kAcTypes = [
  'Central AC',
  'Split AC',
  'Window AC',
  'Ducted AC',
  'None',
];
const List<String> kYesNo = ['Yes', 'No'];

class SpecUnitTypeMeta {
  final IconData icon;
  final Color color;
  const SpecUnitTypeMeta(this.icon, this.color);
}

const Map<String, SpecUnitTypeMeta> kSpecUnitTypeMeta = {
  'Studio': SpecUnitTypeMeta(Icons.bed_outlined, PsColors.primaryMid),
  '1 BHK': SpecUnitTypeMeta(Icons.bed_outlined, PsColors.primary),
  '2 BHK': SpecUnitTypeMeta(Icons.bed_outlined, PsColors.primary),
  '3 BHK': SpecUnitTypeMeta(Icons.bed_outlined, PsColors.primaryDark),
  'Penthouse': SpecUnitTypeMeta(Icons.apartment, PsColors.accent),
  'Villa': SpecUnitTypeMeta(Icons.house_outlined, PsColors.accent),
  'Commercial': SpecUnitTypeMeta(Icons.storefront_outlined, PsColors.green),
  'Warehouse': SpecUnitTypeMeta(Icons.inventory_2_outlined, PsColors.muted),
  'Office': SpecUnitTypeMeta(Icons.business_center_outlined, PsColors.primaryMid),
};

const SpecUnitTypeMeta kSpecDefaultTypeMeta =
    SpecUnitTypeMeta(Icons.home_work_outlined, PsColors.muted);

// ============================================================
// STEPS
// ============================================================

/// The three screens the user moves through, in order:
/// pick a property -> pick a flat (Property Master record) for that
/// property -> view/edit the specification for that PropertyID+RecordID.
enum _SpecStep { properties, flats, form }

// ============================================================
// MODELS
// ============================================================

/// Lightweight property summary used for the picker list.
/// Sourced from the same `getPropertyInfo` endpoint used
/// by the Property Information screen.
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

  SpecUnitTypeMeta get typeMeta =>
      kSpecUnitTypeMeta[unitType] ?? kSpecDefaultTypeMeta;

  String get locationLine {
    final parts =
        [communityArea, city].where((p) => p.trim().isNotEmpty).toList();
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

/// Lightweight flat / tenancy summary from `getPropertyMaster`, used as
/// the middle picker step between a property and its specification.
class FlatSummary {
  final int recordId;
  final String flatNo;
  final String tenantName;
  final String flatType;

  FlatSummary({
    required this.recordId,
    required this.flatNo,
    required this.tenantName,
    required this.flatType,
  });

  factory FlatSummary.fromApi(Map<String, dynamic> item) {
    return FlatSummary(
      recordId: int.tryParse('${item['RecordID'] ?? 0}') ?? 0,
      flatNo: item['FlatNo']?.toString() ?? '',
      tenantName: item['TenantName']?.toString() ?? '',
      flatType: item['FlatType']?.toString() ?? '',
    );
  }

  String get label => flatNo.trim().isNotEmpty ? flatNo : 'Flat #$recordId';

  String get metaLine {
    final parts = <String>[];
    if (flatType.trim().isNotEmpty) parts.add(flatType);
    if (tenantName.trim().isNotEmpty) parts.add(tenantName);
    return parts.isEmpty ? 'No tenant details yet' : parts.join(' · ');
  }
}

/// Mirrors mapApiSpecification / INITIAL_SPEC_FORM.
/// Now scoped to a specific flat (RecordID) within a property, not just
/// the property as a whole.
class SpecificationForm {
  int? id; // SpecificationID
  int propertyId;
  int recordId; // Property Master (flat) record this specification belongs to
  String totalArea;
  String areaUnit;
  String carpetArea;
  String builtUpArea;
  String bedrooms;
  String bathrooms;
  String balconyCount;
  String? maidRoom;
  String? storeRoom;
  String? laundryRoom;
  String? kitchenType;
  String? furnishingStatus;
  String? acType;
  String? internetAvailability;
  String electricityMeterNo;
  String waterMeterNo;
  String gasConnectionNo;

  SpecificationForm({
    this.id,
    this.propertyId = 0,
    this.recordId = 0,
    this.totalArea = '',
    this.areaUnit = 'sq.ft.',
    this.carpetArea = '',
    this.builtUpArea = '',
    this.bedrooms = '',
    this.bathrooms = '',
    this.balconyCount = '',
    this.maidRoom,
    this.storeRoom,
    this.laundryRoom,
    this.kitchenType,
    this.furnishingStatus,
    this.acType,
    this.internetAvailability,
    this.electricityMeterNo = '',
    this.waterMeterNo = '',
    this.gasConnectionNo = '',
  });

  factory SpecificationForm.empty(int propertyId, int recordId) =>
      SpecificationForm(propertyId: propertyId, recordId: recordId);

  factory SpecificationForm.fromApi(
    Map<String, dynamic> item,
    int propertyId,
    int recordId,
  ) {
    String txt(dynamic v) => v == null ? '' : v.toString();
    String? nullableTxt(dynamic v) {
      final t = txt(v).trim();
      return t.isEmpty ? null : t;
    }

    final specId = int.tryParse('${item['SpecificationID'] ?? 0}') ?? 0;
    final apiRecordId =
        int.tryParse('${item['RecordID'] ?? recordId}') ?? recordId;
    return SpecificationForm(
      id: specId,
      propertyId: propertyId,
      recordId: apiRecordId,
      totalArea: txt(item['TotalArea']),
      areaUnit:
          txt(item['AreaUnit']).isNotEmpty ? txt(item['AreaUnit']) : 'sq.ft.',
      carpetArea: txt(item['CarpetArea']),
      builtUpArea: txt(item['BuiltUpArea']),
      bedrooms: txt(item['Bedrooms']),
      bathrooms: txt(item['Bathrooms']),
      balconyCount: txt(item['BalconyCount']),
      maidRoom: nullableTxt(item['MaidRoom']),
      storeRoom: nullableTxt(item['StoreRoom']),
      laundryRoom: nullableTxt(item['LaundryRoom']),
      kitchenType: nullableTxt(item['KitchenType']),
      furnishingStatus: nullableTxt(item['FurnishingStatus']),
      acType: nullableTxt(item['ACType']),
      internetAvailability: nullableTxt(item['InternetAvailability']),
      electricityMeterNo: txt(item['ElectricityMeterNo']),
      waterMeterNo: txt(item['WaterMeterNo']),
      gasConnectionNo: txt(item['GasConnectionNo']),
    );
  }

  bool get isSaved => id != null && id != 0;

  Map<String, dynamic> toPayload({
    required int companyId,
    required int userId,
  }) {
    String? n(String v) => v.trim().isEmpty ? null : v.trim();
    double? nd(String v) {
      final t = v.trim();
      if (t.isEmpty) return null;
      return double.tryParse(t);
    }

    int? ni(String v) {
      final t = v.trim();
      if (t.isEmpty) return null;
      return int.tryParse(t);
    }

    return {
      'SpecificationID': id ?? 0,
      'PropertyID': propertyId,
      'RecordID': recordId,
      'TotalArea': nd(totalArea),
      'AreaUnit': areaUnit.isEmpty ? null : areaUnit,
      'CarpetArea': nd(carpetArea),
      'BuiltUpArea': nd(builtUpArea),
      'Bedrooms': ni(bedrooms),
      'Bathrooms': ni(bathrooms),
      'BalconyCount': ni(balconyCount),
      'MaidRoom': maidRoom,
      'StoreRoom': storeRoom,
      'LaundryRoom': laundryRoom,
      'KitchenType': kitchenType,
      'FurnishingStatus': furnishingStatus,
      'ACType': acType,
      'InternetAvailability': internetAvailability,
      'ElectricityMeterNo': n(electricityMeterNo),
      'WaterMeterNo': n(waterMeterNo),
      'GasConnectionNo': n(gasConnectionNo),
      'CompanyID': companyId,
      'UserID': userId,
    };
  }
}

// ============================================================

class PropertySpecificationScreen extends StatelessWidget {
  const PropertySpecificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: PsColors.background,
      body: PropertySpecificationBody(),
    );
  }
}

class PropertySpecificationBody extends StatefulWidget {
  const PropertySpecificationBody({super.key});

  @override
  State<PropertySpecificationBody> createState() =>
      _PropertySpecificationBodyState();
}

class _PropertySpecificationBodyState
    extends State<PropertySpecificationBody> {
  _SpecStep step = _SpecStep.properties;

  // ---- Step 1: properties ----
  List<PropertySummary> properties = [];
  String searchTerm = '';
  String? filterUnitType;
  String? filterCategory;
  String? filterCity;
  bool loading = false; // loading property list

  PropertySummary? selectedProperty;

  // ---- Step 2: flats (Property Master records) ----
  List<FlatSummary> flats = [];
  bool loadingFlats = false;
  String flatSearchTerm = '';
  FlatSummary? selectedFlat;

  // ---- Step 3: specification form ----
  SpecificationForm form = SpecificationForm.empty(0, 0);
  bool loadingSpec = false;
  bool saving = false;
  bool deleting = false;

  bool get isEditing => form.isSaved;

  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _flatSearchController = TextEditingController();

  // Controllers for every text field (kept in sync with `form`)
  late Map<String, TextEditingController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = {
      'totalArea': TextEditingController(),
      'carpetArea': TextEditingController(),
      'builtUpArea': TextEditingController(),
      'bedrooms': TextEditingController(),
      'bathrooms': TextEditingController(),
      'balconyCount': TextEditingController(),
      'electricityMeterNo': TextEditingController(),
      'waterMeterNo': TextEditingController(),
      'gasConnectionNo': TextEditingController(),
    };
    loadProperties();
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    _searchController.dispose();
    _flatSearchController.dispose();
    super.dispose();
  }

  void _syncControllersFromForm() {
    _controllers['totalArea']!.text = form.totalArea;
    _controllers['carpetArea']!.text = form.carpetArea;
    _controllers['builtUpArea']!.text = form.builtUpArea;
    _controllers['bedrooms']!.text = form.bedrooms;
    _controllers['bathrooms']!.text = form.bathrooms;
    _controllers['balconyCount']!.text = form.balconyCount;
    _controllers['electricityMeterNo']!.text = form.electricityMeterNo;
    _controllers['waterMeterNo']!.text = form.waterMeterNo;
    _controllers['gasConnectionNo']!.text = form.gasConnectionNo;
  }

  void _collectControllersIntoForm() {
    form.totalArea = _controllers['totalArea']!.text;
    form.carpetArea = _controllers['carpetArea']!.text;
    form.builtUpArea = _controllers['builtUpArea']!.text;
    form.bedrooms = _controllers['bedrooms']!.text;
    form.bathrooms = _controllers['bathrooms']!.text;
    form.balconyCount = _controllers['balconyCount']!.text;
    form.electricityMeterNo = _controllers['electricityMeterNo']!.text;
    form.waterMeterNo = _controllers['waterMeterNo']!.text;
    form.gasConnectionNo = _controllers['gasConnectionNo']!.text;
  }

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
          'Unexpected non-JSON response for $action: ${trimmed.substring(0, trimmed.length > 180 ? 180 : trimmed.length)}');
    }
    return jsonDecode(trimmed) as Map<String, dynamic>;
  }

  void _notify(String message, {bool isError = false}) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.fixed,
        backgroundColor: isError ? PsColors.red : PsColors.ink,
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

  // ============================================================
  // STEP 1: PROPERTIES
  // ============================================================

  Future<void> loadProperties() async {
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }
    setState(() => loading = true);
    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyInfo')
          .replace(queryParameters: {'CompanyID': '$companyID'});
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load properties');
      if (data['success'] == true) {
        final List list = data['data'] is List ? data['data'] : [];
        if (!mounted) return;
        setState(() {
          properties = list
              .map((e) => PropertySummary.fromApi(Map<String, dynamic>.from(e)))
              .toList();
        });
      } else {
        if (!mounted) return;
        setState(() => properties = []);
        _notify(data['message']?.toString() ?? 'Failed to load properties.',
            isError: true);
      }
    } catch (e) {
      debugPrint('Load property error: $e');
      _notify(_apiFailureMessage(e, 'load properties'), isError: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  List<String> get cityOptions {
    final set =
        properties.map((p) => p.city).where((c) => c.trim().isNotEmpty).toSet().toList();
    set.sort();
    return set;
  }

  List<PropertySummary> get filteredProperties {
    final term = searchTerm.trim().toLowerCase();
    Iterable<PropertySummary> base = properties;
    if (term.isNotEmpty) {
      base = base.where((p) {
        final values = [
          p.propertyName,
          p.propertyCode,
          p.buildingName,
          p.communityArea,
          p.city,
          p.unitNumber,
        ];
        return values.any((v) => v.toLowerCase().contains(term));
      });
    }
    if (filterUnitType != null && filterUnitType!.isNotEmpty) {
      base = base.where((p) => p.unitType == filterUnitType);
    }
    if (filterCategory != null && filterCategory!.isNotEmpty) {
      base = base.where((p) => p.propertyCategory == filterCategory);
    }
    if (filterCity != null && filterCity!.isNotEmpty) {
      base = base.where((p) => p.city == filterCity);
    }
    return base.toList();
  }

  int get activeFilterCount => [filterUnitType, filterCategory, filterCity]
      .where((v) => v != null && v.isNotEmpty)
      .length;

  void clearFilters() {
    setState(() {
      searchTerm = '';
      _searchController.clear();
      filterUnitType = null;
      filterCategory = null;
      filterCity = null;
    });
  }

  /// Step 1 -> Step 2: property picked, load its flats.
  Future<void> openProperty(PropertySummary property) async {
    FocusScope.of(context).unfocus();
    setState(() {
      selectedProperty = property;
      selectedFlat = null;
      flats = [];
      flatSearchTerm = '';
      _flatSearchController.clear();
      step = _SpecStep.flats;
    });
    await loadFlats();
  }

  // ============================================================
  // STEP 2: FLATS (Property Master records)
  // ============================================================

  Future<void> loadFlats() async {
    final property = selectedProperty;
    if (property == null) return;
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }
    setState(() => loadingFlats = true);
    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyMaster')
          .replace(queryParameters: {
        'CompanyID': '$companyID',
        'PropertyID': '${property.id}',
      });
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load flats');
      if (data['success'] != true) {
        _notify(data['message']?.toString() ?? 'Failed to load flats.',
            isError: true);
        if (!mounted) return;
        setState(() => flats = []);
        return;
      }
      final List list = data['data'] is List ? data['data'] : [];
      if (!mounted) return;
      setState(() {
        flats = list
            .map((e) => FlatSummary.fromApi(Map<String, dynamic>.from(e)))
            .toList();
      });
    } catch (e) {
      debugPrint('Load flats error: $e');
      _notify(_apiFailureMessage(e, 'load flats'), isError: true);
      if (mounted) setState(() => flats = []);
    } finally {
      if (mounted) setState(() => loadingFlats = false);
    }
  }

  List<FlatSummary> get filteredFlats {
    final term = flatSearchTerm.trim().toLowerCase();
    if (term.isEmpty) return flats;
    return flats.where((f) {
      final values = [f.flatNo, f.tenantName, f.flatType];
      return values.any((v) => v.toLowerCase().contains(term));
    }).toList();
  }

  void backToProperties() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      step = _SpecStep.properties;
      selectedProperty = null;
      selectedFlat = null;
      flats = [];
      form = SpecificationForm.empty(0, 0);
    });
  }

  /// Step 2 -> Step 3: flat picked, load (or start) its specification.
  Future<void> selectFlat(FlatSummary flat) async {
    FocusScope.of(context).unfocus();
    setState(() {
      selectedFlat = flat;
      step = _SpecStep.form;
    });
    await loadSpecification();
  }

  void backToFlats() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      step = _SpecStep.flats;
      selectedFlat = null;
      form = SpecificationForm.empty(selectedProperty?.id ?? 0, 0);
    });
  }

  // ============================================================
  // STEP 3: SPECIFICATION
  // ============================================================

  Future<void> loadSpecification() async {
    final property = selectedProperty;
    final flat = selectedFlat;
    if (property == null || flat == null) return;

    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() => loadingSpec = true);
    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertySpecificationByID')
          .replace(queryParameters: {
        'PropertyID': '${property.id}',
        'RecordID': '${flat.recordId}',
        'CompanyID': '$companyID',
      });
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load specification');
      if (data['success'] != true) {
        _notify(data['message']?.toString() ?? 'Failed to load specification.',
            isError: true);
        if (!mounted) return;
        setState(() {
          form = SpecificationForm.empty(property.id, flat.recordId);
          _syncControllersFromForm();
        });
        return;
      }
      if (!mounted) return;
      setState(() {
        form = data['data'] == null
            ? SpecificationForm.empty(property.id, flat.recordId)
            : SpecificationForm.fromApi(
                Map<String, dynamic>.from(data['data']),
                property.id,
                flat.recordId,
              );
        _syncControllersFromForm();
      });
    } catch (e) {
      debugPrint('Load specification error: $e');
      _notify(_apiFailureMessage(e, 'load specification'), isError: true);
      if (!mounted) return;
      setState(() {
        form = SpecificationForm.empty(property.id, flat.recordId);
        _syncControllersFromForm();
      });
    } finally {
      if (mounted) setState(() => loadingSpec = false);
    }
  }

  Future<void> handleSave() async {
    if (saving || deleting) return;
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
    if (selectedProperty == null || form.propertyId == 0) {
      _notify('Please select a property.', isError: true);
      return;
    }
    if (selectedFlat == null || form.recordId == 0) {
      _notify('Please select a flat.', isError: true);
      return;
    }

    _collectControllersIntoForm();

    final validationError = _validateForm();
    if (validationError != null) {
      _notify(validationError, isError: true);
      return;
    }

    setState(() => saving = true);
    try {
      final payload = form.toPayload(companyId: companyID, userId: userID);
      debugPrint('Saving Specification: $payload');
      final response = await http.post(
        Uri.parse('${ApiConfig.webUrl}/insertUpdatePropertySpecification'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );
      final data = _decodeJsonBody(response.body, 'save specification');
      if (data['success'] != true) {
        _notify(data['message']?.toString() ?? 'Specification could not be saved.',
            isError: true);
        return;
      }
      _notify(data['message']?.toString() ??
          (isEditing
              ? 'Specification updated successfully.'
              : 'Specification saved successfully.'));
      if (!mounted) return;
      // Stay on the flat's specification (now saved) instead of dropping
      // all the way back to the property list, matching the web flow.
      await loadSpecification();
    } catch (e) {
      debugPrint('Save specification error: $e');
      _notify(_apiFailureMessage(e, 'save specification'), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  String? _validateForm() {
    final decimalFields = <String, String>{
      'Total Area': form.totalArea,
      'Carpet Area': form.carpetArea,
      'Built-up Area': form.builtUpArea,
    };
    for (final entry in decimalFields.entries) {
      final text = entry.value.trim();
      if (text.isEmpty) continue;
      final value = double.tryParse(text);
      if (value == null || value < 0) {
        return 'Please enter a valid ${entry.key}.';
      }
    }
    final integerFields = <String, String>{
      'Bedrooms': form.bedrooms,
      'Bathrooms': form.bathrooms,
      'Balcony Count': form.balconyCount,
    };
    for (final entry in integerFields.entries) {
      final text = entry.value.trim();
      if (text.isEmpty) continue;
      final value = int.tryParse(text);
      if (value == null || value < 0) {
        return 'Please enter a valid ${entry.key}.';
      }
    }
    return null;
  }

  Future<void> handleDelete() async {
    if (!isEditing) return;
    if (saving || deleting) return;
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
    if (form.id == null) {
      _notify('SpecificationID not found.', isError: true);
      return;
    }

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => _DeleteConfirmSheet(
        propertyLabel: selectedFlat?.label ??
            selectedProperty?.fullLabel ??
            'this specification',
      ),
    );
    if (confirmed != true) return;

    setState(() => deleting = true);
    try {
      final request = http.Request(
        'POST',
        Uri.parse('${ApiConfig.webUrl}/deletePropertySpecification'),
      );
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'SpecificationID': form.id,
        'PropertyID': form.propertyId,
        'RecordID': form.recordId,
        'CompanyID': companyID,
        'UserID': userID,
      });
      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      final data = _decodeJsonBody(response.body, 'delete specification');
      if (data['success'] != true) {
        _notify(data['message']?.toString() ?? 'Specification could not be deleted.',
            isError: true);
        return;
      }
      _notify(data['message']?.toString() ?? 'Specification deleted successfully.');
      if (!mounted) return;
      setState(() {
        form = SpecificationForm.empty(
            selectedProperty?.id ?? 0, selectedFlat?.recordId ?? 0);
        _syncControllersFromForm();
      });
    } catch (e) {
      debugPrint('Delete specification error: $e');
      _notify(_apiFailureMessage(e, 'delete specification'), isError: true);
    } finally {
      if (mounted) setState(() => deleting = false);
    }
  }

  Future<void> _showPicker({
    required String title,
    required List<String> options,
    required String? selected,
    required ValueChanged<String?> onSelected,
    bool allowClear = true,
  }) async {
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
                  color: PsColors.hairline,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(title,
                          style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: PsColors.ink)),
                    ),
                    if (options.isEmpty)
                      const Text('No options yet',
                          style: TextStyle(fontSize: 12, color: PsColors.muted)),
                  ],
                ),
              ),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  padding: const EdgeInsets.only(bottom: 8),
                  children: [
                    if (allowClear)
                      _pickerTile(
                        label: 'All',
                        selected: selected == null || selected.isEmpty,
                        onTap: () {
                          Navigator.pop(ctx);
                          onSelected(null);
                        },
                      ),
                    ...options.map((o) => _pickerTile(
                          label: o,
                          selected: selected == o,
                          onTap: () {
                            Navigator.pop(ctx);
                            onSelected(o);
                          },
                        )),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _pickerTile({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      title: Text(
        label,
        style: TextStyle(
          fontSize: 14,
          color: selected ? PsColors.primary : PsColors.ink,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
      trailing: selected
          ? const Icon(Icons.check_rounded, color: PsColors.primary, size: 20)
          : null,
    );
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    late Widget child;
    late Key key;
    switch (step) {
      case _SpecStep.properties:
        child = _buildPropertiesStep(key: const ValueKey('properties'));
        key = const ValueKey('properties');
        break;
      case _SpecStep.flats:
        child = _buildFlatsStep(key: const ValueKey('flats'));
        key = const ValueKey('flats');
        break;
      case _SpecStep.form:
        child = _buildForm(key: const ValueKey('form'));
        key = const ValueKey('form');
        break;
    }

    return SafeArea(
      child: AnimatedSwitcher(
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
        child: KeyedSubtree(key: key, child: child),
      ),
    );
  }

  // ------------------------------------------------------------
  // STEP 1 UI: properties
  // ------------------------------------------------------------

  Widget _buildPropertiesStep({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PsColors.background,
      body: Column(
        children: [
          _listHeader(),
          Expanded(
            child: RefreshIndicator(
              color: PsColors.primary,
              onRefresh: loadProperties,
              child: loading
                  ? _loadingList()
                  : filteredProperties.isEmpty
                      ? _emptyState()
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          itemCount: filteredProperties.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) =>
                              _propertyCard(filteredProperties[i]),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _listHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      decoration: const BoxDecoration(
        color: PsColors.surface,
        border: Border(bottom: BorderSide(color: PsColors.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Property Specifications', style: PsText.screenTitle),
          const SizedBox(height: 2),
          Text(
            loading
                ? 'Loading…'
                : '${filteredProperties.length} of ${properties.length} properties',
            style: PsText.screenSubtitle,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => searchTerm = v),
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Search property, code, building or city',
              hintStyle: const TextStyle(fontSize: 13, color: PsColors.muted),
              prefixIcon:
                  const Icon(Icons.search_rounded, color: PsColors.muted, size: 20),
              suffixIcon: searchTerm.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close_rounded,
                          size: 18, color: PsColors.muted),
                      onPressed: () => setState(() {
                        searchTerm = '';
                        _searchController.clear();
                      }),
                    ),
              filled: true,
              fillColor: PsColors.background,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(PsRadius.field),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 34,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                if (activeFilterCount > 0) ...[
                  _actionChip(
                    label: 'Clear',
                    icon: Icons.close_rounded,
                    onTap: clearFilters,
                  ),
                  const SizedBox(width: PsSpace.sm),
                ],
                _filterChip(
                  label: filterUnitType ?? 'Unit type',
                  active: filterUnitType != null,
                  onTap: () => _showPicker(
                    title: 'Unit type',
                    options: kSpecUnitTypes,
                    selected: filterUnitType,
                    onSelected: (v) => setState(() => filterUnitType = v),
                  ),
                ),
                const SizedBox(width: PsSpace.sm),
                _filterChip(
                  label: filterCategory ?? 'Category',
                  active: filterCategory != null,
                  onTap: () => _showPicker(
                    title: 'Property category',
                    options: kSpecPropertyCategories,
                    selected: filterCategory,
                    onSelected: (v) => setState(() => filterCategory = v),
                  ),
                ),
                const SizedBox(width: PsSpace.sm),
                _filterChip(
                  label: filterCity ?? 'City',
                  active: filterCity != null,
                  onTap: () => _showPicker(
                    title: 'City',
                    options: cityOptions,
                    selected: filterCity,
                    onSelected: (v) => setState(() => filterCity = v),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip({
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: active ? PsColors.primary : PsColors.background,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: active ? PsColors.primary : PsColors.hairline,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: active ? Colors.white : PsColors.ink,
              ),
            ),
            const SizedBox(width: 3),
            Icon(Icons.keyboard_arrow_down_rounded,
                size: 16, color: active ? Colors.white : PsColors.muted),
          ],
        ),
      ),
    );
  }

  Widget _actionChip({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: PsColors.redSoft,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: PsColors.red),
            const SizedBox(width: PsSpace.xs),
            Text(label,
                style: const TextStyle(
                    fontSize: 12.5, fontWeight: FontWeight.w700, color: PsColors.red)),
          ],
        ),
      ),
    );
  }

  Widget _loadingList() {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => Container(
        height: 84,
        decoration: BoxDecoration(
          color: PsColors.surface,
          borderRadius: BorderRadius.circular(PsRadius.card),
          border: Border.all(color: PsColors.hairline),
        ),
      ),
    );
  }

  Widget _emptyState() {
    final hasFilters = activeFilterCount > 0 || searchTerm.trim().isNotEmpty;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(
          hasFilters ? Icons.search_off_rounded : Icons.home_work_outlined,
          size: 56,
          color: PsColors.primaryTint,
        ),
        const SizedBox(height: PsSpace.lg),
        Text(
          hasFilters ? 'No properties match' : 'No properties yet',
          textAlign: TextAlign.center,
          style: const TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: PsColors.ink),
        ),
        const SizedBox(height: 6),
        Text(
          hasFilters
              ? 'Try a different search term or clear your filters.'
              : 'Add a property first, then come back to set its specification.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: PsColors.muted, height: 1.4),
        ),
        const SizedBox(height: 20),
        if (hasFilters)
          Center(
            child: OutlinedButton(
              onPressed: clearFilters,
              style: OutlinedButton.styleFrom(
                foregroundColor: PsColors.primary,
                side: const BorderSide(color: PsColors.primaryTint),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(PsRadius.badge)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Text('Clear filters'),
            ),
          ),
      ],
    );
  }

  Widget _propertyCard(PropertySummary property) {
    final meta = property.typeMeta;
    final isOpening = loadingFlats && selectedProperty?.id == property.id;
    return Material(
      color: PsColors.surface,
      borderRadius: BorderRadius.circular(PsRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(PsRadius.card),
        onTap: loadingFlats ? null : () => openProperty(property),
        child: Container(
          padding: const EdgeInsets.all(PsSpace.md),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(PsRadius.card),
            border: Border.all(color: PsColors.hairline),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: meta.color.withOpacity(.12),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(meta.icon, color: meta.color, size: 22),
              ),
              const SizedBox(width: PsSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(property.fullLabel,
                        style: PsText.cardTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(property.buildingLine,
                        style: PsText.cardMeta,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: PsSpace.sm),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 13, color: PsColors.muted),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(property.locationLine,
                              style: PsText.cardMeta,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                    if (property.unitType.isNotEmpty ||
                        property.propertyCategory.isNotEmpty) ...[
                      const SizedBox(height: PsSpace.sm),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          if (property.unitType.isNotEmpty)
                            _tag(property.unitType, meta.color),
                          if (property.propertyCategory.isNotEmpty)
                            _tag(property.propertyCategory, PsColors.primaryMid),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: PsSpace.xs),
              isOpening
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: PsColors.primary),
                    )
                  : const Icon(Icons.chevron_right_rounded, color: PsColors.muted),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(.10),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: color),
      ),
    );
  }

  // ------------------------------------------------------------
  // STEP 2 UI: flats (Property Master records)
  // ------------------------------------------------------------

  Widget _buildFlatsStep({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PsColors.background,
      body: Column(
        children: [
          _flatsHeader(),
          Expanded(
            child: RefreshIndicator(
              color: PsColors.primary,
              onRefresh: loadFlats,
              child: loadingFlats
                  ? _loadingList()
                  : filteredFlats.isEmpty
                      ? _emptyFlatsState()
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          itemCount: filteredFlats.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) => _flatCard(filteredFlats[i]),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _flatsHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 10, 16, 14),
      decoration: const BoxDecoration(
        color: PsColors.surface,
        border: Border(bottom: BorderSide(color: PsColors.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: backToProperties,
                icon: const Icon(Icons.arrow_back_rounded, color: PsColors.ink),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Select a flat',
                      style: TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w800, color: PsColors.ink),
                    ),
                    Text(
                      selectedProperty?.fullLabel ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: PsText.screenSubtitle,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: TextField(
              controller: _flatSearchController,
              onChanged: (v) => setState(() => flatSearchTerm = v),
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                isDense: true,
                hintText: 'Search by flat no, tenant or flat type',
                hintStyle: const TextStyle(fontSize: 13, color: PsColors.muted),
                prefixIcon:
                    const Icon(Icons.search_rounded, color: PsColors.muted, size: 20),
                suffixIcon: flatSearchTerm.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close_rounded,
                            size: 18, color: PsColors.muted),
                        onPressed: () => setState(() {
                          flatSearchTerm = '';
                          _flatSearchController.clear();
                        }),
                      ),
                filled: true,
                fillColor: PsColors.background,
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(PsRadius.field),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _emptyFlatsState() {
    final hasSearch = flatSearchTerm.trim().isNotEmpty;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(
          hasSearch ? Icons.search_off_rounded : Icons.meeting_room_outlined,
          size: 56,
          color: PsColors.primaryTint,
        ),
        const SizedBox(height: PsSpace.lg),
        Text(
          hasSearch ? 'No flats match' : 'No flats yet',
          textAlign: TextAlign.center,
          style: const TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: PsColors.ink),
        ),
        const SizedBox(height: 6),
        Text(
          hasSearch
              ? 'Try a different search term.'
              : 'Add a flat for this property in Property Master first, then come back to set its specification.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: PsColors.muted, height: 1.4),
        ),
      ],
    );
  }

  Widget _flatCard(FlatSummary flat) {
    final isOpening = loadingSpec && selectedFlat?.recordId == flat.recordId;
    return Material(
      color: PsColors.surface,
      borderRadius: BorderRadius.circular(PsRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(PsRadius.card),
        onTap: loadingSpec ? null : () => selectFlat(flat),
        child: Container(
          padding: const EdgeInsets.all(PsSpace.md),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(PsRadius.card),
            border: Border.all(color: PsColors.hairline),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: PsColors.primarySoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.door_front_door_outlined,
                    color: PsColors.primary, size: 20),
              ),
              const SizedBox(width: PsSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(flat.label,
                        style: PsText.cardTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(flat.metaLine,
                        style: PsText.cardMeta,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              isOpening
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: PsColors.primary),
                    )
                  : const Icon(Icons.chevron_right_rounded, color: PsColors.muted),
            ],
          ),
        ),
      ),
    );
  }

  // ------------------------------------------------------------
  // STEP 3 UI: specification form
  // ------------------------------------------------------------

  Widget _buildForm({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PsColors.background,
      body: Column(
        children: [
          _formHeader(),
          Expanded(
            child: loadingSpec
                ? const Center(
                    child: CircularProgressIndicator(color: PsColors.primary))
                : SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _formSection(
                          icon: Icons.straighten_rounded,
                          title: 'Area details',
                          subtitle: 'Measurements for this unit',
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: _field('Total Area', 'totalArea',
                                      placeholder: 'e.g. 1250',
                                      keyboardType: const TextInputType
                                          .numberWithOptions(decimal: true),
                                      inputFormatters: [
                                        FilteringTextInputFormatter.allow(
                                            RegExp(r'^\d*\.?\d{0,2}')),
                                      ]),
                                ),
                                const SizedBox(width: PsSpace.md),
                                SizedBox(
                                  width: 110,
                                  child: _pickerField(
                                    label: 'Unit',
                                    value: form.areaUnit,
                                    placeholder: 'Select',
                                    onTap: () => _showPicker(
                                      title: 'Area unit',
                                      options: kAreaUnits,
                                      selected: form.areaUnit,
                                      allowClear: false,
                                      onSelected: (v) => setState(
                                          () => form.areaUnit = v ?? 'sq.ft.'),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            _field('Carpet Area', 'carpetArea',
                                placeholder: 'e.g. 1020',
                                keyboardType:
                                    const TextInputType.numberWithOptions(decimal: true),
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'^\d*\.?\d{0,2}')),
                                ]),
                            _field('Built-up Area', 'builtUpArea',
                                placeholder: 'e.g. 1180',
                                keyboardType:
                                    const TextInputType.numberWithOptions(decimal: true),
                                inputFormatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'^\d*\.?\d{0,2}')),
                                ]),
                          ],
                        ),
                        const SizedBox(height: PsSpace.lg),
                        _formSection(
                          icon: Icons.door_front_door_outlined,
                          title: 'Room configuration',
                          subtitle: 'Layout and additional rooms',
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: _field('Bedrooms', 'bedrooms',
                                      placeholder: 'e.g. 2',
                                      keyboardType: TextInputType.number,
                                      inputFormatters: [
                                        FilteringTextInputFormatter.digitsOnly,
                                      ]),
                                ),
                                const SizedBox(width: PsSpace.md),
                                Expanded(
                                  child: _field('Bathrooms', 'bathrooms',
                                      placeholder: 'e.g. 2',
                                      keyboardType: TextInputType.number,
                                      inputFormatters: [
                                        FilteringTextInputFormatter.digitsOnly,
                                      ]),
                                ),
                              ],
                            ),
                            _field('Balcony Count', 'balconyCount',
                                placeholder: 'e.g. 1',
                                keyboardType: TextInputType.number,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                ]),
                            Row(
                              children: [
                                Expanded(
                                  child: _pickerField(
                                    label: 'Maid Room',
                                    value: form.maidRoom ?? '',
                                    placeholder: 'Select',
                                    onTap: () => _showPicker(
                                      title: 'Maid room',
                                      options: kYesNo,
                                      selected: form.maidRoom,
                                      onSelected: (v) =>
                                          setState(() => form.maidRoom = v),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: PsSpace.md),
                                Expanded(
                                  child: _pickerField(
                                    label: 'Store Room',
                                    value: form.storeRoom ?? '',
                                    placeholder: 'Select',
                                    onTap: () => _showPicker(
                                      title: 'Store room',
                                      options: kYesNo,
                                      selected: form.storeRoom,
                                      onSelected: (v) =>
                                          setState(() => form.storeRoom = v),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                Expanded(
                                  child: _pickerField(
                                    label: 'Laundry Room',
                                    value: form.laundryRoom ?? '',
                                    placeholder: 'Select',
                                    onTap: () => _showPicker(
                                      title: 'Laundry room',
                                      options: kYesNo,
                                      selected: form.laundryRoom,
                                      onSelected: (v) =>
                                          setState(() => form.laundryRoom = v),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: PsSpace.md),
                                Expanded(
                                  child: _pickerField(
                                    label: 'Kitchen Type',
                                    value: form.kitchenType ?? '',
                                    placeholder: 'Select',
                                    onTap: () => _showPicker(
                                      title: 'Kitchen type',
                                      options: kKitchenTypes,
                                      selected: form.kitchenType,
                                      onSelected: (v) =>
                                          setState(() => form.kitchenType = v),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: PsSpace.lg),
                        _formSection(
                          icon: Icons.home_work_outlined,
                          title: 'Amenities & facilities',
                          subtitle: 'Furnishing, air conditioning and connectivity',
                          children: [
                            _pickerField(
                              label: 'Furnishing Status',
                              value: form.furnishingStatus ?? '',
                              placeholder: 'Select furnishing',
                              onTap: () => _showPicker(
                                title: 'Furnishing status',
                                options: kFurnishingStatuses,
                                selected: form.furnishingStatus,
                                onSelected: (v) =>
                                    setState(() => form.furnishingStatus = v),
                              ),
                            ),
                            _pickerField(
                              label: 'AC Type',
                              value: form.acType ?? '',
                              placeholder: 'Select AC type',
                              onTap: () => _showPicker(
                                title: 'AC type',
                                options: kAcTypes,
                                selected: form.acType,
                                onSelected: (v) => setState(() => form.acType = v),
                              ),
                            ),
                            _pickerField(
                              label: 'Internet Availability',
                              value: form.internetAvailability ?? '',
                              placeholder: 'Select',
                              onTap: () => _showPicker(
                                title: 'Internet availability',
                                options: kYesNo,
                                selected: form.internetAvailability,
                                onSelected: (v) =>
                                    setState(() => form.internetAvailability = v),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: PsSpace.lg),
                        _formSection(
                          icon: Icons.speed_rounded,
                          title: 'Meter details',
                          subtitle: 'Utility meter and connection numbers',
                          children: [
                            _field('Electricity Meter No', 'electricityMeterNo',
                                placeholder: 'Electricity meter number',
                                textCapitalization: TextCapitalization.characters),
                            _field('Water Meter No', 'waterMeterNo',
                                placeholder: 'Water meter number',
                                textCapitalization: TextCapitalization.characters),
                            _field('Gas Connection No', 'gasConnectionNo',
                                placeholder: 'Gas connection number',
                                textCapitalization: TextCapitalization.characters),
                          ],
                        ),
                        if (isEditing) ...[
                          const SizedBox(height: 20),
                          Center(
                            child: TextButton.icon(
                              onPressed: (saving || deleting) ? null : handleDelete,
                              icon: Icon(
                                deleting
                                    ? Icons.hourglass_top_rounded
                                    : Icons.delete_outline_rounded,
                                size: 18,
                                color: PsColors.red,
                              ),
                              label: Text(
                                deleting ? 'Deleting…' : 'Delete this specification',
                                style: const TextStyle(
                                    color: PsColors.red, fontWeight: FontWeight.w700),
                              ),
                            ),
                          ),
                        ],
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
        color: PsColors.surface,
        border: Border(bottom: BorderSide(color: PsColors.hairline)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: (saving || deleting) ? null : backToFlats,
            icon: const Icon(Icons.arrow_back_rounded, color: PsColors.ink),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEditing ? 'Edit specification' : 'New specification',
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w800, color: PsColors.ink),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  [
                    selectedProperty?.fullLabel ?? '',
                    if (selectedFlat != null) selectedFlat!.label,
                  ].where((s) => s.isNotEmpty).join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: PsText.screenSubtitle,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _formSection({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(PsSpace.lg),
      decoration: BoxDecoration(
        color: PsColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: PsColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: PsColors.primarySoft,
                  borderRadius: BorderRadius.circular(PsRadius.badge),
                ),
                child: Icon(icon, color: PsColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: PsText.sectionTitle),
                    Text(subtitle, style: PsText.sectionSubtitle),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: PsSpace.lg),
          for (int i = 0; i < children.length; i++) ...[
            children[i],
            if (i != children.length - 1) const SizedBox(height: 14),
          ],
        ],
      ),
    );
  }

  Widget _fieldLabel(String label) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(label.toUpperCase(), style: PsText.label),
      );

  Widget _field(
    String label,
    String key, {
    String? placeholder,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    final disabled = saving || deleting;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel(label),
          TextField(
            controller: _controllers[key],
            enabled: !disabled,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            textCapitalization: textCapitalization,
            style: const TextStyle(fontSize: 14, color: PsColors.ink),
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: const TextStyle(fontSize: 13, color: PsColors.muted),
              filled: true,
              fillColor: disabled ? const Color(0xFFF5F6FA) : PsColors.background,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(PsRadius.field),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(PsRadius.field),
                borderSide: const BorderSide(color: PsColors.primary, width: 1.4),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _pickerField({
    required String label,
    required String value,
    required String placeholder,
    required VoidCallback onTap,
  }) {
    final disabled = saving || deleting;
    final hasValue = value.isNotEmpty;
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel(label),
          InkWell(
            onTap: disabled ? null : onTap,
            borderRadius: BorderRadius.circular(PsRadius.field),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              decoration: BoxDecoration(
                color: disabled ? const Color(0xFFF5F6FA) : PsColors.background,
                borderRadius: BorderRadius.circular(PsRadius.field),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      hasValue ? value : placeholder,
                      style: TextStyle(
                        fontSize: 14,
                        color: hasValue ? PsColors.ink : PsColors.muted,
                        fontWeight: hasValue ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down_rounded,
                      color: PsColors.muted, size: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _formFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: const BoxDecoration(
        color: PsColors.surface,
        border: Border(top: BorderSide(color: PsColors.hairline)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          onPressed: (saving || deleting || loadingSpec) ? null : handleSave,
          icon: Icon(saving ? Icons.hourglass_top_rounded : Icons.check_rounded,
              size: 20),
          label: Text(
            saving ? 'Saving…' : (isEditing ? 'Update specification' : 'Save specification'),
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: PsColors.primary,
            foregroundColor: Colors.white,
            disabledBackgroundColor: PsColors.primaryTint,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ),
    );
  }
}

class _DeleteConfirmSheet extends StatelessWidget {
  final String propertyLabel;
  const _DeleteConfirmSheet({required this.propertyLabel});

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
                  color: PsColors.hairline,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: PsColors.redSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.delete_outline_rounded,
                  color: PsColors.red, size: 26),
            ),
            const SizedBox(height: 14),
            const Text('Delete specification?',
                style: TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w800, color: PsColors.ink)),
            const SizedBox(height: 6),
            Text(
              'The specification for "$propertyLabel" will be permanently removed. This can\'t be undone.',
              style: const TextStyle(fontSize: 13, color: PsColors.muted, height: 1.4),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: PsColors.ink,
                      side: const BorderSide(color: PsColors.hairline),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(PsRadius.field)),
                    ),
                    child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: PsSpace.md),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PsColors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(PsRadius.field)),
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