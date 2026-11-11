import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/core/session_store.dart';

class RentalManagementScreen extends StatefulWidget {
  const RentalManagementScreen({super.key});

  @override
  State<RentalManagementScreen> createState() => _RentalManagementScreenState();
}

class _RentalManagementScreenState extends State<RentalManagementScreen> {
  static const _primary = Color(0xFF2D4BA9);
  static const _paymentModes = ['Cash', 'Online Transaction', 'Cheque'];
  static const _transactionTypes = ['Cheque', 'Cash', 'Online Transaction'];

  final _formKey = GlobalKey<FormState>();
  final _searchController = TextEditingController();
  final Map<String, TextEditingController> _fields = {
    for (final name in [
      'Name',
      'MName',
      'LName',
      'Mobile',
      'Email',
      'EIDNo',
      'EIDExpiryDate',
      'FlatNo',
      'FlatType',
      'RentalAmount',
      'BadgeNo',
    ])
      name: TextEditingController(),
  };
  final _transactionAmountController = TextEditingController();
  final _transactionDateController = TextEditingController();

  List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _units = [];
  List<Map<String, dynamic>> _renters = [];
  List<Map<String, dynamic>> _rentalContracts = [];
  List<Map<String, dynamic>> _transactions = [];
  Set<String> _selectedPaymentModes = {};
  String? _selectedPropertyId;
  String? _selectedRecordId;
  String? _sex;
  String _rentalStatus = 'Occupied';
  DateTime? _leaseStartDate;
  DateTime? _leaseEndDate;
  String _search = '';
  String _transactionType = 'Cheque';
  String? _photoBase64;
  String? _photoMimeType;
  PlatformFile? _transactionFile;
  String? _transactionPath;
  int? _transactionId;
  int? _editingUserId;
  int _rentalId = 0;
  int _companyId = 0;
  int _userId = 0;
  int _renterRoleId = 0;
  bool _loading = true;
  bool _loadingUnits = false;
  bool _loadingTransactions = false;
  bool _saving = false;
  bool _savingTransaction = false;
  bool _deleting = false;
  bool _showForm = false;

  @override
  void initState() {
    super.initState();
    _loadDirectory();
  }

  @override
  void dispose() {
    _searchController.dispose();
    for (final controller in _fields.values) {
      controller.dispose();
    }
    _transactionAmountController.dispose();
    _transactionDateController.dispose();
    super.dispose();
  }

