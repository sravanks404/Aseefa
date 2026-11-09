import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

class PiColors {
  static const Color primary = Color.fromARGB(255, 35, 0, 196);
  static const Color primaryDark = Color(0xFF17008C);
  static const Color primaryMid = Color(0xFF6F7FDB);
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

class PiSpace {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
}

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
  static const sectionSubtitle = TextStyle(fontSize: 12, color: PiColors.muted);
  static const cardTitle =
      TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: PiColors.ink);
  static const cardMeta =
      TextStyle(fontSize: 12, color: PiColors.muted, fontWeight: FontWeight.w500);
  static const label = TextStyle(
      fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .3, color: PiColors.primaryMid);
}

// ============================================================
class AmenitiesScreen extends StatelessWidget {
  const AmenitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: PiColors.background,
      body: AmenitiesBody(),
    );
  }
}

class AmenitiesBody extends StatefulWidget {
  const AmenitiesBody({super.key});

  @override
  State<AmenitiesBody> createState() => _AmenitiesBodyState();
}

class _AmenitiesBodyState extends State<AmenitiesBody> {
  List<PropertyModel> properties = [];

  PropertyModel? selectedProperty;

  bool propertiesLoading = false;
  bool amenitiesLoading = false;
  bool saving = false;

  String errorMessage = "";

  final Map<String, bool> enabled = {};
  final Map<String, String> details = {};
  final Map<String, int> amenityIds = {};

  String propertySearch = "";
  String searchTerm = "";

  String filterSection = "";
  String filterSelected = "";

  bool showAmenityList = false;

  DateTime? savedAt;

  final TextEditingController propertySearchController = TextEditingController();
  final TextEditingController searchController = TextEditingController();

  int companyId = 0;
  int userId = 0;

