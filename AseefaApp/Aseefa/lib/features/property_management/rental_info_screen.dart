import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';
import 'rental_management_screen.dart';

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


const List<String> kRentalStatuses = [
  'Occupied',
  'Vacant',
  'Reserved',
  'Under Maintenance',
  'Blocked',
];

const List<String> kPaymentFrequencies = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Yearly',
];

const List<String> kRenewalOptions = [
  'Automatic Renewal',
  'Tenant Option to Renew',
  'Landlord Option to Renew',
  'No Renewal',
];

class StatusMeta {
  final Color color;
  final Color soft;
  const StatusMeta(this.color, this.soft);
}

const Map<String, StatusMeta> kStatusMeta = {
  'Occupied': StatusMeta(PiColors.green, PiColors.greenSoft),
  'Reserved': StatusMeta(PiColors.primary, PiColors.primarySoft),
  'Under Maintenance': StatusMeta(PiColors.accent, PiColors.accentSoft),
  'Blocked': StatusMeta(PiColors.red, PiColors.redSoft),
  'Vacant': StatusMeta(PiColors.muted, Color(0xFFF3F4F6)),
};

const StatusMeta kDefaultStatusMeta = StatusMeta(PiColors.muted, Color(0xFFF3F4F6));


class PropertyOption {
  final int id;
  final String label;
  final String code;

  PropertyOption({required this.id, required this.label, this.code = ''});

  factory PropertyOption.fromApi(Map<String, dynamic> item) {
    final pid = int.tryParse('${item['PropertyID'] ?? 0}') ?? 0;
    final name = item['PropertyName']?.toString() ?? '';
    return PropertyOption(
      id: pid,
      label: name.isNotEmpty ? name : 'Property #$pid',
      code: item['PropertyCode']?.toString() ?? '',
    );
  }

  String get searchText => '$label $code $id';
}

/// A unit / flat from `getPropertyMaster`, picked *inside* the rental
/// form (mirrors the web version's in-form "Unit / Property Master"
/// dropdown). Selecting one supplies `RecordID` for the rental payload
/// and supplies the `RecordID` used by the rental API.
class RentalUnitOption {
  final int recordId;
  final String flatNo;
  final String flatType;
  final String tenantName;

  RentalUnitOption({
    required this.recordId,
    required this.flatNo,
    required this.flatType,
    required this.tenantName,
  });

  factory RentalUnitOption.fromApi(Map<String, dynamic> item) {
    return RentalUnitOption(
      recordId: int.tryParse('${item['RecordID'] ?? 0}') ?? 0,
      flatNo: item['FlatNo']?.toString() ?? '',
      flatType: item['FlatType']?.toString() ?? '',
      tenantName: item['TenantName']?.toString() ?? '',
    );
  }

  String get label {
    final parts = <String>[flatNo.trim().isNotEmpty ? flatNo : 'Record #$recordId'];
    if (flatType.trim().isNotEmpty) parts.add(flatType);
    if (tenantName.trim().isNotEmpty) parts.add(tenantName);
    return parts.join(' - ');
  }
}

class RentalTenantOption {
  final int id;
  final String name;
  final String mobile;
  final String email;

  const RentalTenantOption({
    required this.id,
    required this.name,
    this.mobile = '',
    this.email = '',
  });

  factory RentalTenantOption.fromApi(Map<String, dynamic> item) {
    return RentalTenantOption(
      id: int.tryParse('${item['UserId'] ?? item['UserID'] ?? 0}') ?? 0,
      name: item['Name']?.toString() ?? '',
      mobile: item['Mobile']?.toString() ?? '',
      email: item['Email']?.toString() ?? '',
    );
  }

  String get label => name.isNotEmpty ? name : 'Tenant #$id';

  String get subtitle => [
        if (mobile.trim().isNotEmpty) mobile.trim(),
        if (email.trim().isNotEmpty) email.trim(),
      ].join(' · ');
}

class RentalForm {
  int? id;

  // PropertyMaster.RecordID — the unit this rental is tied to, chosen
  // inside the form via the Unit / Property Master picker.
  int? recordId;
  int? tenantUserId;

  String tenantName;
  String rentalStatus;

  String monthlyRent;
  String annualRent;
  String securityDeposit;
  String numberOfCheques;

  String paymentFrequency;

  DateTime? leaseStartDate;
  DateTime? leaseEndDate;

  String renewalOption;

  String rentIncreasePercentage;
  String gracePeriod;

  String lateFeeRules;

  RentalForm({
    this.id,
    this.recordId,
    this.tenantUserId,
    this.tenantName = '',
    this.rentalStatus = '',
    this.monthlyRent = '',
    this.annualRent = '',
    this.securityDeposit = '',
    this.numberOfCheques = '',
    this.paymentFrequency = '',
    this.leaseStartDate,
    this.leaseEndDate,
    this.renewalOption = '',
    this.rentIncreasePercentage = '',
    this.gracePeriod = '',
    this.lateFeeRules = '',
  });

  factory RentalForm.empty() => RentalForm();

  factory RentalForm.fromApi(Map<String, dynamic> item) {
    final rentalID = int.tryParse('${item['RentalID'] ?? 0}') ?? 0;
    final recId = int.tryParse('${item['RecordID'] ?? 0}') ?? 0;
    final tenantID = int.tryParse(
          '${item['TenantUserID'] ?? item['TenantUserId'] ?? 0}',
        ) ??
        0;
    return RentalForm(
      id: rentalID,
      recordId: recId == 0 ? null : recId,
      tenantUserId: tenantID == 0 ? null : tenantID,
      tenantName: item['TenantName']?.toString() ?? '',
      rentalStatus: item['RentalStatus']?.toString() ?? '',
      monthlyRent: _numText(item['MonthlyRent']),
      annualRent: _numText(item['AnnualRent']),
      securityDeposit: _numText(item['SecurityDeposit']),
      numberOfCheques: _numText(item['NumberOfCheques']),
      paymentFrequency: item['PaymentFrequency']?.toString() ?? '',
      leaseStartDate: _parseDate(_dateOnly(item['LeaseStartDate'])),
      leaseEndDate: _parseDate(_dateOnly(item['LeaseEndDate'])),
      renewalOption: item['RenewalOption']?.toString() ?? '',
      rentIncreasePercentage: _numText(item['RentIncreasePercentage']),
      gracePeriod: _numText(item['GracePeriod']),
      lateFeeRules: item['LateFeeRules']?.toString() ?? '',
    );
  }

  String get fullLabel =>
      tenantName.trim().isNotEmpty ? tenantName : 'Rental #${id ?? 0}';

  StatusMeta get statusMeta => kStatusMeta[rentalStatus] ?? kDefaultStatusMeta;

  String get rentLine {
    final rent = monthlyRent.trim();
    if (rent.isEmpty) return 'Rent not set';
    final n = double.tryParse(rent);
    return n == null ? rent : '₹ ${n.toStringAsFixed(2)} / mo';
  }

  String get leaseLine {
    if (leaseStartDate == null && leaseEndDate == null) {
      return 'No lease period set';
    }
    final s = leaseStartDate == null ? '—' : _fmtDate(leaseStartDate!);
    final e = leaseEndDate == null ? '—' : _fmtDate(leaseEndDate!);
    return '$s  →  $e';
  }

