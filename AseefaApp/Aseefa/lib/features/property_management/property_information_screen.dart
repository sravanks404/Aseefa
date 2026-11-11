import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

// ============================================================
// DESIGN TOKENS
// ============================================================
class PiColors {
  static const Color primary = Color.fromARGB(255, 35, 0, 196);
  static const Color primaryDark = Color(0xFF17008C);
  static const Color primaryMid = Color(0xFF6F7FDB); // primaryLight
  static const Color primarySoft = Color(0xFFEDEBFB);
  static const Color primaryTint = Color(0xFFDAD5F6);

  static const Color accent = Color(0xFFF59E0B); // warningColor, used for premium unit types
  static const Color accentSoft = Color(0xFFFEF3DA);

  static const Color background = Color(0xFFF5F7FB); // bgColor
  static const Color surface = Colors.white; // cardBg

  static const Color ink = Color(0xFF111827); // textPrimary
  static const Color muted = Color(0xFF6B7280); // textSecondary
  static const Color hairline = Color(0xFFE5E7EB); // borderColor

  static const Color green = Color(0xFF16A34A); // successColor
  static const Color greenSoft = Color(0xFFDFF6E6);
  static const Color red = Color(0xFFDC2626); // errorColor
  static const Color redSoft = Color(0xFFFCE8E8);
}

// Spacing
class PiSpace {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
}

// Border Radius
class PiRadius {
  static const double card = 16;
  static const double button = 12;
  static const double field = 12;
  static const double badge = 10;
}

class PiText {
  static const screenTitle = TextStyle(
      fontSize: 22, fontWeight: FontWeight.w800, color: PiColors.ink, height: 1.15);
  static const screenSubtitle =
      TextStyle(fontSize: 13, color: PiColors.muted, fontWeight: FontWeight.w500);
  static const sectionTitle = TextStyle(
      fontSize: 15, fontWeight: FontWeight.w700, color: PiColors.primaryDark);
  static const sectionSubtitle =
      TextStyle(fontSize: 12, color: PiColors.muted);
  static const cardTitle =
      TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: PiColors.ink);
  static const cardMeta =
      TextStyle(fontSize: 12, color: PiColors.muted, fontWeight: FontWeight.w500);
  static const label = TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w700,
      letterSpacing: .3,
      color: PiColors.primaryMid);
}

