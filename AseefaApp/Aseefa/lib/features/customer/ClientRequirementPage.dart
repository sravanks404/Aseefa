import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/api_config.dart';

class AppColors {
  static const primary = Color(0xFF1433C3);
  static const secondary = Color(0xFF6F7FDB);
  static const background = Color(0xFFF5F7FB);
  static const card = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF111827);
  static const textSecondary = Color(0xFF6B7280);
  static const border = Color(0xFFE5E7EB);
  static const success = Color(0xFF16A34A);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFDC2626);
}

class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const xxl = 32.0;
}

class AppRadius {
  static const cards = 16.0;
  static const buttons = 12.0;
  static const textFields = 12.0;
  static const dialogs = 16.0;
  static const bottomSheets = 20.0;
  static const badges = 16.0;
}

class AppIconSize {
  static const card = 16.0;
  static const listTile = 20.0;
  static const appBar = 24.0;
  static const fab = 24.0;
}

class AppShadow {
  static final card = [
    BoxShadow(
      color: Colors.black.withOpacity(0.05),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];
}

class AppText {
  static const _f = 'Inter';

  static const pageTitle = TextStyle(
    fontFamily: _f,
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );
  static const sectionTitle = TextStyle(
    fontFamily: _f,
    fontSize: 16,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
  );
  static const cardValue = TextStyle(
    fontFamily: _f,
    fontSize: 20,
    fontWeight: FontWeight.w900,
    color: AppColors.textPrimary,
  );
  static const cardTitle = TextStyle(
    fontFamily: _f,
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: AppColors.textSecondary,
  );
  static const buttonText = TextStyle(
    fontFamily: _f,
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: Colors.white,
  );
  static const inputText = TextStyle(
    fontFamily: _f,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textPrimary,
  );
  static const smallText = TextStyle(
    fontFamily: _f,
    fontSize: 11,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );
  static const caption = TextStyle(
    fontFamily: _f,
    fontSize: 10,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );
}

class ClientRequirementPage extends StatefulWidget {
  final Map client;

  const ClientRequirementPage({super.key, required this.client});

  @override
  State<ClientRequirementPage> createState() => _ClientRequirementPageState();
}

class _ClientRequirementPageState extends State<ClientRequirementPage> {
  int createdBy = 0;
  int companyId = 0;

  // ── CONTROLLERS ─────────────────────────────
  final _clientName = TextEditingController();
  final _project = TextEditingController();
  final _reqDate = TextEditingController();
  final _location = TextEditingController();
  final _mobDate = TextEditingController();
  final _remark = TextEditingController();

  bool loading = false;
  bool rolesLoading = false;
  bool _isSubmitting = false;

  Map? selectedRole;
  List roles = [];
  List<RoleEntry> entries = [];

  // ── VALIDATION ERRORS ─────────────────────────────
  // Only the 4 required fields tracked here.
  final Map<String, String?> _errors = {
    'clientName': null,
    'project': null,
    'reqDate': null,
  };

  @override
  void initState() {
    super.initState();
    _clientName.text = widget.client["CompanyName"] ?? "";
    loadSessionData();
    fetchRoles();
  }

