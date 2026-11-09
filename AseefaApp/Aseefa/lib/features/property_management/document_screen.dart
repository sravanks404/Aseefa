import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
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


class DocTypeMeta {
  final String key;
  final IconData icon;
  final bool multi;
  const DocTypeMeta(this.key, this.icon, {this.multi = true});
}

const List<DocTypeMeta> kSupportedDocumentTypes = [
  DocTypeMeta('Title Deed', Icons.description_outlined),
  DocTypeMeta('Sale Agreement', Icons.receipt_long_outlined),
  DocTypeMeta('Floor Plan', Icons.straighten_outlined),
  DocTypeMeta('Lift Safety Certificate', Icons.verified_user_outlined),
  DocTypeMeta('Plot Number Documents', Icons.location_on_outlined),
  DocTypeMeta('Civil Defence (DCD) Approval documents(CCTV Documents)',
      Icons.videocam_outlined),
  DocTypeMeta('Civil Defence Clearance(Fire safety documents)',
      Icons.local_fire_department_outlined),
  DocTypeMeta('Municipality Approval', Icons.account_balance_outlined),
  DocTypeMeta('Building Permit', Icons.fact_check_outlined),
  DocTypeMeta('Property Insurance', Icons.security_outlined),
  DocTypeMeta('Electricity & Water Bill(FEWA)', Icons.bolt_outlined),
  DocTypeMeta('Mortgage Documents', Icons.payments_outlined),
  DocTypeMeta('Warranty Documents', Icons.workspace_premium_outlined),
  DocTypeMeta('Property Photos', Icons.image_outlined),
];

const List<String> kDocStatusOptions = ['Uploaded', 'Missing'];

// ── Models ──────────────────────────────────────────────────

class DocPropertyOption {
  final int id;
  final String label;
  final String code;

  DocPropertyOption({required this.id, required this.label, this.code = ''});

  factory DocPropertyOption.fromApi(Map<String, dynamic> item) {
    final pid = int.tryParse('${item['PropertyID'] ?? item['propertyId'] ?? item['id'] ?? 0}') ?? 0;
    final name = item['PropertyName']?.toString() ?? item['propertyName']?.toString() ?? '';
    return DocPropertyOption(
      id: pid,
      label: name.isNotEmpty ? name : 'Property #$pid',
      code: item['PropertyCode']?.toString() ?? item['propertyCode']?.toString() ?? '',
    );
  }

  String get searchText => '$label $code $id';
}

class PropertyDocument {
  final int id;
  final String documentId;
  final String documentType;
  final String fileName;
  final String fileSizeLabel;
  final String documentDate;
  final String expiryDate;
  final String uploadedBy;
  final String notes;
  final String path;

  PropertyDocument({
    required this.id,
    required this.documentId,
    required this.documentType,
    required this.fileName,
    required this.fileSizeLabel,
    required this.documentDate,
    required this.expiryDate,
    required this.uploadedBy,
    required this.notes,
    required this.path,
  });

  factory PropertyDocument.fromApi(Map<String, dynamic> item) {
    return PropertyDocument(
      id: int.tryParse('${item['DocumentID'] ?? item['documentId'] ?? item['id'] ?? 0}') ?? 0,
      documentId: item['DocumentID']?.toString() ?? item['documentId']?.toString() ?? '',
      documentType: item['DocumentType']?.toString() ?? item['documentType']?.toString() ?? '',
      fileName: item['FileName']?.toString() ?? item['fileName']?.toString() ?? '',
      fileSizeLabel: item['FileSizeLabel']?.toString() ??
          item['fileSizeLabel']?.toString() ??
          _bytesToLabel(item['FileSize']),
      documentDate: _dateOnlyStr(item['DocumentDate'] ?? item['documentDate']),
      expiryDate: _dateOnlyStr(item['ExpiryDate'] ?? item['expiryDate']),
      uploadedBy: item['UploadedBy']?.toString() ?? item['uploadedBy']?.toString() ?? '',
      notes: item['Notes']?.toString() ?? item['notes']?.toString() ?? '',
      path: item['FilePath']?.toString() ??
          item['filePath']?.toString() ??
          item['Path']?.toString() ??
          item['path']?.toString() ??
          '',
    );
  }
}

