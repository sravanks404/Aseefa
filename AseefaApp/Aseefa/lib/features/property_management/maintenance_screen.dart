import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/config/design_tokens.dart';
import 'package:suitapps/core/session_store.dart';

class PropertyModel {
  final int propertyId;
  final String propertyName;
  final String propertyCode;

  PropertyModel({
    required this.propertyId,
    required this.propertyName,
    required this.propertyCode,
  });

  factory PropertyModel.fromJson(Map<String, dynamic> json) {
    return PropertyModel(
      propertyId: _parseInt(json['PropertyID']),
      propertyName: _parseString(json['PropertyName']),
      propertyCode: _parseString(json['PropertyCode']),
    );
  }

  String get displayName {
    if (propertyName.trim().isNotEmpty) return propertyName.trim();
    if (propertyCode.trim().isNotEmpty) return propertyCode.trim();
    return 'Property #$propertyId';
  }

  static int _parseInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is double) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }

  static String _parseString(dynamic v) => v?.toString() ?? '';
}


const List<String> kYesNo = ['Yes', 'No'];

const List<String> kCostFrequencies = [
  'One Time',
  'Monthly',
  'Quarterly',
  'Half Yearly',
  'Yearly',
];

// ============================================================
class MaintenanceScreen extends StatelessWidget {
  const MaintenanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: PiColors.background,
      body: MaintenanceBody(),
    );
  }
}


class MaintenanceBody extends StatefulWidget {
  const MaintenanceBody({super.key});

  @override
  State<MaintenanceBody> createState() => _MaintenanceBodyState();
}

class _MaintenanceBodyState extends State<MaintenanceBody> {
  // --- list state ---
  List<PropertyModel> properties = [];
  bool loadingProperties = false;
  String searchTerm = '';
  final TextEditingController _searchController = TextEditingController();

  // --- selected property / detail state ---
  PropertyModel? selectedProperty;
  bool showForm = false;
  bool loadingMaintenance = false;
  bool hasMaintenance = false;

  // --- form fields ---
  int maintenanceId = 0;

  String lastMaintenanceDate = '';
  String nextScheduledMaintenance = '';

  String amcAvailable = '';
  String amcStartDate = '';
  String amcEndDate = '';
  final TextEditingController amcContractNoController = TextEditingController();

  String warrantyAvailable = '';
  String warrantyExpiryDate = '';
  final TextEditingController warrantyDetailsController = TextEditingController();

  final TextEditingController contractorNameController = TextEditingController();
  final TextEditingController contractorPhoneController = TextEditingController();
  final TextEditingController contractorEmailController = TextEditingController();
  final TextEditingController contractorAddressController = TextEditingController();
  final TextEditingController serviceProviderController = TextEditingController();
  final TextEditingController serviceContactController = TextEditingController();

  final TextEditingController maintenanceCostController = TextEditingController();
  String costFrequency = '';

  final TextEditingController repairHistoryController = TextEditingController();
  final TextEditingController inspectionReportsController = TextEditingController();

  // --- request state ---
  bool saving = false;
  bool deleting = false;

  @override
  void initState() {
    super.initState();
    loadProperties();
  }

  @override
  void dispose() {
    _searchController.dispose();
    amcContractNoController.dispose();
    warrantyDetailsController.dispose();
    contractorNameController.dispose();
    contractorPhoneController.dispose();
    contractorEmailController.dispose();
    contractorAddressController.dispose();
    serviceProviderController.dispose();
    serviceContactController.dispose();
    maintenanceCostController.dispose();
    repairHistoryController.dispose();
    inspectionReportsController.dispose();
    super.dispose();
  }


  Future<int> _getCompanyId() async => SessionStore.getCompanyId();
  Future<int> _getUserId() async => SessionStore.getUserId();

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

  String _apiFailureMessage(Object error, String action) {
    final text = error.toString();
    if (text.contains('<!DOCTYPE') || text.contains('<html')) {
      return 'Maintenance backend is not available for $action. Check the API route and backend server.';
    }
    if (text.contains('TimeoutException')) {
      return 'Server request timed out. Please try again.';
    }
    return 'Failed to $action.';
  }

