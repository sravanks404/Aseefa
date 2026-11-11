import 'dart:convert';
import 'package:flutter/material.dart';
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

class UtilityPaymentModel {
  final int utilityId;
  final String paymentId;
  final String utilityType;
  final String amount;
  final String dueDate;
  final String paidDate;
  final String status;
  final String referenceNumber;
  final String notes;

  UtilityPaymentModel({
    required this.utilityId,
    required this.paymentId,
    required this.utilityType,
    required this.amount,
    required this.dueDate,
    required this.paidDate,
    required this.status,
    required this.referenceNumber,
    required this.notes,
  });

  factory UtilityPaymentModel.fromJson(Map<String, dynamic> json) {
    String dateOnly(dynamic v) {
      final s = v?.toString() ?? '';
      return s.length >= 10 ? s.substring(0, 10) : s;
    }

    return UtilityPaymentModel(
      utilityId: _parseInt(json['UtilityID']),
      paymentId: json['PaymentID']?.toString() ?? '',
      utilityType: json['UtilityType']?.toString() ?? '',
      amount: json['PaymentAmount']?.toString() ?? '',
      dueDate: dateOnly(json['PaymentDueDate']),
      paidDate: dateOnly(json['PaidDate']),
      status: json['PaymentStatus']?.toString() ?? 'Pending',
      referenceNumber: json['ReferenceNumber']?.toString() ?? '',
      notes: json['Notes']?.toString() ?? '',
    );
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}


const List<String> kUtilityTypes = ['Electricity', 'Water', 'Gas', 'Internet'];
const List<String> kPaymentStatuses = ['Paid', 'Pending', 'Overdue'];


const Color _kWaterBlue = Color(0xFF0F6FB0);
const Color _kWaterBlueSoft = Color(0xFFE5F3FB);

const Map<String, IconData> kUtilityIcons = {
  'Electricity': Icons.bolt_rounded,
  'Water': Icons.water_drop_outlined,
  'Gas': Icons.local_fire_department_rounded,
  'Internet': Icons.wifi_rounded,
};

const Map<String, Color> kUtilityColors = {
  'Electricity': PiColors.accent,
  'Water': _kWaterBlue,
  'Gas': PiColors.red,
  'Internet': PiColors.green,
};

const Map<String, Color> kUtilitySoftColors = {
  'Electricity': PiColors.accentSoft,
  'Water': _kWaterBlueSoft,
  'Gas': PiColors.redSoft,
  'Internet': PiColors.greenSoft,
};

// ============================================================
class UtilitiesScreen extends StatelessWidget {
  const UtilitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: PiColors.background,
      body: UtilitiesBody(),
    );
  }
}


class UtilitiesBody extends StatefulWidget {
  const UtilitiesBody({super.key});

  @override
  State<UtilitiesBody> createState() => _UtilitiesBodyState();
}

class _UtilitiesBodyState extends State<UtilitiesBody> {
  
  List<PropertyModel> properties = [];
  bool loadingProperties = false;
  String propertySearchTerm = '';
  final TextEditingController _propertySearchController = TextEditingController();

  PropertyModel? selectedProperty;
  bool loadingUtilities = false;
  bool showForm = false;

  List<UtilityPaymentModel> payments = [];
  String paymentSearchTerm = '';
  String filterType = '';
  String filterStatus = '';
  final TextEditingController _paymentSearchController = TextEditingController();

  List<UtilityPaymentModel> get filteredPayments {
    final term = paymentSearchTerm.trim().toLowerCase();

    final sorted = [...payments]..sort((a, b) {
        final da = DateTime.tryParse(a.dueDate) ?? DateTime(1970);
        final db = DateTime.tryParse(b.dueDate) ?? DateTime(1970);
        return db.compareTo(da);
      });

    return sorted.where((p) {
      if (filterType.isNotEmpty && p.utilityType != filterType) return false;
      if (filterStatus.isNotEmpty && p.status != filterStatus) return false;
      if (term.isEmpty) return true;

      final haystack = [p.paymentId, p.utilityType, p.referenceNumber]
          .where((v) => v.trim().isNotEmpty)
          .map((v) => v.toLowerCase());

      return haystack.any((v) => v.contains(term));
    }).toList();
  }