  // ── LOAD SESSION DATA ─────────────────────────────
  Future<void> loadSessionData() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      createdBy = prefs.getInt('UserId') ?? 0;
      companyId = int.tryParse(prefs.getString('CompanyID') ?? '0') ?? 0;
    });
    debugPrint("CreatedBy: $createdBy");
    debugPrint("CompanyID: $companyId");
  }

  // ── FETCH ROLES ─────────────────────────────
  Future<void> fetchRoles() async {
    setState(() => rolesLoading = true);
    try {
      final res = await http.get(
        Uri.parse("${ApiConfig.apiBaseUrl}${ApiConfig.getJobRoles}"),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          roles = data["data"];
          rolesLoading = false;
        });
      } else {
        setState(() => rolesLoading = false);
        snack("Failed to load roles");
      }
    } catch (e) {
      setState(() => rolesLoading = false);
      snack("Error loading roles");
    }
  }

  @override
  void dispose() {
    _clientName.dispose();
    _project.dispose();
    _reqDate.dispose();
    _location.dispose();
    _mobDate.dispose();
    _remark.dispose();
    for (var e in entries) {
      e.dispose();
    }
    super.dispose();
  }

  // ── RESET FORM ─────────────────────────────
  void resetForm() {
    _clientName.text = widget.client["CompanyName"] ?? "";
    _project.clear();
    _reqDate.clear();
    _location.clear();
    _mobDate.clear();
    _remark.clear();
    for (var e in entries) {
      e.dispose();
    }
    setState(() {
      entries = [];
      selectedRole = null;
      _errors.updateAll((_, __) => null);
    });
  }

  // ── VALIDATE ─────────────────────────────
  bool _validate() {
    final newErrors = <String, String?>{
      'clientName': _clientName.text.trim().isEmpty
          ? 'Client Name is required'
          : null,
      'project': _project.text.trim().isEmpty
          ? 'Project Name is required'
          : null,
      'reqDate': _reqDate.text.trim().isEmpty
          ? 'Requirement Date is required'
          : null,
    };

    setState(() => _errors.addAll(newErrors));

    // Stop if any field-level error exists.
    if (newErrors.values.any((e) => e != null)) return false;

    // Role check — shown as a styled toast, not a field error.
    if (entries.isEmpty) {
      _showNoRoleToast();
      return false;
    }

    // Per-role quantity check.
    for (var role in entries) {
      final qty = int.tryParse(role.qty.text.trim()) ?? 0;
      if (qty <= 0) {
        snack("Enter valid quantity for ${role.name}");
        return false;
      }
    }

    return true;
  }

  // ── SUBMIT ─────────────────────────────
  Future<void> submit() async {
    if (_isSubmitting) return;
    if (!_validate()) return;

    final clientId = widget.client["ClientID"] ?? widget.client["AccountID"];
    if (clientId == null) {
      snack("Client ID missing");
      return;
    }

    _isSubmitting = true;
    setState(() => loading = true);

    final body = {
      "ClientID": clientId,
      "ClientName": _clientName.text.trim(),
      "ProjectName": _project.text.trim(),
      "Date": _reqDate.text.trim(),
      "ProjectLocation": _location.text.trim(),
      "MobilizationDate": _mobDate.text.trim(),
      "Remark": _remark.text.trim(),
      "CreatedBy": createdBy,
      "CompanyID": companyId,
      "Details": entries
          .map(
            (e) => {
              "RoleName": e.name,
              "RoleID": e.id,
              "Quantity": int.tryParse(e.qty.text) ?? 1,
              "DetailRemark": e.remark.text.trim(),
            },
          )
          .toList(),
    };

    debugPrint("REQUEST: ${jsonEncode(body)}");

    try {
      final res = await http.post(
        Uri.parse("${ApiConfig.apiBaseUrl}${ApiConfig.insertRequirement}"),
        headers: {"Content-Type": "application/json; charset=UTF-8"},
        body: jsonEncode(body),
      );

      debugPrint("RESPONSE: ${res.body}");

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data["success"] == true) {
          snack("Requirement submitted successfully", success: true);
          resetForm();
        } else {
          snack(data.toString());
        }
      } else {
        snack("Server error: ${res.statusCode}");
      }
    } catch (e) {
      snack("Error: $e");
    } finally {
      _isSubmitting = false;
      if (mounted) setState(() => loading = false);
    }
  }

  // ── ADD ROLE ─────────────────────────────
  void addRole() {
    if (selectedRole == null) return;
    final roleId = selectedRole!["RoleID"];
    final roleName = selectedRole!["RoleName"];
    if (entries.any((e) => e.id == roleId)) {
      snack("Role already added");
      return;
    }
    setState(() {
      entries.add(RoleEntry(roleId, roleName));
      selectedRole = null;
    });
  }

  // ── SNACK ─────────────────────────────
  void snack(String msg, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          msg,
          style: AppText.smallText.copyWith(color: Colors.white),
        ),
        backgroundColor: success ? AppColors.success : AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.buttons),
        ),
      ),
    );
  }

  // ── NO-ROLE TOAST ─────────────────────────────
  void _showNoRoleToast() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        duration: const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.transparent,
        elevation: 0,
        margin: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          0,
          AppSpacing.lg,
          AppSpacing.xl,
        ),
        content: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          decoration: BoxDecoration(
            // color: const Color(0xFF1C1C2E),
            color: AppColors.error,
            borderRadius: BorderRadius.circular(AppRadius.cards),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.18),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: AppColors.warning.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person_add_alt_1_outlined,
                  color: AppColors.warning,
                  size: AppIconSize.listTile,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "No Role Added",
                      style: AppText.smallText.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "Select a role and tap Add Role before submitting.",
                      style: AppText.caption.copyWith(
                        color: Colors.white70,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── DATE PICKER ─────────────────────────────
  Future<void> _pickDate(TextEditingController controller) async {
    final DateTime initial =
        DateTime.tryParse(controller.text) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted =
          "${picked.year.toString().padLeft(4, '0')}-"
          "${picked.month.toString().padLeft(2, '0')}-"
          "${picked.day.toString().padLeft(2, '0')}";

      setState(() {
        controller.text = formatted;
        // Only reqDate has validation; clear its error when a date is picked.
        if (controller == _reqDate) _errors['reqDate'] = null;
      });
    }
  }

  // ── DECORATION ─────────────────────────────
  InputDecoration _decoration(String label, {Color? fill, String? errorText}) {
    final hasError = errorText != null;
    return InputDecoration(
      labelText: label,
      labelStyle: AppText.smallText.copyWith(
        color: hasError ? AppColors.error : AppColors.textSecondary,
      ),
      filled: true,
      fillColor: hasError
          ? AppColors.error.withOpacity(0.04)
          : (fill ?? AppColors.background),
      helperText: hasError ? errorText : null,
      helperStyle: const TextStyle(
        fontSize: 11,
        color: AppColors.error,
        fontWeight: FontWeight.w500,
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.textFields),
        borderSide: BorderSide(
          color: hasError ? AppColors.error : AppColors.border,
        ),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.textFields),
        borderSide: BorderSide(
          color: hasError ? AppColors.error : AppColors.border,
          width: hasError ? 1.5 : 1.0,
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.textFields),
        borderSide: BorderSide(
          color: hasError ? AppColors.error : AppColors.primary,
          width: 1.5,
        ),
      ),
    );
  }

  ButtonStyle get _primaryButtonStyle => ElevatedButton.styleFrom(
    backgroundColor: AppColors.primary,
    disabledBackgroundColor: AppColors.primary.withOpacity(0.5),
    foregroundColor: Colors.white,
    textStyle: AppText.buttonText,
    padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppRadius.buttons),
    ),
  );

  // ── VALIDATED TEXT FIELD ─────────────────────────────
  // Clears its own error as soon as the user starts typing.
  Widget field(String label, TextEditingController c, String errorKey) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: TextField(
        controller: c,
        style: AppText.inputText,
        onChanged: (_) {
          if (_errors[errorKey] != null) {
            setState(() => _errors[errorKey] = null);
          }
        },
        decoration: _decoration(
          label,
          fill: AppColors.card,
          errorText: _errors[errorKey],
        ),
      ),
    );
  }

  // ── PLAIN TEXT FIELD (optional, no validation) ───────────────────────
  Widget plainField(String label, TextEditingController c) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: TextField(
        controller: c,
        style: AppText.inputText,
        decoration: _decoration(label, fill: AppColors.card),
      ),
    );
  }
  // ── READ ONLY FIELD ─────────────────────────────