  Map<String, dynamic> toPayload({
    required int companyId,
    required int userId,
    required int propertyId,
  }) {
    dynamic num(String v) {
      final t = v.trim();
      if (t.isEmpty) return null;
      return double.tryParse(t);
    }

    int? intg(String v) {
      final t = v.trim();
      if (t.isEmpty) return null;
      return int.tryParse(t);
    }

    String? dateStr(DateTime? d) {
      if (d == null) return null;
      return '${d.year.toString().padLeft(4, '0')}-'
          '${d.month.toString().padLeft(2, '0')}-'
          '${d.day.toString().padLeft(2, '0')}';
    }

    return {
      'RentalID': id ?? 0,
      // PropertyMaster.RecordID — the unit chosen inside the form
      'RecordID': recordId ?? 0,
      'TenantUserID': tenantUserId,
      'CompanyID': companyId,
      // Top-level Property.PropertyID (kept alongside RecordID, matching
      // the web payload)
      'PropertyID': propertyId,
      'TenantName': tenantName.trim(),
      'RentalStatus': rentalStatus.isEmpty ? 'Vacant' : rentalStatus,
      'MonthlyRent': num(monthlyRent),
      'AnnualRent': num(annualRent),
      'SecurityDeposit': num(securityDeposit),
      'NumberOfCheques': intg(numberOfCheques),
      'PaymentFrequency': paymentFrequency.isEmpty ? null : paymentFrequency,
      'RentIncreasePercentage': num(rentIncreasePercentage),
      'LeaseStartDate': dateStr(leaseStartDate),
      'LeaseEndDate': dateStr(leaseEndDate),
      'RenewalOption': renewalOption.isEmpty ? null : renewalOption,
      'GracePeriod': intg(gracePeriod),
      'LateFeeRules': lateFeeRules.trim(),
      'UserID': userId,
    };
  }
}

String _numText(dynamic v) {
  if (v == null) return '';
  return v.toString();
}

String _dateOnly(dynamic v) {
  if (v == null) return '';
  final t = v.toString();
  return t.length >= 10 ? t.substring(0, 10) : t;
}

DateTime? _parseDate(String v) {
  if (v.isEmpty) return null;
  try {
    final p = v.split('-');
    if (p.length == 3) {
      return DateTime(int.parse(p[0]), int.parse(p[1]), int.parse(p[2]));
    }
  } catch (_) {}
  return null;
}

String _fmtDate(DateTime d) =>
    '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

// ============================================================
class RentalInformationScreen extends StatelessWidget {
  const RentalInformationScreen({
    super.key,
    this.registrationOnly = false,
  });

  final bool registrationOnly;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PiColors.background,
      body: RentalInformationBody(registrationOnly: registrationOnly),
    );
  }
}

class RentalRegistrationScreen extends StatelessWidget {
  const RentalRegistrationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const RentalManagementScreen();
  }
}


class RentalInformationBody extends StatefulWidget {
  const RentalInformationBody({
    super.key,
    this.registrationOnly = false,
  });

  final bool registrationOnly;

  @override
  State<RentalInformationBody> createState() => _RentalInformationBodyState();
}

class _RentalInformationBodyState extends State<RentalInformationBody> {
  // Property selector
  List<PropertyOption> properties = [];
  bool loadingProperties = false;
  String propertySearch = '';
  final TextEditingController _propertySearchController = TextEditingController();

  PropertyOption? selectedProperty;

  // Rentals (all units combined, for the selected property)
  List<RentalForm> rentals = [];
  bool loadingRentals = false;
  String rentalSearch = '';
  String? filterStatus;
  String? filterFrequency;
  final TextEditingController _rentalSearchController = TextEditingController();

  // Units / Property Master records for the selected property — used to
  // populate the in-form "Unit / Property Master" picker.
  List<RentalUnitOption> rentalUnits = [];
  bool loadingUnits = false;

  List<RentalTenantOption> tenants = [];
  bool loadingTenants = false;

  // Form
  bool showForm = false;
  RentalForm form = RentalForm.empty();
  bool saving = false;
  bool deleting = false;
  bool creatingTenant = false;

  bool get isEditing => form.id != null;

  late Map<String, TextEditingController> _controllers;

  @override
  void initState() {
    super.initState();
    _controllers = {
      'monthlyRent': TextEditingController(),
      'annualRent': TextEditingController(),
      'securityDeposit': TextEditingController(),
      'numberOfCheques': TextEditingController(),
      'rentIncreasePercentage': TextEditingController(),
      'gracePeriod': TextEditingController(),
      'lateFeeRules': TextEditingController(),
    };
    loadProperties();
  }

  @override
  void dispose() {
    for (final c in _controllers.values) {
      c.dispose();
    }
    _propertySearchController.dispose();
    _rentalSearchController.dispose();
    super.dispose();
  }

  void _syncControllersFromForm() {
    _controllers['monthlyRent']!.text = form.monthlyRent;
    _controllers['annualRent']!.text = form.annualRent;
    _controllers['securityDeposit']!.text = form.securityDeposit;
    _controllers['numberOfCheques']!.text = form.numberOfCheques;
    _controllers['rentIncreasePercentage']!.text = form.rentIncreasePercentage;
    _controllers['gracePeriod']!.text = form.gracePeriod;
    _controllers['lateFeeRules']!.text = form.lateFeeRules;
  }

  void _collectControllersIntoForm() {
    // Tenant details are selected from the tenant master and are not text
    // fields in the rental contract form.
    form.monthlyRent = _controllers['monthlyRent']!.text;
    form.annualRent = _controllers['annualRent']!.text;
    form.securityDeposit = _controllers['securityDeposit']!.text;
    form.numberOfCheques = _controllers['numberOfCheques']!.text;
    form.rentIncreasePercentage = _controllers['rentIncreasePercentage']!.text;
    form.gracePeriod = _controllers['gracePeriod']!.text;
    form.lateFeeRules = _controllers['lateFeeRules']!.text;
  }


  Future<int> _getCompanyId() async => SessionStore.getCompanyId();
  Future<int> _getUserId() async => SessionStore.getUserId();