String _dateOnlyStr(dynamic v) {
  if (v == null) return '';
  final t = v.toString();
  return t.length >= 10 ? t.substring(0, 10) : t;
}

String _bytesToLabel(dynamic bytesRaw) {
  final bytes = bytesRaw is num ? bytesRaw.toDouble() : double.tryParse('$bytesRaw');
  if (bytes == null) return '';
  if (bytes < 1024) return '${bytes.toStringAsFixed(0)} B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(0)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}

String _fmtDisplayDate(String isoLike) {
  if (isoLike.isEmpty) return '';
  final d = DateTime.tryParse(isoLike);
  if (d == null) return isoLike;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]} ${d.year}';
}

IconData _fileIconFor(String fileName) {
  final ext = fileName.contains('.') ? fileName.split('.').last.toLowerCase() : '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext)) return Icons.image_outlined;
  if (['mp4', 'mov', 'avi', 'mkv'].contains(ext)) return Icons.play_circle_outline;
  if (ext == 'pdf') return Icons.picture_as_pdf_outlined;
  if (['doc', 'docx'].contains(ext)) return Icons.description_outlined;
  return Icons.insert_drive_file_outlined;
}


const String kAseefaFileRootUrl = 'https://api.aseefa.suitapps.in';

String _documentUrl(String path) {
  if (path.isEmpty) return '';
  final normalized = path.replaceAll('\\', '/').replaceFirst(RegExp(r'^\.\./'), '');
  final segments = normalized.split('/').map(Uri.encodeComponent).join('/');
  return '$kAseefaFileRootUrl/$segments';
}



class DocumentScreen extends StatelessWidget {
  const DocumentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: PiColors.background,
      body: DocumentBody(),
    );
  }
}

class DocumentBody extends StatefulWidget {
  const DocumentBody({super.key});

  @override
  State<DocumentBody> createState() => _DocumentBodyState();
}

class _DocumentBodyState extends State<DocumentBody> {
  // Properties
  List<DocPropertyOption> properties = [];
  bool loadingProperties = false;
  DocPropertyOption? selectedProperty;

  // Documents
  List<PropertyDocument> documents = [];
  bool loadingDocuments = false;
  String searchTerm = '';
  final TextEditingController _searchController = TextEditingController();
  bool isFilterOpen = false;
  String? filterStatus;
  String? filterType;

  // Form
  bool showForm = false;
  int? formId;
  String formDocumentType = '';
  String formUploadedBy = '';
  DateTime? formDocumentDate;
  DateTime? formExpiryDate;
  String formNotes = '';
  String formExistingFileName = '';
  String formExistingPath = '';
  bool lockType = false;
  PlatformFile? selectedFile;

  bool saving = false;
  bool deleting = false;

  bool get isEditing => formId != null;

  final TextEditingController _uploadedByController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    loadProperties();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _uploadedByController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<int> _getCompanyId() async => SessionStore.getCompanyId();
  Future<int> _getUserId() async => SessionStore.getUserId();

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
  //             child: Text(message,
  //                 style: const TextStyle(
  //                     color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
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