  int get activeFilterCount =>
      (filterType.isNotEmpty ? 1 : 0) + (filterStatus.isNotEmpty ? 1 : 0);

  int paymentUtilityId = 0;
  String paymentId = '';
  String paymentUtilityType = 'Electricity';
  String paymentDueDate = '';
  String paymentPaidDate = '';
  String paymentStatus = 'Paid';

  final TextEditingController amountController = TextEditingController();
  final TextEditingController referenceNumberController = TextEditingController();
  final TextEditingController notesController = TextEditingController();

  bool get isEditingPayment => paymentUtilityId > 0;


  bool saving = false;
  bool deleting = false;

  @override
  void initState() {
    super.initState();
    loadProperties();
  }

  @override
  void dispose() {
    _propertySearchController.dispose();
    _paymentSearchController.dispose();

    amountController.dispose();
    referenceNumberController.dispose();
    notesController.dispose();

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
      return 'Utilities backend is not available for $action. Check the API route and backend server.';
    }
    if (text.contains('TimeoutException')) {
      return 'Server request timed out. Please try again.';
    }
    return 'Failed to $action.';
  }


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
    final term = propertySearchTerm.trim().toLowerCase();
    if (term.isEmpty) return properties;

    return properties.where((p) {
      final values = [p.propertyName, p.propertyCode];
      return values
          .where((v) => v.trim().isNotEmpty)
          .any((v) => v.toLowerCase().contains(term));
    }).toList();
  }

  void clearPropertySearch() {
    setState(() {
      propertySearchTerm = '';
      _propertySearchController.clear();
    });
  }

  Future<void> _loadUtilities(int propertyId) async {
    final companyID = await _getCompanyId();

    if (companyID == 0 || propertyId == 0) {
      _clearAll();
      return;
    }

    setState(() => loadingUtilities = true);

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyUtilities').replace(
        queryParameters: {
          'PropertyID': '$propertyId',
          'CompanyID': '$companyID',
        },
      );

      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load utilities');

      if (data['success'] != true) {
        throw Exception(data['message']?.toString() ?? 'Failed to load utility details.');
      }

      final List rows = data['data'] is List ? data['data'] : [];

      _clearConfigAndPayments();

      final loadedPayments = <UtilityPaymentModel>[];

      for (final raw in rows) {
        final row = Map<String, dynamic>.from(raw);

        if (_rowHasPaymentInfo(row)) {
          loadedPayments.add(UtilityPaymentModel.fromJson(row));
        } else {
          final type = _toText(row['UtilityType']);


        }
      }

      if (!mounted) return;
      setState(() => payments = loadedPayments);
    } catch (e) {
      debugPrint('Load utilities error: $e');
      _clearConfigAndPayments();
      if (!mounted) return;
      _notify(_apiFailureMessage(e, 'load utilities'), isError: true);
    } finally {
      if (mounted) setState(() => loadingUtilities = false);
    }
  }

  bool _rowHasPaymentInfo(Map<String, dynamic> row) {
    return _toText(row['PaymentID']).isNotEmpty ||
        _toText(row['PaymentAmount']).isNotEmpty ||
        _toText(row['PaymentStatus']).isNotEmpty ||
        _toText(row['PaymentDueDate']).isNotEmpty ||
        _toText(row['PaidDate']).isNotEmpty ||
        _toText(row['ReferenceNumber']).isNotEmpty;
  }

  void _clearConfigAndPayments() {
    for (final type in kUtilityTypes) {
    }
    payments = [];
  }

  void _clearAll() {
    _clearConfigAndPayments();
    _clearPaymentForm();
  }

  void _clearPaymentForm() {
    paymentUtilityId = 0;
    paymentId = '';
    paymentUtilityType = 'Electricity';
    paymentDueDate = '';
    paymentPaidDate = '';
    paymentStatus = 'Paid';
    amountController.clear();
    referenceNumberController.clear();
    notesController.clear();
  }


  Future<void> openProperty(PropertyModel property) async {
    FocusScope.of(context).unfocus();

    setState(() {
      selectedProperty = property;
      showForm = false;
    });

    await _loadUtilities(property.propertyId);
  }

  void changeProperty() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();

    setState(() {
      selectedProperty = null;
      showForm = false;
    });

    _clearAll();
  }

  void openCreatePayment() {
    FocusScope.of(context).unfocus();
    _clearPaymentForm();
    setState(() => showForm = true);
  }

  void openEditPayment(UtilityPaymentModel payment) {
    FocusScope.of(context).unfocus();

    setState(() {
      paymentUtilityId = payment.utilityId;
      paymentId = payment.paymentId;
      paymentUtilityType = payment.utilityType;
      paymentDueDate = payment.dueDate;
      paymentPaidDate = payment.paidDate;
      paymentStatus = payment.status.isEmpty ? 'Pending' : payment.status;
      amountController.text = payment.amount;
      referenceNumberController.text = payment.referenceNumber;
      notesController.text = payment.notes;

      showForm = true;
    });
  }

  void backToUtilities() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() => showForm = false);
    _clearPaymentForm();
  }

  Future<void> handleSavePayment() async {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();

    final companyID = await _getCompanyId();
    final userID = await _getUserId();

    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }
    if (selectedProperty == null) {
      _notify('Please select a property first.', isError: true);
      return;
    }
    if (amountController.text.trim().isNotEmpty) {
      final value = double.tryParse(amountController.text.trim());
      if (value == null || value < 0) {
        _notify('Please enter a valid Amount.', isError: true);
        return;
      }
    }

    setState(() => saving = true);

    try {
      final payload = {
        'UtilityID': paymentUtilityId,
        'PropertyID': selectedProperty!.propertyId,
        'CompanyID': companyID,
        'UtilityType': paymentUtilityType,
        'ProviderName': null,
        'AccountNumber': null,
        'MonthlyCost': null,
        'DueDateText': null,
        'PaymentID': paymentId.isEmpty ? null : paymentId,
        'PaymentAmount':
            amountController.text.trim().isEmpty ? null : amountController.text.trim(),
        'PaymentDueDate': paymentDueDate.isEmpty ? null : paymentDueDate,
        'PaidDate': paymentPaidDate.isEmpty ? null : paymentPaidDate,
        'PaymentStatus': paymentStatus,
        'ReferenceNumber': _nullableString(referenceNumberController.text),
        'Notes': _nullableString(notesController.text),
        if (paymentUtilityId == 0) 'CreatedBy': userID,
        'ModifiedBy': userID,
        'Action': paymentUtilityId > 0 ? 'UPDATE' : 'INSERT',
      };

      final response = await http.post(
        Uri.parse('${ApiConfig.webUrl}/insertUpdatePropertyUtilities'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      );

      final data = _decodeJsonBody(response.body, 'save utility payment');

      if (data['success'] != true) {
        _notify(data['message']?.toString() ?? 'Unable to save utility payment.', isError: true);
        return;
      }

      await _loadUtilities(selectedProperty!.propertyId);

      if (!mounted) return;

      _notify(data['message']?.toString() ?? 'Utility payment saved successfully.');
      backToUtilities();
    } catch (e) {
      debugPrint('Save payment error: $e');
      _notify(_apiFailureMessage(e, 'save utility payment'), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> handleDeletePayment() async {
    if (deleting || saving) return;
    if (!isEditingPayment || selectedProperty == null) return;

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => const _DeleteConfirmSheet(
        title: 'Delete utility payment?',
        message:
            'This utility payment record will be permanently removed. This can\'t be undone.',
      ),
    );

    if (confirmed != true) return;

    final companyID = await _getCompanyId();
    final userID = await _getUserId();

    if (companyID == 0) {
      _notify('Session expired. Please login again.', isError: true);
      return;
    }

    setState(() => deleting = true);

    try {
      final request = http.Request(
        'POST',
        Uri.parse('${ApiConfig.webUrl}/deletePropertyUtility'),
      );
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'UtilityID': paymentUtilityId,
        'PropertyID': selectedProperty!.propertyId,
        'CompanyID': companyID,
        'ModifiedBy': userID,
      });

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);
      final data = _decodeJsonBody(response.body, 'delete utility payment');

      if (data['success'] != true) {
        _notify(data['message']?.toString() ?? 'Unable to delete utility payment.',
            isError: true);
        return;
      }

      await _loadUtilities(selectedProperty!.propertyId);

      if (!mounted) return;

      _notify(data['message']?.toString() ?? 'Utility payment deleted successfully.');
      backToUtilities();
    } catch (e) {
      debugPrint('Delete payment error: $e');
      _notify(_apiFailureMessage(e, 'delete utility payment'), isError: true);
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


  Future<void> _openFilterSheet() async {
    String tempType = filterType;
    String tempStatus = filterStatus;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 14,
                  bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 14),
                        decoration: BoxDecoration(
                          color: PiColors.hairline,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                    const Text('Filter Payments',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w800, color: PiColors.ink)),
                    const SizedBox(height: PiSpace.lg),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text('UTILITY TYPE'.toUpperCase(), style: PiText.label),
                    ),
                    _sheetPickerRow(
                      value: tempType,
                      placeholder: 'All utilities',
                      onTap: () async {
                        await _showPicker(
                          title: 'Utility type',
                          options: kUtilityTypes,
                          selected: tempType,
                          onSelected: (v) => setSheetState(() => tempType = v ?? ''),
                        );
                      },
                    ),
                    const SizedBox(height: PiSpace.lg),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Text('PAYMENT STATUS'.toUpperCase(), style: PiText.label),
                    ),
                    _sheetPickerRow(
                      value: tempStatus,
                      placeholder: 'All statuses',
                      onTap: () async {
                        await _showPicker(
                          title: 'Payment status',
                          options: kPaymentStatuses,
                          selected: tempStatus,
                          onSelected: (v) => setSheetState(() => tempStatus = v ?? ''),
                        );
                      },
                    ),
                    const SizedBox(height: PiSpace.xl),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => setSheetState(() {
                              tempType = '';
                              tempStatus = '';
                            }),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: PiColors.primary,
                              backgroundColor: PiColors.primarySoft,
                              side: BorderSide.none,
                              padding: const EdgeInsets.symmetric(vertical: 13),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(PiRadius.button)),
                            ),
                            child: const Text('Clear All',
                                style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ),
                        const SizedBox(width: PiSpace.sm),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              setState(() {
                                filterType = tempType;
                                filterStatus = tempStatus;
                              });
                              Navigator.pop(ctx);
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
                                style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _sheetPickerRow({
    required String value,
    required String placeholder,
    required VoidCallback onTap,
  }) {
    final hasValue = value.isNotEmpty;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(PiRadius.field),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: PiColors.background,
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
            const Icon(Icons.keyboard_arrow_down_rounded, color: PiColors.muted, size: 20),
          ],
        ),
      ),
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
            ? _buildPropertyList(key: const ValueKey('list'))
            : _buildDetail(key: const ValueKey('detail')),
      ),
    );
  }


  Widget _buildPropertyList({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: Column(
        children: [
          _propertyListHeader(),
          Expanded(
            child: RefreshIndicator(
              color: PiColors.primary,
              onRefresh: loadProperties,
              child: loadingProperties
                  ? _loadingList()
                  : filteredProperties.isEmpty
                      ? _emptyPropertyState()
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

  Widget _propertyListHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Utilities', style: PiText.screenTitle),
          const SizedBox(height: 2),
          Text(
            loadingProperties
                ? 'Loading…'
                : '${filteredProperties.length} of ${properties.length} properties',
            style: PiText.screenSubtitle,
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _propertySearchController,
            onChanged: (v) => setState(() => propertySearchTerm = v),
            style: const TextStyle(fontSize: 14),
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Search property name or code',
              hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
              prefixIcon:
                  const Icon(Icons.search_rounded, color: PiColors.muted, size: 20),
              suffixIcon: propertySearchTerm.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: PiColors.muted),
                      onPressed: clearPropertySearch,
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

  Widget _emptyPropertyState() {
    final hasSearch = propertySearchTerm.trim().isNotEmpty;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(
          hasSearch ? Icons.search_off_rounded : Icons.electrical_services_rounded,
          size: 56,
          color: PiColors.primaryTint,
        ),
        const SizedBox(height: PiSpace.lg),
        Text(
          hasSearch ? 'No properties match' : 'No properties yet',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: PiColors.ink),
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
              onPressed: clearPropertySearch,
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
                        style: PiText.cardTitle, maxLines: 1, overflow: TextOverflow.ellipsis),
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
              child: loadingUtilities
                  ? _loadingCard('Loading utility details...')
                  : (showForm ? _buildPaymentForm() : _buildOverview()),
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
                : (showForm ? backToUtilities : changeProperty),
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
                      ? (isEditingPayment ? 'Edit utility payment' : 'New utility payment')
                      : 'Utility payment history',
                  style: PiText.screenSubtitle,
                ),
              ],
            ),
          ),
          if (loadingUtilities)
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
              onPressed: (saving || deleting)
                  ? null
                  : changeProperty,
              style: OutlinedButton.styleFrom(
                foregroundColor: PiColors.primary,
                side: const BorderSide(color: PiColors.primary),
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
                shape:
                    RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
              ),
              child: const Text('Change', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
            ),
        ],
      ),
    );
  }

  Widget _buildOverview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _formSection(
          icon: Icons.receipt_long_rounded,
          title: 'Utility Payment History',
          subtitle: 'Record of past and upcoming utility payments',
          children: [_paymentHistorySection()],
        ),
      ],
    );
  }

  Widget _paymentHistorySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _paymentSearchController,
                onChanged: (v) => setState(() => paymentSearchTerm = v),
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  isDense: true,
                  hintText: 'Search payment ID, reference...',
                  hintStyle: const TextStyle(fontSize: 12.5, color: PiColors.muted),
                  prefixIcon: const Icon(Icons.search_rounded, color: PiColors.primary, size: 19),
                  suffixIcon: paymentSearchTerm.isEmpty
                      ? null
                      : IconButton(
                          icon: const Icon(Icons.close_rounded, size: 16, color: PiColors.muted),
                          onPressed: () => setState(() {
                            paymentSearchTerm = '';
                            _paymentSearchController.clear();
                          }),
                        ),
                  filled: true,
                  fillColor: PiColors.background,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(PiRadius.field),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ),
            const SizedBox(width: PiSpace.sm),
            Stack(
              clipBehavior: Clip.none,
              children: [
                OutlinedButton(
                  onPressed: _openFilterSheet,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: PiColors.primary,
                    side: const BorderSide(color: PiColors.primary),
                    padding: const EdgeInsets.all(12),
                    shape:
                        RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
                  ),
                  child: const Icon(Icons.filter_list_rounded, size: 19),
                ),
                if (activeFilterCount > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      width: 16,
                      height: 16,
                      alignment: Alignment.center,
                      decoration: const BoxDecoration(color: PiColors.red, shape: BoxShape.circle),
                      child: Text(
                        '$activeFilterCount',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
        const SizedBox(height: PiSpace.md),
        SizedBox(
          height: 46,
          child: ElevatedButton.icon(
            onPressed: openCreatePayment,
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Add Payment'),
            style: ElevatedButton.styleFrom(
              backgroundColor: PiColors.primary,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
            ),
          ),
        ),
        const SizedBox(height: PiSpace.md),
        if (filteredPayments.isEmpty)
          _emptyCard(
            icon: Icons.receipt_long_outlined,
            title: 'No payments found',
            subtitle: 'Try adjusting your search or filters, or add a new payment.',
          )
        else
          Column(
            children: [
              for (int i = 0; i < filteredPayments.length; i++) ...[
                if (i > 0) const SizedBox(height: PiSpace.sm),
                _paymentTile(filteredPayments[i]),
              ],
            ],
          ),
      ],
    );
  }

  Widget _paymentTile(UtilityPaymentModel payment) {
    final color = kUtilityColors[payment.utilityType] ?? PiColors.primary;
    final soft = kUtilitySoftColors[payment.utilityType] ?? PiColors.primarySoft;
    final icon = kUtilityIcons[payment.utilityType] ?? Icons.bolt_rounded;

    return Material(
      color: PiColors.background,
      borderRadius: BorderRadius.circular(PiRadius.field),
      child: InkWell(
        onTap: () => openEditPayment(payment),
        borderRadius: BorderRadius.circular(PiRadius.field),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(PiRadius.field),
            border: Border.all(color: PiColors.hairline),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(color: soft, borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: PiSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            payment.utilityType,
                            style: const TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w800, color: PiColors.ink),
                          ),
                        ),
                        _statusTag(payment.status),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      payment.amount.isNotEmpty ? 'AED ${payment.amount}' : 'Amount not set',
                      style: const TextStyle(fontSize: 12, color: PiColors.muted),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Due ${payment.dueDate.isNotEmpty ? payment.dueDate : '—'}'
                      '${payment.paidDate.isNotEmpty ? ' • Paid ${payment.paidDate}' : ''}',
                      style: const TextStyle(fontSize: 11, color: PiColors.muted),
                    ),
                    if (payment.referenceNumber.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text('Ref: ${payment.referenceNumber}',
                          style: const TextStyle(fontSize: 11, color: PiColors.muted)),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: PiColors.primary),
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusTag(String status) {
    Color color;
    Color bg;

    switch (status) {
      case 'Paid':
        color = PiColors.green;
        bg = PiColors.greenSoft;
        break;
      case 'Overdue':
        color = PiColors.red;
        bg = PiColors.redSoft;
        break;
      case 'Pending':
        color = PiColors.accent;
        bg = PiColors.accentSoft;
        break;
      default:
        color = PiColors.muted;
        bg = const Color(0xFFEEF2F6);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(PiRadius.badge)),
      child: Text(
        status.isEmpty ? '—' : status,
        style: TextStyle(color: color, fontSize: 10.5, fontWeight: FontWeight.w800),
      ),
    );
  }

  // ------------------------- PAYMENT FORM -------------------------
  Widget _buildPaymentForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _formSection(
          icon: Icons.receipt_long_rounded,
          title: 'Payment Details',
          subtitle: 'Which utility this payment covers, the amount, and its status',
          children: [
            if (paymentId.isNotEmpty) ...[
              _readOnlyField('Payment ID', paymentId),
              const SizedBox(height: PiSpace.lg),
            ],
            _pickerField(
              label: 'Utility Type',
              value: paymentUtilityType,
              placeholder: 'Select',
              onTap: () => _showPicker(
                title: 'Utility type',
                options: kUtilityTypes,
                selected: paymentUtilityType,
                allowClear: false,
                onSelected: (v) => setState(() => paymentUtilityType = v ?? 'Electricity'),
              ),
            ),
            Row(
              children: [
                Expanded(
                  child: _field('Amount (AED)', amountController,
                      placeholder: 'e.g. 420',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true)),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _pickerField(
                    label: 'Status',
                    value: paymentStatus,
                    placeholder: 'Select',
                    onTap: () => _showPicker(
                      title: 'Payment status',
                      options: kPaymentStatuses,
                      selected: paymentStatus,
                      allowClear: false,
                      onSelected: (v) => setState(() => paymentStatus = v ?? 'Pending'),
                    ),
                  ),
                ),
              ],
            ),
            Row(
              children: [
                Expanded(
                  child: _dateField(
                    label: 'Due Date',
                    value: paymentDueDate,
                    onChanged: (v) => setState(() => paymentDueDate = v),
                  ),
                ),
                const SizedBox(width: PiSpace.md),
                Expanded(
                  child: _dateField(
                    label: 'Paid Date',
                    value: paymentPaidDate,
                    onChanged: (v) => setState(() => paymentPaidDate = v),
                  ),
                ),
              ],
            ),
            _field('Reference Number', referenceNumberController,
                placeholder: 'e.g. DEWA-7729104'),
            _field('Notes', notesController,
                placeholder: 'e.g. Billed jointly with electricity.', maxLines: 3),
          ],
        ),
        const SizedBox(height: PiSpace.xl),
        SizedBox(
          height: 50,
          child: ElevatedButton.icon(
            onPressed: (saving || deleting) ? null : handleSavePayment,
            icon: Icon(saving ? Icons.hourglass_top_rounded : Icons.check_rounded, size: 20),
            label: Text(
              saving ? 'Saving…' : (isEditingPayment ? 'Update Payment' : 'Save Payment'),
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
        if (isEditingPayment) ...[
          const SizedBox(height: PiSpace.sm),
          SizedBox(
            height: 46,
            child: OutlinedButton.icon(
              onPressed: (saving || deleting) ? null : handleDeletePayment,
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.button)),
              ),
            ),
          ),
        ],
        const SizedBox(height: PiSpace.sm),
        SizedBox(
          height: 46,
          child: OutlinedButton.icon(
            onPressed: (saving || deleting) ? null : backToUtilities,
            icon: const Icon(Icons.arrow_back_rounded, size: 18),
            label: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w700)),
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

 
  Widget _formSection({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? headerAction,
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
            crossAxisAlignment: CrossAxisAlignment.start,
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
          if (headerAction != null) ...[
            const SizedBox(height: PiSpace.md),
            Align(alignment: Alignment.centerRight, child: headerAction),
          ],
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

  Widget _readOnlyField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
            color: const Color(0xFFF5F6FA),
            borderRadius: BorderRadius.circular(PiRadius.field),
          ),
          child: Text(value,
              style: const TextStyle(fontSize: 14, color: PiColors.muted, fontWeight: FontWeight.w500)),
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
                const Icon(Icons.keyboard_arrow_down_rounded, color: PiColors.muted, size: 20),
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

  Widget _loadingCard(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 42, horizontal: PiSpace.lg),
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(color: PiColors.hairline),
      ),
      child: Column(
        children: [
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: PiColors.primary),
          ),
          const SizedBox(height: PiSpace.md),
          Text(message,
              style: const TextStyle(color: PiColors.muted, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _emptyCard({required IconData icon, required String title, required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(PiSpace.xl),
      decoration: BoxDecoration(
        color: PiColors.background,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(color: PiColors.hairline),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(color: PiColors.primarySoft, borderRadius: BorderRadius.circular(16)),
            child: Icon(icon, color: PiColors.primary, size: 27),
          ),
          const SizedBox(height: PiSpace.md),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(color: PiColors.ink, fontSize: 14, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: PiSpace.sm),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: PiColors.muted, fontSize: 12, height: 1.45),
          ),
        ],
      ),
    );
  }


  int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  String _toText(dynamic value) => value == null ? '' : value.toString();

  String? _nullableString(String value) {
    final text = value.trim();
    return text.isEmpty ? null : text;
  }
}

class _DeleteConfirmSheet extends StatelessWidget {
  final String title;
  final String message;
  const _DeleteConfirmSheet({required this.title, required this.message});

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
            Text(title,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink)),
            const SizedBox(height: 6),
            Text(message, style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4)),
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