  Future<dynamic> _requestJson(
    String endpoint, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
    http.MultipartRequest? multipart,
  }) async {
    final uri = Uri.parse(
      '${ApiConfig.webUrl}/$endpoint',
    ).replace(queryParameters: query);
    late http.Response response;
    if (multipart != null) {
      final streamed = await multipart.send().timeout(
        const Duration(seconds: 30),
      );
      response = await http.Response.fromStream(streamed);
    } else if (body != null) {
      response = await http
          .post(
            uri,
            headers: const {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 30));
    } else {
      response = await http.get(uri).timeout(const Duration(seconds: 30));
    }
    final raw = response.body.trim();
    if (raw.isEmpty || raw.startsWith('<')) {
      throw const FormatException(
        'The rental API returned an invalid response.',
      );
    }
    final decoded = jsonDecode(raw);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final message = decoded is Map ? decoded['message'] : null;
      throw Exception(
        message ?? 'Rental API request failed (${response.statusCode}).',
      );
    }
    return decoded;
  }

  List<Map<String, dynamic>> _rows(dynamic value) {
    dynamic list = value;
    if (value is Map) {
      list =
          value['data'] ??
          value['Data'] ??
          value['transactions'] ??
          value['Transactions'] ??
          value['roles'] ??
          value['Roles'];
    }
    if (list is! List) return [];
    return list
        .whereType<Map>()
        .map((row) => Map<String, dynamic>.from(row))
        .toList();
  }

  bool _success(dynamic value) =>
      value == true || value?.toString().toLowerCase() == 'true';

  int _int(dynamic value) => int.tryParse('$value') ?? 0;

  String _errorText(Object error) =>
      error.toString().replaceFirst('Exception: ', '');

  void _notify(String message, {bool error = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: error ? Colors.red.shade700 : Colors.green.shade700,
        ),
      );
  }

  Future<void> _loadDirectory() async {
    setState(() => _loading = true);
    try {
      _companyId = await SessionStore.getCompanyId();
      _userId = await SessionStore.getUserId();
      if (_companyId <= 0) {
        throw Exception('Company context is missing. Please sign in again.');
      }

      final responses = await Future.wait([
        _requestJson('GetUsermaster', query: {'CompanyID': '$_companyId'}),
        _requestJson('getPropertyInfo', query: {'CompanyID': '$_companyId'}),
        _requestJson('GetRoleList', query: {'CompanyID': '$_companyId'}),
      ]);
      final users = _rows(responses[0]);
      final properties = _rows(responses[1]);
      final roles = _rows(responses[2]);
      final renterRole = roles.where((role) {
        final name = (role['RoleName'] ?? role['Name'] ?? '').toString().trim();
        return name.toLowerCase() == 'renter';
      }).firstOrNull;
      _renterRoleId = _int(
        renterRole?['RoleID'] ??
            renterRole?['RoleId'] ??
            renterRole?['UserRoleId'] ??
            renterRole?['UserRoleID'],
      );
      if (_renterRoleId <= 0) {
        throw Exception('The Renter role is not available for this company.');
      }

      final unitAndContractResponses = await Future.wait(
        properties.map((property) async {
          final propertyId = _int(property['PropertyID']);
          final results = await Future.wait([
            _requestJson(
              'getPropertyMaster',
              query: {'CompanyID': '$_companyId', 'PropertyID': '$propertyId'},
            ),
            _requestJson(
              'getPropertyRental',
              query: {'CompanyID': '$_companyId', 'PropertyID': '$propertyId'},
            ),
          ]);
          return (
            propertyId: propertyId,
            units: _rows(results[0]),
            contracts: _rows(results[1]),
          );
        }),
      );

      final unitByKey = <String, Map<String, dynamic>>{};
      final contractById = <int, Map<String, dynamic>>{};
      final contractByUnit = <String, Map<String, dynamic>>{};
      for (final result in unitAndContractResponses) {
        for (final unit in result.units) {
          unitByKey['${result.propertyId}_${_int(unit['RecordID'])}'] = unit;
        }
        for (final contract in result.contracts) {
          final contractId = _int(contract['RentalID']);
          if (contractId > 0) contractById[contractId] = contract;
          contractByUnit.putIfAbsent(
            '${result.propertyId}_${_int(contract['RecordID'])}',
            () => {...contract, 'PropertyID': result.propertyId},
          );
        }
      }

      final propertyNames = {
        for (final property in properties)
          _int(property['PropertyID']): (property['PropertyName'] ?? '')
              .toString(),
      };
      final enriched =
          users
              .where((user) {
                final userRole = _int(user['UserRoleId'] ?? user['UserRoleID']);
                return userRole == 0 || userRole == _renterRoleId;
              })
              .map((user) {
                final propertyId = _int(user['PropertyID']);
                final recordId = _int(user['RecordID']);
                final unit = unitByKey['${propertyId}_$recordId'] ?? {};
                final contract =
                    contractById[_int(user['RentalID'])] ??
                    contractByUnit['${propertyId}_$recordId'] ??
                    {};
                return {
                  ...user,
                  'PropertyName':
                      propertyNames[propertyId] ?? user['PropertyName'] ?? '',
                  'FlatNo': user['FlatNo'] ?? unit['FlatNo'] ?? '',
                  'FlatType': user['FlatType'] ?? unit['FlatType'] ?? '',
                  'RentalAmount':
                      user['RentalAmount'] ??
                      user['WorkerRate'] ??
                      contract['MonthlyRent'] ??
                      contract['AnnualRent'] ??
                      unit['RentalAmount'] ??
                      '',
                  'RentalStatus':
                      contract['RentalStatus'] ??
                      user['RentalStatus'] ??
                      user['Status'] ??
                      '',
                  'LeaseStartDate':
                      contract['LeaseStartDate'] ??
                      user['LeaseStartDate'] ??
                      '',
                  'LeaseEndDate':
                      contract['LeaseEndDate'] ?? user['LeaseEndDate'] ?? '',
                  'RentalID':
                      contract['RentalID'] ?? user['RentalID'] ?? 0,
                };
              })
              .toList()
            ..sort((a, b) => _int(b['UserId']).compareTo(_int(a['UserId'])));

      if (!mounted) return;
      setState(() {
        _properties = properties;
        _rentalContracts = contractByUnit.values.toList();
        _renters = enriched;
      });
    } catch (error) {
      debugPrint('Load rental management data error: $error');
      _notify(_errorText(error), error: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadUnits(int propertyId, {int? selectedRecordId}) async {
    setState(() {
      _loadingUnits = true;
      _units = [];
    });
    try {
      final response = await _requestJson(
        'getPropertyMaster',
        query: {'CompanyID': '$_companyId', 'PropertyID': '$propertyId'},
      );
      final units = _rows(response);
      if (!mounted) return;
      setState(() {
        _units = units;
        _selectedRecordId = selectedRecordId?.toString();
      });
    } catch (error) {
      _notify(
        'Failed to load property units: ${_errorText(error)}',
        error: true,
      );
    } finally {
      if (mounted) setState(() => _loadingUnits = false);
    }
  }

  Future<void> _loadTransactions(int renterId) async {
    if (_selectedPropertyId == null) return;
    setState(() => _loadingTransactions = true);
    try {
      final response = await _requestJson(
        'getRentalTransactions',
        query: {
          'CompanyID': '$_companyId',
          'PropertyID': _selectedPropertyId!,
          'RentID': '$renterId',
        },
      );
      if (response is Map && !_success(response['success'])) {
        throw Exception(response['message'] ?? 'Failed to load transactions.');
      }
      if (!mounted) return;
      setState(() => _transactions = _rows(response));
    } catch (error) {
      _notify('Failed to load transactions: ${_errorText(error)}', error: true);
    } finally {
      if (mounted) setState(() => _loadingTransactions = false);
    }
  }

  List<Map<String, dynamic>> get _filteredRenters {
    final term = _search.trim().toLowerCase();
    if (term.isEmpty) return _renters;
    return _renters.where((renter) {
      final values = [
        renter['Name'],
        renter['MName'],
        renter['LName'],
        renter['Email'],
        renter['Mobile'],
        renter['FlatNo'],
        renter['FlatType'],
        renter['PropertyName'],
      ];
      return values.any(
        (value) => value.toString().toLowerCase().contains(term),
      );
    }).toList();
  }

  void _clearFields() {
    for (final controller in _fields.values) {
      controller.clear();
    }
    _selectedPaymentModes = {};
    _selectedPropertyId = null;
    _selectedRecordId = null;
    _sex = null;
    _rentalStatus = 'Occupied';
    _leaseStartDate = null;
    _leaseEndDate = null;
    _photoBase64 = null;
    _photoMimeType = null;
    _editingUserId = null;
    _rentalId = 0;
    _units = [];
    _transactions = [];
    _transactionId = null;
    _transactionPath = null;
    _transactionFile = null;
    _transactionAmountController.clear();
    _transactionDateController.clear();
    _transactionType = 'Cheque';
  }

  void _openCreate() {
    _clearFields();
    setState(() => _showForm = true);
  }

  Future<void> _openEdit(Map<String, dynamic> renter) async {
    _clearFields();
    _editingUserId = _int(renter['UserId']);
    _rentalId = _int(renter['RentalID']);
    _selectedPropertyId = _int(renter['PropertyID']).toString();
    final recordId = _int(renter['RecordID']);
    _selectedRecordId = null;
    _sex = renter['Sex']?.toString();
    _rentalStatus =
        (renter['RentalStatus'] ?? 'Occupied').toString().trim().isEmpty
            ? 'Occupied'
            : (renter['RentalStatus'] ?? 'Occupied').toString();
    _leaseStartDate = DateTime.tryParse(_dateOnly(renter['LeaseStartDate']));
    _leaseEndDate = DateTime.tryParse(_dateOnly(renter['LeaseEndDate']));
    _selectedPaymentModes = _parsePaymentModes(
      renter['PaymentMode'] ?? renter['paymentMode'],
    );
    for (final entry in {
      'Name': renter['Name'],
      'MName': renter['MName'],
      'LName': renter['LName'],
      'Mobile': renter['Mobile'],
      'Email': renter['Email'],
      'EIDNo': renter['EIDNo'],
      'EIDExpiryDate': _dateOnly(renter['EIDExpiryDate']),
      'FlatNo': renter['FlatNo'],
      'FlatType': renter['FlatType'],
      'RentalAmount': renter['RentalAmount'] ?? renter['WorkerRate'],
      'BadgeNo': renter['BadgeNo'],
    }.entries) {
      _fields[entry.key]!.text = entry.value?.toString() ?? '';
    }
    final image = renter['IMAGE'] ?? renter['image'];
    if (image is String) {
      _photoBase64 = image.startsWith('data:')
          ? image.substring(image.indexOf(',') + 1)
          : image;
      _photoMimeType = image.startsWith('data:')
          ? image.split(';').first.substring(5)
          : 'image/jpeg';
    } else if (image is Map && image['data'] is List) {
      _photoBase64 = base64Encode((image['data'] as List).cast<int>());
      _photoMimeType = 'image/jpeg';
    }
    setState(() => _showForm = true);
    await _loadUnits(_int(renter['PropertyID']), selectedRecordId: recordId);
    await _loadTransactions(_editingUserId!);
  }

  Set<String> _parsePaymentModes(dynamic value) {
    final modes = value is List
        ? value
        : value is String
        ? value.split(',')
        : [];
    return modes
        .map((mode) => mode.toString().trim())
        .where(_paymentModes.contains)
        .toSet();
  }

  String _dateOnly(dynamic value) {
    final text = value?.toString() ?? '';
    return text.length >= 10 ? text.substring(0, 10) : text;
  }

  String _dateForApi(DateTime value) =>
      '${value.year.toString().padLeft(4, '0')}-'
      '${value.month.toString().padLeft(2, '0')}-'
      '${value.day.toString().padLeft(2, '0')}';

  Future<void> _pickLeaseDate({required bool startDate}) async {
    final current = startDate ? _leaseStartDate : _leaseEndDate;
    final initial = current ??
        (startDate ? DateTime.now() : _leaseStartDate ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1900),
      lastDate: DateTime(2200),
    );
    if (picked == null || !mounted) return;
    setState(() {
      if (startDate) {
        _leaseStartDate = picked;
      } else {
        _leaseEndDate = picked;
      }
    });
  }

  String _renterName(Map<String, dynamic> renter) =>
      [renter['Name'], renter['MName'], renter['LName']]
          .where((part) => part != null && part.toString().trim().isNotEmpty)
          .join(' ');

  Future<bool> _checkAvailability() async {
    final response = await _requestJson(
      'checkFlatAvailability',
      query: {
        'CompanyID': '$_companyId',
        'PropertyID': _selectedPropertyId!,
        'RecordID': _selectedRecordId!,
        'RentalID': '$_rentalId',
        'UserId': '${_editingUserId ?? 0}',
        if (_leaseStartDate != null)
          'LeaseStartDate': _dateForApi(_leaseStartDate!),
        if (_leaseEndDate != null) 'LeaseEndDate': _dateForApi(_leaseEndDate!),
      },
    );
    if (response is! Map || !_success(response['success'])) {
      throw Exception(
        response is Map
            ? response['message'] ?? 'Could not verify unit availability.'
            : 'Could not verify unit availability.',
      );
    }
    final occupied =
        response['isOccupied'] == true ||
        response['isOccupied']?.toString().toLowerCase() == 'true';
    final available =
        response['available'] == true ||
        response['available']?.toString().toLowerCase() == 'true';
    if (occupied || !available) {
      throw Exception(
        response['message'] ??
            'This unit is occupied. Select another unit or complete the current rental first.',
      );
    }
    return true;
  }

  Future<void> _saveRenter() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPropertyId == null || _selectedRecordId == null) {
      _notify('Select a property and unit.', error: true);
      return;
    }
    if (_companyId <= 0 || _userId <= 0 || _renterRoleId <= 0) {
      _notify(
        'Company, user, or renter role is missing. Sign in again.',
        error: true,
      );
      return;
    }
    if (_rentalStatus.toLowerCase() == 'occupied' &&
        _leaseStartDate == null) {
      _notify(
        'Lease start date is required for an occupied rental.',
        error: true,
      );
      return;
    }
    if (_leaseStartDate != null &&
        _leaseEndDate != null &&
        _leaseEndDate!.isBefore(_leaseStartDate!)) {
      _notify(
        'Lease end date cannot be before lease start date.',
        error: true,
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await _checkAvailability();
      final payload = <String, dynamic>{
        'UserId': _editingUserId ?? 0,
        'RentalID': _rentalId,
        'PropertyID': int.parse(_selectedPropertyId!),
        'RecordID': int.parse(_selectedRecordId!),
        'FlatNo': _fields['FlatNo']!.text.trim(),
        'FlatType': _fields['FlatType']!.text.trim(),
        'RentalStatus': _rentalStatus,
        'LeaseStartDate': _leaseStartDate == null
            ? null
            : _dateForApi(_leaseStartDate!),
        'LeaseEndDate':
            _leaseEndDate == null ? null : _dateForApi(_leaseEndDate!),
        'Name': _fields['Name']!.text.trim(),
        'MName': _fields['MName']!.text.trim().isEmpty
            ? null
            : _fields['MName']!.text.trim(),
        'LName': _fields['LName']!.text.trim().isEmpty
            ? null
            : _fields['LName']!.text.trim(),
        'Mobile': _fields['Mobile']!.text.trim(),
        'Email': _fields['Email']!.text.trim().isEmpty
            ? null
            : _fields['Email']!.text.trim(),
        'Sex': _sex == null ? null : int.tryParse(_sex!),
        'EIDNo': _fields['EIDNo']!.text.trim().isEmpty
            ? null
            : _fields['EIDNo']!.text.trim(),
        'EIDExpiryDate': _fields['EIDExpiryDate']!.text.trim().isEmpty
            ? null
            : _fields['EIDExpiryDate']!.text.trim(),
        'BadgeNo': _fields['BadgeNo']!.text.trim().isEmpty
            ? null
            : _fields['BadgeNo']!.text.trim(),
        'WorkerRate': double.tryParse(_fields['RentalAmount']!.text.trim()),
        'RentalAmount':
            double.tryParse(_fields['RentalAmount']!.text.trim()),
        'MonthlyRent':
            double.tryParse(_fields['RentalAmount']!.text.trim()),
        'PaymentMode': _selectedPaymentModes.isEmpty
            ? null
            : _selectedPaymentModes.join(','),
        'UserRoleId': _renterRoleId,
        'CompanyID': _companyId,
        'BranchID': null,
        if (_editingUserId == null) ...{
          'CreatedBy': _userId,
          'CreatedDate': DateTime.now().toIso8601String(),
        } else ...{
          'ModifiedBy': _userId,
          'ModifiedDate': DateTime.now().toIso8601String(),
        },
        if (_photoBase64 != null)
          'image':
              'data:${_photoMimeType ?? 'image/jpeg'};base64,$_photoBase64',
      };
      final response = await _requestJson('InsertUpdateUser', body: payload);
      if (response is! Map || !_success(response['success'])) {
        throw Exception(
          response is Map
              ? response['message'] ?? 'Rental could not be saved.'
              : 'Rental could not be saved.',
        );
      }
      final savedId = _int(response['UserId'] ?? response['UserID']);
      _notify(_editingUserId == null ? 'Renter created.' : 'Renter updated.');
      await _loadDirectory();
      if (!mounted) return;
      if (_editingUserId == null && savedId > 0) {
        final created = _renters
            .where((row) => _int(row['UserId']) == savedId)
            .firstOrNull;
        if (created != null) {
          await _openEdit(created);
          return;
        }
      }
      setState(() {
        _showForm = false;
        _clearFields();
      });
    } catch (error) {
      debugPrint('Save renter error: $error');
      _notify(_errorText(error), error: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteRenter() async {
    if (_editingUserId == null || _deleting) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete renter?'),
        content: const Text('This removes the renter record.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _deleting = true);
    try {
      final response = await _requestJson(
        'Deleteusers',
        body: {'UserId': _editingUserId, 'deletedBy': _userId},
      );
      if (response is! Map || !_success(response['success'])) {
        throw Exception(
          response is Map
              ? response['message'] ?? 'Renter could not be deleted.'
              : 'Renter could not be deleted.',
        );
      }
      _notify('Renter deleted.');
      await _loadDirectory();
      if (mounted) {
        setState(() {
          _showForm = false;
          _clearFields();
        });
      }
    } catch (error) {
      _notify(_errorText(error), error: true);
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Future<void> _choosePhoto() async {
    final result = await FilePicker.pickFiles(
      type: FileType.image,
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    final bytes = file.bytes;
    if (bytes == null) {
      _notify('The selected photo could not be read.', error: true);
      return;
    }
    if (bytes.length > 300 * 1024) {
      _notify('Photo must be under 300 KB.', error: true);
      return;
    }
    setState(() {
      _photoBase64 = base64Encode(bytes);
      _photoMimeType = file.extension?.toLowerCase() == 'png'
          ? 'image/png'
          : 'image/jpeg';
    });
  }

  Future<void> _chooseTransactionFile() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;
    setState(() => _transactionFile = result.files.first);
  }

  Future<void> _saveTransaction() async {
    if (_editingUserId == null) {
      _notify('Save the renter first to record transactions.', error: true);
      return;
    }
    final amount = double.tryParse(_transactionAmountController.text.trim());
    if (amount == null || amount <= 0) {
      _notify('Enter a transaction amount greater than zero.', error: true);
      return;
    }
    if (_selectedPropertyId == null || _selectedRecordId == null) {
      _notify('The renter must be linked to a property unit.', error: true);
      return;
    }
    setState(() => _savingTransaction = true);
    try {
      final rowId = DateTime.now().microsecondsSinceEpoch.toString();
      final seq =
          _int(
            _transactions
                .where(
                  (row) =>
                      (row['TransactionType'] ?? '').toString().toLowerCase() ==
                      _transactionType.toLowerCase(),
                )
                .length,
          ) +
          1;
      final tx = {
        'RowId': rowId,
        'TransactionID': _transactionId ?? 0,
        'RecordID': int.parse(_selectedRecordId!),
        'TransactionType': _transactionType,
        'Sequence': _transactionId == null
            ? seq
            : (_transactions
                      .where(
                        (row) => _int(row['TransactionID']) == _transactionId,
                      )
                      .firstOrNull?['Sequence'] ??
                  seq),
        'Label': _transactionId == null ? '$_transactionType $seq' : null,
        'Amount': amount,
        'TransactionDate': _transactionDateController.text.trim().isEmpty
            ? null
            : _transactionDateController.text.trim(),
        'ExistingPath': _transactionPath,
      };
      final request =
          http.MultipartRequest(
              'POST',
              Uri.parse('${ApiConfig.webUrl}/saveRentalTransactions'),
            )
            ..fields['CompanyID'] = '$_companyId'
            ..fields['PropertyID'] = _selectedPropertyId!
            ..fields['RentID'] = '$_editingUserId'
            ..fields['UserID'] = '$_userId'
            ..fields['TransactionsJson'] = jsonEncode([tx]);
      if (_transactionFile != null && _transactionFile!.bytes == null) {
        throw Exception('The selected transaction file could not be read.');
      }
      if (_transactionFile?.bytes != null) {
        request.files.add(
          http.MultipartFile.fromBytes(
            'file_$rowId',
            _transactionFile!.bytes!,
            filename: _transactionFile!.name,
          ),
        );
      }
      final response = await _requestJson(
        'saveRentalTransactions',
        multipart: request,
      );
      if (response is! Map || !_success(response['success'])) {
        throw Exception(
          response is Map
              ? response['message'] ?? 'Transaction could not be saved.'
              : 'Transaction could not be saved.',
        );
      }
      _notify(
        _transactionId == null ? 'Transaction saved.' : 'Transaction updated.',
      );
      _resetTransactionEditor();
      await _loadTransactions(_editingUserId!);
    } catch (error) {
      debugPrint('Save rental transaction error: $error');
      _notify(_errorText(error), error: true);
    } finally {
      if (mounted) setState(() => _savingTransaction = false);
    }
  }

  void _editTransaction(Map<String, dynamic> transaction) {
    setState(() {
      _transactionId = _int(transaction['TransactionID']);
      _transactionType = transaction['TransactionType']?.toString() ?? 'Cheque';
      _transactionAmountController.text =
          transaction['Amount']?.toString() ?? '';
      _transactionDateController.text = _dateOnly(
        transaction['TransactionDate'],
      );
      _transactionPath = transaction['Path']?.toString();
      _transactionFile = null;
    });
  }

  void _resetTransactionEditor() {
    setState(() {
      _transactionId = null;
      _transactionType = 'Cheque';
      _transactionAmountController.clear();
      _transactionDateController.clear();
      _transactionPath = null;
      _transactionFile = null;
    });
  }

  Future<void> _deleteTransaction(Map<String, dynamic> transaction) async {
    final id = _int(transaction['TransactionID']);
    if (id <= 0) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete transaction?'),
        content: Text('Delete ${transaction['Label'] ?? 'this transaction'}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      final response = await _requestJson(
        'deleteRentalTransaction',
        body: {'TransactionID': id, 'UserID': _userId},
      );
      if (response is! Map || !_success(response['success'])) {
        throw Exception(
          response is Map
              ? response['message'] ?? 'Transaction could not be deleted.'
              : 'Transaction could not be deleted.',
        );
      }
      if (_transactionId == id) _resetTransactionEditor();
      _notify('Transaction deleted.');
      await _loadTransactions(_editingUserId!);
    } catch (error) {
      _notify(_errorText(error), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FB),
      appBar: AppBar(
        title: Text(
          _showForm
              ? (_editingUserId == null ? 'New renter' : 'Edit renter')
              : 'Rental Management',
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF111827),
        actions: [
          if (!_showForm)
            IconButton(
              tooltip: 'Refresh',
              onPressed: _loading ? null : _loadDirectory,
              icon: const Icon(Icons.refresh),
            ),
          if (_showForm)
            TextButton.icon(
              onPressed: _saving || _deleting
                  ? null
                  : () => setState(() {
                      _showForm = false;
                      _clearFields();
                    }),
              icon: const Icon(Icons.arrow_back),
              label: const Text('List'),
            ),
        ],
      ),
      floatingActionButton: !_showForm
          ? FloatingActionButton.extended(
              onPressed: _openCreate,
              backgroundColor: _primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.person_add_alt_1),
              label: const Text('New renter'),
            )
          : null,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _showForm
          ? _buildForm()
          : _buildList(),
    );
  }

  Widget _buildList() {
    final renters = _filteredRenters;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            controller: _searchController,
            onChanged: (value) => setState(() => _search = value),
            decoration: InputDecoration(
              hintText: 'Search renter, property or unit',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _search.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _search = '');
                      },
                      icon: const Icon(Icons.close),
                    ),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
        ),
        Expanded(
          child: renters.isEmpty
              ? const Center(child: Text('No renters found.'))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                  itemCount: renters.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final renter = renters[index];
                    final name = _renterName(renter);
                    final property = renter['PropertyName']?.toString() ?? '';
                    final unit = renter['FlatNo']?.toString() ?? '';
                    final rent = renter['RentalAmount']?.toString() ?? '';
                    final status = renter['RentalStatus']?.toString() ?? '';
                    return Card(
                      elevation: 0,
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFFEDEBFB),
                          foregroundColor: _primary,
                          child: Text(
                            name.isEmpty ? '?' : name[0].toUpperCase(),
                          ),
                        ),
                        title: Text(
                          name.isEmpty ? 'Renter #${renter['UserId']}' : name,
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 5),
                          child: Text(
                            [
                              if (unit.isNotEmpty) unit,
                              if (property.isNotEmpty) property,
                              if ((renter['Mobile'] ?? '')
                                  .toString()
                                  .isNotEmpty)
                                renter['Mobile'].toString(),
                              if (rent.isNotEmpty) 'Rent: $rent',
                              if (status.isNotEmpty) status,
                            ].join(' · '),
                          ),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => _openEdit(renter),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    final contract = _rentalContracts
        .where(
          (row) =>
              _int(row['PropertyID']).toString() == _selectedPropertyId &&
              _int(row['RecordID']).toString() == _selectedRecordId,
        )
        .firstOrNull;

    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _section('Property and unit', Icons.home_work_outlined, [
            DropdownButtonFormField<String>(
              key: ValueKey('property-$_selectedPropertyId'),
              initialValue: _selectedPropertyId,
              decoration: const InputDecoration(labelText: 'Property *'),
              items: _properties.map((property) {
                final id = _int(property['PropertyID']).toString();
                return DropdownMenuItem(
                  value: id,
                  child: Text(
                    property['PropertyName']?.toString() ?? 'Property $id',
                  ),
                );
              }).toList(),
              validator: (value) => value == null ? 'Select a property.' : null,
              onChanged: _saving
                  ? null
                  : (value) async {
                      if (value == null) return;
                      setState(() {
                        _selectedPropertyId = value;
                        _selectedRecordId = null;
                        _fields['FlatNo']!.clear();
                        _fields['FlatType']!.clear();
                      });
                      await _loadUnits(int.parse(value));
                    },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              key: ValueKey('unit-$_selectedPropertyId-$_selectedRecordId'),
              initialValue: _selectedRecordId,
              decoration: InputDecoration(
                labelText: 'Flat / unit *',
                helperText: _loadingUnits ? 'Loading units…' : null,
              ),
              items: _units.map((unit) {
                final id = _int(unit['RecordID']).toString();
                final flat = (unit['FlatNo'] ?? 'Unit $id').toString();
                final type = (unit['FlatType'] ?? '').toString();
                return DropdownMenuItem(
                  value: id,
                  child: Text(type.isEmpty ? flat : '$flat · $type'),
                );
              }).toList(),
              validator: (value) => value == null ? 'Select a unit.' : null,
              onChanged: _loadingUnits || _saving
                  ? null
                  : (value) {
                      final unit = _units
                          .where(
                            (row) => _int(row['RecordID']).toString() == value,
                          )
                          .firstOrNull;
                      setState(() {
                        _selectedRecordId = value;
                        _fields['FlatNo']!.text =
                            unit?['FlatNo']?.toString() ?? '';
                        _fields['FlatType']!.text =
                            unit?['FlatType']?.toString() ?? '';
                        _fields['RentalAmount']!.text =
                            unit?['RentalAmount']?.toString() ?? '';
                      });
                    },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _textField('Flat No', 'FlatNo')),
                const SizedBox(width: 12),
                Expanded(child: _textField('Flat Type', 'FlatType')),
              ],
            ),
            const SizedBox(height: 12),
            _textField(
              'Rent Amount',
              'RentalAmount',
              keyboard: TextInputType.number,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              key: ValueKey('rental-status-$_rentalStatus'),
              initialValue: _rentalStatus,
              decoration: const InputDecoration(labelText: 'Rental status *'),
              items: const [
                DropdownMenuItem(value: 'Occupied', child: Text('Occupied')),
                DropdownMenuItem(value: 'Vacant', child: Text('Vacant')),
                DropdownMenuItem(value: 'Reserved', child: Text('Reserved')),
                DropdownMenuItem(
                  value: 'Under Maintenance',
                  child: Text('Under Maintenance'),
                ),
                DropdownMenuItem(value: 'Blocked', child: Text('Blocked')),
              ],
              onChanged: _saving
                  ? null
                  : (value) => setState(
                      () => _rentalStatus = value ?? 'Occupied',
                    ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    key: ValueKey(
                      'lease-start-${_leaseStartDate?.toIso8601String()}',
                    ),
                    initialValue: _leaseStartDate == null
                        ? ''
                        : _dateForApi(_leaseStartDate!),
                    readOnly: true,
                    decoration: InputDecoration(
                      labelText: _rentalStatus.toLowerCase() == 'occupied'
                          ? 'Lease start date *'
                          : 'Lease start date',
                      suffixIcon: const Icon(Icons.calendar_today_outlined),
                    ),
                    onTap: _saving
                        ? null
                        : () => _pickLeaseDate(startDate: true),
                    validator: (value) =>
                        _rentalStatus.toLowerCase() == 'occupied' &&
                            _leaseStartDate == null
                        ? 'Lease start date is required for an occupied rental.'
                        : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    key: ValueKey(
                      'lease-end-${_leaseEndDate?.toIso8601String()}',
                    ),
                    initialValue: _leaseEndDate == null
                        ? ''
                        : _dateForApi(_leaseEndDate!),
                    readOnly: true,
                    decoration: const InputDecoration(
                      labelText: 'Lease end date',
                      suffixIcon: Icon(Icons.calendar_today_outlined),
                    ),
                    onTap: _saving
                        ? null
                        : () => _pickLeaseDate(startDate: false),
                  ),
                ),
              ],
            ),
            if (contract != null) ...[
              const SizedBox(height: 12),
              _contractSummary(contract),
            ] else if (_selectedPropertyId != null &&
                _selectedRecordId != null) ...[
              const SizedBox(height: 12),
              const Text(
                'Renter and lease details will be saved against this property unit.',
                style: TextStyle(color: Colors.blueGrey, fontSize: 12),
              ),
            ],
          ]),
          const SizedBox(height: 14),
          _section('Renter details', Icons.person_outline, [
            Row(
              children: [
                Expanded(
                  child: _textField('First name *', 'Name', required: true),
                ),
                const SizedBox(width: 12),
                Expanded(child: _textField('Middle name', 'MName')),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _textField('Last name', 'LName')),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    key: ValueKey('gender-$_sex'),
                    initialValue: _sex,
                    decoration: const InputDecoration(labelText: 'Gender'),
                    items: const [
                      DropdownMenuItem(value: '0', child: Text('Male')),
                      DropdownMenuItem(value: '1', child: Text('Female')),
                      DropdownMenuItem(value: '2', child: Text('Others')),
                    ],
                    onChanged: _saving
                        ? null
                        : (value) => setState(() => _sex = value),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _textField(
                    'Mobile *',
                    'Mobile',
                    required: true,
                    keyboard: TextInputType.phone,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _textField(
                    'Email',
                    'Email',
                    keyboard: TextInputType.emailAddress,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _textField('Emirates ID', 'EIDNo')),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _fields['EIDExpiryDate'],
                    readOnly: true,
                    decoration: const InputDecoration(
                      labelText: 'EID expiry',
                      suffixIcon: Icon(Icons.calendar_today_outlined),
                    ),
                    onTap: _pickEidExpiry,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _textField('Lease / contract number', 'BadgeNo'),
            const SizedBox(height: 12),
            const Text(
              'Payment modes',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            Wrap(
              spacing: 4,
              children: _paymentModes
                  .map(
                    (mode) => FilterChip(
                      label: Text(mode),
                      selected: _selectedPaymentModes.contains(mode),
                      onSelected: _saving
                          ? null
                          : (selected) => setState(() {
                              if (selected) {
                                _selectedPaymentModes.add(mode);
                              } else {
                                _selectedPaymentModes.remove(mode);
                              }
                            }),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                if (_photoBase64 != null)
                  ClipOval(
                    child: Image.memory(
                      base64Decode(_photoBase64!),
                      width: 68,
                      height: 68,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) =>
                          const Icon(Icons.person, size: 42),
                    ),
                  )
                else
                  const CircleAvatar(radius: 34, child: Icon(Icons.person)),
                const SizedBox(width: 12),
                OutlinedButton.icon(
                  onPressed: _saving ? null : _choosePhoto,
                  icon: const Icon(Icons.photo_camera_outlined),
                  label: const Text('Tenant photo'),
                ),
                if (_photoBase64 != null)
                  IconButton(
                    tooltip: 'Remove photo',
                    onPressed: _saving
                        ? null
                        : () => setState(() {
                            _photoBase64 = null;
                            _photoMimeType = null;
                          }),
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Image limit: 300 KB.',
              style: TextStyle(color: Colors.blueGrey, fontSize: 12),
            ),
          ]),
          const SizedBox(height: 14),
          _section('Payment transactions', Icons.payments_outlined, [
            if (_editingUserId == null)
              const Text('Save renter details first to add transactions.')
            else ...[
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      key: ValueKey('transaction-type-$_transactionType'),
                      initialValue: _transactionType,
                      decoration: const InputDecoration(labelText: 'Type'),
                      items: _transactionTypes
                          .map(
                            (type) => DropdownMenuItem(
                              value: type,
                              child: Text(type),
                            ),
                          )
                          .toList(),
                      onChanged: (value) =>
                          setState(() => _transactionType = value ?? 'Cheque'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _transactionAmountController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      decoration: const InputDecoration(labelText: 'Amount *'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _transactionDateController,
                      readOnly: true,
                      decoration: const InputDecoration(
                        labelText: 'Transaction date',
                        suffixIcon: Icon(Icons.calendar_today_outlined),
                      ),
                      onTap: _pickTransactionDate,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    tooltip: 'Attach receipt or cheque',
                    onPressed: _chooseTransactionFile,
                    icon: const Icon(Icons.attach_file),
                  ),
                  if (_transactionFile != null)
                    Expanded(
                      child: Text(
                        _transactionFile!.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    )
                  else if (_transactionPath != null)
                    const Expanded(child: Text('File attached', maxLines: 1)),
                ],
              ),
              if (_transactionId != null)
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _resetTransactionEditor,
                    child: const Text('Cancel edit'),
                  ),
                ),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton.icon(
                  onPressed: _savingTransaction ? null : _saveTransaction,
                  icon: _savingTransaction
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(
                    _transactionId == null
                        ? 'Save transaction'
                        : 'Update transaction',
                  ),
                ),
              ),
              const Divider(height: 28),
              if (_loadingTransactions)
                const Center(child: CircularProgressIndicator())
              else if (_transactions.isEmpty)
                const Text('No payment transactions recorded yet.')
              else
                ..._transactions.map(_transactionTile),
            ],
          ]),
          const SizedBox(height: 16),
          Row(
            children: [
              if (_editingUserId != null)
                OutlinedButton.icon(
                  onPressed: _deleting || _saving ? null : _deleteRenter,
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  label: const Text(
                    'Delete',
                    style: TextStyle(color: Colors.red),
                  ),
                ),
              const Spacer(),
              FilledButton.icon(
                onPressed: _saving || _deleting ? null : _saveRenter,
                icon: _saving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save_outlined),
                label: Text(
                  _editingUserId == null ? 'Create renter' : 'Save changes',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _section(String title, IconData icon, List<Widget> children) => Card(
    elevation: 0,
    color: Colors.white,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: const BorderSide(color: Color(0xFFE5E7EB)),
    ),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: _primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    ),
  );

  Widget _textField(
    String label,
    String name, {
    bool required = false,
    TextInputType? keyboard,
  }) {
    return TextFormField(
      controller: _fields[name],
      keyboardType: keyboard,
      decoration: InputDecoration(labelText: label),
      validator: (value) {
        final text = value?.trim() ?? '';
        if (required && text.isEmpty) return 'This field is required.';
        if (name == 'Email' &&
            text.isNotEmpty &&
            !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(text)) {
          return 'Enter a valid email.';
        }
        if (name == 'EIDNo' &&
            text.isNotEmpty &&
            !RegExp(r'^784-\d{4}-\d{7}-\d$').hasMatch(text)) {
          return 'Format: 784-XXXX-XXXXXXX-X';
        }
        if (name == 'RentalAmount' &&
            text.isNotEmpty &&
            double.tryParse(text) == null) {
          return 'Enter a valid amount.';
        }
        return null;
      },
    );
  }

  Widget _contractSummary(Map<String, dynamic> contract) {
    final start = _dateOnly(contract['LeaseStartDate']);
    final end = _dateOnly(contract['LeaseEndDate']);
    final status = contract['RentalStatus']?.toString() ?? '—';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        'Linked property contract · $status${start.isEmpty && end.isEmpty ? '' : ' · $start to $end'}',
        style: const TextStyle(fontSize: 12, color: Color(0xFF1E40AF)),
      ),
    );
  }

  Widget _transactionTile(Map<String, dynamic> transaction) {
    final type = transaction['TransactionType']?.toString() ?? 'Transaction';
    final label =
        transaction['Label']?.toString() ??
        '$type ${transaction['Sequence'] ?? ''}'.trim();
    final amount = transaction['Amount']?.toString() ?? '0';
    final date = _dateOnly(transaction['TransactionDate']);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const CircleAvatar(child: Icon(Icons.receipt_long_outlined)),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(
          [if (date.isNotEmpty) date, 'Amount: $amount'].join(' · '),
        ),
        onTap: () => _editTransaction(transaction),
        trailing: IconButton(
          tooltip: 'Delete transaction',
          onPressed: () => _deleteTransaction(transaction),
          icon: const Icon(Icons.delete_outline, color: Colors.red),
        ),
      ),
    );
  }

  Future<void> _pickEidExpiry() async {
    final initial =
        DateTime.tryParse(_fields['EIDExpiryDate']!.text) ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (date != null) {
      _fields['EIDExpiryDate']!.text =
          '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _pickTransactionDate() async {
    final initial =
        DateTime.tryParse(_transactionDateController.text) ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (date != null) {
      _transactionDateController.text =
          '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    }
  }
}