Widget readOnlyField(String label, TextEditingController c) {
  return Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.md),
    child: TextField(
      controller: c,
      readOnly: true,
      style: AppText.inputText.copyWith(
        color: AppColors.textSecondary,
      ),
      decoration: _decoration(
        label,
        fill: AppColors.card,
      ).copyWith(
        suffixIcon: const Icon(
          Icons.lock_outline,
          size: AppIconSize.listTile,
          color: AppColors.textSecondary,
        ),
      ),
    ),
  );
}

  // ── VALIDATED DATE FIELD ─────────────────────────────
  Widget dateField(String label, TextEditingController c, String errorKey) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: TextField(
        controller: c,
        readOnly: true,
        onTap: () => _pickDate(c),
        style: AppText.inputText,
        decoration: _decoration(
          label,
          fill: AppColors.card,
          errorText: _errors[errorKey],
        ).copyWith(
          suffixIcon: Icon(
            Icons.calendar_today_outlined,
            size: AppIconSize.listTile,
            color: _errors[errorKey] != null
                ? AppColors.error
                : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  // ── PLAIN DATE FIELD (optional, no validation) ───────────────────────
  Widget plainDateField(String label, TextEditingController c) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: TextField(
        controller: c,
        readOnly: true,
        onTap: () => _pickDate(c),
        style: AppText.inputText,
        decoration: _decoration(label, fill: AppColors.card).copyWith(
          suffixIcon: const Icon(
            Icons.calendar_today_outlined,
            size: AppIconSize.listTile,
            color: AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  // ── SECTION CARD ─────────────────────────────
  Widget _sectionCard({required String title, required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(AppRadius.cards),
        border: Border.all(color: AppColors.border),
        boxShadow: AppShadow.card,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppText.sectionTitle),
          const SizedBox(height: AppSpacing.md),
          child,
        ],
      ),
    );
  }

  // ── ROLE DROPDOWN ─────────────────────────────
  Widget _roleDropdown() {
    return DropdownButtonFormField<Map>(
      value: selectedRole,
      hint: Text(
        "Select Role",
        style: AppText.inputText.copyWith(color: AppColors.textSecondary),
      ),
      style: AppText.inputText,
      decoration: _decoration("Role"),
      items: roles.map<DropdownMenuItem<Map>>((r) {
        return DropdownMenuItem<Map>(
          value: r,
          child: Text(r["RoleName"], style: AppText.inputText),
        );
      }).toList(),
      onChanged: (v) => setState(() => selectedRole = v),
    );
  }

  // ── ROLE CARD ─────────────────────────────
  Widget _roleCard(RoleEntry e) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(AppRadius.cards),
          border: Border.all(color: AppColors.border),
          boxShadow: AppShadow.card,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.badge_outlined,
                      size: AppIconSize.card,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(child: Text(e.name, style: AppText.sectionTitle)),
                IconButton(
                  icon: const Icon(
                    Icons.delete_outline,
                    size: AppIconSize.listTile,
                    color: AppColors.error,
                  ),
                  onPressed: () => setState(() => entries.remove(e)),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: e.qty,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: AppText.inputText,
              decoration: _decoration("Quantity"),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: e.remark,
              style: AppText.inputText,
              decoration: _decoration("Remark"),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(size: AppIconSize.appBar),
        title: Text(
          "Client Requirement",
          style: AppText.pageTitle.copyWith(color: Colors.white),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          // ── DETAILS SECTION ──
          _sectionCard(
            title: "Requirement Details",
            child: Column(
              children: [
                // field("Client Name *", _clientName, 'clientName'),
                readOnlyField("Client Name *", _clientName),
                field("Project Name *", _project, 'project'),
                dateField("Requirement Date *", _reqDate, 'reqDate'),
                plainField("Location", _location),
                plainDateField("Mobilization Date", _mobDate),
                plainField("Remark", _remark),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // ── ADD ROLE SECTION ──
          _sectionCard(
            title: "Add Role",
            child: Column(
              children: [
                rolesLoading
                    ? const Padding(
                        padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
                        child: Center(
                          child: CircularProgressIndicator(
                            color: AppColors.primary,
                          ),
                        ),
                      )
                    : _roleDropdown(),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: _primaryButtonStyle,
                    onPressed: addRole,
                    child: const Text("Add Role"),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.lg),

          // ── ROLE LIST ──
          if (entries.isNotEmpty) ...[
            Text("Selected Roles", style: AppText.sectionTitle),
            const SizedBox(height: AppSpacing.sm),
            ...entries.map((e) => _roleCard(e)),
          ],

          const SizedBox(height: AppSpacing.xl),

          // ── SUBMIT BUTTON ──
          SizedBox(
            height: 50,
            child: ElevatedButton(
              style: _primaryButtonStyle,
              onPressed: loading ? null : submit,
              child: loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text("Submit Requirement", style: AppText.buttonText),
            ),
          ),

          const SizedBox(height: AppSpacing.xl),
        ],
      ),
    );
  }
}

// ── MODEL ─────────────────────────────
class RoleEntry {
  int id;
  String name;
  TextEditingController qty = TextEditingController(text: "1");
  TextEditingController remark = TextEditingController();

  RoleEntry(this.id, this.name);

  void dispose() {
    qty.dispose();
    remark.dispose();
  }
}