  final List<AmenitySection> sections = [
    AmenitySection(
      title: "Parking",
      icon: Icons.local_parking_rounded,
      items: [
        AmenityItem(
          keyName: "Parking Space",
          icon: Icons.directions_car_rounded,
          hasDetail: true,
          detailLabel: "Number of Spaces",
          placeholder: "e.g. 2",
          detailType: "spaces",
        ),
        AmenityItem(
          keyName: "Covered Parking",
          icon: Icons.garage_rounded,
          hasDetail: true,
          detailLabel: "Number of Spaces",
          placeholder: "e.g. 1",
          detailType: "spaces",
        ),
        AmenityItem(
          keyName: "Visitor Parking",
          icon: Icons.signpost_rounded,
          hasDetail: true,
          detailLabel: "Number of Spaces",
          placeholder: "e.g. 5",
          detailType: "spaces",
        ),
      ],
    ),
    AmenitySection(
      title: "Recreation & Leisure",
      icon: Icons.emoji_emotions_rounded,
      items: [
        AmenityItem(keyName: "Swimming Pool", icon: Icons.pool_rounded),
        AmenityItem(keyName: "Gym", icon: Icons.fitness_center_rounded),
        AmenityItem(keyName: "Children's Play Area", icon: Icons.child_friendly_rounded),
        AmenityItem(keyName: "Garden", icon: Icons.park_rounded),
      ],
    ),
    AmenitySection(
      title: "Safety & Security",
      icon: Icons.shield_rounded,
      items: [
        AmenityItem(keyName: "Security", icon: Icons.security_rounded),
        AmenityItem(keyName: "CCTV", icon: Icons.videocam_rounded),
        AmenityItem(keyName: "Fire Safety System", icon: Icons.local_fire_department_rounded),
        AmenityItem(keyName: "Smart Lock", icon: Icons.key_rounded),
      ],
    ),
    AmenitySection(
      title: "Building Systems",
      icon: Icons.apartment_rounded,
      items: [
        AmenityItem(keyName: "Lift", icon: Icons.elevator_rounded),
        AmenityItem(keyName: "Central AC", icon: Icons.ac_unit_rounded),
        AmenityItem(keyName: "Backup Generator", icon: Icons.battery_charging_full_rounded),
        AmenityItem(keyName: "Smart Home Features", icon: Icons.memory_rounded),
      ],
    ),
    AmenitySection(
      title: "Accessibility & Lifestyle",
      icon: Icons.favorite_rounded,
      items: [
        AmenityItem(keyName: "Wheelchair Accessibility", icon: Icons.accessible_rounded),
        AmenityItem(keyName: "Pet Friendly", icon: Icons.pets_rounded),
      ],
    ),
    AmenitySection(
      title: "Outdoor & Storage",
      icon: Icons.home_work_rounded,
      items: [
        AmenityItem(keyName: "Balcony", icon: Icons.balcony_rounded),
        AmenityItem(keyName: "Terrace", icon: Icons.wb_sunny_rounded),
        AmenityItem(
          keyName: "Storage Unit",
          icon: Icons.inventory_2_rounded,
          hasDetail: true,
          detailLabel: "Size / Notes",
          placeholder: "e.g. 6 sqm, basement level",
          detailType: "notes",
        ),
      ],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    propertySearchController.dispose();
    searchController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    companyId = await SessionStore.getCompanyId();
    userId = await SessionStore.getUserId();
    await loadProperties();
  }

  List<AmenityItem> get allAmenities => sections.expand((section) => section.items).toList();

  int get selectedCount =>
      allAmenities.where((item) => enabled[item.keyName] == true).length;

  int get totalCount => allAmenities.length;

  int get selectedPercentage {
    if (totalCount == 0) return 0;
    return ((selectedCount / totalCount) * 100).round();
  }

  String _apiFailureMessage(Object error, String action) {
    final text = error.toString();
    if (text.contains('<!DOCTYPE') || text.contains('<html')) {
      return 'Amenities backend is not available for $action. Check the API route and backend server.';
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

  Future<void> loadProperties() async {
    if (companyId == 0) {
      setState(() => errorMessage = "CompanyID not found. Please login again.");
      return;
    }

    setState(() {
      propertiesLoading = true;
      errorMessage = "";
    });

    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/getPropertyInformation')
          .replace(queryParameters: {'CompanyID': '$companyId'});

      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load properties');

      if (data["success"] == true) {
        final List list = data["data"] ?? [];
        if (!mounted) return;
        setState(() {
          properties = list
              .map(
                (e) => PropertyModel(
                  id: int.tryParse('${e["PropertyID"] ?? e["propertyId"] ?? e["id"] ?? 0}') ?? 0,
                  name: e["PropertyName"] ?? e["propertyName"] ?? "",
                  code: e["PropertyCode"] ?? e["propertyCode"] ?? "",
                ),
              )
              .toList();
        });
      } else {
        if (!mounted) return;
        setState(() {
          properties = [];
          errorMessage = data["message"] ?? "Failed to load properties.";
        });
      }
    } catch (e) {
      debugPrint('Load property error: $e');
      if (!mounted) return;
      setState(() => errorMessage = _apiFailureMessage(e, 'load properties'));
    } finally {
      if (mounted) setState(() => propertiesLoading = false);
    }
  }

  List<PropertyModel> get filteredProperties {
    final term = propertySearch.trim().toLowerCase();
    if (term.isEmpty) return properties;
    return properties.where((p) {
      final values = [p.name, p.code, '${p.id}'];
      return values.any((v) => v.toLowerCase().contains(term));
    }).toList();
  }

  // ========================================================
  // SELECT PROPERTY
  // ========================================================
  Future<void> selectProperty(PropertyModel property) async {
    setState(() {
      selectedProperty = property;
      showAmenityList = false;
      savedAt = null;
      errorMessage = "";

      enabled.clear();
      details.clear();
      amenityIds.clear();
    });

    await loadAmenities(property.id);
  }

  void changeProperty() {
    setState(() {
      selectedProperty = null;
      showAmenityList = false;
    });
  }

  Future<void> loadAmenities(int propertyId) async {
    setState(() {
      amenitiesLoading = true;
      errorMessage = "";
    });

    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/getPropertyAmenities').replace(
        queryParameters: {'PropertyID': '$propertyId', 'CompanyID': '$companyId'},
      );

      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load amenities');

      if (data["success"] == true) {
        final List rows = data["data"] ?? [];

        final Map<String, bool> newEnabled = {};
        final Map<String, String> newDetails = {};
        final Map<String, int> newIds = {};

        for (final row in rows) {
          final String name = row["AmenityName"] ?? row["amenityName"] ?? "";
          final item = findAmenity(name);
          if (item == null) continue;

          final bool available = row["IsAvailable"] == true || row["IsAvailable"] == 1;
          newEnabled[item.keyName] = available;

          if (row["AmenityID"] != null) {
            newIds[item.keyName] = int.tryParse(row["AmenityID"].toString()) ?? 0;
          }

          if (item.hasDetail) {
            if (item.detailType == "spaces") {
              newDetails[item.keyName] = (row["NumberOfSpaces"] ?? "").toString();
            } else {
              newDetails[item.keyName] = row["SizeOrNotes"] ?? "";
            }
          }
        }

        if (!mounted) return;
        setState(() {
          enabled
            ..clear()
            ..addAll(newEnabled);
          details
            ..clear()
            ..addAll(newDetails);
          amenityIds
            ..clear()
            ..addAll(newIds);
        });
      } else {
        if (!mounted) return;
        setState(() => errorMessage = data["message"] ?? "Failed to load amenities.");
      }
    } catch (e) {
      debugPrint('Load amenities error: $e');
      if (!mounted) return;
      setState(() => errorMessage = _apiFailureMessage(e, 'load amenities'));
    } finally {
      if (mounted) setState(() => amenitiesLoading = false);
    }
  }