  Map<String, dynamic> _decodeJsonBody(String body, String action) {
    final trimmed = body.trim();
    if (trimmed.isEmpty) throw const FormatException('Empty response from server');
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

  List<dynamic> _documentsFrom(Map<String, dynamic> data) {
    final value = data['documents'] ?? data['data'];
    return value is List ? value : [];
  }

  String _apiFailureMessage(Object error, String action) {
    final text = error.toString();
    if (text.contains('<!DOCTYPE') || text.contains('<html')) {
      return 'Document backend is not available for $action. Check the API route and backend server.';
    }
    return 'Failed to $action.';
  }

  // ── Loading ────────────────────────────────────────────────

  Future<void> loadProperties() async {
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }
    setState(() => loadingProperties = true);
    try {
      final uri = Uri.parse('$kAseefaWebUrl/getPropertyInfo')
          .replace(queryParameters: {'CompanyID': '$companyID'});
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load properties');
      if (data['success'] == true) {
        final List list = data['data'] is List ? data['data'] : [];
        if (!mounted) return;
        setState(() {
          properties =
              list.map((e) => DocPropertyOption.fromApi(Map<String, dynamic>.from(e))).toList();
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

  Future<void> loadDocuments() async {
    if (selectedProperty == null) return;
    final companyID = await _getCompanyId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }
    setState(() => loadingDocuments = true);
    try {
      final uri = Uri.parse('$kAseefaWebUrl/getPropertyDocs').replace(queryParameters: {
        'CompanyID': '$companyID',
        'PropertyID': '${selectedProperty!.id}',
      });
      final response = await http.get(uri);
      final data = _decodeJsonBody(response.body, 'load documents');
      if (_isSuccess(data['success'])) {
        final list = _documentsFrom(data);
        if (!mounted) return;
        setState(() {
          documents =
              list.map((e) => PropertyDocument.fromApi(Map<String, dynamic>.from(e))).toList();
        });
      } else {
        if (!mounted) return;
        setState(() => documents = []);
        _notify(data['message'] ?? 'Failed to load documents.', isError: true);
      }
    } catch (e) {
      debugPrint('Load documents error: $e');
      _notify(_apiFailureMessage(e, 'load documents'), isError: true);
    } finally {
      if (mounted) setState(() => loadingDocuments = false);
    }
  }

  // ── Derived data ───────────────────────────────────────────

  Map<String, List<PropertyDocument>> get docsByType {
    final map = <String, List<PropertyDocument>>{};
    for (final d in documents) {
      map.putIfAbsent(d.documentType, () => []).add(d);
    }
    return map;
  }

  int get coverageCount =>
      kSupportedDocumentTypes.where((t) => (docsByType[t.key] ?? []).isNotEmpty).length;

  double get coveragePct =>
      kSupportedDocumentTypes.isEmpty ? 0 : (coverageCount / kSupportedDocumentTypes.length);

  List<DocTypeMeta> get visibleTypes {
    final term = searchTerm.trim().toLowerCase();
    return kSupportedDocumentTypes.where((t) {
      final docs = docsByType[t.key] ?? [];
      final uploaded = docs.isNotEmpty;
      if (filterStatus == 'Uploaded' && !uploaded) return false;
      if (filterStatus == 'Missing' && uploaded) return false;
      if (filterType != null && filterType!.isNotEmpty && t.key != filterType) return false;
      if (term.isEmpty) return true;
      final matchesType = t.key.toLowerCase().contains(term);
      final matchesFile = docs.any((d) => d.fileName.toLowerCase().contains(term));
      return matchesType || matchesFile;
    }).toList();
  }

  int get activeFilterCount =>
      [filterStatus, filterType].where((v) => v != null && v!.isNotEmpty).length;

  // ── Actions ────────────────────────────────────────────────

  Future<void> selectProperty(DocPropertyOption property) async {
    FocusScope.of(context).unfocus();
    setState(() {
      selectedProperty = property;
      documents = [];
      searchTerm = '';
      _searchController.clear();
      filterStatus = null;
      filterType = null;
      showForm = false;
    });
    await loadDocuments();
  }

  void changeProperty() {
    if (saving || deleting) return;
    setState(() {
      selectedProperty = null;
      documents = [];
      showForm = false;
    });
  }

  void clearFilters() {
    setState(() {
      filterStatus = null;
      filterType = null;
    });
  }

  void _resetForm() {
    formId = null;
    formDocumentType = '';
    formUploadedBy = '';
    formDocumentDate = null;
    formExpiryDate = null;
    formNotes = '';
    formExistingFileName = '';
    formExistingPath = '';
    selectedFile = null;
    lockType = false;
    _uploadedByController.clear();
    _notesController.clear();
  }

  void openCreate([String presetType = '']) {
    if (selectedProperty == null) {
      _notify('Please select a property first.', isError: true);
      return;
    }
    final meta = kSupportedDocumentTypes.where((t) => t.key == presetType).firstOrNull;
    final existing = presetType.isNotEmpty ? (docsByType[presetType] ?? []).firstOrNull : null;
    if (existing != null && meta != null && !meta.multi) {
      openEdit(existing, locked: true);
      return;
    }
    setState(() {
      _resetForm();
      formDocumentType = presetType;
      lockType = presetType.isNotEmpty;
      showForm = true;
    });
  }

  void openEdit(PropertyDocument doc, {bool locked = true}) {
    setState(() {
      formId = doc.id;
      formDocumentType = doc.documentType;
      formUploadedBy = doc.uploadedBy;
      _uploadedByController.text = doc.uploadedBy;
      formDocumentDate = DateTime.tryParse(doc.documentDate);
      formExpiryDate = DateTime.tryParse(doc.expiryDate);
      formNotes = doc.notes;
      _notesController.text = doc.notes;
      formExistingFileName = doc.fileName;
      formExistingPath = doc.path;
      selectedFile = null;
      lockType = locked;
      showForm = true;
    });
  }

  void backToList() {
    if (saving || deleting) return;
    FocusScope.of(context).unfocus();
    setState(() {
      showForm = false;
      _resetForm();
    });
  }

  
  Future<void> pickFile() async {
  final result = await FilePicker.pickFiles();
  if (result == null || result.files.isEmpty) return;
  setState(() => selectedFile = result.files.first);
}

  Future<void> _pickDate({required bool isDocDate}) async {
    final initial = isDocDate
        ? (formDocumentDate ?? DateTime.now())
        : (formExpiryDate ?? DateTime.now());
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(colorScheme: const ColorScheme.light(primary: PiColors.primary)),
        child: child!,
      ),
    );
    if (picked == null) return;
    setState(() {
      if (isDocDate) {
        formDocumentDate = picked;
      } else {
        formExpiryDate = picked;
      }
    });
  }

  Future<void> handleSave() async {
    if (saving || deleting) return;
    if (selectedProperty == null) {
      _notify('Please select a property first.', isError: true);
      return;
    }
    if (formDocumentType.isEmpty) {
      _notify('Please select a document type.', isError: true);
      return;
    }

    final companyID = await _getCompanyId();
    final userID = await _getUserId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    setState(() => saving = true);

    try {
      final url = Uri.parse('$kAseefaWebUrl/uploadPropertyDoc');
      final request = http.MultipartRequest('POST', url);

      request.fields['CompanyID'] = '$companyID';
      request.fields['PropertyID'] = '${selectedProperty!.id}';
      if (isEditing) request.fields['id'] = '$formId';
      request.fields['documentType'] = formDocumentType;
      request.fields['uploadedBy'] = _uploadedByController.text.trim().isEmpty
          ? '$userID'
          : _uploadedByController.text.trim();
      request.fields['documentDate'] = formDocumentDate != null
          ? _isoDate(formDocumentDate!)
          : _isoDate(DateTime.now());
      request.fields['expiryDate'] =
          formExpiryDate != null ? _isoDate(formExpiryDate!) : '';
      request.fields['notes'] = _notesController.text.trim();

      if (selectedFile != null && selectedFile!.path != null) {
        request.files
            .add(await http.MultipartFile.fromPath('file', selectedFile!.path!));
      }

      debugPrint('Saving Document → URL: $url');
      debugPrint('Saving Document → Fields: ${request.fields}');

      final streamed = await request.send();
      final response = await http.Response.fromStream(streamed);

      debugPrint('Save document → Status: ${response.statusCode}');

      final data = _decodeJsonBody(response.body, 'save document');

      if (!_isSuccess(data['success'])) {
        _notify(data['message'] ?? 'Document could not be saved.', isError: true);
        return;
      }

      final list = _documentsFrom(data);
      if (!mounted) return;
      setState(() {
        documents =
            list.map((e) => PropertyDocument.fromApi(Map<String, dynamic>.from(e))).toList();
      });

      _notify('Document saved successfully!');
      backToList();
    } catch (e) {
      debugPrint('Save document error: $e');
      _notify(_apiFailureMessage(e, 'save document'), isError: true);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> handleDelete() async {
    if (!isEditing || saving || deleting) return;
    if (selectedProperty == null) return;

    final companyID = await _getCompanyId();
    final userID = await _getUserId();
    if (companyID == 0) {
      _notify('CompanyID not found. Please login again.', isError: true);
      return;
    }

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (ctx) => _DeleteConfirmSheet(label: formExistingFileName.isNotEmpty
          ? formExistingFileName
          : formDocumentType),
    );
    if (confirmed != true) return;

    setState(() => deleting = true);

    try {
      final response = await http.post(
        Uri.parse('$kAseefaWebUrl/deletePropertyDoc'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'CompanyID': companyID,
          'PropertyID': selectedProperty!.id,
          'id': formId,
          'DeletedBy': userID,
        }),
      );

      final data = _decodeJsonBody(response.body, 'delete document');

      if (!_isSuccess(data['success'])) {
        _notify(data['message'] ?? 'Document could not be deleted.', isError: true);
        return;
      }

      final list = _documentsFrom(data);
      if (!mounted) return;
      setState(() {
        documents =
            list.map((e) => PropertyDocument.fromApi(Map<String, dynamic>.from(e))).toList();
      });

      _notify('Document deleted successfully!');
      backToList();
    } catch (e) {
      debugPrint('Delete document error: $e');
      _notify(_apiFailureMessage(e, 'delete document'), isError: true);
    } finally {
      if (mounted) setState(() => deleting = false);
    }
  }

  Future<void> openDocumentViewer(PropertyDocument doc) async {
    if (doc.path.isEmpty) return;
    final url = _documentUrl(doc.path);
    final ext = doc.fileName.contains('.') ? doc.fileName.split('.').last.toLowerCase() : '';
    final isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext);

    if (isImage) {
      if (!mounted) return;
      await showDialog(
        context: context,
        builder: (ctx) => Dialog(
          insetPadding: const EdgeInsets.all(16),
          backgroundColor: Colors.black,
          child: InteractiveViewer(
            child: Image.network(
              url,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) =>
                  const Padding(padding: EdgeInsets.all(24), child: Text('Unable to load image', style: TextStyle(color: Colors.white))),
            ),
          ),
        ),
      );
      return;
    }

    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      _notify('Could not open this file.', isError: true);
    }
  }

  String _isoDate(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  // ── UI ─────────────────────────────────────────────────────

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
            position: Tween<Offset>(begin: const Offset(0, .03), end: Offset.zero).animate(animation),
            child: child,
          ),
        ),
        child: selectedProperty == null
            ? _buildPropertyPicker(key: const ValueKey('doc_picker'))
            : showForm
                ? _buildForm(key: const ValueKey('doc_form'))
                : _buildDocumentGrid(key: const ValueKey('doc_grid')),
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
                const Text('Property Documents', style: PiText.screenTitle),
                const SizedBox(height: 2),
                Text(
                  loadingProperties ? 'Loading…' : 'Select a property to continue',
                  style: PiText.screenSubtitle,
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
                  : properties.isEmpty
                      ? _emptyState(
                          icon: Icons.apartment_outlined,
                          title: 'No properties found',
                          subtitle: 'No property information is available yet.',
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                          itemCount: properties.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) => _propertyOptionCard(properties[i]),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _propertyOptionCard(DocPropertyOption property) {
    return Material(
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
                child: const Icon(Icons.apartment_rounded, color: PiColors.primary, size: 22),
              ),
              const SizedBox(width: PiSpace.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(property.label, style: PiText.cardTitle, maxLines: 1, overflow: TextOverflow.ellipsis),
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

  Widget _buildDocumentGrid({Key? key}) {
    return Scaffold(
      key: key,
      backgroundColor: PiColors.background,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: loadingDocuments ? null : () => openCreate(),
        backgroundColor: PiColors.primary,
        icon: const Icon(Icons.cloud_upload_outlined),
        label: const Text('Upload document', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: Column(
        children: [
          _gridHeader(),
          Expanded(
            child: RefreshIndicator(
              color: PiColors.primary,
              onRefresh: loadDocuments,
              child: loadingDocuments
                  ? _loadingList()
                  : visibleTypes.isEmpty
                      ? _emptyState(
                          icon: Icons.folder_open_outlined,
                          title: 'No document categories match',
                          subtitle: 'Try adjusting your search or filters.',
                          onClearFilters: activeFilterCount > 0 ? clearFilters : null,
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                          itemCount: visibleTypes.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) => _docTypeCard(visibleTypes[i]),
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _gridHeader() {
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
                    const Text('Documents', style: PiText.screenTitle),
                    Text(selectedProperty?.label ?? '',
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: PiText.screenSubtitle),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.only(left: 6, right: 6),
            child: Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: coveragePct,
                      minHeight: 9,
                      backgroundColor: PiColors.primarySoft,
                      valueColor: const AlwaysStoppedAnimation(PiColors.primary),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Text('$coverageCount / ${kSupportedDocumentTypes.length}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: PiColors.primaryDark)),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Padding(
            padding: const EdgeInsets.only(left: 6),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => searchTerm = v),
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                isDense: true,
                hintText: 'Search document type or file name',
                hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
                prefixIcon: const Icon(Icons.search_rounded, color: PiColors.muted, size: 20),
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
                      title: 'Document status',
                      options: kDocStatusOptions,
                      selected: filterStatus,
                      onSelected: (v) => setState(() => filterStatus = v),
                    ),
                  ),
                  const SizedBox(width: PiSpace.sm),
                  _filterChip(
                    label: filterType ?? 'Type',
                    active: filterType != null,
                    onTap: () => _showPicker(
                      title: 'Document type',
                      options: kSupportedDocumentTypes.map((t) => t.key).toList(),
                      selected: filterType,
                      onSelected: (v) => setState(() => filterType = v),
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
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: active ? Colors.white : PiColors.ink)),
            const SizedBox(width: 3),
            Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: active ? Colors.white : PiColors.muted),
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
            Text(label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: PiColors.red)),
          ],
        ),
      ),
    );
  }

  Widget _docTypeCard(DocTypeMeta type) {
    final docs = docsByType[type.key] ?? [];
    final uploaded = docs.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(PiSpace.md),
      decoration: BoxDecoration(
        color: PiColors.surface,
        borderRadius: BorderRadius.circular(PiRadius.card),
        border: Border.all(color: PiColors.hairline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: PiColors.primarySoft, borderRadius: BorderRadius.circular(10)),
                child: Icon(type.icon, color: PiColors.primary, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(type.key, style: PiText.cardTitle),
                    Text(type.multi ? 'Multiple files supported' : 'Single file', style: PiText.cardMeta),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: uploaded ? PiColors.greenSoft : PiColors.accentSoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  uploaded ? 'Uploaded' : 'Missing',
                  style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: uploaded ? PiColors.green : PiColors.accent),
                ),
              ),
            ],
          ),
          const SizedBox(height: PiSpace.md),
          if (uploaded)
            ...docs.map((d) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(9),
                    onTap: () => openEdit(d, locked: !type.multi),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: PiColors.background,
                        borderRadius: BorderRadius.circular(9),
                        border: Border.all(color: PiColors.hairline),
                      ),
                      child: Row(
                        children: [
                          Icon(_fileIconFor(d.fileName), size: 16, color: PiColors.primaryMid),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(d.fileName.isEmpty ? 'Untitled file' : d.fileName,
                                    maxLines: 1, overflow: TextOverflow.ellipsis, style: PiText.cardMeta.copyWith(color: PiColors.ink, fontWeight: FontWeight.w600)),
                                if (d.documentDate.isNotEmpty || d.fileSizeLabel.isNotEmpty)
                                  Text(
                                    [
                                      if (d.fileSizeLabel.isNotEmpty) d.fileSizeLabel,
                                      if (d.documentDate.isNotEmpty) _fmtDisplayDate(d.documentDate),
                                    ].join(' · '),
                                    style: const TextStyle(fontSize: 10.5, color: PiColors.muted),
                                  ),
                              ],
                            ),
                          ),
                          if (d.path.isNotEmpty)
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.visibility_outlined, size: 18, color: PiColors.primary),
                              onPressed: () => openDocumentViewer(d),
                            ),
                        ],
                      ),
                    ),
                  ),
                ))
          else
            Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                border: Border.all(color: PiColors.hairline, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(9),
              ),
              alignment: Alignment.center,
              child: const Text('No file uploaded yet', style: TextStyle(fontSize: 12, color: PiColors.muted)),
            ),
          if (type.multi || !uploaded) ...[
            const SizedBox(height: 4),
            OutlinedButton.icon(
              onPressed: () => openCreate(type.key),
              icon: const Icon(Icons.add_rounded, size: 16),
              label: Text(uploaded ? 'Add another file' : 'Upload'),
              style: OutlinedButton.styleFrom(
                foregroundColor: PiColors.primary,
                side: const BorderSide(color: PiColors.primaryTint),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
              ),
            ),
          ],
        ],
      ),
    );
  }

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
                    icon: Icons.folder_outlined,
                    title: 'Document details',
                    subtitle: 'Choose the category and attach the file',
                    children: [
                      _pickerField(
                        label: 'Document Type',
                        value: formDocumentType,
                        placeholder: 'Select document type',
                        disabled: lockType,
                        onTap: () => _showPicker(
                          title: 'Document type',
                          options: kSupportedDocumentTypes.map((t) => t.key).toList(),
                          selected: formDocumentType,
                          allowClear: false,
                          onSelected: (v) => setState(() => formDocumentType = v ?? ''),
                        ),
                      ),
                      _textField(
                        label: 'Uploaded By',
                        controller: _uploadedByController,
                        placeholder: 'e.g. Ahmed Al Farsi',
                      ),
                      _dateField(
                        label: 'Document Date',
                        value: formDocumentDate,
                        onTap: () => _pickDate(isDocDate: true),
                      ),
                      _fileField(),
                    ],
                  ),
                  const SizedBox(height: PiSpace.lg),
                  _formSection(
                    icon: Icons.info_outline_rounded,
                    title: 'Additional details',
                    subtitle: 'Optional expiry tracking and notes',
                    children: [
                      _dateField(
                        label: 'Expiry Date',
                        value: formExpiryDate,
                        onTap: () => _pickDate(isDocDate: false),
                        hint: 'Applies to insurance, permits, and other renewable documents',
                      ),
                      _textField(
                        label: 'Notes',
                        controller: _notesController,
                        placeholder: 'e.g. Original title deed issued by Dubai Land Department.',
                        maxLines: 4,
                      ),
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
                          deleting ? 'Deleting…' : 'Delete this document',
                          style: const TextStyle(color: PiColors.red, fontWeight: FontWeight.w700),
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
                Text(isEditing ? 'Edit document' : 'Upload document',
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink)),
                Text(selectedProperty?.label ?? '',
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: PiText.screenSubtitle),
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
                decoration: BoxDecoration(color: PiColors.primarySoft, borderRadius: BorderRadius.circular(PiRadius.badge)),
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

  Widget _fieldLabel(String label) =>
      Padding(padding: const EdgeInsets.only(bottom: 6), child: Text(label.toUpperCase(), style: PiText.label));

  Widget _textField({
    required String label,
    required TextEditingController controller,
    String? placeholder,
    int maxLines = 1,
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
          style: const TextStyle(fontSize: 14, color: PiColors.ink),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(fontSize: 13, color: PiColors.muted),
            filled: true,
            fillColor: disabled ? const Color(0xFFF5F6FA) : PiColors.background,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(PiRadius.field), borderSide: BorderSide.none),
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
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
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
    String? hint,
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
                    hasValue ? '${value.day.toString().padLeft(2, '0')}/${value.month.toString().padLeft(2, '0')}/${value.year}' : 'Select date',
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
        if (hint != null) ...[
          const SizedBox(height: 4),
          Text(hint, style: const TextStyle(fontSize: 11, color: PiColors.muted)),
        ],
      ],
    );
  }

  Widget _fileField() {
    final disabled = saving || deleting;
    final displayName = selectedFile?.name ?? formExistingFileName;
    final sizeLabel = selectedFile != null ? _bytesToLabel(selectedFile!.size) : '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel('File'),
        InkWell(
          onTap: disabled ? null : pickFile,
          borderRadius: BorderRadius.circular(PiRadius.field),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              border: Border.all(color: PiColors.primaryTint, style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(PiRadius.field),
            ),
            child: Row(
              children: [
                Icon(
                  displayName.isNotEmpty ? _fileIconFor(displayName) : Icons.cloud_upload_outlined,
                  color: PiColors.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(displayName.isEmpty ? 'Tap to choose a file' : displayName,
                          maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: PiColors.ink)),
                      Text(sizeLabel.isNotEmpty ? sizeLabel : 'PDF, image, or video',
                          style: const TextStyle(fontSize: 11, color: PiColors.muted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        if (formExistingPath.isNotEmpty && selectedFile == null) ...[
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => openDocumentViewer(PropertyDocument(
              id: formId ?? 0,
              documentId: '',
              documentType: formDocumentType,
              fileName: formExistingFileName,
              fileSizeLabel: '',
              documentDate: '',
              expiryDate: '',
              uploadedBy: '',
              notes: '',
              path: formExistingPath,
            )),
            icon: const Icon(Icons.visibility_outlined, size: 16),
            label: const Text('View current file'),
            style: TextButton.styleFrom(foregroundColor: PiColors.primary),
          ),
        ],
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
            saving ? 'Saving…' : (isEditing ? 'Update document' : 'Save document'),
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
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(22))),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 4),
                width: 36,
                height: 4,
                decoration: BoxDecoration(color: PiColors.hairline, borderRadius: BorderRadius.circular(3)),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
                child: Row(children: [
                  Expanded(child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: PiColors.ink))),
                ]),
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

  Widget _pickerTile({required String label, required bool selected, required VoidCallback onTap}) {
    return ListTile(
      onTap: onTap,
      title: Text(label,
          style: TextStyle(fontSize: 14, color: selected ? PiColors.primary : PiColors.ink, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
      trailing: selected ? const Icon(Icons.check_rounded, color: PiColors.primary, size: 20) : null,
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
  }) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 60),
      children: [
        Icon(icon, size: 56, color: PiColors.primaryTint),
        const SizedBox(height: PiSpace.lg),
        Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: PiColors.ink)),
        const SizedBox(height: 6),
        Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4)),
        if (onClearFilters != null) ...[
          const SizedBox(height: 20),
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
          ),
        ],
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
                decoration: BoxDecoration(color: PiColors.hairline, borderRadius: BorderRadius.circular(3)),
              ),
            ),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(color: PiColors.redSoft, borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.delete_outline_rounded, color: PiColors.red, size: 26),
            ),
            const SizedBox(height: 14),
            const Text('Delete document?', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: PiColors.ink)),
            const SizedBox(height: 6),
            Text('"$label" will be permanently removed. This can\'t be undone.',
                style: const TextStyle(fontSize: 13, color: PiColors.muted, height: 1.4)),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.field)),
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
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(PiRadius.field)),
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

extension _FirstOrNullExt<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}