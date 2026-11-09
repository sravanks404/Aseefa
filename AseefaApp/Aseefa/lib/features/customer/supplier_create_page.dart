import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/api_config.dart';

// ─── Models ──────────────────────────────────────────────────────────────────
class ContactPerson {
  String contactPerson;
  String contactNumber;

  ContactPerson({required this.contactPerson, required this.contactNumber});

  Map<String, dynamic> toJson() => {
    'ContactPerson': contactPerson,
    'ContactNumber': contactNumber,
  };
}

class SupplierVisitModel {
  String companyName;
  int userId;
  int companyId;
  int customerSuitAppsId;
  String email;
  String phone;
  String projectLocation;
  double latitude;
  double longitude;
  String remark;
  String? image;
  List<ContactPerson> contactPersons;

  SupplierVisitModel({
    required this.companyName,
    required this.userId,
    required this.companyId,
    required this.customerSuitAppsId,
    required this.email,
    required this.phone,
    required this.projectLocation,
    required this.latitude,
    required this.longitude,
    required this.remark,
    this.image,
    required this.contactPersons,
  });

  Map<String, dynamic> toJson() => {
    'CompanyName': companyName,
    'UserId': userId,
    'CompanyId': companyId,
    'CustomerSuitAppsId': customerSuitAppsId,
    'Email': email,
    'Phone': phone,
    'ProjectLocation': projectLocation,
    'Latitude': latitude,
    'Longitude': longitude,
    'Remark': remark,
    'Image': image,
    'ContactPersons': contactPersons.map((e) => e.toJson()).toList(),
  };
}

class SupplierCreatePage extends StatefulWidget {
  const SupplierCreatePage({super.key});

  @override
  State<SupplierCreatePage> createState() => _SupplierCreatePageState();
}