  // ========================================================
  // LOAD PROPERTIES
  // ========================================================
  Future<void> loadProperties() async {
    final companyID = await _getCompanyId();

    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() => loadingProperties = true);

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
              .map((e) => PropertyModel.fromJson(Map<String, dynamic>.from(e)))
              .toList();
        });
      } else {
        if (!mounted) return;
        setState(() => properties = []);
        _notify(data['message']?.toString() ?? 'Failed to load properties.', isError: true);
      }
    } catch (e) {
      debugPrint('Load property error: $e');
      if (!mounted) return;
      setState(() => properties = []);
      _notify(_apiFailureMessage(e, 'load properties'), isError: true);
    } finally {
      if (mounted) setState(() => loadingProperties = false);
    }
  }

  List<PropertyModel> get filteredProperties {
    final term = searchTerm.trim().toLowerCase();
    if (term.isEmpty) return properties;

    return properties.where((p) {
      final values = [p.propertyName, p.propertyCode];
      return values
          .where((v) => v.trim().isNotEmpty)
          .any((v) => v.toLowerCase().contains(term));
    }).toList();
  }

  void clearSearch() {
    setState(() {
      searchTerm = '';
      _searchController.clear();
    });
  }

  Future<void> _loadMaintenance(int propertyId) async {
    final companyID = await _getCompanyId();

    if (companyID == 0 || propertyId == 0) {
      _clearForm();
      return;
    }

    setState(() => loadingMaintenance = true);

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyMaintenance').replace(
        queryParameters: {
          'PropertyID': '$propertyId',
          'CompanyID': '$companyID',
        },
      );

      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load maintenance');

      if (data['success'] != true) {
        throw Exception(data['message']?.toString() ?? 'Failed to load maintenance details.');
      }

      final List list = data['data'] is List ? data['data'] : [];

      if (list.isEmpty) {
        _clearForm();
        if (!mounted) return;
        setState(() => hasMaintenance = false);
        return;
      }

      _mapMaintenanceToForm(Map<String, dynamic>.from(list.first));

      if (!mounted) return;
      setState(() => hasMaintenance = maintenanceId > 0);
    } catch (e) {
      debugPrint('Load maintenance error: $e');
      _clearForm();
      if (!mounted) return;
      setState(() => hasMaintenance = false);
      _notify(_apiFailureMessage(e, 'load maintenance'), isError: true);
    } finally {
      if (mounted) setState(() => loadingMaintenance = false);
    }
  }

  void _mapMaintenanceToForm(Map<String, dynamic> data) {
    maintenanceId = _toInt(data['MaintenanceID']);

    lastMaintenanceDate = _toDateOnly(data['LastMaintenanceDate']);
    nextScheduledMaintenance = _toDateOnly(data['NextScheduledMaintenance']);

    amcAvailable = _toText(data['AMCAvailable']);
    amcStartDate = _toDateOnly(data['AMCStartDate']);
    amcEndDate = _toDateOnly(data['AMCEndDate']);
    amcContractNoController.text = _toText(data['AMCContractNumber']);

    warrantyAvailable = _toText(data['WarrantyAvailable']);
    warrantyExpiryDate = _toDateOnly(data['WarrantyExpiryDate']);
    warrantyDetailsController.text = _toText(data['WarrantyDetails']);

    contractorNameController.text = _toText(data['ContractorName']);
    contractorPhoneController.text = _toText(data['PhoneNumber']);
    contractorEmailController.text = _toText(data['EmailAddress']);
    contractorAddressController.text = _toText(data['ContractorAddress']);
    serviceProviderController.text = _toText(data['ServiceProvider']);
    serviceContactController.text = _toText(data['ServiceContact']);

    maintenanceCostController.text = _toText(data['MaintenanceCost']);
    costFrequency = _toText(data['MaintenanceCostFrequency']);

    repairHistoryController.text = _toText(data['RepairHistory']);
    inspectionReportsController.text = _toText(data['InspectionReports']);
  }

  void _clearForm() {
    maintenanceId = 0;

    lastMaintenanceDate = '';
    nextScheduledMaintenance = '';

    amcAvailable = '';
    amcStartDate = '';
    amcEndDate = '';
    amcContractNoController.clear();

    warrantyAvailable = '';
    warrantyExpiryDate = '';
    warrantyDetailsController.clear();

    contractorNameController.clear();
    contractorPhoneController.clear();
    contractorEmailController.clear();
    contractorAddressController.clear();
    serviceProviderController.clear();
    serviceContactController.clear();

    maintenanceCostController.clear();
    costFrequency = '';

    repairHistoryController.clear();
    inspectionReportsController.clear();
  }


  Future<void> openProperty(PropertyModel property) async {
    FocusScope.of(context).unfocus();

    setState(() {
      selectedProperty = property;
      showForm = false;
    });

    await _loadMaintenance(property.propertyId);
  }

  void changeProperty() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();

    setState(() {
      selectedProperty = null;
      showForm = false;
      hasMaintenance = false;
    });

    _clearForm();
  }

  void openCreate() {
    FocusScope.of(context).unfocus();
    _clearForm();
    setState(() {
      hasMaintenance = false;
      showForm = true;
    });
  }

  Future<void> openEdit() async {
    if (selectedProperty == null) return;
    FocusScope.of(context).unfocus();
    await _loadMaintenance(selectedProperty!.propertyId);
    if (!mounted) return;
    setState(() => showForm = true);
  }

  void backToSummary() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() => showForm = false);
  }

  Future<void> handleReset() async {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();

    if (hasMaintenance && selectedProperty != null) {
      await _loadMaintenance(selectedProperty!.propertyId);
    } else {
      _clearForm();
      if (!mounted) return;
      setState(() {});
    }
  }


  Future<void> handleSave() async {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();

    final companyID = await _getCompanyId();
    final userID = await _getUserId();
    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }
    if (userID == 0) {
      _notify('UserID not found. Please login again.', isError: true);
      return;
    }
    if (propertyId == 0) {
      _notify('Please select a property.', isError: true);
      return;
    }

    final validationError = _validateForm();
    if (validationError != null) {
      _notify(validationError, isError: true);
      return;
    }

    setState(() => saving = true);

    try {
      final payload = {
        'MaintenanceID': maintenanceId > 0 ? maintenanceId : null,
        'PropertyID': propertyId,
        'LastMaintenanceDate': lastMaintenanceDate.isEmpty ? null : lastMaintenanceDate,
        'NextScheduledMaintenance':
            nextScheduledMaintenance.isEmpty ? null : nextScheduledMaintenance,
        'AMCAvailable': amcAvailable.isEmpty ? null : amcAvailable,
        'AMCContractNumber': _nullableString(amcContractNoController.text),
        'AMCStartDate': amcStartDate.isEmpty ? null : amcStartDate,
        'AMCEndDate': amcEndDate.isEmpty ? null : amcEndDate,
        'WarrantyAvailable': warrantyAvailable.isEmpty ? null : warrantyAvailable,
        'WarrantyExpiryDate': warrantyExpiryDate.isEmpty ? null : warrantyExpiryDate,
        'WarrantyDetails': _nullableString(warrantyDetailsController.text),
        'ContractorName': _nullableString(contractorNameController.text),
        'PhoneNumber': _nullableString(contractorPhoneController.text),
        'EmailAddress': _nullableString(contractorEmailController.text),
        'ContractorAddress': _nullableString(contractorAddressController.text),
        'ServiceProvider': _nullableString(serviceProviderController.text),
        'ServiceContact': _nullableString(serviceContactController.text),
        'MaintenanceCost': _nullableDouble(maintenanceCostController.text),
        'MaintenanceCostFrequency': costFrequency.isEmpty ? null : costFrequency,
        'RepairHistory': _nullableString(repairHistoryController.text),
        'InspectionReports': _nullableString(inspectionReportsController.text),
        'CompanyID': companyID,
        'UserID': userID,
      };

      final response = await http.post(
        Uri.parse('${ApiConfig.webUrl}/insertUpdatePropertyMaintenance'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final data = _decodeJsonBody(response.body, 'save maintenance');

      if (response.statusCode < 200 || response.statusCode >= 300) {
        final reason = data['error']?.toString() ?? data['message']?.toString();
        throw Exception(reason ?? 'HTTP ${response.statusCode}');
      }

      if (data['success'] != true) {
        final reason = data['error']?.toString() ?? data['message']?.toString();
        throw Exception(reason ?? 'Maintenance could not be saved.');
      }

      final responseData = data['data'];
      final savedId = _toInt(
        data['MaintenanceID'] ??
            (responseData is Map<String, dynamic> ? responseData['MaintenanceID'] : null) ??
            (responseData is List && responseData.isNotEmpty && responseData.first is Map
                ? responseData.first['MaintenanceID']
                : null),
      );
      if (savedId > 0) maintenanceId = savedId;

      await _loadMaintenance(propertyId);

      if (!mounted) return;
      setState(() {
        hasMaintenance = true;
        showForm = false;
      });

      _notify(data['message']?.toString() ?? 'Maintenance saved successfully.');
    } catch (e) {
      debugPrint('Save maintenance error: $e');
      _notify(_apiFailureMessage(e, 'save maintenance'), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> handleDelete() async {
    if (deleting || saving) return;
    if (maintenanceId == 0) return;

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) =>
          _DeleteConfirmSheet(label: selectedProperty?.displayName ?? 'this record'),
    );

    if (confirmed != true) return;

    final companyID = await _getCompanyId();
    final userID = await _getUserId();
    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyID == 0 || userID == 0) {
      _notify('Session expired. Please login again.', isError: true);
      return;
    }
    if (propertyId == 0) {
      _notify('Property not selected.', isError: true);
      return;
    }

    setState(() => deleting = true);

    try {
      final request = http.Request(
        'POST',
        Uri.parse('${ApiConfig.webUrl}/deletePropertyMaintenance'),
      );
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'MaintenanceID': maintenanceId,
        'PropertyID': propertyId,
        'CompanyID': companyID,
        'UserID': userID,
      });

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      final data = _decodeJsonBody(response.body, 'delete maintenance');

      if (data['success'] != true) {
        _notify(data['message']?.toString() ?? 'Maintenance record could not be deleted.',
            isError: true);
        return;
      }

      _clearForm();

      if (!mounted) return;
      setState(() {
        hasMaintenance = false;
        showForm = false;
      });

      _notify(data['message']?.toString() ?? 'Maintenance record deleted successfully.');
    } catch (e) {
      debugPrint('Delete maintenance error: $e');
      _notify(_apiFailureMessage(e, 'delete maintenance'), isError: true);
    } finally {
      if (mounted) setState(() => deleting = false);
    }
  }


  String? _validateForm() {
    if (maintenanceCostController.text.trim().isNotEmpty) {
      final value = double.tryParse(maintenanceCostController.text.trim());
      if (value == null || value < 0) {
        return 'Please enter a valid Maintenance Cost.';
      }
    }

    if (contractorEmailController.text.trim().isNotEmpty) {
      final email = contractorEmailController.text.trim();
      final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
      if (!emailRegex.hasMatch(email)) {
        return 'Please enter a valid Email Address.';
      }
    }

    return null;
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
                        label: 'Not set',
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
        child: selectedProperty == null
            ? _buildList(key: const ValueKey('list'))
            : _buildDetail(key: const ValueKey('detail')),
      ),
    );
  }


  Widget _buildList({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: Column(
        children: [
          _listHeader(),
          Expanded(
            child: RefreshIndicator(
              color: PiColors.primary,
              onRefresh: loadProperties,
              child: loadingProperties
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
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Maintenance', style: PiText.screenTitle),
          const SizedBox(height: 2),
          Text(
            loadingProperties
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
              hintText: 'Search property name or code',
              hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
              prefixIcon:
                  const Icon(Icons.search_rounded, color: PiColors.muted, size: 20),
              suffixIcon: searchTerm.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: PiColors.muted),
                      onPressed: clearSearch,
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
    );
  }

  Widget _loadingList() {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, __) => Container(
        height: 78,
        decoration: BoxDecoration(
          color: PiColors.surface,
          borderRadius: BorderRadius.circular(PiRadius.card),
          border: Border.all(color: PiColors.hairline),
        ),
      ),
    );
  }

  Widget _emptyState() {
    final hasSearch = searchTerm.trim().isNotEmpty;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(
          hasSearch ? Icons.search_off_rounded : Icons.build_circle_outlined,
          size: 56,
          color: PiColors.primaryTint,
        ),
        const SizedBox(height: PiSpace.lg),
        Text(
          hasSearch ? 'No properties match' : 'No properties yet',
          textAlign: TextAlign.center,
          style: const TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: PiColors.ink),
        ),
        const SizedBox(height: 6),
        Text(
          hasSearch
              ? 'Try a different property name or code.'
              : 'No properties are available for this company.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4),
        ),
        if (hasSearch) ...[
          const SizedBox(height: 20),
          Center(
            child: OutlinedButton(
              onPressed: clearSearch,
              style: OutlinedButton.styleFrom(
                foregroundColor: PiColors.primary,
                side: const BorderSide(color: PiColors.primaryTint),
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.badge)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Text('Clear search'),
            ),
          ),
        ],
      ],
    );
  }

  Widget _propertyCard(PropertyModel property) {
    return Material(
      color: PiColors.surface,
      borderRadius: BorderRadius.circular(PiRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(PiRadius.card),
        onTap: loadingProperties ? null : () => openProperty(property),
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
                child: const Icon(Icons.home_work_outlined, color: PiColors.primary, size: 22),
              ),
              const SizedBox(width: PiSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(property.displayName,
                        style: PiText.cardTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Text(
                      property.propertyCode.isNotEmpty
                          ? property.propertyCode
                          : 'Property #${property.propertyId}',
                      style: PiText.cardMeta,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
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


  Widget _buildDetail({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: Column(
        children: [
          _detailHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              child: showForm ? _buildForm() : _buildSummary(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailHeader() {
    final property = selectedProperty!;

    return Container(
      padding: const EdgeInsets.fromLTRB(6, 10, 16, 14),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: (saving || deleting)
                ? null
                : (showForm ? backToSummary : changeProperty),
            icon: const Icon(Icons.arrow_back_rounded, color: PiColors.ink),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  property.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink),
                ),
                Text(
                  showForm
                      ? (hasMaintenance ? 'Edit maintenance' : 'New maintenance record')
                      : 'Maintenance profile',
                  style: PiText.screenSubtitle,
                ),
              ],
            ),
          ),
          if (loadingMaintenance)
            const Padding(
              padding: EdgeInsets.only(right: 6),
              child: SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: PiColors.primary),
              ),
            )
          else if (!showForm)
            OutlinedButton(
              onPressed: (saving || deleting) ? null : changeProperty,
              style: OutlinedButton.styleFrom(
                foregroundColor: PiColors.primary,
                side: const BorderSide(color: PiColors.primary),
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
              ),
              child: const Text('Change', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
            ),
        ],
      ),
    );
  }

  // ------------------------- SUMMARY -------------------------
  Widget _buildSummary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Material(
          color: PiColors.surface,
          borderRadius: BorderRadius.circular(PiRadius.card),
          child: InkWell(
            onTap: loadingMaintenance ? null : (hasMaintenance ? openEdit : openCreate),
            borderRadius: BorderRadius.circular(PiRadius.card),
            child: Container(
              padding: const EdgeInsets.all(PiSpace.lg),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(PiRadius.card),
                border: Border.all(color: PiColors.hairline),
              ),
              child: Row(
                children: [
                  Container(
                    width: 45,
                    height: 45,
                    decoration: BoxDecoration(
                        color: PiColors.primarySoft, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.tune_rounded, color: PiColors.primary),
                  ),
                  const SizedBox(width: PiSpace.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Maintenance Profile', style: PiText.sectionTitle),
                        const SizedBox(height: 4),
                        Text(
                          loadingMaintenance
                              ? 'Loading maintenance details...'
                              : (hasMaintenance
                                  ? 'Maintenance profile saved for this property'
                                  : 'No maintenance record yet'),
                          style: PiText.sectionSubtitle,
                        ),
                      ],
                    ),
                  ),
                  if (!loadingMaintenance) ...[
                    _statusBadge(),
                    const SizedBox(width: 6),
                    const Icon(Icons.chevron_right_rounded, color: PiColors.primary),
                  ],
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: PiSpace.lg),
        if (!loadingMaintenance)
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: hasMaintenance ? openEdit : openCreate,
                    icon: Icon(hasMaintenance ? Icons.edit_rounded : Icons.add_rounded, size: 19),
                    label: Text(hasMaintenance ? 'Update Maintenance' : 'Add Maintenance',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PiColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(PiRadius.button)),
                    ),
                  ),
                ),
              ),
              if (hasMaintenance) ...[
                const SizedBox(width: PiSpace.sm),
                SizedBox(
                  height: 50,
                  width: 50,
                  child: IconButton(
                    tooltip: 'Delete',
                    onPressed: handleDelete,
                    style: IconButton.styleFrom(
                      backgroundColor: PiColors.redSoft,
                      foregroundColor: PiColors.red,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(PiRadius.button)),
                    ),
                    icon: const Icon(Icons.delete_outline_rounded),
                  ),
                ),
              ],
            ],
          ),
      ],
    );
  }

  Widget _statusBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: hasMaintenance ? PiColors.greenSoft : PiColors.background,
        borderRadius: BorderRadius.circular(PiRadius.badge),
      ),
      child: Text(
        hasMaintenance ? 'Saved' : 'New',
        style: TextStyle(
          color: hasMaintenance ? PiColors.green : PiColors.muted,
          fontSize: 10.5,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }

  // ------------------------- FORM -------------------------
  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _formSection(
          icon: Icons.event_available_rounded,
          title: 'Maintenance Information',
          subtitle: 'Track previous and upcoming maintenance',
          children: [
            Row(
              children: [
                Expanded(
                  child: _dateField(
                    label: 'Last Maintenance Date',
                    value: lastMaintenanceDate,
                    onChanged: (v) => setState(() => lastMaintenanceDate = v),
                  ),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _dateField(
                    label: 'Next Scheduled Maintenance',
                    value: nextScheduledMaintenance,
                    onChanged: (v) => setState(() => nextScheduledMaintenance = v),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: PiSpace.lg),
        _formSection(
          icon: Icons.description_outlined,
          title: 'Annual Maintenance Contract (AMC)',
          subtitle: 'Manage AMC agreement and validity details',
          children: [
            Row(
              children: [
                Expanded(
                  child: _pickerField(
                    label: 'AMC Available',
                    value: amcAvailable,
                    placeholder: 'Select',
                    onTap: () => _showPicker(
                      title: 'AMC Available',
                      options: kYesNo,
                      selected: amcAvailable,
                      onSelected: (v) => setState(() => amcAvailable = v ?? ''),
                    ),
                  ),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _field('AMC Contract Number', amcContractNoController,
                      placeholder: 'e.g. AMC-2026-001'),
                ),
              ],
            ),
            Row(
              children: [
                Expanded(
                  child: _dateField(
                    label: 'AMC Start Date',
                    value: amcStartDate,
                    onChanged: (v) => setState(() => amcStartDate = v),
                  ),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _dateField(
                    label: 'AMC End Date',
                    value: amcEndDate,
                    onChanged: (v) => setState(() => amcEndDate = v),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: PiSpace.lg),
        _formSection(
          icon: Icons.verified_user_outlined,
          title: 'Warranty Information',
          subtitle: 'Record warranty coverage and expiry',
          children: [
            Row(
              children: [
                Expanded(
                  child: _pickerField(
                    label: 'Warranty Available',
                    value: warrantyAvailable,
                    placeholder: 'Select',
                    onTap: () => _showPicker(
                      title: 'Warranty Available',
                      options: kYesNo,
                      selected: warrantyAvailable,
                      onSelected: (v) => setState(() => warrantyAvailable = v ?? ''),
                    ),
                  ),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _dateField(
                    label: 'Warranty Expiry Date',
                    value: warrantyExpiryDate,
                    onChanged: (v) => setState(() => warrantyExpiryDate = v),
                  ),
                ),
              ],
            ),
            _field('Warranty Details', warrantyDetailsController,
                placeholder: 'Enter warranty coverage, equipment details or terms...',
                maxLines: 4),
          ],
        ),
        const SizedBox(height: PiSpace.lg),
        _formSection(
          icon: Icons.badge_outlined,
          title: 'Contractor Details',
          subtitle: 'Contact information for the maintenance contractor',
          children: [
            Row(
              children: [
                Expanded(
                  child: _field('Contractor Name', contractorNameController,
                      placeholder: 'Enter contractor name'),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _field('Phone Number', contractorPhoneController,
                      placeholder: 'Enter phone number',
                      keyboardType: TextInputType.phone),
                ),
              ],
            ),
            Row(
              children: [
                Expanded(
                  child: _field('Email Address', contractorEmailController,
                      placeholder: 'contractor@example.com',
                      keyboardType: TextInputType.emailAddress),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _field('Service Provider', serviceProviderController,
                      placeholder: 'Company / service provider'),
                ),
              ],
            ),
            _field('Service Contact', serviceContactController,
                placeholder: 'Service contact number', keyboardType: TextInputType.phone),
            _field('Contractor Address', contractorAddressController,
                placeholder: 'Enter contractor address...', maxLines: 3),
          ],
        ),
        const SizedBox(height: PiSpace.lg),
        _formSection(
          icon: Icons.attach_money_rounded,
          title: 'Maintenance Cost',
          subtitle: 'Record recurring maintenance expenses',
          children: [
            Row(
              children: [
                Expanded(
                  child: _field('Maintenance Cost', maintenanceCostController,
                      placeholder: '0.00',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}'))
                      ]),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _pickerField(
                    label: 'Frequency',
                    value: costFrequency,
                    placeholder: 'Select frequency',
                    onTap: () => _showPicker(
                      title: 'Cost Frequency',
                      options: kCostFrequencies,
                      selected: costFrequency,
                      onSelected: (v) => setState(() => costFrequency = v ?? ''),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: PiSpace.lg),
        _formSection(
          icon: Icons.build_outlined,
          title: 'Repair History',
          subtitle: 'Record previous repairs and maintenance work',
          children: [
            _field('Repair History', repairHistoryController,
                placeholder:
                    'Enter repair details, dates, work performed and associated costs...',
                maxLines: 4),
          ],
        ),
        const SizedBox(height: PiSpace.lg),
        _formSection(
          icon: Icons.fact_check_outlined,
          title: 'Inspection Reports',
          subtitle: 'Record inspection findings and report references',
          children: [
            Container(
              padding: const EdgeInsets.all(PiSpace.md),
              margin: const EdgeInsets.only(bottom: PiSpace.lg),
              decoration: BoxDecoration(
                color: PiColors.primarySoft,
                borderRadius: BorderRadius.circular(PiRadius.field - 3),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info_rounded, size: 16, color: PiColors.primary),
                  const SizedBox(width: PiSpace.sm),
                  Expanded(
                    child: Text(
                      'Add inspection dates, findings, safety observations, report numbers or other relevant inspection information.',
                      style: TextStyle(fontSize: 12, color: PiColors.primaryDark, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            _field('Inspection Reports', inspectionReportsController,
                placeholder: 'Enter inspection report details...', maxLines: 4),
          ],
        ),
        const SizedBox(height: PiSpace.xl),
        _formFooter(),
      ],
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

  Widget _field(
    String label,
    TextEditingController controller, {
    String? placeholder,
    int maxLines = 1,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    final disabled = saving || deleting;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        TextField(
          controller: controller,
          enabled: !disabled,
          maxLines: maxLines,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          style: const TextStyle(fontSize: 14, color: PiColors.ink),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
            filled: true,
            fillColor: disabled ? const Color(0xFFF5F6FA) : PiColors.background,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
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

  Widget _dateField({
    required String label,
    required String value,
    required ValueChanged<String> onChanged,
  }) {
    final disabled = saving || deleting;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        InkWell(
          onTap: disabled ? null : () => _pickDate(value, onChanged),
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
                    value.isEmpty ? 'Select date' : value,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: value.isEmpty ? FontWeight.w400 : FontWeight.w600,
                      color: value.isEmpty ? PiColors.muted : PiColors.ink,
                    ),
                  ),
                ),
                const Icon(Icons.calendar_today_rounded, size: 16, color: PiColors.primary),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickDate(String currentValue, ValueChanged<String> onChanged) async {
    DateTime? initial;
    if (currentValue.isNotEmpty) {
      initial = DateTime.tryParse(currentValue);
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initial ?? DateTime.now(),
      firstDate: DateTime(1990),
      lastDate: DateTime(2100),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx)
            .copyWith(colorScheme: Theme.of(ctx).colorScheme.copyWith(primary: PiColors.primary)),
        child: child!,
      ),
    );

    if (picked != null) {
      final formatted =
          '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      onChanged(formatted);
    }
  }

  Widget _formFooter() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: (saving || deleting) ? null : handleSave,
            icon: Icon(
              saving ? Icons.hourglass_top_rounded : Icons.check_rounded,
              size: 20,
            ),
            label: Text(
              saving ? 'Saving…' : (hasMaintenance ? 'Update Maintenance' : 'Save Maintenance'),
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
        const SizedBox(height: PiSpace.sm),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: (saving || deleting) ? null : handleReset,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Reset', style: TextStyle(fontWeight: FontWeight.w700)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: PiColors.primary,
                  side: const BorderSide(color: PiColors.primaryTint),
                  backgroundColor: PiColors.primarySoft,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape:
                      RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
                ),
              ),
            ),
            if (hasMaintenance) ...[
              const SizedBox(width: PiSpace.sm),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: (saving || deleting) ? null : handleDelete,
                  icon: Icon(
                    deleting ? Icons.hourglass_top_rounded : Icons.delete_outline_rounded,
                    size: 18,
                  ),
                  label: Text(deleting ? 'Deleting…' : 'Delete',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: PiColors.red,
                    side: const BorderSide(color: Color(0xFFFECACA)),
                    backgroundColor: PiColors.redSoft,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(PiRadius.button)),
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: PiSpace.sm),
        SizedBox(
          height: 46,
          child: OutlinedButton.icon(
            onPressed: (saving || deleting) ? null : backToSummary,
            icon: const Icon(Icons.arrow_back_rounded, size: 18),
            label: const Text('Back', style: TextStyle(fontWeight: FontWeight.w700)),
            style: OutlinedButton.styleFrom(
              foregroundColor: PiColors.ink,
              side: const BorderSide(color: PiColors.hairline),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
            ),
          ),
        ),
      ],
    );
  }

  // ========================================================
  // HELPERS
  // ========================================================
  int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  String _toText(dynamic value) => value == null ? '' : value.toString();

  String _toDateOnly(dynamic value) {
    final text = _toText(value);
    return text.length >= 10 ? text.substring(0, 10) : text;
  }

  String? _nullableString(String value) {
    final text = value.trim();
    return text.isEmpty ? null : text;
  }

  double? _nullableDouble(String value) {
    final text = value.trim();
    if (text.isEmpty) return null;
    return double.tryParse(text);
  }
}

class _DeleteConfirmSheet extends StatelessWidget {
  final String label;
  const _DeleteConfirmSheet({required this.label});

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
              child: const Icon(Icons.delete_outline_rounded, color: PiColors.red, size: 26),
            ),
            const SizedBox(height: 14),
            const Text('Delete maintenance record?',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink)),
            const SizedBox(height: 6),
            Text(
              'The maintenance record for "$label" will be permanently removed. This can\'t be undone.',
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