  String _apiFailureMessage(Object error, String action) {
    final text = error.toString();
    if (text.contains('<!DOCTYPE') || text.contains('<html')) {
      return 'Rental backend is not available for $action. Check the API route and backend server.';
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

  bool _isSuccess(dynamic value) {
    if (value == true) return true;
    return value?.toString().toLowerCase() == 'true';
  }

  // void _notify(String message, {bool isError = false}) {
  //   if (!mounted) return;
  //   final messenger = ScaffoldMessenger.maybeOf(context);
  //   if (messenger == null) return;

  //   messenger.hideCurrentSnackBar();
  //   messenger.showSnackBar(
  //     SnackBar(
  //       behavior: SnackBarBehavior.fixed,
  //       backgroundColor: isError ? PiColors.red : PiColors.ink,
  //       duration: const Duration(seconds: 3),
  //       content: Row(
  //         children: [
  //           Icon(isError ? Icons.error_outline : Icons.check_circle_outline,
  //               color: Colors.white, size: 18),
  //           const SizedBox(width: 10),
  //           Expanded(
  //             child: Text(
  //               message,
  //               style: const TextStyle(
  //                   color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
  //             ),
  //           ),
  //         ],
  //       ),
  //     ),
  //   );
  // }
  void _notify(String message, {bool isError = false}) {
  if (!mounted) return;
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger.hideCurrentSnackBar();
  messenger.showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: isError ? PiColors.red : PiColors.green,
      duration: const Duration(seconds: 3),
      margin: const EdgeInsets.all(12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      content: Row(
        children: [
          Icon(isError ? Icons.error_outline : Icons.check_circle_outline,
              color: Colors.white, size: 18),
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

  RentalUnitOption? _findUnit(int? recordId) {
    if (recordId == null) return null;
    for (final u in rentalUnits) {
      if (u.recordId == recordId) return u;
    }
    return null;
  }

  RentalTenantOption? _findTenant(int? tenantId) {
    if (tenantId == null) return null;
    for (final tenant in tenants) {
      if (tenant.id == tenantId) return tenant;
    }
    return null;
  }

  RentalTenantOption? _findTenantByMobile(String mobile) {
    for (final tenant in tenants) {
      if (tenant.mobile.trim() == mobile.trim()) return tenant;
    }
    return null;
  }

  void selectTenant(RentalTenantOption tenant) {
    setState(() {
      form.tenantUserId = tenant.id;
      form.tenantName = tenant.name;
    });
  }

  Future<void> _showTenantPicker() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.only(bottom: 12),
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
                padding: const EdgeInsets.fromLTRB(20, 14, 16, 8),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Select tenant',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: PiColors.ink,
                        ),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await _showCreateTenant();
                      },
                      icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
                      label: const Text('New tenant'),
                    ),
                  ],
                ),
              ),
              if (loadingTenants)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                )
              else if (tenants.isEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.person_search_outlined,
                        size: 42,
                        color: PiColors.primaryMid,
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'No tenants are linked to this unit yet.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: PiColors.muted, fontSize: 13),
                      ),
                      const SizedBox(height: 10),
                      FilledButton.icon(
                        onPressed: () async {
                          Navigator.pop(ctx);
                          await _showCreateTenant();
                        },
                        icon: const Icon(Icons.add_rounded),
                        label: const Text('Create tenant'),
                      ),
                    ],
                  ),
                )
              else
                Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.only(bottom: 8),
                    itemCount: tenants.length,
                    separatorBuilder: (_, __) =>
                        const Divider(height: 1, indent: 20, endIndent: 20),
                    itemBuilder: (context, index) {
                      final tenant = tenants[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: PiColors.primarySoft,
                          child: Text(
                            tenant.label.isNotEmpty
                                ? tenant.label[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              color: PiColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        title: Text(
                          tenant.label,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: tenant.subtitle.isEmpty
                            ? null
                            : Text(tenant.subtitle),
                        trailing: tenant.id == form.tenantUserId
                            ? const Icon(Icons.check_circle, color: PiColors.primary)
                            : null,
                        onTap: () {
                          Navigator.pop(ctx);
                          selectTenant(tenant);
                        },
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  bool? _availabilityFromResponse(Map<String, dynamic> response) {
    bool? parse(dynamic value) {
      if (value is bool) return value;
      if (value is num) return value != 0;
      if (value is String) {
        switch (value.trim().toLowerCase()) {
          case 'true':
          case '1':
          case 'available':
            return true;
          case 'false':
          case '0':
          case 'unavailable':
          case 'occupied':
            return false;
        }
      }
      return null;
    }

    for (final key in ['isAvailable', 'IsAvailable', 'available', 'Available']) {
      final result = parse(response[key]);
      if (result != null) return result;
    }
    final data = response['data'] ?? response['Data'];
    if (data is Map) {
      return _availabilityFromResponse(Map<String, dynamic>.from(data));
    }
    return parse(data);
  }

  Future<bool> _checkUnitAvailability({
    required int companyId,
    required PropertyOption property,
    required int recordId,
  }) async {
    final query = <String, String>{
      'CompanyID': '$companyId',
      'PropertyID': '${property.id}',
      'RecordID': '$recordId',
    };
    if (form.id != null) query['RentalID'] = '${form.id}';
    final uri = Uri.parse('${ApiConfig.webUrl}/checkFlatAvailability')
        .replace(queryParameters: query);
    final response = await http.get(uri).timeout(const Duration(seconds: 20));
    final data = _decodeJsonBody(response.body, 'check unit availability');
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['message'] ?? 'Unit availability could not be checked.');
    }
    final available = _availabilityFromResponse(data);
    if (available == null) {
      throw const FormatException(
        'The availability API response did not include an availability value.',
      );
    }
    return available;
  }

  Future<int> _loadRenterRoleId(int companyId, int userId) async {
    final uri = Uri.parse('${ApiConfig.webUrl}${ApiConfig.getRolesLists}')
        .replace(queryParameters: {
      'CompanyID': '$companyId',
      'createdBy': '$userId',
    });
    final response = await http.get(uri).timeout(const Duration(seconds: 20));
    final decoded = jsonDecode(response.body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Renter role could not be loaded (${response.statusCode}).');
    }

    dynamic rows = decoded;
    if (decoded is Map) {
      rows = decoded['data'] ?? decoded['Data'] ?? decoded['roles'] ?? decoded['Roles'];
    }
    if (rows is! List) {
      throw const FormatException('The role API did not return a role list.');
    }

    for (final row in rows.whereType<Map>()) {
      final name = (row['RoleName'] ?? row['Name'] ?? '').toString().trim();
      if (name.toLowerCase() != 'renter') continue;
      final roleId = int.tryParse(
            '${row['UserRoleId'] ?? row['UserRoleID'] ?? row['RoleId'] ?? row['RoleID'] ?? row['ID'] ?? ''}',
          ) ??
          0;
      if (roleId > 0) return roleId;
    }

    throw Exception('The Renter role is not available for this company.');
  }

  Future<void> _showCreateTenant() async {
    final property = selectedProperty;
    final recordId = form.recordId;
    if (property == null || recordId == null || recordId <= 0) {
      _notify('Select a property unit before creating a tenant.', isError: true);
      return;
    }

    final draft = await showModalBottomSheet<_TenantDraft>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (_) => const _TenantCreateSheet(),
    );
    if (draft == null) return;

    final companyID = await _getCompanyId();
    final userID = await _getUserId();
    if (companyID <= 0 || userID <= 0) {
      _notify('Company or user session is missing. Please login again.', isError: true);
      return;
    }

    if (!mounted) return;
    setState(() => creatingTenant = true);
    try {
      final available = await _checkUnitAvailability(
        companyId: companyID,
        property: property,
        recordId: recordId,
      );
      if (!available) {
        _notify('This unit is not available for a new rental.', isError: true);
        return;
      }
      final renterRoleId = await _loadRenterRoleId(companyID, userID);
      final payload = {
        'UserId': 0,
        'Name': draft.name.trim(),
        'MName': null,
        'LName': null,
        'Mobile': draft.mobile.trim(),
        'Email': draft.email.trim().isEmpty ? null : draft.email.trim(),
        'Address1': draft.address.trim(),
        'Address2': '',
        'Address3': '',
        'CreatedBy': '$userID',
        'CompanyID': companyID,
        'UserRoleId': renterRoleId,
        'PropertyID': property.id,
        'RecordID': recordId,
      };
      final response = await http
          .post(
            Uri.parse('${ApiConfig.webUrl}/InsertUpdateUser'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 20));
      final data = _decodeJsonBody(response.body, 'create tenant');
      if (response.statusCode < 200 ||
          response.statusCode >= 300 ||
          !_isSuccess(data['success'])) {
        throw Exception(data['message'] ?? 'Tenant could not be created.');
      }

      final createdId = _tenantIdFromResponse(data);
      await loadTenants();
      if (!mounted) return;
      final createdTenant =
          _findTenant(createdId) ?? _findTenantByMobile(draft.mobile);
      if (createdTenant != null) {
        selectTenant(createdTenant);
      } else if (createdId > 0) {
        selectTenant(RentalTenantOption(
          id: createdId,
          name: draft.name.trim(),
          mobile: draft.mobile.trim(),
          email: draft.email.trim(),
        ));
      } else {
        _notify(
          'Tenant was created, but the API did not return its ID. Select the tenant from the list to continue.',
          isError: true,
        );
        return;
      }
      _notify('Tenant created and linked to this unit.');
    } catch (e) {
      debugPrint('Create tenant error: $e');
      _notify(_apiFailureMessage(e, 'create tenant'), isError: true);
    } finally {
      if (mounted) setState(() => creatingTenant = false);
    }
  }

  int _tenantIdFromResponse(Map<String, dynamic> response) {
    int parse(dynamic value) => int.tryParse('$value') ?? 0;
    final direct = parse(response['UserId'] ?? response['UserID']);
    if (direct > 0) return direct;
    final nested = response['data'];
    final nestedValue = parse(nested);
    if (nestedValue > 0) return nestedValue;
    if (nested is Map) {
      return parse(nested['UserId'] ?? nested['UserID']);
    }
    if (nested is List && nested.isNotEmpty && nested.first is Map) {
      final row = nested.first as Map;
      return parse(row['UserId'] ?? row['UserID']);
    }
    return 0;
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

      final response = await http.get(uri).timeout(const Duration(seconds: 20));
      final data = _decodeJsonBody(response.body, 'load properties');

      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          _isSuccess(data['success'])) {
        final List list = data['data'] is List ? data['data'] : [];
        if (!mounted) return;
        setState(() {
          properties = list
              .map((e) => PropertyOption.fromApi(Map<String, dynamic>.from(e)))
              .toList();
        });
      } else {
        if (!mounted) return;
        setState(() => properties = []);
        _notify(data['message'] ?? 'Failed to load properties.', isError: true);
      }
    } catch (e) {
      debugPrint('Load property error: $e');
      _notify(_apiFailureMessage(e, 'load properties'), isError: true);
    } finally {
      if (mounted) setState(() => loadingProperties = false);
    }
  }

  List<PropertyOption> get filteredProperties {
    final term = propertySearch.trim().toLowerCase();
    if (term.isEmpty) return properties;
    return properties
        .where((p) => p.searchText.toLowerCase().contains(term))
        .toList();
  }

  Future<void> selectProperty(PropertyOption property) async {
    FocusScope.of(context).unfocus();
    setState(() {
      selectedProperty = property;
      rentals = [];
      rentalUnits = [];
      tenants = [];
      rentalSearch = '';
      _rentalSearchController.clear();
      filterStatus = null;
      filterFrequency = null;
      showForm = false;
    });
    // Load units (for the form's unit picker) and rentals (for the list)
    // together, same as the web version.
    if (widget.registrationOnly) {
      await loadRentalUnits();
    } else {
      await Future.wait([loadRentals(), loadRentalUnits()]);
    }
  }

  void changeProperty() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      selectedProperty = null;
      rentals = [];
      rentalUnits = [];
      tenants = [];
      form = RentalForm.empty();
      showForm = false;
    });
  }

  Future<void> loadRentals() async {
    if (selectedProperty == null) return;

    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() => loadingRentals = true);

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyRental').replace(
        queryParameters: {
          'CompanyID': '$companyID',
          'PropertyID': '${selectedProperty!.id}',
        },
      );

      final response = await http.get(uri).timeout(const Duration(seconds: 20));
      final data = _decodeJsonBody(response.body, 'load rentals');

      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          _isSuccess(data['success'])) {
        final List list = data['data'] is List ? data['data'] : [];
        if (!mounted) return;
        setState(() {
          rentals =
              list.map((e) => RentalForm.fromApi(Map<String, dynamic>.from(e))).toList();
        });
      } else {
        if (!mounted) return;
        setState(() => rentals = []);
        _notify(data['message'] ?? 'Failed to load rentals.', isError: true);
      }
    } catch (e) {
      debugPrint('Load rental error: $e');
      _notify(_apiFailureMessage(e, 'load rentals'), isError: true);
    } finally {
      if (mounted) setState(() => loadingRentals = false);
    }
  }

 
  Future<void> loadRentalUnits() async {
    if (selectedProperty == null) return;

    final companyID = await _getCompanyId();
    if (companyID == 0) return;

    setState(() => loadingUnits = true);

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyMaster').replace(
        queryParameters: {
          'CompanyID': '$companyID',
          'PropertyID': '${selectedProperty!.id}',
        },
      );

      final response = await http.get(uri).timeout(const Duration(seconds: 20));
      final data = _decodeJsonBody(response.body, 'load units');

      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          _isSuccess(data['success'])) {
        final List list = data['data'] is List ? data['data'] : [];
        if (!mounted) return;
        setState(() {
          rentalUnits = list
              .map((e) => RentalUnitOption.fromApi(Map<String, dynamic>.from(e)))
              .toList();
        });
      } else {
        if (!mounted) return;
        setState(() => rentalUnits = []);
        _notify(data['message'] ?? 'Failed to load property units.', isError: true);
      }
    } catch (e) {
      debugPrint('Load units error: $e');
      _notify(_apiFailureMessage(e, 'load units'), isError: true);
    } finally {
      if (mounted) setState(() => loadingUnits = false);
    }
  }

  Future<void> loadTenants() async {
    final property = selectedProperty;
    final recordId = form.recordId;
    if (property == null || recordId == null || recordId <= 0) {
      if (mounted) setState(() => tenants = []);
      return;
    }

    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    if (!mounted) return;
    setState(() => loadingTenants = true);
    try {
      final query = <String, String>{
        'CompanyID': '$companyID',
        'PropertyID': '${property.id}',
        'RecordID': '$recordId',
      };
      if (form.id != null) query['RentalID'] = '${form.id}';
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyRentalTenants')
          .replace(queryParameters: query);
      final response = await http.get(uri).timeout(const Duration(seconds: 20));
      final data = _decodeJsonBody(response.body, 'load tenants');

      if (response.statusCode < 200 || response.statusCode >= 300 ||
          !_isSuccess(data['success'])) {
        throw Exception(data['message'] ?? 'Tenant list could not be loaded.');
      }

      final rows = data['data'];
      final list = rows is List ? rows : <dynamic>[];
      if (!mounted) return;
      setState(() {
        tenants = list
            .whereType<Map>()
            .map((row) => RentalTenantOption.fromApi(
                  Map<String, dynamic>.from(row),
                ))
            .where((tenant) => tenant.id > 0)
            .toList();
      });
    } catch (e) {
      debugPrint('Load rental tenants error: $e');
      _notify(_apiFailureMessage(e, 'load tenants'), isError: true);
    } finally {
      if (mounted) setState(() => loadingTenants = false);
    }
  }

  List<RentalForm> get filteredRentals {
    final term = rentalSearch.trim().toLowerCase();

    Iterable<RentalForm> base = rentals;

    if (term.isNotEmpty) {
      base = base.where((r) {
        final values = [r.tenantName, r.rentalStatus, '${r.id ?? 0}'];
        return values.any((v) => v.toLowerCase().contains(term));
      });
    }

    if (filterStatus != null && filterStatus!.isNotEmpty) {
      base = base.where((r) => r.rentalStatus == filterStatus);
    }

    if (filterFrequency != null && filterFrequency!.isNotEmpty) {
      base = base.where((r) => r.paymentFrequency == filterFrequency);
    }

    return base.toList();
  }

  int get activeFilterCount =>
      [filterStatus, filterFrequency].where((v) => v != null && v.isNotEmpty).length;

  void clearFilters() {
    setState(() {
      rentalSearch = '';
      _rentalSearchController.clear();
      filterStatus = null;
      filterFrequency = null;
    });
  }

  void openCreate() {
    if (selectedProperty == null) {
      _notify('Please select a property first.', isError: true);
      return;
    }
    setState(() {
      form = RentalForm.empty();
      _syncControllersFromForm();
      showForm = true;
    });
  }

  Future<void> openEdit(RentalForm rental) async {
    if (selectedProperty == null) return;

    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() {
      form = rental;
      _syncControllersFromForm();
      showForm = true;
    });

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyRentalByID').replace(
        queryParameters: {
          'RentalID': '${rental.id}',
          'CompanyID': '$companyID',
          'PropertyID': '${selectedProperty!.id}',
        },
      );

      final response = await http.get(uri).timeout(const Duration(seconds: 20));
      final data = _decodeJsonBody(response.body, 'open rental');

      if (response.statusCode >= 200 &&
          response.statusCode < 300 &&
          _isSuccess(data['success']) &&
          data['data'] != null) {
        if (!mounted) return;
        setState(() {
          form = RentalForm.fromApi(Map<String, dynamic>.from(data['data']));
          _syncControllersFromForm();
        });
        await loadTenants();
        final tenant = _findTenant(form.tenantUserId);
        if (tenant != null && mounted) {
          setState(() => form.tenantName = tenant.name);
        }
      } else {
        _notify(data['message'] ?? 'Rental details could not be loaded.', isError: true);
      }
    } catch (e) {
      debugPrint('Open rental error: $e');
      _notify(_apiFailureMessage(e, 'open rental'), isError: true);
    }
  }

  void backToList() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      showForm = false;
      form = RentalForm.empty();
    });
  }

 
  Future<void> selectRentalUnit(RentalUnitOption unit) async {
    setState(() {
      form.recordId = unit.recordId;
      form.tenantUserId = null;
      form.tenantName = '';
      tenants = [];
    });
    await loadTenants();
  }


  Future<void> handleSave() async {
    if (saving || deleting || creatingTenant || loadingTenants) return;
    if (selectedProperty == null) {
      _notify('Please select a property first.', isError: true);
      return;
    }

    if (form.recordId == null || form.recordId == 0) {
      _notify('Please select a unit for this rental.', isError: true);
      return;
    }

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

    final validationError = _validate();
    if (validationError != null) {
      _notify(validationError, isError: true);
      return;
    }

    setState(() => saving = true);

    try {
      final payload = form.toPayload(
        companyId: companyID,
        userId: userID,
        propertyId: selectedProperty!.id,
      );

      final url = Uri.parse('${ApiConfig.webUrl}/insertUpdatePropertyRental');
      debugPrint('Saving Rental → URL: $url');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 20)      );

      debugPrint('Save rental → Status: ${response.statusCode}');

      final data = _decodeJsonBody(response.body, 'save rental');

      if (!_isSuccess(data['success'])) {
        _notify(data['message'] ?? 'Rental could not be saved.', isError: true);
        return;
      }

      _notify(data['message'] ??
          (isEditing ? 'Rental updated successfully.' : 'Rental added successfully.'));

      await loadRentals();

      if (!mounted) return;
      setState(() {
        showForm = false;
        form = RentalForm.empty();
      });
    } catch (e) {
      debugPrint('Save rental error: $e');
      _notify(_apiFailureMessage(e, 'save rental'), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  String? _validate() {
    if (form.rentalStatus.trim().toLowerCase() == 'occupied' &&
        (form.tenantUserId == null || form.tenantUserId! <= 0)) {
      return 'Select or create a tenant before saving this rental.';
    }

    bool badNumber(String v) => v.trim().isNotEmpty && double.tryParse(v.trim()) == null;
    bool badInt(String v) => v.trim().isNotEmpty && int.tryParse(v.trim()) == null;

    if (badNumber(form.monthlyRent)) return 'Please enter a valid Monthly Rent.';
    if (badNumber(form.annualRent)) return 'Please enter a valid Annual Rent.';
    if (badNumber(form.securityDeposit)) return 'Please enter a valid Security Deposit.';
    if (badInt(form.numberOfCheques)) return 'Please enter a valid Number of Cheques.';
    if (badNumber(form.rentIncreasePercentage)) return 'Please enter a valid Rent Increase %.';
    if (badInt(form.gracePeriod)) return 'Please enter a valid Grace Period.';

    if (form.leaseStartDate != null &&
        form.leaseEndDate != null &&
        form.leaseEndDate!.isBefore(form.leaseStartDate!)) {
      return 'Lease End Date cannot be before Lease Start Date.';
    }

    return null;
  }

  Future<void> handleDelete() async {
    if (!isEditing) return;
    if (saving || deleting) return;
    if (selectedProperty == null) return;

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

    setState(() => deleting = true);

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => _DeleteConfirmSheet(label: form.fullLabel),
    );

    if (confirmed != true) {
      if (mounted) setState(() => deleting = false);
      return;
    }

    try {
      final request = http.Request(
        'POST',
        Uri.parse('${ApiConfig.webUrl}/deletePropertyRental'),
      );
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode({
        'RentalID': form.id,
        'CompanyID': companyID,
        'PropertyID': selectedProperty!.id,
        'UserID': userID,
      });

      final streamed = await request.send().timeout(const Duration(seconds: 20));
      final response = await http.Response.fromStream(streamed);
      final data = _decodeJsonBody(response.body, 'delete rental');

      if (!_isSuccess(data['success'])) {
        _notify(data['message'] ?? 'Rental could not be deleted.', isError: true);
        return;
      }

      _notify(data['message'] ?? 'Rental deleted successfully.');

      await loadRentals();

      if (!mounted) return;
      setState(() {
        showForm = false;
        form = RentalForm.empty();
      });
    } catch (e) {
      debugPrint('Delete rental error: $e');
      _notify(_apiFailureMessage(e, 'delete rental'), isError: true);
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
                              fontSize: 16, fontWeight: FontWeight.w800, color: PiColors.ink)),
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

  /// Bottom sheet for the in-form "Unit / Property Master" picker.
  Future<void> _showUnitPicker() async {
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
                            fontSize: 16, fontWeight: FontWeight.w800, color: PiColors.ink),
                      ),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: rentalUnits.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                        child: Text(
                          'No units found for this property. Add a flat in Property Master first.',
                          style: TextStyle(fontSize: 13, color: PiColors.muted),
                        ),
                      )
                    : ListView(
                        shrinkWrap: true,
                        padding: const EdgeInsets.only(bottom: 8),
                        children: rentalUnits
                            .map((u) => _pickerTile(
                                  label: u.label,
                                  selected: u.recordId == form.recordId,
                                  onTap: () {
                                    Navigator.pop(ctx);
                                    selectRentalUnit(u);
                                  },
                                ))
                            .toList(),
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
      trailing:
          selected ? const Icon(Icons.check_rounded, color: PiColors.primary, size: 20) : null,
    );
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart
        ? (form.leaseStartDate ?? DateTime.now())
        : (form.leaseEndDate ?? form.leaseStartDate ?? DateTime.now());

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context)
              .copyWith(colorScheme: const ColorScheme.light(primary: PiColors.primary)),
          child: child!,
        );
      },
    );

    if (picked == null) return;

    setState(() {
      if (isStart) {
        form.leaseStartDate = picked;
      } else {
        form.leaseEndDate = picked;
      }
    });
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
            : widget.registrationOnly
                ? _buildTenantRegistration(key: const ValueKey('registration'))
                : showForm
                ? _buildForm(key: const ValueKey('form'))
                : _buildRentalList(key: const ValueKey('list')),
      ),
    );
  }

  Widget _buildTenantRegistration({Key? key}) {
    final selectedUnit = _findUnit(form.recordId);
    final selectedTenant = _findTenant(form.tenantUserId);
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: Column(
        children: [
          Container(
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
                      const Text('Rental registration', style: PiText.screenTitle),
                      Text(
                        selectedProperty?.label ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: PiText.screenSubtitle,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
              children: [
                _formSection(
                  icon: Icons.home_work_outlined,
                  title: 'Choose a unit',
                  subtitle: 'Select the property space for this renter',
                  children: [
                    _pickerField(
                      label: 'Property unit',
                      value: selectedUnit?.label ?? '',
                      placeholder: loadingUnits ? 'Loading units…' : 'Select a unit',
                      onTap: loadingUnits ? () {} : _showUnitPicker,
                      disabled: loadingUnits,
                    ),
                  ],
                ),
                const SizedBox(height: PiSpace.lg),
                _formSection(
                  icon: Icons.person_add_alt_1_rounded,
                  title: 'Renter details',
                  subtitle: 'Register a renter against the selected unit',
                  children: [
                    if (selectedTenant != null)
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: PiColors.greenSoft,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.check_circle_outline_rounded,
                              color: PiColors.green,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    selectedTenant.label,
                                    style: const TextStyle(
                                      color: PiColors.ink,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  if (selectedTenant.subtitle.isNotEmpty)
                                    Text(
                                      selectedTenant.subtitle,
                                      style: const TextStyle(
                                        color: PiColors.muted,
                                        fontSize: 12,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      const Text(
                        'Create a renter account and link it to this unit.',
                        style: PiText.screenSubtitle,
                      ),
                    const SizedBox(height: 4),
                    OutlinedButton.icon(
                      onPressed: form.recordId == null ||
                              loadingTenants ||
                              creatingTenant
                          ? null
                          : _showTenantPicker,
                      icon: const Icon(Icons.people_outline_rounded),
                      label: Text(
                        loadingTenants
                            ? 'Loading renters…'
                            : 'Choose existing renter',
                      ),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        foregroundColor: PiColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            decoration: const BoxDecoration(
              color: PiColors.surface,
              border: Border(top: BorderSide(color: PiColors.hairline)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton.icon(
                onPressed: form.recordId == null || creatingTenant
                    ? null
                    : _showCreateTenant,
                icon: const Icon(Icons.person_add_alt_1_rounded),
                label: Text(
                  creatingTenant ? 'Registering…' : 'Register renter',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ),
        ],
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
                Text(
                  widget.registrationOnly
                      ? 'Rental registration'
                      : 'Rental Information',
                  style: PiText.screenTitle,
                ),
                const SizedBox(height: 2),
                Text(
                  loadingProperties
                      ? 'Loading…'
                      : widget.registrationOnly
                          ? 'Choose a property to register a renter'
                          : 'Select a property to continue',
                  style: PiText.screenSubtitle,
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _propertySearchController,
                  onChanged: (v) => setState(() => propertySearch = v),
                  style: const TextStyle(fontSize: 14),
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: 'Search property, code or area',
                    hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
                    prefixIcon:
                        const Icon(Icons.search_rounded, color: PiColors.muted, size: 20),
                    suffixIcon: propertySearch.isEmpty
                        ? null
                        : IconButton(
                            icon: const Icon(Icons.close_rounded, size: 18, color: PiColors.muted),
                            onPressed: () => setState(() {
                              propertySearch = '';
                              _propertySearchController.clear();
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
              child: loadingProperties
                  ? _loadingList()
                  : filteredProperties.isEmpty
                      ? _emptyState(
                          icon: Icons.home_work_outlined,
                          title: 'No properties found',
                          subtitle: 'No property information is available yet.',
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: filteredProperties.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) =>
                              _propertyOptionCard(filteredProperties[i]),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _propertyOptionCard(PropertyOption property) {
    return Material(
      color: PiColors.surface,
      borderRadius: BorderRadius.circular(PiRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(PiRadius.card),
        onTap: loadingRentals ? null : () => selectProperty(property),
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
                child: const Icon(Icons.apartment_rounded, color: PiColors.primary, size: 22),
              ),
              const SizedBox(width: PiSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(property.label,
                        style: PiText.cardTitle, maxLines: 1, overflow: TextOverflow.ellipsis),
                    if (property.code.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(property.code, style: PiText.cardMeta),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: PiColors.muted),
            ],
          ),
        ),
      ),
    );
  }


  Widget _buildRentalList({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: loadingRentals ? null : openCreate,
        backgroundColor: PiColors.primary,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add rental', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          _rentalListHeader(),
          Expanded(
            child: RefreshIndicator(
              color: PiColors.primary,
              onRefresh: loadRentals,
              child: loadingRentals
                  ? _loadingList()
                  : filteredRentals.isEmpty
                      ? _emptyState(
                          icon: Icons.receipt_long_outlined,
                          title: activeFilterCount > 0 || rentalSearch.trim().isNotEmpty
                              ? 'No rentals match'
                              : 'No rental information yet',
                          subtitle: activeFilterCount > 0 || rentalSearch.trim().isNotEmpty
                              ? 'Try a different search term or clear your filters.'
                              : 'Add rental information for this property.',
                          onClearFilters: activeFilterCount > 0 || rentalSearch.trim().isNotEmpty
                              ? clearFilters
                              : null,
                          onAdd: activeFilterCount > 0 || rentalSearch.trim().isNotEmpty
                              ? null
                              : openCreate,
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                          itemCount: filteredRentals.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) => _rentalCard(filteredRentals[i]),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _rentalListHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 10, 16, 12),
      decoration: const BoxDecoration(
        color: PiColors.surface,
        border: Border(bottom: BorderSide(color: PiColors.hairline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: saving || deleting ? null : changeProperty,
                icon: const Icon(Icons.arrow_back_rounded, color: PiColors.ink),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Rentals', style: PiText.screenTitle),
                    Text(
                      selectedProperty?.label ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: PiText.screenSubtitle,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: Text(
              loadingRentals
                  ? 'Loading…'
                  : '${filteredRentals.length} of ${rentals.length} rentals',
              style: PiText.screenSubtitle,
            ),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: TextField(
              controller: _rentalSearchController,
              onChanged: (v) => setState(() => rentalSearch = v),
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                isDense: true,
                hintText: 'Search tenant, status or rental ID',
                hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
                prefixIcon: const Icon(Icons.search_rounded, color: PiColors.muted, size: 20),
                suffixIcon: rentalSearch.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close_rounded, size: 18, color: PiColors.muted),
                        onPressed: () => setState(() {
                          rentalSearch = '';
                          _rentalSearchController.clear();
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
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: SizedBox(
              height: 34,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  if (activeFilterCount > 0) ...[
                    _actionChip(label: 'Clear', icon: Icons.close_rounded, onTap: clearFilters),
                    const SizedBox(width: PiSpace.sm),
                  ],
                  _filterChip(
                    label: filterStatus ?? 'Status',
                    active: filterStatus != null,
                    onTap: () => _showPicker(
                      title: 'Rental status',
                      options: kRentalStatuses,
                      selected: filterStatus,
                      onSelected: (v) => setState(() => filterStatus = v),
                    ),
                  ),
                  const SizedBox(width: PiSpace.sm),
                  _filterChip(
                    label: filterFrequency ?? 'Frequency',
                    active: filterFrequency != null,
                    onTap: () => _showPicker(
                      title: 'Payment frequency',
                      options: kPaymentFrequencies,
                      selected: filterFrequency,
                      onSelected: (v) => setState(() => filterFrequency = v),
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

  Widget _filterChip({required String label, required bool active, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: active ? PiColors.primary : PiColors.background,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: active ? PiColors.primary : PiColors.hairline),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(label,
                style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: active ? Colors.white : PiColors.ink)),
            const SizedBox(width: 3),
            Icon(Icons.keyboard_arrow_down_rounded,
                size: 16, color: active ? Colors.white : PiColors.muted),
          ],
        ),
      ),
    );
  }

  Widget _actionChip({required String label, required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(color: PiColors.redSoft, borderRadius: BorderRadius.circular(18)),
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

  Widget _rentalCard(RentalForm rental) {
    final meta = rental.statusMeta;
    return Material(
      color: PiColors.surface,
      borderRadius: BorderRadius.circular(PiRadius.card),
      child: InkWell(
        borderRadius: BorderRadius.circular(PiRadius.card),
        onTap: () => openEdit(rental),
        child: Container(
          padding: const EdgeInsets.all(PiSpace.md),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(PiRadius.card),
            border: Border.all(color: PiColors.hairline),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: PiColors.primarySoft,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.person_rounded, color: PiColors.primary),
                  ),
                  const SizedBox(width: PiSpace.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(rental.fullLabel,
                            style: PiText.cardTitle,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 3),
                        Text('Rental #${rental.id ?? 0}', style: PiText.cardMeta),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: meta.soft,
                      borderRadius: BorderRadius.circular(PiRadius.badge),
                    ),
                    child: Text(
                      rental.rentalStatus.isEmpty ? 'New' : rental.rentalStatus,
                      style:
                          TextStyle(color: meta.color, fontSize: 9.5, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: PiSpace.md),
              Container(
                padding: const EdgeInsets.all(PiSpace.md),
                decoration: BoxDecoration(
                  color: PiColors.background,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _infoItem(
                          icon: Icons.currency_rupee_rounded, label: 'Monthly Rent', value: rental.rentLine),
                    ),
                    Container(width: 1, height: 34, color: PiColors.hairline),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(left: PiSpace.md),
                        child: _infoItem(
                          icon: Icons.calendar_month_rounded,
                          label: 'Frequency',
                          value: rental.paymentFrequency.isEmpty ? '-' : rental.paymentFrequency,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: PiSpace.sm),
              Row(
                children: [
                  const Icon(Icons.date_range_rounded, size: 14, color: PiColors.muted),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(rental.leaseLine,
                        style: PiText.cardMeta, maxLines: 1, overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoItem({required IconData icon, required String label, required String value}) {
    return Row(
      children: [
        Icon(icon, size: 16, color: PiColors.primary),
        const SizedBox(width: 7),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(
                      color: PiColors.muted, fontSize: 10, fontWeight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: PiColors.ink, fontSize: 12, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ],
    );
  }


  Widget _buildForm({Key? key}) {
    final selectedUnit = _findUnit(form.recordId);

    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      body: Column(
        children: [
          _formHeader(selectedUnit),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _formSection(
                    icon: Icons.person_outline_rounded,
                    title: 'Rental overview',
                    subtitle: 'Select the unit, and set the current status',
                    children: [
                      _pickerField(
                        label: 'Unit / Property Master',
                        value: selectedUnit?.label ?? '',
                        placeholder: loadingUnits ? 'Loading units…' : 'Select a unit',
                        onTap: _showUnitPicker,
                        disabled: loadingUnits || saving || deleting,
                      ),
                      _tenantSelectionField(),
                      _pickerField(
                        label: 'Rental Status',
                        value: form.rentalStatus,
                        placeholder: 'Select',
                        onTap: () => _showPicker(
                          title: 'Rental status',
                          options: kRentalStatuses,
                          selected: form.rentalStatus,
                          onSelected: (v) => setState(() => form.rentalStatus = v ?? ''),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: PiSpace.lg),
                  _formSection(
                    icon: Icons.currency_rupee_rounded,
                    title: 'Rent details',
                    subtitle: 'Amounts and how often rent is collected',
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _field('Monthly Rent', 'monthlyRent',
                                placeholder: '0.00', numeric: true),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('Annual Rent', 'annualRent',
                                placeholder: '0.00', numeric: true),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _field('Security Deposit', 'securityDeposit',
                                placeholder: '0.00', numeric: true),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('Number of Cheques', 'numberOfCheques',
                                placeholder: 'Enter number',
                                numeric: true,
                              
                                forceDisabled: isEditing),
                          ),
                        ],
                      ),
                      _pickerField(
                        label: 'Payment Frequency',
                        value: form.paymentFrequency,
                        placeholder: 'Select',
                        onTap: () => _showPicker(
                          title: 'Payment frequency',
                          options: kPaymentFrequencies,
                          selected: form.paymentFrequency,
                          onSelected: (v) => setState(() => form.paymentFrequency = v ?? ''),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: PiSpace.lg),
                  _formSection(
                    icon: Icons.date_range_rounded,
                    title: 'Lease period',
                    subtitle: 'Start, end and renewal terms',
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _dateField(
                              label: 'Lease Start Date',
                              value: form.leaseStartDate,
                              onTap: () => _pickDate(isStart: true),
                            ),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _dateField(
                              label: 'Lease End Date',
                              value: form.leaseEndDate,
                              onTap: () => _pickDate(isStart: false),
                            ),
                          ),
                        ],
                      ),
                      _pickerField(
                        label: 'Renewal Option',
                        value: form.renewalOption,
                        placeholder: 'Select',
                        onTap: () => _showPicker(
                          title: 'Renewal option',
                          options: kRenewalOptions,
                          selected: form.renewalOption,
                          onSelected: (v) => setState(() => form.renewalOption = v ?? ''),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: PiSpace.lg),
                  _formSection(
                    icon: Icons.rule_rounded,
                    title: 'Rent rules',
                    subtitle: 'Increases, grace period and late fees',
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _field('Rent Increase %', 'rentIncreasePercentage',
                                placeholder: '0', numeric: true),
                          ),
                          const SizedBox(width: PiSpace.md),
                          Expanded(
                            child: _field('Grace Period (days)', 'gracePeriod',
                                placeholder: '0', numeric: true),
                          ),
                        ],
                      ),
                      _field('Late Fee Rules', 'lateFeeRules',
                          placeholder: 'Enter late fee rules', maxLines: 4),
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
                          deleting ? 'Deleting…' : 'Delete this rental',
                          style:
                              const TextStyle(color: PiColors.red, fontWeight: FontWeight.w700),
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

  Widget _tenantSelectionField() {
    final selected = _findTenant(form.tenantUserId);
    final displayName = selected?.label ??
        (form.tenantName.trim().isNotEmpty ? form.tenantName : '');
    final subtitle = selected?.subtitle ?? '';
    final disabled = form.recordId == null ||
        saving ||
        deleting ||
        creatingTenant;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel('Tenant'),
        Container(
          padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
          decoration: BoxDecoration(
            color: disabled ? const Color(0xFFF5F6FA) : PiColors.background,
            borderRadius: BorderRadius.circular(PiRadius.field),
            border: Border.all(
              color: form.tenantUserId == null
                  ? PiColors.hairline
                  : PiColors.primaryTint,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: PiColors.primarySoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.person_outline_rounded,
                  color: PiColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: InkWell(
                  onTap: disabled ? null : _showTenantPicker,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        displayName.isEmpty ? 'Select a tenant' : displayName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: displayName.isEmpty
                              ? PiColors.muted
                              : PiColors.ink,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        form.recordId == null
                            ? 'Choose a unit first'
                            : loadingTenants
                                ? 'Loading tenants…'
                                : subtitle.isNotEmpty
                                    ? subtitle
                                    : 'Select an existing tenant or create one',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: PiColors.muted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Create tenant',
                onPressed: disabled ? null : _showCreateTenant,
                icon: creatingTenant
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(
                        Icons.person_add_alt_1_rounded,
                        color: PiColors.primary,
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _formHeader(RentalUnitOption? selectedUnit) {
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
                  isEditing ? 'Edit rental' : 'New rental',
                  style: const TextStyle(
                      fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink),
                ),
                Text(
                  [
                    selectedProperty?.label ?? '',
                    if (selectedUnit != null) selectedUnit.label,
                  ].where((s) => s.isNotEmpty).join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
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

  Widget _field(
    String label,
    String key, {
    String? placeholder,
    bool numeric = false,
    int maxLines = 1,
    // Number of Cheques can be locked while editing.
    bool forceDisabled = false,
  }) {
    final disabled = saving || deleting || forceDisabled;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        TextField(
          controller: _controllers[key],
          enabled: !disabled,
          maxLines: maxLines,
          keyboardType: numeric ? const TextInputType.numberWithOptions(decimal: true) : null,
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
    bool disabled = false,
  }) {
    final isDisabled = disabled || saving || deleting;
    final hasValue = value.isNotEmpty;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label),
        InkWell(
          onTap: isDisabled ? null : onTap,
          borderRadius: BorderRadius.circular(PiRadius.field),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            decoration: BoxDecoration(
              color: isDisabled ? const Color(0xFFF5F6FA) : PiColors.background,
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
    required DateTime? value,
    required VoidCallback onTap,
  }) {
    final disabled = saving || deleting;
    final hasValue = value != null;
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
                    hasValue ? _fmtDate(value) : 'Select date',
                    style: TextStyle(
                      fontSize: 14,
                      color: hasValue ? PiColors.ink : PiColors.muted,
                      fontWeight: hasValue ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
                const Icon(Icons.calendar_today_outlined, color: PiColors.muted, size: 18),
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
          onPressed: (saving || deleting || creatingTenant || loadingTenants)
              ? null
              : handleSave,
          icon: Icon(
            saving || creatingTenant || loadingTenants
                ? Icons.hourglass_top_rounded
                : Icons.check_rounded,
            size: 20,
          ),
          label: Text(
            saving || creatingTenant || loadingTenants
                ? 'Please wait…'
                : (isEditing ? 'Update rental' : 'Save rental'),
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

  Widget _emptyState({
    required IconData icon,
    required String title,
    required String subtitle,
    VoidCallback? onClearFilters,
    VoidCallback? onAdd,
  }) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(icon, size: 56, color: PiColors.primaryTint),
        const SizedBox(height: PiSpace.lg),
        Text(title,
            textAlign: TextAlign.center,
            style:
                const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: PiColors.ink)),
        const SizedBox(height: 6),
        Text(subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4)),
        const SizedBox(height: 20),
        if (onClearFilters != null)
          Center(
            child: OutlinedButton(
              onPressed: onClearFilters,
              style: OutlinedButton.styleFrom(
                foregroundColor: PiColors.primary,
                side: const BorderSide(color: PiColors.primaryTint),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.badge)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Text('Clear filters'),
            ),
          )
        else if (onAdd != null)
          Center(
            child: ElevatedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add rental'),
              style: ElevatedButton.styleFrom(
                backgroundColor: PiColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.badge)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
          ),
      ],
    );
  }
}

class _TenantDraft {
  final String name;
  final String mobile;
  final String email;
  final String address;

  const _TenantDraft({
    required this.name,
    required this.mobile,
    required this.email,
    required this.address,
  });
}

class _TenantCreateSheet extends StatefulWidget {
  const _TenantCreateSheet();

  @override
  State<_TenantCreateSheet> createState() => _TenantCreateSheetState();
}

class _TenantCreateSheetState extends State<_TenantCreateSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.pop(
      context,
      _TenantDraft(
        name: _nameController.text,
        mobile: _mobileController.text,
        email: _emailController.text,
        address: _addressController.text,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: PiColors.hairline,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'Create tenant',
                  style: TextStyle(
                    color: PiColors.ink,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 5),
                const Text(
                  'The tenant will be linked to the selected property and unit.',
                  style: TextStyle(color: PiColors.muted, fontSize: 13),
                ),
                const SizedBox(height: 18),
                _tenantTextField(
                  controller: _nameController,
                  label: 'Full name',
                  hint: 'Enter tenant name',
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Name is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                _tenantTextField(
                  controller: _mobileController,
                  label: 'Mobile',
                  hint: 'Enter mobile number',
                  keyboardType: TextInputType.phone,
                  validator: (value) => value == null || value.trim().isEmpty
                      ? 'Mobile number is required.'
                      : null,
                ),
                const SizedBox(height: 12),
                _tenantTextField(
                  controller: _emailController,
                  label: 'Email (optional)',
                  hint: 'name@example.com',
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    final email = value?.trim() ?? '';
                    if (email.isNotEmpty && !email.contains('@')) {
                      return 'Enter a valid email address.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                _tenantTextField(
                  controller: _addressController,
                  label: 'Address (optional)',
                  hint: 'Address line 1',
                  maxLines: 2,
                ),
                const SizedBox(height: 20),
                SizedBox(
                  height: 50,
                  child: FilledButton.icon(
                    onPressed: _submit,
                    icon: const Icon(Icons.person_add_alt_1_rounded),
                    label: const Text(
                      'Create and select tenant',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _tenantTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: PiText.label),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: PiColors.background,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(PiRadius.field),
              borderSide: BorderSide.none,
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 13,
            ),
          ),
        ),
      ],
    );
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
            const Text('Delete rental?',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink)),
            const SizedBox(height: 6),
            Text(
              '"$label" will be permanently removed. This can\'t be undone.',
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
                      shape:
                          RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.field)),
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
                      shape:
                          RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.field)),
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