// ============================================================
// CONSTANTS
// ============================================================
const List<String> kUnitTypes = [
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

const List<String> kPropertyCategories = [
  'Residential',
  'Commercial',
];

class UnitTypeMeta {
  final IconData icon;
  final Color color;
  const UnitTypeMeta(this.icon, this.color);
}

const Map<String, UnitTypeMeta> kUnitTypeMeta = {
  'Studio': UnitTypeMeta(Icons.bed_outlined, PiColors.primaryMid),
  '1 BHK': UnitTypeMeta(Icons.bed_outlined, PiColors.primary),
  '2 BHK': UnitTypeMeta(Icons.bed_outlined, PiColors.primary),
  '3 BHK': UnitTypeMeta(Icons.bed_outlined, PiColors.primaryDark),
  'Penthouse': UnitTypeMeta(Icons.apartment, PiColors.accent),
  'Villa': UnitTypeMeta(Icons.house_outlined, PiColors.accent),
  'Commercial': UnitTypeMeta(Icons.storefront_outlined, PiColors.green),
  'Warehouse': UnitTypeMeta(Icons.inventory_2_outlined, PiColors.muted),
  'Office': UnitTypeMeta(Icons.business_center_outlined, PiColors.primaryMid),
};

const UnitTypeMeta kDefaultTypeMeta =
    UnitTypeMeta(Icons.home_work_outlined, PiColors.muted);

// ============================================================
// MODEL  (mirrors mapApiProperty / INITIAL_FORM)
// ============================================================
class PropertyForm {
  int? id;

  String propertyId;
  String propertyName;
  String propertyCode;

  String buildingName;
  String buildingNumber;
  String unitNumber;
  String floorNumber;

  String unitType;
  String propertyCategory;

  String towerWing;
  String blockNumber;
  String communityArea;

  String city;
  String stateEmirate;
  String country;
  String postalCode;

  String gpsLocation;
  String googleMapsLink;

  PropertyForm({
    this.id,
    this.propertyId = '',
    this.propertyName = '',
    this.propertyCode = '',
    this.buildingName = '',
    this.buildingNumber = '',
    this.unitNumber = '',
    this.floorNumber = '',
    this.unitType = '',
    this.propertyCategory = '',
    this.towerWing = '',
    this.blockNumber = '',
    this.communityArea = '',
    this.city = '',
    this.stateEmirate = '',
    this.country = '',
    this.postalCode = '',
    this.gpsLocation = '',
    this.googleMapsLink = '',
  });

  factory PropertyForm.empty() => PropertyForm();

  factory PropertyForm.fromApi(Map<String, dynamic> item) {
    final propertyID = int.tryParse('${item['PropertyID'] ?? 0}') ?? 0;
    return PropertyForm(
      id: propertyID,
      propertyId: propertyID != 0
          ? 'PRP-${propertyID.toString().padLeft(4, '0')}'
          : '',
      propertyName: item['PropertyName']?.toString() ?? '',
      propertyCode: item['PropertyCode']?.toString() ?? '',
      buildingName: item['BuildingName']?.toString() ?? '',
      buildingNumber: item['BuildingNumber']?.toString() ?? '',
      unitNumber: item['UnitNumber']?.toString() ?? '',
      floorNumber: item['FloorNumber']?.toString() ?? '',
      unitType: item['UnitType']?.toString() ?? '',
      propertyCategory: item['PropertyCategory']?.toString() ?? '',
      towerWing: item['TowerWing']?.toString() ?? '',
      blockNumber: item['BlockNumber']?.toString() ?? '',
      communityArea: item['CommunityArea']?.toString() ?? '',
      city: item['City']?.toString() ?? '',
      stateEmirate: item['StateEmirate']?.toString() ?? '',
      country: item['Country']?.toString() ?? '',
      postalCode: item['PostalCode']?.toString() ?? '',
      gpsLocation: item['GPSLocation']?.toString() ?? '',
      googleMapsLink: item['GoogleMapsLink']?.toString() ?? '',
    );
  }

  String get fullLabel {
    if (propertyName.trim().isNotEmpty) return propertyName;
    if (propertyCode.trim().isNotEmpty) return propertyCode;
    if (propertyId.trim().isNotEmpty) return propertyId;
    return 'Property #${id ?? 0}';
  }

  UnitTypeMeta get typeMeta => kUnitTypeMeta[unitType] ?? kDefaultTypeMeta;

  String get locationLine {
    final parts = [communityArea, city]
        .where((p) => p.trim().isNotEmpty)
        .toList();
    return parts.isEmpty ? 'Location not set' : parts.join(', ');
  }

  String get buildingLine {
    final parts = <String>[];
    if (buildingName.trim().isNotEmpty) parts.add(buildingName);
    if (unitNumber.trim().isNotEmpty) parts.add('Unit $unitNumber');
    if (floorNumber.trim().isNotEmpty) parts.add('Floor $floorNumber');
    return parts.isEmpty ? 'No building details yet' : parts.join(' · ');
  }

  Map<String, dynamic> toPayload({
    required int companyId,
    required int userId,
  }) {
    String? n(String v) => v.trim().isEmpty ? null : v.trim();
    return {
      'PropertyID': id ?? 0,
      'PropertyCode': n(propertyCode),
      'PropertyName': propertyName.trim(),
      'BuildingName': n(buildingName),
      'BuildingNumber': n(buildingNumber),
      'UnitNumber': n(unitNumber),
      'FloorNumber': n(floorNumber),
      'UnitType': unitType.isEmpty ? null : unitType,
      'PropertyCategory': propertyCategory.isEmpty ? null : propertyCategory,
      'TowerWing': n(towerWing),
      'BlockNumber': n(blockNumber),
      'CommunityArea': n(communityArea),
      'City': n(city),
      'StateEmirate': n(stateEmirate),
      'Country': n(country),
      'PostalCode': n(postalCode),
      'GPSLocation': n(gpsLocation),
      'GoogleMapsLink': n(googleMapsLink),
      'CompanyID': companyId,
      'UserID': userId,
    };
  }
}

// ============================================================
class PropertyInformationScreen extends StatelessWidget {
  const PropertyInformationScreen({
    super.key,
    this.openCreate = false,
  });

  final bool openCreate;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PiColors.background,
      body: PropertyInformationBody(openCreate: openCreate),
    );
  }
}

