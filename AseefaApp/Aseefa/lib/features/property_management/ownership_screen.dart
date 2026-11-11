import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

class PropertyOwnershipScreen extends StatefulWidget {
  const PropertyOwnershipScreen({super.key});

  @override
  State<PropertyOwnershipScreen> createState() =>
      _PropertyOwnershipScreenState();
}

class _PropertyOwnershipScreenState
    extends State<PropertyOwnershipScreen> {


  static const Color primary = Color.fromARGB(255, 35, 0, 196);
  static const Color primaryDark = Color(0xFF1B007A);
  static const Color primaryLight = Color(0xFF6F7FDB);
  static const Color primarySoft = Color(0xFFF0EEFF);
  static const Color primaryTint = Color(0xFFDCD6FF);

  static const Color bgColor = Color(0xFFF5F7FB);
  static const Color cardBg = Colors.white;

  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color borderColor = Color(0xFFE5E7EB);

  static const Color errorColor = Color(0xFFDC2626);
  static const Color errorBg = Color(0xFFFEF2F2);

  static const Color successColor = Color(0xFF16A34A);
  static const Color successBg = Color(0xFFF0FDF4);

  static const Color warningColor = Color(0xFFF59E0B);


  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;

  static const double radiusCard = 16;
  static const double radiusButton = 12;
  static const double radiusField = 12;
  static const double radiusBadge = 10;


  List<PropertyModel> properties = [];

  bool loadingProperties = false;

  PropertyModel? selectedProperty;


  List<OwnershipModel> ownerships = [];

  bool loadingOwnerships = false;

  String searchTerm = '';

  String? filterUnitType;
  String? filterCategory;
  String? filterCity;

  final TextEditingController _searchController = TextEditingController();

 

  bool showForm = false;


  int ownershipId = 0;

  final TextEditingController ownerNameController = TextEditingController();
  final TextEditingController coOwnerDetailsController =
      TextEditingController();
  final TextEditingController ownershipPercentageController =
      TextEditingController();
  final TextEditingController purchaseDateController =
      TextEditingController();
  final TextEditingController purchasePriceController =
      TextEditingController();
  final TextEditingController currentMarketValueController =
      TextEditingController();
  final TextEditingController mortgageDetailsController =
      TextEditingController();
  final TextEditingController loanAmountController = TextEditingController();
  final TextEditingController loanProviderController =
      TextEditingController();
  final TextEditingController emiDetailsController = TextEditingController();
  final TextEditingController insuranceCompanyController =
      TextEditingController();
  final TextEditingController insurancePolicyNumberController =
      TextEditingController();
  final TextEditingController insuranceExpiryDateController =
      TextEditingController();
  final TextEditingController propertyTaxDetailsController =
      TextEditingController();

  bool get isEditing => ownershipId > 0;


  bool saving = false;

  bool deleting = false;

  String errorMessage = '';

  String successMessage = '';


  @override
  void initState() {
    super.initState();
    _loadProperties();
  }

  @override
  void dispose() {
    _searchController.dispose();
    ownerNameController.dispose();
    coOwnerDetailsController.dispose();
    ownershipPercentageController.dispose();
    purchaseDateController.dispose();
    purchasePriceController.dispose();
    currentMarketValueController.dispose();
    mortgageDetailsController.dispose();
    loanAmountController.dispose();
    loanProviderController.dispose();
    emiDetailsController.dispose();
    insuranceCompanyController.dispose();
    insurancePolicyNumberController.dispose();
    insuranceExpiryDateController.dispose();
    propertyTaxDetailsController.dispose();

    super.dispose();
  }


  Future<int> _getCompanyId() async {
      return SessionStore.getCompanyId();
  }

  Future<int> _getUserId() async {
      return SessionStore.getUserId();
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };


  Future<void> _loadProperties() async {
    final companyId = await _getCompanyId();

    if (companyId == 0) {
      if (!mounted) return;

      setState(() {
        errorMessage = 'CompanyID not found. Please login again.';
      });

      return;
    }

    if (!mounted) return;

    setState(() {
      loadingProperties = true;
      errorMessage = '';
      successMessage = '';
    });

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyInfo').replace(
        queryParameters: {'CompanyID': companyId.toString()},
      );

      final response =
          await http.get(uri, headers: _headers).timeout(const Duration(seconds: 30));

      final body = _decodeResponse(response);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          body['message']?.toString() ?? 'Failed to load properties.',
        );
      }

      if (body['success'] == true) {
        final List<dynamic> data = body['data'] is List ? body['data'] : [];

        final loadedProperties = data
            .map(
              (item) => PropertyModel.fromJson(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList();

        if (!mounted) return;

        setState(() {
          properties = loadedProperties;
        });
      } else {
        throw Exception(
          body['message']?.toString() ?? 'Failed to load properties.',
        );
      }
    } catch (e) {
      if (!mounted) return;

      setState(() {
        properties = [];
        errorMessage = _cleanError(e);
      });
    } finally {
      if (!mounted) return;

      setState(() {
        loadingProperties = false;
      });
    }
  }



  Future<void> _loadOwnerships() async {
    final companyId = await _getCompanyId();

    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyId == 0 || propertyId == 0) {
      setState(() {
        ownerships = [];
      });
      return;
    }

    if (!mounted) return;

    setState(() {
      loadingOwnerships = true;
      errorMessage = '';
      successMessage = '';
    });

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyOwnership').replace(
        queryParameters: {
          'CompanyID': companyId.toString(),
          'PropertyID': propertyId.toString(),
        },
      );

      final response =
          await http.get(uri, headers: _headers).timeout(const Duration(seconds: 30));

      final body = _decodeResponse(response);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          body['message']?.toString() ??
              'Failed to load ownership details.',
        );
      }

      if (body['success'] != true) {
        throw Exception(
          body['message']?.toString() ??
              'Failed to load ownership details.',
        );
      }

      final List<dynamic> data = body['data'] is List ? body['data'] : [];

      final loaded = data
          .map(
            (item) => OwnershipModel.fromJson(
              Map<String, dynamic>.from(item),
            ),
          )
          .toList();

      if (!mounted) return;

      setState(() {
        ownerships = loaded;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        ownerships = [];
        errorMessage = _cleanError(e);
      });
    } finally {
      if (!mounted) return;

      setState(() {
        loadingOwnerships = false;
      });
    }
  }


  Future<void> _loadOwnershipById(int id) async {
    final companyId = await _getCompanyId();

    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyId == 0 || propertyId == 0 || id == 0) return;

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/getPropertyOwnershipByID').replace(
        queryParameters: {
          'OwnershipID': id.toString(),
          'CompanyID': companyId.toString(),
          'PropertyID': propertyId.toString(),
        },
      );

      final response =
          await http.get(uri, headers: _headers).timeout(const Duration(seconds: 30));

      final body = _decodeResponse(response);

      if (response.statusCode < 200 || response.statusCode >= 300) return;
      if (body['success'] != true) return;

      dynamic record = body['data'];

      if (record is List) {
        record = record.isNotEmpty ? record.first : null;
      }

      if (record == null) return;

      final ownership =
          OwnershipModel.fromJson(Map<String, dynamic>.from(record));

      if (!mounted) return;

      setState(() {
        _mapOwnershipToForm(ownership);
      });
    } catch (_) {
      // non-fatal — keep showing the row data already in hand
    }
  }


  void _mapOwnershipToForm(OwnershipModel o) {
    ownershipId = o.ownershipId;
    ownerNameController.text = o.ownerName;
    coOwnerDetailsController.text = o.coOwnerDetails;
    ownershipPercentageController.text = o.ownershipPercentage;
    purchaseDateController.text = o.purchaseDate;
    purchasePriceController.text = o.purchasePrice;
    currentMarketValueController.text = o.currentMarketValue;
    mortgageDetailsController.text = o.mortgageDetails;
    loanAmountController.text = o.loanAmount;
    loanProviderController.text = o.loanProvider;
    emiDetailsController.text = o.emiDetails;
    insuranceCompanyController.text = o.insuranceCompany;
    insurancePolicyNumberController.text = o.insurancePolicyNumber;
    insuranceExpiryDateController.text = o.insuranceExpiryDate;
    propertyTaxDetailsController.text = o.propertyTaxDetails;
  }


  void _clearForm() {
    ownershipId = 0;

    ownerNameController.clear();
    coOwnerDetailsController.clear();
    ownershipPercentageController.clear();
    purchaseDateController.clear();
    purchasePriceController.clear();
    currentMarketValueController.clear();
    mortgageDetailsController.clear();
    loanAmountController.clear();
    loanProviderController.clear();
    emiDetailsController.clear();
    insuranceCompanyController.clear();
    insurancePolicyNumberController.clear();
    insuranceExpiryDateController.clear();
    propertyTaxDetailsController.clear();
  }



  Future<void> _handleSelectProperty(PropertyModel property) async {
    FocusScope.of(context).unfocus();

    setState(() {
      selectedProperty = property;
      showForm = false;
      errorMessage = '';
      successMessage = '';
    });

    _clearForm();

    await _loadOwnerships();
  }

  void _handleChangeProperty() {
    if (saving || deleting) return;

    FocusScope.of(context).unfocus();

    setState(() {
      selectedProperty = null;
      showForm = false;
      ownerships = [];
      searchTerm = '';
      errorMessage = '';
      successMessage = '';
    });

    _clearForm();
  }


  void _openCreate() {
    FocusScope.of(context).unfocus();

    _clearForm();

    setState(() {
      showForm = true;
      errorMessage = '';
      successMessage = '';
    });
  }

  Future<void> _openEdit(OwnershipModel ownership) async {
    FocusScope.of(context).unfocus();

    setState(() {
      _mapOwnershipToForm(ownership);
      showForm = true;
      errorMessage = '';
      successMessage = '';
    });

    await _loadOwnershipById(ownership.ownershipId);
  }

  void _backToList() {
    if (saving || deleting) return;

    FocusScope.of(context).unfocus();

    setState(() {
      showForm = false;
      errorMessage = '';
      successMessage = '';
    });

    _clearForm();
  }


  Future<void> _pickDate(TextEditingController controller) async {
    if (saving || deleting) return;

    final initial = DateTime.tryParse(controller.text) ?? DateTime.now();

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1970),
      lastDate: DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: primary,
              onPrimary: Colors.white,
              onSurface: textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked == null) return;

    final formatted =
        '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';

    setState(() {
      controller.text = formatted;
    });
  }



  Future<void> _handleSave() async {
    if (saving || deleting) return;

    FocusScope.of(context).unfocus();

    final companyId = await _getCompanyId();
    final userId = await _getUserId();

    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyId == 0) {
      _showError('CompanyID not found. Please login again.');
      return;
    }

    if (propertyId == 0) {
      _showError('Please select a property first.');
      return;
    }

    if (userId == 0) {
      _showError('UserID not found. Please login again.');
      return;
    }

    final validationError = _validateForm();

    if (validationError != null) {
      _showError(validationError);
      return;
    }

    setState(() {
      saving = true;
      errorMessage = '';
      successMessage = '';
    });

    try {
      final payload = {
        'OwnershipID': ownershipId == 0 ? null : ownershipId,
        'CompanyID': companyId,
        'PropertyID': propertyId,
        'OwnerName': ownerNameController.text.trim(),
        'CoOwnerDetails': coOwnerDetailsController.text.trim(),
        'OwnershipPercentage': _nullableDouble(
          ownershipPercentageController.text,
        ),
        'PurchaseDate': _nullableString(purchaseDateController.text),
        'PurchasePrice': _nullableDouble(purchasePriceController.text),
        'CurrentMarketValue':
            _nullableDouble(currentMarketValueController.text),
        'MortgageDetails': mortgageDetailsController.text.trim(),
        'LoanAmount': _nullableDouble(loanAmountController.text),
        'LoanProvider': loanProviderController.text.trim(),
        'EMIDetails': emiDetailsController.text.trim(),
        'InsuranceCompany': insuranceCompanyController.text.trim(),
        'InsurancePolicyNumber':
            insurancePolicyNumberController.text.trim(),
        'InsuranceExpiryDate':
            _nullableString(insuranceExpiryDateController.text),
        'PropertyTaxDetails': propertyTaxDetailsController.text.trim(),
        'UserID': userId,
      };

      final uri = Uri.parse('${ApiConfig.webUrl}/insertUpdatePropertyOwnership');

      final response = await http
          .post(uri, headers: _headers, body: jsonEncode(payload))
          .timeout(const Duration(seconds: 30));

      final body = _decodeResponse(response);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          body['message']?.toString() ??
              'Failed to save ownership details.',
        );
      }

      if (body['success'] != true) {
        throw Exception(
          body['message']?.toString() ??
              'Failed to save ownership details.',
        );
      }

      await _loadOwnerships();

      if (!mounted) return;

      final message =
          body['message']?.toString() ??
              (isEditing
                  ? 'Ownership record updated successfully.'
                  : 'Ownership record saved successfully.');

      setState(() {
        showForm = false;
      });

      _clearForm();

      _showSuccess(message);
    } catch (e) {
      if (!mounted) return;

      setState(() {
        errorMessage = _cleanError(e);
      });

      _showError(_cleanError(e));
    } finally {
      if (!mounted) return;

      setState(() {
        saving = false;
      });
    }
  }



  Future<void> _handleDelete() async {
    if (deleting || saving) return;

    if (ownershipId == 0) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusCard),
          ),
          title: const Text(
            'Delete Ownership Record?',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
          content: const Text(
            'Are you sure you want to delete this ownership record? This action cannot be undone.',
            style: TextStyle(
              color: textSecondary,
              height: 1.5,
            ),
          ),
          actionsPadding: const EdgeInsets.fromLTRB(lg, 0, lg, lg),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: errorColor,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(radiusButton),
                ),
              ),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    final companyId = await _getCompanyId();
    final userId = await _getUserId();

    final propertyId = selectedProperty?.propertyId ?? 0;

    if (companyId == 0 || userId == 0) {
      _showError('Session expired. Please login again.');
      return;
    }

    if (propertyId == 0) {
      _showError('Property not selected.');
      return;
    }

    setState(() {
      deleting = true;
      errorMessage = '';
      successMessage = '';
    });

    try {
      final uri = Uri.parse('${ApiConfig.webUrl}/deletePropertyOwnership');

      final payload = {
        'OwnershipID': ownershipId,
        'CompanyID': companyId,
        'PropertyID': propertyId,
        'UserID': userId,
      };

      final response = await http
          .post(uri, headers: _headers, body: jsonEncode(payload))
          .timeout(const Duration(seconds: 30));

      final body = _decodeResponse(response);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception(
          body['message']?.toString() ??
              'Failed to delete ownership record.',
        );
      }

      if (body['success'] != true) {
        throw Exception(
          body['message']?.toString() ??
              'Failed to delete ownership record.',
        );
      }

      _clearForm();

      await _loadOwnerships();

      if (!mounted) return;

      setState(() {
        showForm = false;
      });

      _showSuccess(
        body['message']?.toString() ??
            'Ownership record deleted successfully.',
      );
    } catch (e) {
      if (!mounted) return;

      setState(() {
        errorMessage = _cleanError(e);
      });

      _showError(_cleanError(e));
    } finally {
      if (!mounted) return;

      setState(() {
        deleting = false;
      });
    }
  }


  String? _validateForm() {
    if (ownerNameController.text.trim().isEmpty) {
      return 'Please enter the Owner Name.';
    }

    if (ownershipPercentageController.text.trim().isNotEmpty) {
      final value =
          double.tryParse(ownershipPercentageController.text.trim());

      if (value == null || value < 0 || value > 100) {
        return 'Please enter a valid Ownership Percentage (0-100).';
      }
    }

    final decimalFields = <String, TextEditingController>{
      'Purchase Price': purchasePriceController,
      'Current Market Value': currentMarketValueController,
      'Loan Amount': loanAmountController,
    };

    for (final entry in decimalFields.entries) {
      final text = entry.value.text.trim();

      if (text.isEmpty) continue;

      final value = double.tryParse(text);

      if (value == null || value < 0) {
        return 'Please enter a valid ${entry.key}.';
      }
    }

    return null;
  }



  List<OwnershipModel> get filteredOwnerships {
    final term = searchTerm.trim().toLowerCase();

    if (term.isEmpty) {
      return ownerships;
    }

    return ownerships.where((o) {
      final values = [
        o.ownerName,
        o.loanProvider,
        o.insuranceCompany,
        o.ownershipId.toString(),
      ];

      return values
          .where((value) => value.trim().isNotEmpty)
          .any((value) => value.toLowerCase().contains(term));
    }).toList();
  }



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: _buildAppBar(),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: selectedProperty == null
              ? _buildPropertyPicker()
              : (showForm ? _buildFormView() : _buildOwnershipListView()),
        ),
      ),
    );
  }



  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: cardBg,
      surfaceTintColor: Colors.transparent,
      centerTitle: false,
      leading: selectedProperty != null
          ? IconButton(
              tooltip: 'Back',
              onPressed: saving || deleting
                  ? null
                  : (showForm ? _backToList : _handleChangeProperty),
              icon: const Icon(
                Icons.arrow_back_rounded,
                color: textPrimary,
              ),
            )
          : null,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Property Ownership',
            style: TextStyle(
              color: textPrimary,
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
          if (selectedProperty != null)
            Text(
              selectedProperty!.displayName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: textSecondary,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
        ],
      ),
      actions: [
        if (loadingProperties || loadingOwnerships)
          const Padding(
            padding: EdgeInsets.only(right: lg),
            child: Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: primary,
                ),
              ),
            ),
          ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: borderColor),
      ),
    );
  }



  Widget _buildPropertyPicker() {
    return RefreshIndicator(
      color: primary,
      onRefresh: _loadProperties,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(lg),
        children: [
          _buildPageIntro(),
          const SizedBox(height: lg),
          _buildGlobalMessages(),
          _buildPropertyPickerCard(),
          const SizedBox(height: xl),
        ],
      ),
    );
  }

  Widget _buildPageIntro() {
    return Container(
      padding: const EdgeInsets.all(lg),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [primary, Color(0xFF4D2BDB)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(radiusCard),
        boxShadow: [
          BoxShadow(
            color: primary.withOpacity(.16),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.badge_outlined,
              color: Colors.white,
              size: 26,
            ),
          ),
          const SizedBox(width: md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Property Ownership',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: xs),
                Text(
                  'Select a property to view or manage its owners.',
                  style: TextStyle(
                    color: Colors.white.withOpacity(.82),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPropertyPickerCard() {
    if (loadingProperties) {
      return _buildLoadingCard('Loading properties...');
    }

    if (properties.isEmpty) {
      return _buildEmptyCard(
        icon: Icons.apartment_rounded,
        title: 'No properties found',
        subtitle: 'No properties are available for this company.',
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radiusCard),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.035),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(lg, lg, lg, md),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: primarySoft,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.domain_rounded,
                    color: primary,
                    size: 18,
                  ),
                ),
                const SizedBox(width: md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select Property',
                        style: TextStyle(
                          color: textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${properties.length} ${properties.length == 1 ? 'property' : 'properties'}',
                        style: const TextStyle(
                          color: textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: borderColor),
          ...properties.map(_buildPropertyTile),
        ],
      ),
    );
  }

  Widget _buildPropertyTile(PropertyModel property) {
    return InkWell(
      onTap: () => _handleSelectProperty(property),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(lg),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: primarySoft,
                borderRadius: BorderRadius.circular(13),
              ),
              child: const Icon(
                Icons.home_work_outlined,
                color: primary,
                size: 23,
              ),
            ),
            const SizedBox(width: md),
            Expanded(
              child: Text(
                property.displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: primaryDark,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: sm),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: primarySoft,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Select',
                    style: TextStyle(
                      color: primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  SizedBox(width: 3),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: primary,
                    size: 17,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildOwnershipListView() {
    return RefreshIndicator(
      color: primary,
      onRefresh: _loadOwnerships,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(lg),
        children: [
          _buildSelectedPropertyCard(),
          const SizedBox(height: lg),
          _buildGlobalMessages(),
          _buildSearchField(),
          const SizedBox(height: sm),
          _buildAddOwnerButton(),
          const SizedBox(height: lg),
          _buildOwnershipListCard(),
          const SizedBox(height: xl),
        ],
      ),
    );
  }

  Widget _buildSelectedPropertyCard() {
    final property = selectedProperty!;

    return Container(
      padding: const EdgeInsets.all(lg),
      decoration: BoxDecoration(
        color: primarySoft,
        borderRadius: BorderRadius.circular(radiusCard),
        border: Border.all(color: primaryTint),
      ),
      child: Row(
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: primary,
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(
              Icons.home_work_rounded,
              color: Colors.white,
              size: 23,
            ),
          ),
          const SizedBox(width: md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SELECTED PROPERTY',
                  style: TextStyle(
                    color: primary,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: .8,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  property.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: primaryDark,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: sm),
          OutlinedButton(
            onPressed:
                saving || deleting ? null : _handleChangeProperty,
            style: OutlinedButton.styleFrom(
              foregroundColor: primary,
              side: const BorderSide(color: primary),
              padding: const EdgeInsets.symmetric(
                horizontal: 11,
                vertical: 9,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(radiusButton),
              ),
            ),
            child: const Text(
              'Change',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radiusField),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.025),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        onChanged: (value) => setState(() => searchTerm = value),
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(
          hintText: 'Search owner, lender or insurer',
          hintStyle: const TextStyle(
            color: textSecondary,
            fontSize: 13,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: primary,
            size: 21,
          ),
          suffixIcon: searchTerm.isNotEmpty
              ? IconButton(
                  onPressed: () => setState(() => searchTerm = ''),
                  icon: const Icon(
                    Icons.clear_rounded,
                    size: 19,
                    color: textSecondary,
                  ),
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: md,
            vertical: 15,
          ),
        ),
      ),
    );
  }

  Widget _buildAddOwnerButton() {
    return SizedBox(
      width: double.infinity,
      child: _buildPrimaryButton(
        label: 'Add Owner',
        icon: Icons.person_add_alt_1_rounded,
        onPressed: _openCreate,
      ),
    );
  }

  Widget _buildOwnershipListCard() {
    if (loadingOwnerships) {
      return _buildLoadingCard('Loading ownership details...');
    }

    if (filteredOwnerships.isEmpty) {
      return _buildEmptyCard(
        icon: Icons.badge_outlined,
        title: 'No ownership records found',
        subtitle: searchTerm.isEmpty
            ? 'Add an owner to get started.'
            : 'Try a different owner, lender or insurer.',
      );
    }

    return Column(
      children: filteredOwnerships
          .map((o) => Padding(
                padding: const EdgeInsets.only(bottom: md),
                child: _buildOwnershipTile(o),
              ))
          .toList(),
    );
  }

  Widget _buildOwnershipTile(OwnershipModel o) {
    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radiusCard),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.03),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => _openEdit(o),
        borderRadius: BorderRadius.circular(radiusCard),
        child: Padding(
          padding: const EdgeInsets.all(lg),
          child: Row(
            children: [
              Container(
                width: 45,
                height: 45,
                decoration: BoxDecoration(
                  color: primarySoft,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.person_outline_rounded,
                  color: primary,
                ),
              ),
              const SizedBox(width: md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      o.ownerName.isEmpty ? 'Unnamed Owner' : o.ownerName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: primaryDark,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _ownershipSubtitle(o),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: textSecondary,
                        fontSize: 11.5,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: sm),
              if (o.ownershipPercentage.trim().isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: primarySoft,
                    borderRadius: BorderRadius.circular(radiusBadge),
                  ),
                  child: Text(
                    '${o.ownershipPercentage}%',
                    style: const TextStyle(
                      color: primary,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              const SizedBox(width: 4),
              const Icon(
                Icons.chevron_right_rounded,
                color: primary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _ownershipSubtitle(OwnershipModel o) {
    final parts = <String>[];

    if (o.purchasePrice.trim().isNotEmpty) {
      parts.add('Purchased AED ${o.purchasePrice}');
    }

    if (o.loanProvider.trim().isNotEmpty) {
      parts.add(o.loanProvider);
    }

    if (o.insuranceExpiryDate.trim().isNotEmpty) {
      parts.add('Insurance exp. ${o.insuranceExpiryDate}');
    }

    return parts.isEmpty
        ? 'No additional details on file'
        : parts.join(' • ');
  }



  Widget _buildFormView() {
    return ListView(
      padding: const EdgeInsets.all(lg),
      children: [
        _buildSelectedPropertyCard(),
        const SizedBox(height: lg),
        _buildGlobalMessages(),
        _buildFormHeader(),
        const SizedBox(height: lg),
        _buildSection(
          icon: Icons.badge_outlined,
          title: 'Owner Details',
          subtitle: 'Who owns this property and their share',
          children: [_buildOwnerFields()],
        ),
        const SizedBox(height: md),
        _buildSection(
          icon: Icons.payments_outlined,
          title: 'Purchase & Market Value',
          subtitle: 'Acquisition cost and current estimated value',
          children: [_buildPurchaseFields()],
        ),
        const SizedBox(height: md),
        _buildSection(
          icon: Icons.account_balance_outlined,
          title: 'Mortgage & Loan',
          subtitle: 'Financing details, if this property is mortgaged',
          children: [_buildLoanFields()],
        ),
        const SizedBox(height: md),
        _buildSection(
          icon: Icons.verified_user_outlined,
          title: 'Insurance',
          subtitle: 'Property insurance coverage on file',
          children: [_buildInsuranceFields()],
        ),
        const SizedBox(height: md),
        _buildSection(
          icon: Icons.receipt_long_outlined,
          title: 'Property Tax',
          subtitle: 'Tax registration or payment details',
          children: [_buildTaxFields()],
        ),
        const SizedBox(height: lg),
        _buildFormFooter(),
        const SizedBox(height: xl),
      ],
    );
  }

  Widget _buildFormHeader() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isEditing ? 'Edit Ownership' : 'New Ownership Record',
                style: const TextStyle(
                  color: primaryDark,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                isEditing
                    ? 'Update this owner\'s details'
                    : 'Add a new owner to this property',
                style: const TextStyle(
                  color: textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ---------------- Owner fields ----------------

  Widget _buildOwnerFields() {
    return Column(
      children: [
        _buildField(
          label: 'Owner Name',
          controller: ownerNameController,
          hintText: 'e.g. Ahmed Al Farsi',
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'Ownership Percentage',
          controller: ownershipPercentageController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
          ],
          hintText: 'e.g. 100',
          prefixText: '%  ',
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'Co-Owner Details',
          controller: coOwnerDetailsController,
          hintText:
              'Names, shares, or contact details of any co-owners',
          maxLines: 3,
          textCapitalization: TextCapitalization.sentences,
        ),
      ],
    );
  }

  // ---------------- Purchase fields ----------------

  Widget _buildPurchaseFields() {
    return Column(
      children: [
        _buildDateField(
          label: 'Purchase Date',
          controller: purchaseDateController,
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'Purchase Price',
          controller: purchasePriceController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
          ],
          hintText: 'e.g. 1200000',
          prefixText: 'AED  ',
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'Current Market Value',
          controller: currentMarketValueController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
          ],
          hintText: 'e.g. 1450000',
          prefixText: 'AED  ',
        ),
      ],
    );
  }

  // ---------------- Loan fields ----------------

  Widget _buildLoanFields() {
    return Column(
      children: [
        _buildField(
          label: 'Loan Amount',
          controller: loanAmountController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d{0,2}')),
          ],
          hintText: 'e.g. 800000',
          prefixText: 'AED  ',
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'Loan Provider',
          controller: loanProviderController,
          hintText: 'e.g. Emirates NBD',
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'Mortgage Details',
          controller: mortgageDetailsController,
          hintText: 'Mortgage type, term, interest rate, etc.',
          maxLines: 3,
          textCapitalization: TextCapitalization.sentences,
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'EMI Details',
          controller: emiDetailsController,
          hintText:
              'Monthly EMI amount, due date, remaining installments, etc.',
          maxLines: 3,
          textCapitalization: TextCapitalization.sentences,
        ),
      ],
    );
  }

  // ---------------- Insurance fields ----------------

  Widget _buildInsuranceFields() {
    return Column(
      children: [
        _buildField(
          label: 'Insurance Company',
          controller: insuranceCompanyController,
          hintText: 'e.g. AXA Gulf',
          textCapitalization: TextCapitalization.words,
        ),
        const SizedBox(height: lg),
        _buildField(
          label: 'Insurance Policy Number',
          controller: insurancePolicyNumberController,
          hintText: 'e.g. POL-88213',
          textCapitalization: TextCapitalization.characters,
        ),
        const SizedBox(height: lg),
        _buildDateField(
          label: 'Insurance Expiry Date',
          controller: insuranceExpiryDateController,
        ),
      ],
    );
  }

  // ---------------- Tax fields ----------------

  Widget _buildTaxFields() {
    return _buildField(
      label: 'Property Tax Details',
      controller: propertyTaxDetailsController,
      hintText: 'Tax authority, reference number, last payment, etc.',
      maxLines: 3,
      textCapitalization: TextCapitalization.sentences,
    );
  }

  

  Widget _buildSection({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(lg),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radiusCard),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.025),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: primarySoft,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, color: primary, size: 21),
              ),
              const SizedBox(width: md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: primaryDark,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: textSecondary,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: lg),
          Container(height: 1, color: borderColor),
          const SizedBox(height: lg),
          ...children,
        ],
      ),
    );
  }


  Widget _buildField({
    required String label,
    required TextEditingController controller,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? hintText,
    String? prefixText,
    int maxLines = 1,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: primaryDark,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: .25,
          ),
        ),
        const SizedBox(height: sm),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          textCapitalization: textCapitalization,
          maxLines: maxLines,
          enabled: !saving && !deleting,
          style: const TextStyle(
            color: textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
          decoration: _inputDecoration(
            hintText: hintText,
            prefixText: prefixText,
          ),
        ),
      ],
    );
  }



  Widget _buildDateField({
    required String label,
    required TextEditingController controller,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: primaryDark,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: .25,
          ),
        ),
        const SizedBox(height: sm),
        TextField(
          controller: controller,
          readOnly: true,
          enabled: !saving && !deleting,
          onTap: () => _pickDate(controller),
          style: const TextStyle(
            color: textPrimary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
          decoration: _inputDecoration(
            hintText: 'Select date',
            suffix: const Icon(
              Icons.calendar_today_rounded,
              color: primary,
              size: 18,
            ),
          ),
        ),
      ],
    );
  }



  InputDecoration _inputDecoration({
    String? hintText,
    String? prefixText,
    Widget? suffix,
  }) {
    return InputDecoration(
      hintText: hintText,
      hintStyle: const TextStyle(
        color: textSecondary,
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
      prefixText: prefixText,
      prefixStyle: const TextStyle(
        color: textSecondary,
        fontSize: 12.5,
        fontWeight: FontWeight.w700,
      ),
      suffixIcon: suffix,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: md,
        vertical: 13,
      ),
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
        borderSide: const BorderSide(color: primary, width: 1.4),
      ),
      disabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusField),
        borderSide: const BorderSide(color: borderColor),
      ),
    );
  }



  Widget _buildFormFooter() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: _buildPrimaryButton(
            label: saving
                ? 'Saving...'
                : isEditing
                    ? 'Update Ownership'
                    : 'Save Ownership',
            icon: saving
                ? Icons.hourglass_top_rounded
                : Icons.check_circle_outline_rounded,
            onPressed: saving || deleting ? null : _handleSave,
            loading: saving,
          ),
        ),
        const SizedBox(height: sm),
        Row(
          children: [
            Expanded(
              child: _buildSecondaryButton(
                label: 'Cancel',
                icon: Icons.close_rounded,
                onPressed: saving || deleting ? null : _backToList,
              ),
            ),
            if (isEditing) ...[
              const SizedBox(width: sm),
              Expanded(
                child: _buildDangerButton(
                  label: deleting ? 'Deleting...' : 'Delete',
                  icon: deleting
                      ? Icons.hourglass_top_rounded
                      : Icons.delete_outline_rounded,
                  onPressed: saving || deleting ? null : _handleDelete,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }



  Widget _buildPrimaryButton({
    required String label,
    required IconData icon,
    required VoidCallback? onPressed,
    bool loading = false,
  }) {
    return SizedBox(
      height: 50,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: primary.withOpacity(.55),
          disabledForegroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusButton),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (loading)
              const SizedBox(
                width: 17,
                height: 17,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            else
              Icon(icon, size: 19),
            const SizedBox(width: sm),
            Text(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecondaryButton({
    required String label,
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return SizedBox(
      height: 46,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          disabledForegroundColor: primary.withOpacity(.4),
          side: const BorderSide(color: primaryTint),
          backgroundColor: primarySoft,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusButton),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18),
            const SizedBox(width: sm),
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDangerButton({
    required String label,
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return SizedBox(
      height: 46,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: errorColor,
          disabledForegroundColor: errorColor.withOpacity(.4),
          side: const BorderSide(color: Color(0xFFFECACA)),
          backgroundColor: errorBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusButton),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18),
            const SizedBox(width: sm),
            Flexible(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }



  Widget _buildGlobalMessages() {
    if (errorMessage.isEmpty && successMessage.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: [
        if (errorMessage.isNotEmpty)
          _buildMessage(message: errorMessage, isError: true),
        if (successMessage.isNotEmpty)
          _buildMessage(message: successMessage, isError: false),
        const SizedBox(height: md),
      ],
    );
  }

  Widget _buildMessage({
    required String message,
    required bool isError,
  }) {
    final color = isError ? errorColor : successColor;
    final background = isError ? errorBg : successBg;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: md, vertical: 12),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(radiusField),
        border: Border.all(color: color.withOpacity(.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isError
                ? Icons.error_outline_rounded
                : Icons.check_circle_outline_rounded,
            color: color,
            size: 19,
          ),
          const SizedBox(width: sm),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildLoadingCard(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 42, horizontal: lg),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radiusCard),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          const SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: primary,
            ),
          ),
          const SizedBox(height: md),
          Text(
            message,
            style: const TextStyle(
              color: textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCard({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(xl),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(radiusCard),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: primarySoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: primary, size: 27),
          ),
          const SizedBox(height: md),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: sm),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: textSecondary,
              fontSize: 12,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }



  void _showSuccess(String message) {
    if (!mounted) return;

    setState(() {
      successMessage = message;
    });

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          backgroundColor: successColor,
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(lg),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusButton),
          ),
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white),
              const SizedBox(width: sm),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
  }

  void _showError(String message) {
    if (!mounted) return;

    setState(() {
      errorMessage = message;
    });

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          backgroundColor: errorColor,
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(lg),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusButton),
          ),
          content: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.white),
              const SizedBox(width: sm),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
  }



  Map<String, dynamic> _decodeResponse(http.Response response) {
    if (response.body.isEmpty) return {};

    try {
      final decoded = jsonDecode(response.body);

      if (decoded is Map<String, dynamic>) return decoded;

      return {};
    } catch (_) {
      return {};
    }
  }

  String _cleanError(Object error) {
    if (error is http.ClientException) {
      return 'Unable to connect to the server.';
    }

    if (error.toString().contains('TimeoutException')) {
      return 'Server request timed out. Please try again.';
    }

    if (error is FormatException) {
      return 'Invalid server response.';
    }

    final message = error.toString().replaceFirst('Exception: ', '');

    return message.isEmpty
        ? 'Something went wrong. Please try again.'
        : message;
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
      propertyName: _parseString(
        json['PropertyName'] ?? json['PropertyLabel'] ?? json['Name'],
      ),
      propertyCode: _parseString(json['PropertyCode']),
    );
  }

  String get displayName {
    if (propertyName.trim().isNotEmpty) return propertyName.trim();
    if (propertyCode.trim().isNotEmpty) return propertyCode.trim();
    return 'Property #$propertyId';
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static String _parseString(dynamic value) {
    return value?.toString() ?? '';
  }
}