class _SupplierCreatePageState extends State<SupplierCreatePage>
    with TickerProviderStateMixin {
  // ─── Design System ────────────────────────────────────────────────────────
  static const Color primary = Color.fromARGB(255, 35, 0, 196);
  static const Color primaryLight = Color(0xFF6F7FDB);
  static const Color bgColor = Color(0xFFF5F7FB);
  static const Color cardBg = Colors.white;
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color borderColor = Color(0xFFE5E7EB);
  static const Color errorColor = Color(0xFFDC2626);
  static const Color successColor = Color(0xFF16A34A);
  static const Color warningColor = Color(0xFFF59E0B);

  // Spacing
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;

  // Border Radius
  static const double radiusCard = 16;
  static const double radiusButton = 12;
  static const double radiusField = 12;
  static const double radiusBadge = 10;

  // Shadow
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.05),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  // ─── Form Controllers ─────────────────────────────────────────────────────
  final _formKey = GlobalKey<FormState>();
  bool _isSaving = false;
  bool _autoValidate = false;

  final _companyNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _projectLocationCtrl = TextEditingController();
  final _remarkCtrl = TextEditingController();

  // Contact Persons
  final List<ContactPerson> _contactPersons = [];
  final List<TextEditingController> _contactPersonNameCtrls = [];
  final List<TextEditingController> _contactPersonNumberCtrls = [];

  // GPS Location
  Position? _currentPosition;
  String _gpsStatus = 'Not captured';
  double _latitude = 0.0;
  double _longitude = 0.0;

  // Image
  File? _selectedImage;
  final _picker = ImagePicker();

  // Visit Date Time
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  String _formattedDateTime = '';

  // User Info (should come from auth/session)
  int _userId = 0; // TODO: Get from actual session
  int _companyId = 0; // TODO: Get from actual session

  int _customerSuitAppsId() {
    final now = DateTime.now();

    final dateTime = DateFormat('ddMMyyyyHHmmss').format(now);

    return int.parse('$dateTime$_userId');
  }

  // Animation
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  @override
  void initState() {
    super.initState();

    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);

    _fadeCtrl.forward();

    _updateFormattedDateTime();

    _loadSession();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();

    setState(() {
      _userId = prefs.getInt('UserId') ?? 0;

      _companyId = int.tryParse(prefs.getString('CompanyID') ?? '0') ?? 0;
    });

    debugPrint('Loaded UserId=$_userId CompanyId=$_companyId');
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _companyNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _projectLocationCtrl.dispose();
    _remarkCtrl.dispose();
    for (var ctrl in _contactPersonNameCtrls) {
      ctrl.dispose();
    }
    for (var ctrl in _contactPersonNumberCtrls) {
      ctrl.dispose();
    }
    super.dispose();
  }

  void _updateFormattedDateTime() {
    _formattedDateTime = DateFormat('dd/MM/yyyy - hh:mm a').format(
      DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        _selectedTime.hour,
        _selectedTime.minute,
      ),
    );
    setState(() {});
  }

  // ─── Image Picker ─────────────────────────────────────────────────────────
  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 25, // reduce size
      maxWidth: 1200,
      maxHeight: 1200,
      preferredCameraDevice: CameraDevice.rear,
    );

    if (image != null) {
      setState(() => _selectedImage = File(image.path));
    }
  }

  // ─── GPS Location ─────────────────────────────────────────────────────────
  Future<void> _getCurrentLocation() async {
    setState(() {
      _gpsStatus = 'Getting location...';
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _gpsStatus = 'Location services disabled';
        });
        _showSnack('Please enable location services', isError: true);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _gpsStatus = 'Location permission denied';
          });
          _showSnack('Location permission denied', isError: true);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _gpsStatus = 'Permission permanently denied';
        });
        _showSnack('Location permission permanently denied', isError: true);
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentPosition = position;
        _latitude = position.latitude;
        _longitude = position.longitude;
        _gpsStatus = 'Location captured ✓';
      });

      _showSnack('Location captured successfully', isError: false);
    } catch (e) {
      setState(() {
        _gpsStatus = 'Failed to get location';
      });
      _showSnack('Failed to get location: $e', isError: true);
    }
  }

  // ─── Contact Persons Management ───────────────────────────────────────────
  void _addContactPerson() {
    setState(() {
      _contactPersons.add(ContactPerson(contactPerson: '', contactNumber: ''));
      _contactPersonNameCtrls.add(TextEditingController());
      _contactPersonNumberCtrls.add(TextEditingController());
    });
  }

  void _removeContactPerson(int index) {
    setState(() {
      _contactPersons.removeAt(index);
      _contactPersonNameCtrls[index].dispose();
      _contactPersonNumberCtrls[index].dispose();
      _contactPersonNameCtrls.removeAt(index);
      _contactPersonNumberCtrls.removeAt(index);
    });
  }

  void _updateContactPerson(int index) {
    setState(() {
      _contactPersons[index] = ContactPerson(
        contactPerson: _contactPersonNameCtrls[index].text,
        contactNumber: _contactPersonNumberCtrls[index].text,
      );
    });
  }

  // ─── Validators ───────────────────────────────────────────────────────────
  String? _required(String? v, String field) {
    if (v == null || v.trim().isEmpty) return '$field is required';
    return null;
  }

  String? _validateEmail(String? v) {
    if (v == null || v.trim().isEmpty) return 'Email is required';
    final regex = RegExp(r'^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$');
    if (!regex.hasMatch(v.trim())) return 'Enter a valid email address';
    return null;
  }

  String? _validatePhone(String? v) {
    if (v == null || v.trim().isEmpty) return 'Phone number is required';
    final digits = v.replaceAll(RegExp(r'\D'), '');
    // if (digits.length != 10) return 'Enter a valid 10-digit number';
    if (digits.length < 8 || digits.length > 15) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  String? _validateContactPersonName(String? v, int index) {
    if (v == null || v.trim().isEmpty) return 'Contact person name required';
    if (v.trim().length < 2) return 'Minimum 2 characters required';
    return null;
  }

  // String? _validateContactPersonNumber(String? v, int index) {
  //   if (v == null || v.trim().isEmpty) return 'Contact number required';
  //   final digits = v.replaceAll(RegExp(r'\D'), '');
  //   if (digits.length != 10) return 'Enter a valid 10-digit number';
  //   return null;
  // }
  String? _validateContactPersonNumber(String? v, int index) {
    if (v == null || v.trim().isEmpty) {
      return 'Contact number required';
    }

    final digits = v.replaceAll(RegExp(r'\D'), '');

    if (digits.length < 8 || digits.length > 15) {
      return 'Enter a valid phone number';
    }

    return null;
  }

  String? _validateGPS() {
    if (_latitude == 0.0 && _longitude == 0.0) {
      return 'GPS location is required';
    }
    return null;
  }

  // ─── Submit to API ────────────────────────────────────────────────────────
  Future<void> _submitForm() async {
    // setState(() => _autoValidate = true);
    if (_isSaving) {
      return;
    }

    setState(() {
      _isSaving = true;
      _autoValidate = true;
    });

    _selectedDate = DateTime.now();
    _selectedTime = TimeOfDay.now();
    _updateFormattedDateTime();

    // Auto capture GPS (hidden from UI)
    if (_latitude == 0.0 && _longitude == 0.0) {
      try {
        await _getCurrentLocation();
      } catch (_) {}
    }

    // Validate all contact persons
    bool contactPersonsValid = true;
    for (int i = 0; i < _contactPersons.length; i++) {
      if (_contactPersonNameCtrls[i].text.trim().isEmpty ||
          _contactPersonNumberCtrls[i].text.trim().isEmpty) {
        contactPersonsValid = false;
        break;
      }
    }

    final isValid = _formKey.currentState?.validate() ?? false;
    // if (!isValid || !contactPersonsValid) {
    //   _showSnack('Please fill in all required fields', isError: true);
    //   return;
    // }
    if (!isValid || !contactPersonsValid) {
      _showSnack('Please fill in all required fields', isError: true);

      setState(() {
        _isSaving = false;
      });

      return;
    }

    // if (_contactPersons.isEmpty) {
    //   _showSnack('Please add at least one contact person', isError: true);
    //   return;
    // }
    if (_contactPersons.isEmpty) {
      _showSnack('Please add at least one contact person', isError: true);

      setState(() {
        _isSaving = false;
      });

      return;
    }

    if (_latitude == 0.0 && _longitude == 0.0) {
      _showSnack('Unable to fetch device location', isError: true);
      return;
    }

    // setState(() => _isSaving = true);

    try {
      // Update contact persons data
      for (int i = 0; i < _contactPersons.length; i++) {
        _contactPersons[i] = ContactPerson(
          contactPerson: _contactPersonNameCtrls[i].text,
          contactNumber: _contactPersonNumberCtrls[i].text,
        );
      }

      String? base64Image;

      if (_selectedImage != null) {
        final bytes = await _selectedImage!.readAsBytes();
        base64Image = base64Encode(bytes);
      }

      final SupplierVisit = SupplierVisitModel(
        companyName: _companyNameCtrl.text.trim(),
        userId: _userId,
        companyId: _companyId,
        customerSuitAppsId: _customerSuitAppsId(),
        email: _emailCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        projectLocation: _projectLocationCtrl.text.trim(),
        latitude: _latitude,
        longitude: _longitude,
        remark: _remarkCtrl.text.trim(),
        image: base64Image,
        contactPersons: _contactPersons,
      );

      final response = await _sendToApi(SupplierVisit);

      if (!mounted) return;

      if (response['success'] == true) {
        _showSnack('Supplier visit recorded successfully!', isError: false);
        _resetForm();
      } else {
        _showSnack('Failed to submit: ${response['message']}', isError: true);
      }
    } catch (e) {
      debugPrint('SUBMIT ERROR: $e');
      if (!mounted) return;
      _showSnack('Failed to submit supplier visit.', isError: true);
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<Map<String, dynamic>> _sendToApi(SupplierVisitModel data) async {
    try {
      final url = Uri.parse(ApiConfig.baseUrl + ApiConfig.insertSupplier);

      debugPrint('Request URL: $url');
      debugPrint('Request Body: ${jsonEncode(data.toJson())}');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode(data.toJson()),
      );

      debugPrint('Response Status: ${response.statusCode}');
      debugPrint('Response Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = jsonDecode(response.body);
        return {'success': true, 'data': responseData};
      } else {
        return {
          'success': false,
          'message': 'Server error: ${response.statusCode}',
        };
      }
    } catch (e) {
      debugPrint('API Error: $e');
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  void _resetForm() {
    _formKey.currentState?.reset();
    _companyNameCtrl.clear();
    _emailCtrl.clear();
    _phoneCtrl.clear();
    _projectLocationCtrl.clear();
    _remarkCtrl.clear();

    for (var ctrl in _contactPersonNameCtrls) {
      ctrl.dispose();
    }
    for (var ctrl in _contactPersonNumberCtrls) {
      ctrl.dispose();
    }

    _contactPersons.clear();
    _contactPersonNameCtrls.clear();
    _contactPersonNumberCtrls.clear();

    setState(() {
      _selectedImage = null;
      _currentPosition = null;
      _latitude = 0.0;
      _longitude = 0.0;
      _gpsStatus = 'Not captured';
      _selectedDate = DateTime.now();
      _selectedTime = TimeOfDay.now();
      _autoValidate = false;
    });
    _updateFormattedDateTime();
  }

  void _showSnack(String msg, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.check_circle_outline,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: sm),
            Expanded(
              child: Text(
                msg,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: isError ? errorColor : successColor,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(lg),
      ),
    );
  }

  // ─── UI Helpers ───────────────────────────────────────────────────────────
  InputDecoration _inputDec(
    String label, {
    String? hint,
    Widget? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      prefixIcon: prefixIcon,
      suffixIcon: suffixIcon,
      labelStyle: const TextStyle(
        fontFamily: 'Inter',
        color: textSecondary,
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
      hintStyle: TextStyle(
        fontFamily: 'Inter',
        color: Colors.grey.shade400,
        fontSize: 14,
      ),
      filled: true,
      fillColor: bgColor,
      contentPadding: const EdgeInsets.symmetric(horizontal: lg, vertical: md),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusField),
        borderSide: const BorderSide(color: borderColor),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusField),
        borderSide: const BorderSide(color: borderColor),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusField),
        borderSide: const BorderSide(color: primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusField),
        borderSide: const BorderSide(color: errorColor, width: 1.2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusField),
        borderSide: const BorderSide(color: errorColor, width: 1.5),
      ),
      errorStyle: const TextStyle(
        fontFamily: 'Inter',
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: errorColor,
      ),
    );
  }

  Widget _label(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: xs + 2),
      child: Row(
        children: [
          Text(
            text,
            style: const TextStyle(
              fontFamily: 'Inter',
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: textSecondary,
            ),
          ),
          if (required)
            const Text(
              ' *',
              style: TextStyle(
                color: errorColor,
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
            ),
        ],
      ),
    );
  }

  Widget _field(
    String labelText, {
    required TextEditingController ctrl,
    String? hint,
    bool isRequired = false,
    TextInputType keyboard = TextInputType.text,
    int maxLines = 1,
    List<TextInputFormatter>? formatters,
    String? Function(String?)? validator,
    Widget? prefixIcon,
    TextCapitalization capitalization = TextCapitalization.none,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(labelText, required: isRequired),
        TextFormField(
          controller: ctrl,
          keyboardType: keyboard,
          maxLines: maxLines,
          textCapitalization: capitalization,
          inputFormatters: formatters,
          autovalidateMode: _autoValidate
              ? AutovalidateMode.always
              : AutovalidateMode.disabled,
          validator: validator,
          style: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: textPrimary,
          ),
          decoration: _inputDec('', hint: hint, prefixIcon: prefixIcon),
        ),
      ],
    );
  }

  Widget _sectionHeader(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: lg),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(radiusBadge),
            ),
            child: Icon(icon, color: primary, size: 16),
          ),
          const SizedBox(width: md),
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Inter',
              color: textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
        ],
      ),
    );
  }

  Widget _card({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(lg),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radiusCard),
        boxShadow: cardShadow,
      ),
      child: child,
    );
  }

  Widget _gap([double size = md]) => SizedBox(height: size);

  // ─── Build ────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: _buildAppBar(),
      body: FadeTransition(
        opacity: _fadeAnim,
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(lg, lg, lg, xxl),
            children: [
              _buildCompanyCard(),
              _gap(sm),

              _buildContactPersonsCard(),
              _gap(sm),

              _buildProjectDetailsCard(),
              _gap(sm),
              // _buildGPSCard(),
              // _gap(sm),
              // _buildVisitDateTimeCard(),
              // _gap(sm),
              _buildRemarkCard(),
              _gap(sm),

              _buildImageCard(),
              _gap(lg),

              _buildSubmitButton(),
            ],
          ),
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      title: const Text(
        'Supplier create management',
        style: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w700,
          fontSize: 18,
          letterSpacing: -0.5,
        ),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: Colors.white.withOpacity(0.12)),
      ),
    );
  }

  Widget _buildCompanyCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Company Information', Icons.business_rounded),
          _field(
            'Company Name',
            isRequired: true,
            ctrl: _companyNameCtrl,
            hint: 'Enter company name',
            capitalization: TextCapitalization.words,
            prefixIcon: const Icon(
              Icons.business_outlined,
              size: 18,
              color: textSecondary,
            ),
            validator: (v) => _required(v, 'Company Name'),
          ),
          _gap(),
          _field(
            'Email Address',
            isRequired: true,
            ctrl: _emailCtrl,
            keyboard: TextInputType.emailAddress,
            hint: 'company@example.com',
            prefixIcon: const Icon(
              Icons.email_outlined,
              size: 18,
              color: textSecondary,
            ),
            validator: _validateEmail,
          ),
          _gap(),
          _field(
            'Phone Number',
            isRequired: true,
            ctrl: _phoneCtrl,
            keyboard: TextInputType.phone,
            hint: '9876543210',
            formatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(15),
            ],
            prefixIcon: const Icon(
              Icons.phone_outlined,
              size: 18,
              color: textSecondary,
            ),
            validator: _validatePhone,
          ),
        ],
      ),
    );
  }

  Widget _buildContactPersonsCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _sectionHeader('Contact Persons', Icons.people_rounded),
              IconButton(
                onPressed: _addContactPerson,
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(radiusBadge),
                  ),
                  child: const Icon(
                    Icons.add_rounded,
                    color: primary,
                    size: 20,
                  ),
                ),
                tooltip: 'Add Contact Person',
              ),
            ],
          ),
          if (_contactPersons.isEmpty)
            Container(
              padding: const EdgeInsets.all(lg),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(radiusField),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.person_add_rounded,
                    color: textSecondary,
                    size: 20,
                  ),
                  const SizedBox(width: sm),
                  Text(
                    'Tap + to add contact persons',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      color: textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _contactPersons.length,
              separatorBuilder: (_, __) => const SizedBox(height: md),
              itemBuilder: (context, index) {
                return Container(
                  padding: const EdgeInsets.all(md),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(radiusField),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _contactPersonNameCtrls[index],
                              decoration: InputDecoration(
                                labelText: 'Contact Person Name',
                                hintText: 'Full name',
                                prefixIcon: const Icon(
                                  Icons.person_outline,
                                  size: 18,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusField,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: md,
                                  vertical: sm,
                                ),
                              ),
                              onChanged: (_) => _updateContactPerson(index),
                              validator: (v) =>
                                  _validateContactPersonName(v, index),
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                          const SizedBox(width: sm),
                          Expanded(
                            child: TextFormField(
                              controller: _contactPersonNumberCtrls[index],
                              decoration: InputDecoration(
                                labelText: 'Contact Number',
                                hintText: '9876543210',
                                prefixIcon: const Icon(
                                  Icons.phone_outlined,
                                  size: 18,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusField,
                                  ),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: md,
                                  vertical: sm,
                                ),
                              ),
                              keyboardType: TextInputType.phone,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(15),
                              ],
                              onChanged: (_) => _updateContactPerson(index),
                              validator: (v) =>
                                  _validateContactPersonNumber(v, index),
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                          const SizedBox(width: sm),
                          IconButton(
                            onPressed: () => _removeContactPerson(index),
                            icon: const Icon(
                              Icons.delete_outline,
                              color: errorColor,
                            ),
                            iconSize: 20,
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildProjectDetailsCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Project Details', Icons.location_on_rounded),
          _field(
            'Project Location',
            isRequired: true,
            ctrl: _projectLocationCtrl,
            hint: 'Enter project address / location',
            maxLines: 2,
            keyboard: TextInputType.streetAddress,
            capitalization: TextCapitalization.sentences,
            prefixIcon: const Icon(
              Icons.location_pin,
              size: 18,
              color: textSecondary,
            ),
            validator: (v) => _required(v, 'Project Location'),
          ),
        ],
      ),
    );
  }

  Widget _buildRemarkCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Visit Remark', Icons.note_alt_rounded),
          _field(
            'Remark',
            isRequired: true,
            ctrl: _remarkCtrl,
            hint: 'Enter visit notes, observations, or remarks',
            maxLines: 4,
            keyboard: TextInputType.multiline,
            prefixIcon: const Icon(
              Icons.edit_note_rounded,
              size: 18,
              color: textSecondary,
            ),
            validator: (v) => _required(v, 'Remark'),
          ),
        ],
      ),
    );
  }

  Widget _buildImageCard() {
    return _card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Site Image', Icons.camera_alt_rounded),
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              width: double.infinity,
              height: 180,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(radiusField),
                border: Border.all(color: borderColor),
                image: _selectedImage != null
                    ? DecorationImage(
                        image: FileImage(_selectedImage!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: _selectedImage == null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.camera_alt_outlined,
                          size: 40,
                          color: textSecondary,
                        ),
                        const SizedBox(height: sm),
                        Text(
                          'Tap to capture site image',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            color: textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    )
                  : null,
            ),
          ),
          if (_selectedImage != null)
            Padding(
              padding: const EdgeInsets.only(top: sm),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.check_circle, color: successColor, size: 14),
                  const SizedBox(width: xs),
                  Text(
                    'Image captured',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 11,
                      color: successColor,
                    ),
                  ),
                  const SizedBox(width: md),
                  TextButton.icon(
                    onPressed: () => setState(() => _selectedImage = null),
                    icon: const Icon(Icons.delete_outline, size: 14),
                    label: const Text('Remove'),
                    style: TextButton.styleFrom(
                      foregroundColor: errorColor,
                      padding: EdgeInsets.zero,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: _isSaving ? null : _submitForm,
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: primaryLight.withOpacity(0.5),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusButton),
          ),
        ),
        child: _isSaving
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.send_rounded, size: 18),
                  SizedBox(width: sm),
                  Text(
                    'Submit Visit Report',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