// SCREEN
// ============================================================
class PropertyInformationBody extends StatefulWidget {
  const PropertyInformationBody({
    super.key,
    this.openCreate = false,
  });

  final bool openCreate;

  @override
  State<PropertyInformationBody> createState() =>
      _PropertyInformationBodyState();
}

class _PropertyInformationBodyState extends State<PropertyInformationBody> {
  bool showForm = false;

  List<PropertyForm> properties = [];

  String searchTerm = '';
  String? filterUnitType;
  String? filterCategory;
  String? filterCity;

  PropertyForm form = PropertyForm.empty();

  bool saving = false;
  bool deleting = false;
  bool loading = false;

  bool get isEditing => form.id != null;

  final TextEditingController _searchController = TextEditingController();

  // Controllers for every text field (kept in sync with `form`)
  late Map<String, TextEditingController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = {
      'propertyName': TextEditingController(),
      'propertyCode': TextEditingController(),
      'buildingName': TextEditingController(),
      'buildingNumber': TextEditingController(),
      'unitNumber': TextEditingController(),
      'floorNumber': TextEditingController(),
      'towerWing': TextEditingController(),
      'blockNumber': TextEditingController(),
      'communityArea': TextEditingController(),
      'city': TextEditingController(),
      'stateEmirate': TextEditingController(),
      'country': TextEditingController(),
      'postalCode': TextEditingController(),
      'gpsLocation': TextEditingController(),
      'googleMapsLink': TextEditingController(),
    };
    loadProperties();
    if (widget.openCreate) {
      openCreate();
    }
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    _searchController.dispose();
    super.dispose();
  }

  void _syncControllersFromForm() {
    _controllers['propertyName']!.text = form.propertyName;
    _controllers['propertyCode']!.text = form.propertyCode;
    _controllers['buildingName']!.text = form.buildingName;
    _controllers['buildingNumber']!.text = form.buildingNumber;
    _controllers['unitNumber']!.text = form.unitNumber;
    _controllers['floorNumber']!.text = form.floorNumber;
    _controllers['towerWing']!.text = form.towerWing;
    _controllers['blockNumber']!.text = form.blockNumber;
    _controllers['communityArea']!.text = form.communityArea;
    _controllers['city']!.text = form.city;
    _controllers['stateEmirate']!.text = form.stateEmirate;
    _controllers['country']!.text = form.country;
    _controllers['postalCode']!.text = form.postalCode;
    _controllers['gpsLocation']!.text = form.gpsLocation;
    _controllers['googleMapsLink']!.text = form.googleMapsLink;
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
        backgroundColor: isError ? PiColors.red : PiColors.ink,
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
              .map((e) => PropertyForm.fromApi(Map<String, dynamic>.from(e)))
              .toList();
        });
      } else {
        if (!mounted) return;
        setState(() => properties = []);
        _notify(data?['message'] ?? 'Failed to load properties.', isError: true);
      }
    } catch (e) {
      debugPrint('Load property error: $e');
      _notify(_apiFailureMessage(e, 'load properties'), isError: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  List<String> get cityOptions {
    final set = properties
        .map((p) => p.city)
        .where((c) => c.trim().isNotEmpty)
        .toSet()
        .toList();
    set.sort();
    return set;
  }

  List<PropertyForm> get filteredProperties {
    final term = searchTerm.trim().toLowerCase();

    Iterable<PropertyForm> base = properties;

    if (term.isNotEmpty) {
      base = base.where((p) {
        final values = [
          p.propertyName,
          p.propertyCode,
          p.propertyId,
          p.buildingName,
          p.communityArea,
          p.city,
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

  void openCreate() {
    setState(() {
      form = PropertyForm.empty();
      _syncControllersFromForm();
      showForm = true;
    });
  }

  Future<void> openEdit(PropertyForm property) async {
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    try {
      setState(() => loading = true);

      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyInfoByID')
          .replace(queryParameters: {
        'PropertyID': '${property.id}',
        'CompanyID': '$companyID',
      });

      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'open property');

      if (data['success'] != true || data['data'] == null) {
        _notify(data?['message'] ?? 'Property not found.', isError: true);
        return;
      }

      if (!mounted) return;
      setState(() {
        form = PropertyForm.fromApi(Map<String, dynamic>.from(data['data']));
        _syncControllersFromForm();
        showForm = true;
      });
    } catch (e) {
      debugPrint('Open property error: $e');
      _notify(_apiFailureMessage(e, 'open property'), isError: true);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void backToList() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      showForm = false;
      form = PropertyForm.empty();
    });
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


    _collectControllersIntoForm();

    if (form.propertyName.trim().isEmpty) {
      _notify('Property Name is required.', isError: true);
      return;
    }

    setState(() => saving = true);

    try {
      final payload = form.toPayload(companyId: companyID, userId: userID);
      debugPrint('Saving Property: $payload');

      final response = await http.post(
        Uri.parse('${ApiConfig.webUrl}/insertUpdateProperty'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final data = _decodeJsonBody(response.body, 'save property');

      if (data['success'] != true) {
        _notify(data['message'] ?? 'Property could not be saved.', isError: true);
        return;
      }

      _notify(data?['message'] ??
          (isEditing ? 'Property updated successfully.' : 'Property inserted successfully.'));

      await loadProperties();

      if (!mounted) return;
      setState(() {
        showForm = false;
        form = PropertyForm.empty();
      });
    } catch (e) {
      debugPrint('Save property error: $e');
      _notify(_apiFailureMessage(e, 'save property'), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  void _collectControllersIntoForm() {
    form.propertyName = _controllers['propertyName']!.text;
    form.propertyCode = _controllers['propertyCode']!.text;
    form.buildingName = _controllers['buildingName']!.text;
    form.buildingNumber = _controllers['buildingNumber']!.text;
    form.unitNumber = _controllers['unitNumber']!.text;
    form.floorNumber = _controllers['floorNumber']!.text;
    form.towerWing = _controllers['towerWing']!.text;
    form.blockNumber = _controllers['blockNumber']!.text;
    form.communityArea = _controllers['communityArea']!.text;
    form.city = _controllers['city']!.text;
    form.stateEmirate = _controllers['stateEmirate']!.text;
    form.country = _controllers['country']!.text;
    form.postalCode = _controllers['postalCode']!.text;
    form.gpsLocation = _controllers['gpsLocation']!.text;
    form.googleMapsLink = _controllers['googleMapsLink']!.text;
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
      _notify('PropertyID not found.', isError: true);
      return;
    }

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => _DeleteConfirmSheet(propertyLabel: form.fullLabel),
    );

    if (confirmed != true) return;

    setState(() => deleting = true);

    try {
      final request = http.Request(
        'POST',
        Uri.parse('${ApiConfig.webUrl}/deletePropertyInfo'),
      );
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'PropertyID': form.id,
        'CompanyID': companyID,
        'UserID': userID,
      });

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      final data = _decodeJsonBody(response.body, 'delete property');

      if (data['success'] != true) {
        _notify(data['message'] ?? 'Property could not be deleted.', isError: true);
        return;
      }

      _notify(data?['message'] ?? 'Property deleted successfully.');

      await loadProperties();

      if (!mounted) return;
      setState(() {
        showForm = false;
        form = PropertyForm.empty();
      });
    } catch (e) {
      debugPrint('Delete property error: $e');
      _notify(_apiFailureMessage(e, 'delete property'), isError: true);
    } finally {
      if (mounted) setState(() => deleting = false);
    }
  }

  void clearFilters() {
    setState(() {
      searchTerm = '';
      _searchController.clear();
      filterUnitType = null;
      filterCategory = null;
      filterCity = null;
    });
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
                  color: PiColors.hairline,
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
                              color: PiColors.ink)),
                    ),
                    if (options.isEmpty)
                      const Text('No options yet',
                          style: TextStyle(fontSize: 12, color: PiColors.muted)),
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
          color: selected ? PiColors.primary : PiColors.ink,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
      trailing: selected
          ? const Icon(Icons.check_rounded, color: PiColors.primary, size: 20)
          : null,
    );
  }


  @override
  Widget build(BuildContext context) {
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
        child: showForm
            ? _buildForm(key: const ValueKey('form'))
            : _buildList(key: const ValueKey('list')),
      ),
    );
  }


  Widget _buildList({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: loading ? null : openCreate,
        backgroundColor: PiColors.primary,
        icon: const Icon(Icons.add_rounded),
        label: const Text('New property',
            style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          _listHeader(),
          Expanded(
            child: RefreshIndicator(
              color: PiColors.primary,
              onRefresh: loadProperties,
              child: loading
                  ? _loadingList()
                  : filteredProperties.isEmpty
                      ? _emptyState()
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
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
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Properties', style: PiText.screenTitle),
          const SizedBox(height: 2),
          Text(
            loading
                ? 'Loading…'
                : '${filteredProperties.length} of ${properties.length} properties',
            style: PiText.screenSubtitle,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _searchController,
            onChanged: (v) => setState(() => searchTerm = v),
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Search property, code, area or city',
              hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
              prefixIcon:
                  const Icon(Icons.search_rounded, color: PiColors.muted, size: 20),
              suffixIcon: searchTerm.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: PiColors.muted),
                      onPressed: () => setState(() {
                        searchTerm = '';
                        _searchController.clear();
                      }),
                    ),
              filled: true,
              fillColor: PiColors.background,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(PiRadius.field),
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
                  const SizedBox(width: PiSpace.sm),
                ],
                _filterChip(
                  label: filterUnitType ?? 'Unit type',
                  active: filterUnitType != null,
                  onTap: () => _showPicker(
                    title: 'Unit type',
                    options: kUnitTypes,
                    selected: filterUnitType,
                    onSelected: (v) => setState(() => filterUnitType = v),
                  ),
                ),
                const SizedBox(width: PiSpace.sm),
                _filterChip(
                  label: filterCategory ?? 'Category',
                  active: filterCategory != null,
                  onTap: () => _showPicker(
                    title: 'Property category',
                    options: kPropertyCategories,
                    selected: filterCategory,
                    onSelected: (v) => setState(() => filterCategory = v),
                  ),
                ),
                const SizedBox(width: PiSpace.sm),
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
          color: active ? PiColors.primary : PiColors.background,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: active ? PiColors.primary : PiColors.hairline,
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
                color: active ? Colors.white : PiColors.ink,
              ),
            ),
            const SizedBox(width: 3),
            Icon(Icons.keyboard_arrow_down_rounded,
                size: 16, color: active ? Colors.white : PiColors.muted),
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
          color: PiColors.redSoft,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: PiColors.red),
            const SizedBox(width: PiSpace.xs),
            Text(label,
                style: const TextStyle(
                    fontSize: 12.5, fontWeight: FontWeight.w700, color: PiColors.red)),
          ],
        ),
      ),
    );
  }

  Widget _loadingList() {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => Container(
        height: 84,
        decoration: BoxDecoration(
          color: PiColors.surface,
          borderRadius: BorderRadius.circular(PiRadius.card),
          border: Border.all(color: PiColors.hairline),
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
          color: PiColors.primaryTint,
        ),
        const SizedBox(height: PiSpace.lg),
        Text(
          hasFilters ? 'No properties match' : 'No properties yet',
          textAlign: TextAlign.center,
          style: const TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: PiColors.ink),
        ),
        const SizedBox(height: 6),
        Text(
          hasFilters
              ? 'Try a different search term or clear your filters.'
              : 'Add your first property to start building your portfolio.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4),
        ),
        const SizedBox(height: 20),
        if (hasFilters)
          Center(
            child: OutlinedButton(
              onPressed: clearFilters,
              style: OutlinedButton.styleFrom(
                foregroundColor: PiColors.primary,
                side: const BorderSide(color: PiColors.primaryTint),
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.badge)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Text('Clear filters'),
            ),
          )
        else
          Center(
            child: ElevatedButton.icon(
              onPressed: openCreate,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add property'),
              style: ElevatedButton.styleFrom(
                backgroundColor: PiColors.primary,
                foregroundColor: Colors.white,
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.badge)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ),
      ],
    );
  }

  Widget _propertyCard(PropertyForm property) {
    final meta = property.typeMeta;
    return Material(
      color: PiColors.surface,
      borderRadius: BorderRadius.circular(PiRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(PiRadius.card),
        onTap: loading ? null : () => openEdit(property),
        child: Container(
          padding: const EdgeInsets.all(PiSpace.md),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(PiRadius.card),
            border: Border.all(color: PiColors.hairline),
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
              const SizedBox(width: PiSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(property.fullLabel,
                        style: PiText.cardTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(property.buildingLine,
                        style: PiText.cardMeta,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: PiSpace.sm),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 13, color: PiColors.muted),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(property.locationLine,
                              style: PiText.cardMeta,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                    if (property.unitType.isNotEmpty ||
                        property.propertyCategory.isNotEmpty) ...[
                      const SizedBox(height: PiSpace.sm),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          if (property.unitType.isNotEmpty)
                            _tag(property.unitType, meta.color),
                          if (property.propertyCategory.isNotEmpty)
                            _tag(property.propertyCategory, PiColors.primaryMid),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: PiSpace.xs),
              const Icon(Icons.chevron_right_rounded, color: PiColors.muted),
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

  // --------------------------------------------------------
  // FORM VIEW
  // --------------------------------------------------------
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
                  _formSection(
                    icon: Icons.apartment_rounded,
                    title: 'Property details',
                    subtitle: 'Name, code and unit information',
                    children: [
                      _field('Property Name *', 'propertyName',
                          placeholder: 'e.g. Marina Heights'),
                      _field('Property Code', 'propertyCode',
                          placeholder: 'e.g. PRP-0142'),
                      Row(
                        children: [
                          Expanded(
                            child: _pickerField(
                              label: 'Unit Type',
                              value: form.unitType,
                              placeholder: 'Select',
                              onTap: () => _showPicker(
                                title: 'Unit type',
                                options: kUnitTypes,
                                selected: form.unitType,
                                onSelected: (v) =>
                                    setState(() => form.unitType = v ?? ''),
                              ),
                            ),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _pickerField(
                              label: 'Category',
                              value: form.propertyCategory,
                              placeholder: 'Select',
                              onTap: () => _showPicker(
                                title: 'Property category',
                                options: kPropertyCategories,
                                selected: form.propertyCategory,
                                onSelected: (v) =>
                                    setState(() => form.propertyCategory = v ?? ''),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _field('Building Name', 'buildingName',
                                placeholder: 'e.g. Tower A'),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('Building No.', 'buildingNumber',
                                placeholder: 'e.g. B-12'),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _field('Unit Number', 'unitNumber',
                                placeholder: 'e.g. 204'),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('Floor Number', 'floorNumber',
                                placeholder: 'e.g. 2'),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _field('Tower / Wing', 'towerWing',
                                placeholder: 'e.g. Wing B'),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('Block Number', 'blockNumber',
                                placeholder: 'e.g. Block 4'),
                          ),
                        ],
                      ),
                      _field('Community / Area', 'communityArea',
                          placeholder: 'e.g. Dubai Marina'),
                    ],
                  ),
                  const SizedBox(height: PiSpace.lg),
                  _formSection(
                    icon: Icons.location_on_outlined,
                    title: 'Address & location',
                    subtitle: 'Where this property is physically located',
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _field('City', 'city', placeholder: 'e.g. Dubai'),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('State / Emirate', 'stateEmirate',
                                placeholder: 'e.g. Dubai'),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _field('Country', 'country',
                                placeholder: 'e.g. United Arab Emirates'),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('Postal Code', 'postalCode',
                                placeholder: 'e.g. 00000'),
                          ),
                        ],
                      ),
                      _field('GPS Location', 'gpsLocation',
                          placeholder: 'e.g. 25.0805, 55.1403'),
                      _field('Google Maps Link', 'googleMapsLink',
                          placeholder: 'https://maps.google.com/...'),
                    ],
                  ),
                  if (isEditing) ...[
                    const SizedBox(height: 20),
                    Center(
                      child: TextButton.icon(
                        onPressed: (saving || deleting) ? null : handleDelete,
                        icon: Icon(
                          deleting ? Icons.hourglass_top_rounded : Icons.delete_outline_rounded,
                          size: 18,
                          color: PiColors.red,
                        ),
                        label: Text(
                          deleting ? 'Deleting…' : 'Delete this property',
                          style: const TextStyle(
                              color: PiColors.red, fontWeight: FontWeight.w700),
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
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: (saving || deleting) ? null : backToList,
            icon: const Icon(Icons.arrow_back_rounded, color: PiColors.ink),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEditing ? 'Edit property' : 'New property',
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink),
                ),
                Text(
                  isEditing
                      ? 'Update the selected property'
                      : 'Fill in the property information',
                  style: PiText.screenSubtitle,
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
      padding: const EdgeInsets.all(PiSpace.lg),
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: PiColors.hairline),
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
                  color: PiColors.primarySoft,
                  borderRadius: BorderRadius.circular(PiRadius.badge),
                ),
                child: Icon(icon, color: PiColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
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
        child: Text(label.toUpperCase(), style: PiText.label),
      );

  Widget _field(String label, String key, {String? placeholder}) {
    final disabled = saving || deleting;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        TextField(
          controller: _controllers[key],
          enabled: !disabled,
          style: const TextStyle(fontSize: 14, color: PiColors.ink),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
            filled: true,
            fillColor: disabled ? const Color(0xFFF5F6FA) : PiColors.background,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(PiRadius.field),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(PiRadius.field),
              borderSide: const BorderSide(color: PiColors.primary, width: 1.4),
            ),
          ),
        ),
      ],
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        InkWell(
          onTap: disabled ? null : onTap,
          borderRadius: BorderRadius.circular(PiRadius.field),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              color: disabled ? const Color(0xFFF5F6FA) : PiColors.background,
              borderRadius: BorderRadius.circular(PiRadius.field),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    hasValue ? value : placeholder,
                    style: TextStyle(
                      fontSize: 14,
                      color: hasValue ? PiColors.ink : PiColors.muted,
                      fontWeight: hasValue ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
                const Icon(Icons.keyboard_arrow_down_rounded,
                    color: PiColors.muted, size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _formFooter() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(top: BorderSide(color: PiColors.hairline)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 50,
        child: ElevatedButton.icon(
          onPressed: (saving || deleting) ? null : handleSave,
          icon: Icon(saving ? Icons.hourglass_top_rounded : Icons.check_rounded, size: 20),
          label: Text(
            saving ? 'Saving…' : (isEditing ? 'Update property' : 'Save property'),
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: PiColors.primary,
            foregroundColor: Colors.white,
            disabledBackgroundColor: PiColors.primaryTint,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ),
    );
  }
}

// ============================================================
// Delete confirmation — bottom sheet instead of a desktop dialog,
// consistent with the picker sheets used through the rest of the flow.
// ============================================================
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
                  color: PiColors.hairline,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: PiColors.redSoft,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.delete_outline_rounded,
                  color: PiColors.red, size: 26),
            ),
            const SizedBox(height: 14),
            const Text('Delete property?',
                style: TextStyle(
                    fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink)),
            const SizedBox(height: 6),
            Text(
              '"$propertyLabel" will be permanently removed. This can\'t be undone.',
              style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: PiColors.ink,
                      side: const BorderSide(color: PiColors.hairline),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(PiRadius.field)),
                    ),
                    child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context, true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PiColors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(PiRadius.field)),
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