class OwnershipModel {
  final int ownershipId;
  final String ownerName;
  final String coOwnerDetails;
  final String ownershipPercentage;
  final String purchaseDate;
  final String purchasePrice;
  final String currentMarketValue;
  final String mortgageDetails;
  final String loanAmount;
  final String loanProvider;
  final String emiDetails;
  final String insuranceCompany;
  final String insurancePolicyNumber;
  final String insuranceExpiryDate;
  final String propertyTaxDetails;

  OwnershipModel({
    required this.ownershipId,
    required this.ownerName,
    required this.coOwnerDetails,
    required this.ownershipPercentage,
    required this.purchaseDate,
    required this.purchasePrice,
    required this.currentMarketValue,
    required this.mortgageDetails,
    required this.loanAmount,
    required this.loanProvider,
    required this.emiDetails,
    required this.insuranceCompany,
    required this.insurancePolicyNumber,
    required this.insuranceExpiryDate,
    required this.propertyTaxDetails,
  });

  factory OwnershipModel.fromJson(Map<String, dynamic> json) {
    return OwnershipModel(
      ownershipId: _parseInt(json['OwnershipID']),
      ownerName: _parseString(json['OwnerName']),
      coOwnerDetails: _parseString(json['CoOwnerDetails']),
      ownershipPercentage: _parseString(json['OwnershipPercentage']),
      purchaseDate: _parseDateString(json['PurchaseDate']),
      purchasePrice: _parseString(json['PurchasePrice']),
      currentMarketValue: _parseString(json['CurrentMarketValue']),
      mortgageDetails: _parseString(json['MortgageDetails']),
      loanAmount: _parseString(json['LoanAmount']),
      loanProvider: _parseString(json['LoanProvider']),
      emiDetails: _parseString(json['EMIDetails']),
      insuranceCompany: _parseString(json['InsuranceCompany']),
      insurancePolicyNumber: _parseString(json['InsurancePolicyNumber']),
      insuranceExpiryDate: _parseDateString(json['InsuranceExpiryDate']),
      propertyTaxDetails: _parseString(json['PropertyTaxDetails']),
    );
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static String _parseString(dynamic value) {
    if (value == null) return '';
    return value.toString();
  }

  static String _parseDateString(dynamic value) {
    if (value == null) return '';
    final text = value.toString();
    return text.length >= 10 ? text.substring(0, 10) : text;
  }
}