  AmenityItem? findAmenity(String name) {
    for (final item in allAmenities) {
      if (item.keyName == name) return item;
    }
    return null;
  }

  Future<void> showAmenityDetail(AmenityItem item) async {
    final amenityId = amenityIds[item.keyName];
    if (amenityId == null || selectedProperty == null) return;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) {
        return AmenityDetailDialog(
          companyId: companyId,
          propertyId: selectedProperty!.id,
          amenityId: amenityId,
          item: item,
        );
      },
    );
  }


  Future<void> saveAmenities() async {
    if (selectedProperty == null) {
      _notify("Please select a property first.", isError: true);
      return;
    }
    if (companyId == 0) {
      _notify("CompanyID not found. Please login again.", isError: true);
      return;
    }
    if (userId == 0) {
      _notify("UserID not found. Please login again.", isError: true);
      return;
    }

    setState(() {
      saving = true;
      errorMessage = "";
    });

    try {
      final keysToDelete = amenityIds.keys
          .where((key) => amenityIds[key] != null && enabled[key] != true)
          .toList();

      for (final key in keysToDelete) {
        final response = await http.post(
          Uri.parse('${ApiConfig.baseUrl}/deletePropertyAmenities'),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode({
            "AmenityID": amenityIds[key],
            "PropertyID": selectedProperty!.id,
            "CompanyID": companyId,
            "UserID": userId,
          }),
        );

        final data = _decodeJsonBody(response.body, 'delete amenities');
        if (data["success"] != true) {
          throw Exception(data["message"] ?? "Unable to delete ${key}");
        }

        amenityIds.remove(key);
      }

      final enabledItems = allAmenities.where((item) => enabled[item.keyName] == true);

      for (final item in enabledItems) {
        int? numberOfSpaces;
        String? sizeOrNotes;

        if (item.hasDetail && item.detailType == "spaces") {
          final value = details[item.keyName];
          if (value != null && value.trim().isNotEmpty) {
            numberOfSpaces = int.tryParse(value);
          }
        }

        if (item.hasDetail && item.detailType == "notes") {
          final value = details[item.keyName];
          if (value != null && value.trim().isNotEmpty) {
            sizeOrNotes = value.trim();
          }
        }

        final payload = {
          "AmenityID": amenityIds[item.keyName],
          "PropertyID": selectedProperty!.id,
          "CompanyID": companyId,
          "AmenityCategory": getSectionName(item),
          "AmenityName": item.keyName,
          "IsAvailable": true,
          "NumberOfSpaces": numberOfSpaces,
          "SizeOrNotes": sizeOrNotes,
          "UserID": userId,
        };

        final response = await http.post(
          Uri.parse('${ApiConfig.baseUrl}/insertUpdatePropertyAmenities'),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode(payload),
        );

        final data = _decodeJsonBody(response.body, 'save amenities');

        if (data["success"] != true) {
          throw Exception(data["message"] ?? "Unable to save ${item.keyName}");
        }

        final savedRow = data["data"] is List
            ? (data["data"] as List).isNotEmpty
                ? data["data"][0]
                : null
            : data["data"];

        if (savedRow != null && savedRow["AmenityID"] != null) {
          amenityIds[item.keyName] = int.tryParse(savedRow["AmenityID"].toString()) ?? 0;
        }
      }

      await loadAmenities(selectedProperty!.id);

      if (!mounted) return;
      setState(() => savedAt = DateTime.now());

      _notify("Amenities saved successfully");
    } catch (e) {
      debugPrint('Save amenities error: $e');
      _notify(e.toString().replaceFirst("Exception: ", ""), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  String getSectionName(AmenityItem item) {
    for (final section in sections) {
      if (section.items.contains(item)) return section.title;
    }
    return "";
  }

  void toggleAmenity(AmenityItem item) {
    setState(() {
      enabled[item.keyName] = !(enabled[item.keyName] ?? false);
      savedAt = null;
    });
  }

  void selectAll() {
    setState(() {
      for (final item in allAmenities) {
        enabled[item.keyName] = true;
      }
      savedAt = null;
    });
  }

  void clearAll() {
    setState(() {
      enabled.clear();
      savedAt = null;
    });
  }

  void _notify(String message, {bool isError = false}) {
    if (!mounted) return;
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;

    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isError ? PiColors.red : PiColors.ink,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
        content: Row(
          children: [
            Icon(isError ? Icons.error_outline_rounded : Icons.check_circle_rounded,
                color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<AmenitySection> get visibleSections {
    final term = searchTerm.trim().toLowerCase();

    return sections
        .map((section) {
          if (filterSection.isNotEmpty && section.title != filterSection) {
            return AmenitySection(title: section.title, icon: section.icon, items: []);
          }

          final filtered = section.items.where((item) {
            if (term.isNotEmpty && !item.keyName.toLowerCase().contains(term)) {
              return false;
            }

            final isOn = enabled[item.keyName] == true;

            if (filterSelected == "Selected" && !isOn) return false;
            if (filterSelected == "Not Selected" && isOn) return false;

            return true;
          }).toList();

          return AmenitySection(title: section.title, icon: section.icon, items: filtered);
        })
        .where((section) => section.items.isNotEmpty)
        .toList();
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
            position:
                Tween<Offset>(begin: const Offset(0, .03), end: Offset.zero).animate(animation),
            child: child,
          ),
        ),
        child: selectedProperty == null
            ? _buildPropertyPicker(key: const ValueKey('picker'))
            : _buildPropertyScope(key: const ValueKey('scope')),
      ),
    );
  }

  Widget _buildPropertyPicker({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            decoration: const BoxDecoration(
              color: PiColors.surface,
              border: Border(bottom: BorderSide(color: PiColors.hairline)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Amenities', style: PiText.screenTitle),
                const SizedBox(height: 2),
                Text(
                  propertiesLoading ? 'Loading…' : 'Select a property to manage its amenities',
                  style: PiText.screenSubtitle,
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: propertySearchController,
                  onChanged: (v) => setState(() => propertySearch = v),
                  style: const TextStyle(fontSize: 14),
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: 'Search property, code or ID',
                    hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
                    prefixIcon:
                        const Icon(Icons.search_rounded, color: PiColors.muted, size: 20),
                    suffixIcon: propertySearch.isEmpty
                        ? null
                        : IconButton(
                            icon: const Icon(Icons.close_rounded, size: 18, color: PiColors.muted),
                            onPressed: () => setState(() {
                              propertySearch = '';
                              propertySearchController.clear();
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
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: PiColors.primary,
              onRefresh: loadProperties,
              child: loadingOrEmptyOrList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget loadingOrEmptyOrList() {
    if (propertiesLoading) return _loadingList();

    if (properties.isEmpty || filteredProperties.isEmpty) {
      return _emptyState(
        icon: Icons.home_work_outlined,
        title: properties.isEmpty ? 'No properties found' : 'No properties match',
        subtitle: properties.isEmpty
            ? 'No properties are available for this company.'
            : 'Try a different search term.',
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        if (errorMessage.isNotEmpty) _buildErrorCard(),
        ...filteredProperties.map(_propertyCard),
      ],
    );
  }

  Widget _propertyCard(PropertyModel property) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: Material(
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
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: PiColors.primarySoft,
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: const Icon(Icons.business_rounded, color: PiColors.primary, size: 22),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        property.name.isNotEmpty ? property.name : property.code,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: PiText.cardTitle,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        property.code.isNotEmpty ? property.code : "Property ID: ${property.id}",
                        style: PiText.cardMeta,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: PiColors.muted),
              ],
            ),
          ),
        ),
      ),
    );
  }


  Widget _buildPropertyScope({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: amenitiesLoading
          ? const Center(child: CircularProgressIndicator(color: PiColors.primary))
          : (showAmenityList ? _buildAmenities() : _buildAmenityProfile()),
      bottomNavigationBar: showAmenityList ? _buildBottomBar() : null,
    );
  }

  Widget _selectedPropertyHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 10, 16, 12),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: showAmenityList
                ? () => setState(() => showAmenityList = false)
                : changeProperty,
            icon: const Icon(Icons.arrow_back_rounded, color: PiColors.ink),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Amenities', style: PiText.screenTitle),
                Text(
                  selectedProperty?.name.isNotEmpty == true
                      ? selectedProperty!.name
                      : (selectedProperty?.code ?? ''),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: PiText.screenSubtitle,
                ),
              ],
            ),
          ),
          if (!showAmenityList)
            TextButton(onPressed: changeProperty, child: const Text('Change')),
        ],
      ),
    );
  }


  Widget _buildAmenityProfile() {
    return Column(
      children: [
        _selectedPropertyHeader(),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(PiSpace.lg),
            children: [
              if (errorMessage.isNotEmpty) _buildErrorCard(),
              Material(
                color: PiColors.surface,
                borderRadius: BorderRadius.circular(PiRadius.card),
                child: InkWell(
                  borderRadius: BorderRadius.circular(PiRadius.card),
                  onTap: () => setState(() => showAmenityList = true),
                  child: Container(
                    padding: const EdgeInsets.all(PiSpace.lg),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(PiRadius.card),
                      border: Border.all(color: PiColors.hairline),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: PiColors.primarySoft,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.tune_rounded, color: PiColors.primary),
                        ),
                        const SizedBox(width: PiSpace.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Amenity Profile', style: PiText.cardTitle),
                              const SizedBox(height: 4),
                              Text(
                                selectedCount > 0
                                    ? "$selectedCount of $totalCount amenities selected"
                                    : "Configure amenities for this property",
                                style: PiText.cardMeta,
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: PiColors.primary),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: PiSpace.lg),
              _buildCoverageCard(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAmenities() {
    return Column(
      children: [
        _selectedPropertyHeader(),
        Expanded(
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(PiSpace.lg, PiSpace.lg, PiSpace.lg, 110),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildCoverageCard(),
                    const SizedBox(height: PiSpace.lg),
                    _buildSearchBar(),
                    const SizedBox(height: 10),
                    _buildQuickActions(),
                    const SizedBox(height: PiSpace.lg),
                    if (errorMessage.isNotEmpty) _buildErrorCard(),
                    if (visibleSections.isEmpty) _buildNoResults(),
                    ...visibleSections.map((section) => _buildSection(section)),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCoverageCard() {
    return Container(
      padding: const EdgeInsets.all(PiSpace.lg),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('Amenity Coverage', style: PiText.cardTitle),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: PiColors.primarySoft,
                  borderRadius: BorderRadius.circular(PiRadius.badge),
                ),
                child: Text(
                  "$selectedPercentage%",
                  style: const TextStyle(
                      color: PiColors.primary, fontSize: 12, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ClipRRect(
            borderRadius: BorderRadius.circular(100),
            child: LinearProgressIndicator(
              minHeight: 8,
              value: totalCount == 0 ? 0 : selectedCount / totalCount,
              backgroundColor: PiColors.primarySoft,
              valueColor: const AlwaysStoppedAnimation(PiColors.primary),
            ),
          ),
          const SizedBox(height: 9),
          Row(
            children: [
              Text(
                "$selectedCount / $totalCount selected",
                style: const TextStyle(
                    color: PiColors.primary, fontSize: 11, fontWeight: FontWeight.w700),
              ),
              const Spacer(),
              const Text('Complete', style: TextStyle(color: PiColors.muted, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.field),
        border: Border.all(color: PiColors.hairline),
      ),
      child: TextField(
        controller: searchController,
        onChanged: (value) => setState(() => searchTerm = value),
        decoration: InputDecoration(
          hintText: "Search amenities...",
          hintStyle: const TextStyle(color: PiColors.muted, fontSize: 13),
          prefixIcon: const Icon(Icons.search_rounded, color: PiColors.primary, size: 21),
          suffixIcon: searchTerm.isNotEmpty
              ? IconButton(
                  onPressed: () {
                    searchController.clear();
                    setState(() => searchTerm = "");
                  },
                  icon: const Icon(Icons.close_rounded, size: 19),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _actionButton(
              icon: Icons.check_circle_outline_rounded, title: "Select All", onTap: selectAll),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _actionButton(
              icon: Icons.remove_circle_outline_rounded, title: "Clear All", onTap: clearAll),
        ),
        const SizedBox(width: 8),
        _filterButton(),
      ],
    );
  }

  Widget _actionButton({required IconData icon, required String title, required VoidCallback onTap}) {
    return Material(
      color: PiColors.surface,
      borderRadius: BorderRadius.circular(PiRadius.button),
      child: InkWell(
        borderRadius: BorderRadius.circular(PiRadius.button),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(PiRadius.button),
            border: Border.all(color: PiColors.hairline),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: PiColors.primary, size: 17),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  title,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: PiColors.primary, fontSize: 11, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _filterButton() {
    final count = [filterSection, filterSelected].where((e) => e.isNotEmpty).length;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        InkWell(
          borderRadius: BorderRadius.circular(PiRadius.button),
          onTap: showFilterDialog,
          child: Container(
            width: 46,
            height: 43,
            decoration: BoxDecoration(
              color: PiColors.primarySoft,
              borderRadius: BorderRadius.circular(PiRadius.button),
              border: Border.all(color: PiColors.primaryTint),
            ),
            child: const Icon(Icons.tune_rounded, color: PiColors.primary, size: 20),
          ),
        ),
        if (count > 0)
          Positioned(
            top: -5,
            right: -5,
            child: Container(
              width: 18,
              height: 18,
              decoration: const BoxDecoration(color: PiColors.red, shape: BoxShape.circle),
              alignment: Alignment.center,
              child: Text(
                "$count",
                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildSection(AmenitySection section) {
    final selectedInSection =
        section.items.where((item) => enabled[item.keyName] == true).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: PiColors.primarySoft,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(section.icon, color: PiColors.primary, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(section.title, style: PiText.cardTitle),
                    const SizedBox(height: 2),
                    Text(
                      "$selectedInSection of ${section.items.length} selected",
                      style: const TextStyle(
                          color: PiColors.muted, fontSize: 10, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        ...section.items.map((item) => _buildAmenityCard(item)),
        const SizedBox(height: 14),
      ],
    );
  }

  Widget _buildAmenityCard(AmenityItem item) {
    final bool isOn = enabled[item.keyName] == true;
    final bool hasSavedId = amenityIds[item.keyName] != null;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isOn ? PiColors.primarySoft : PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(
          color: isOn ? PiColors.primaryTint : PiColors.hairline,
          width: isOn ? 1.2 : 1,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: isOn ? PiColors.primary : PiColors.primarySoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(item.icon, color: isOn ? Colors.white : PiColors.primary, size: 21),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Text(item.keyName, style: PiText.cardTitle),
              ),
              if (hasSavedId)
                InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () => showAmenityDetail(item),
                  child: const Padding(
                    padding: EdgeInsets.all(5),
                    child: Icon(Icons.info_outline_rounded, color: PiColors.primaryMid, size: 19),
                  ),
                ),
              const SizedBox(width: 5),
              Switch.adaptive(
                value: isOn,
                activeColor: PiColors.primary,
                onChanged: (_) => toggleAmenity(item),
              ),
            ],
          ),
          if (isOn && item.hasDetail)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: _buildDetailField(item),
            ),
        ],
      ),
    );
  }

  Widget _buildDetailField(AmenityItem item) {
    return TextField(
      keyboardType: item.detailType == "spaces" ? TextInputType.number : TextInputType.text,
      onChanged: (value) {
        details[item.keyName] = value;
        savedAt = null;
      },
      controller: TextEditingController(text: details[item.keyName] ?? "")
        ..selection = TextSelection.collapsed(offset: (details[item.keyName] ?? "").length),
      decoration: InputDecoration(
        labelText: item.detailLabel,
        hintText: item.placeholder,
        labelStyle: const TextStyle(color: PiColors.primary, fontSize: 11, fontWeight: FontWeight.w700),
        hintStyle: const TextStyle(color: PiColors.muted, fontSize: 11),
        filled: true,
        fillColor: Colors.white,
        prefixIcon: Icon(
          item.detailType == "spaces" ? Icons.numbers_rounded : Icons.notes_rounded,
          color: PiColors.primary,
          size: 19,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PiRadius.field),
          borderSide: const BorderSide(color: PiColors.hairline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PiRadius.field),
          borderSide: const BorderSide(color: PiColors.hairline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(PiRadius.field),
          borderSide: const BorderSide(color: PiColors.primary, width: 1.3),
        ),
      ),
    );
  }

  Widget _buildNoResults() {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(35),
      decoration: _cardDecoration(),
      child: const Column(
        children: [
          Icon(Icons.search_off_rounded, color: PiColors.hairline, size: 45),
          SizedBox(height: 12),
          Text('No amenities found',
              style: TextStyle(color: PiColors.ink, fontWeight: FontWeight.w800, fontSize: 14)),
          SizedBox(height: 5),
          Text('Try changing your search or filters.',
              style: TextStyle(color: PiColors.muted, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildErrorCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: PiColors.redSoft,
        borderRadius: BorderRadius.circular(PiRadius.button),
        border: Border.all(color: const Color(0xFFF5B8B8)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: PiColors.red, size: 20),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              errorMessage,
              style: const TextStyle(color: PiColors.red, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _loadingList() {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
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

  Widget _emptyState({required IconData icon, required String title, required String subtitle}) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(icon, size: 56, color: PiColors.primaryTint),
        const SizedBox(height: PiSpace.lg),
        Text(title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: PiColors.ink)),
        const SizedBox(height: 6),
        Text(subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4)),
      ],
    );
  }


  void showFilterDialog() {
    String tempSection = filterSection;
    String tempSelected = filterSelected;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(
                left: PiSpace.lg,
                right: PiSpace.lg,
                top: PiSpace.lg,
                bottom: MediaQuery.of(context).viewInsets.bottom + PiSpace.lg,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                          color: PiColors.hairline, borderRadius: BorderRadius.circular(20)),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: PiColors.primarySoft,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.tune_rounded, color: PiColors.primary),
                      ),
                      const SizedBox(width: 10),
                      const Text('Filter Amenities',
                          style: TextStyle(
                              color: PiColors.ink, fontSize: 17, fontWeight: FontWeight.w800)),
                    ],
                  ),
                  const SizedBox(height: 22),
                  const Text('SECTION',
                      style: TextStyle(
                          color: PiColors.muted,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: .8)),
                  const SizedBox(height: 7),
                  DropdownButtonFormField<String>(
                    value: tempSection.isEmpty ? null : tempSection,
                    decoration: _dropdownDecoration("All sections"),
                    items: [
                      const DropdownMenuItem(value: "", child: Text("All sections")),
                      ...sections.map(
                        (section) => DropdownMenuItem(value: section.title, child: Text(section.title)),
                      ),
                    ],
                    onChanged: (value) => setModalState(() => tempSection = value ?? ""),
                  ),
                  const SizedBox(height: 18),
                  const Text('SELECTION STATUS',
                      style: TextStyle(
                          color: PiColors.muted,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: .8)),
                  const SizedBox(height: 7),
                  DropdownButtonFormField<String>(
                    value: tempSelected.isEmpty ? null : tempSelected,
                    decoration: _dropdownDecoration("All amenities"),
                    items: const [
                      DropdownMenuItem(value: "", child: Text("All amenities")),
                      DropdownMenuItem(value: "Selected", child: Text("Selected")),
                      DropdownMenuItem(value: "Not Selected", child: Text("Not Selected")),
                    ],
                    onChanged: (value) => setModalState(() => tempSelected = value ?? ""),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setState(() {
                              filterSection = "";
                              filterSelected = "";
                            });
                            Navigator.pop(context);
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: PiColors.primary,
                            side: const BorderSide(color: PiColors.hairline),
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(PiRadius.button)),
                          ),
                          child: const Text('Clear', style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {
                              filterSection = tempSection;
                              filterSelected = tempSelected;
                            });
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: PiColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(PiRadius.button)),
                          ),
                          child: const Text('Apply Filters',
                              style: TextStyle(fontWeight: FontWeight.w700)),
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

  InputDecoration _dropdownDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: PiColors.background,
      contentPadding: const EdgeInsets.symmetric(horizontal: 13, vertical: 13),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(PiRadius.field),
        borderSide: const BorderSide(color: PiColors.hairline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(PiRadius.field),
        borderSide: const BorderSide(color: PiColors.hairline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(PiRadius.field),
        borderSide: const BorderSide(color: PiColors.primary),
      ),
    );
  }

 
  Widget _buildBottomBar() {
    return Container(
      padding: EdgeInsets.fromLTRB(
        PiSpace.lg,
        10,
        PiSpace.lg,
        10 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(top: BorderSide(color: PiColors.hairline)),
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: saving ? null : () => setState(() => showAmenityList = false),
              icon: const Icon(Icons.arrow_back_rounded, size: 18),
              label: const Text("Back"),
              style: OutlinedButton.styleFrom(
                foregroundColor: PiColors.primary,
                side: const BorderSide(color: PiColors.hairline),
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: ElevatedButton.icon(
              onPressed: saving ? null : saveAmenities,
              icon: saving
                  ? const SizedBox(
                      width: 17,
                      height: 17,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.check_circle_rounded, size: 18),
              label: Text(saving ? "Saving..." : "Save Amenities"),
              style: ElevatedButton.styleFrom(
                backgroundColor: PiColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: PiColors.surface,
      borderRadius: BorderRadius.circular(PiRadius.card),
      border: Border.all(color: PiColors.hairline),
    );
  }
}


class PropertyModel {
  final int id;
  final String name;
  final String code;

  PropertyModel({required this.id, required this.name, required this.code});
}

class AmenitySection {
  final String title;
  final IconData icon;
  final List<AmenityItem> items;

  AmenitySection({required this.title, required this.icon, required this.items});
}

class AmenityItem {
  final String keyName;
  final IconData icon;
  final bool hasDetail;
  final String detailLabel;
  final String placeholder;
  final String detailType;

  AmenityItem({
    required this.keyName,
    required this.icon,
    this.hasDetail = false,
    this.detailLabel = "",
    this.placeholder = "",
    this.detailType = "",
  });
}

class AmenityDetailDialog extends StatefulWidget {
  final int companyId;
  final int propertyId;
  final int amenityId;
  final AmenityItem item;

  const AmenityDetailDialog({
    super.key,
    required this.companyId,
    required this.propertyId,
    required this.amenityId,
    required this.item,
  });

  @override
  State<AmenityDetailDialog> createState() => _AmenityDetailDialogState();
}

class _AmenityDetailDialogState extends State<AmenityDetailDialog> {
  bool loading = true;
  String? error;
  Map<String, dynamic>? row;

  @override
  void initState() {
    super.initState();
    loadDetail();
  }

  Future<void> loadDetail() async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/getPropertyAmenitiesByID').replace(
        queryParameters: {
          'AmenityID': '${widget.amenityId}',
          'PropertyID': '${widget.propertyId}',
          'CompanyID': '${widget.companyId}',
        },
      );

      final response = await http.get(uri);
      final data = jsonDecode(response.body);

      if (data["success"] == true) {
        final result = data["data"];

        setState(() {
          row = result is List
              ? (result.isNotEmpty ? Map<String, dynamic>.from(result[0]) : null)
              : result != null
                  ? Map<String, dynamic>.from(result)
                  : null;
          loading = false;
        });
      } else {
        setState(() {
          error = data["message"] ?? "Failed to load detail.";
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = "Failed to load amenity detail.";
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: const BoxDecoration(
                color: PiColors.primary,
                borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(.15),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(widget.item.icon, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      widget.item.keyName,
                      style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800),
                    ),
                  ),
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 30,
                      height: 30,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: loading
                  ? const Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator(color: PiColors.primary),
                    )
                  : error != null
                      ? Text(error!, style: const TextStyle(color: PiColors.red, fontSize: 12))
                      : row == null
                          ? const Text("No details found.",
                              style: TextStyle(color: PiColors.muted))
                          : Column(
                              children: [
                                _detailRow("Amenity ID", row!["AmenityID"]?.toString() ?? "—"),
                                _detailRow(
                                  "Available",
                                  (row!["IsAvailable"] == true || row!["IsAvailable"] == 1)
                                      ? "Yes"
                                      : "No",
                                ),
                                if (widget.item.detailType == "spaces")
                                  _detailRow("Spaces", row!["NumberOfSpaces"]?.toString() ?? "—"),
                                if (widget.item.detailType == "notes")
                                  _detailRow("Notes", row!["SizeOrNotes"]?.toString() ?? "—"),
                              ],
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Text(title, style: const TextStyle(color: PiColors.muted, fontSize: 12)),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(color: PiColors.ink, fontSize: 12, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}