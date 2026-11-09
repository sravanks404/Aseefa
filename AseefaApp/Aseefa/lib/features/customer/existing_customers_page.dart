import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suitapps/features/customer/ClientRequirementPage.dart';

import '../../config/api_config.dart';
import 'package:url_launcher/url_launcher.dart';

class ExistingCustomersPage extends StatefulWidget {
  const ExistingCustomersPage({super.key});

  @override
  State<ExistingCustomersPage> createState() => _ExistingCustomersPageState();
}

class _ExistingCustomersPageState extends State<ExistingCustomersPage>
    with TickerProviderStateMixin {
  // ── DESIGN TOKENS ──────────────────────────────────────────────
  static const Color primary = Color(0xFF1433C3);
  static const Color primaryLight = Color(0xFF6F7FDB);
  static const Color bgColor = Color(0xFFF5F7FB);
  static const Color cardBg = Colors.white;
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color borderColor = Color(0xFFE5E7EB);
  static const Color success = Color(0xFF16A34A);

  // Spacing
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;

  // Radius
  static const double radiusCard = 16;
  static const double radiusBadge = 16;
  static const double radiusAvatar = 12;

  List clients = [];
  bool loading = true;
  String searchQuery = '';
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    getClients();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> getClients() async {
    setState(() => loading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      int companyId = int.tryParse(prefs.getString('CompanyID') ?? "0") ?? 0;

      // final url = Uri.parse(
      //   "${ApiConfig.baseUrl}${ApiConfig.getClientDetails}?CompanyId=$companyId",
      // );
      // final response = await http
      //     .get(url, headers: {"Accept": "application/json"})
      final url = Uri.parse(
        "${ApiConfig.baseUrl}${ApiConfig.getClientDetails}?CompanyId=$companyId",
      );

      final response = await http
          .get(url, headers: {"Accept": "application/json"})
          .timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        if (result["success"] == true) {
          setState(() {
            clients = result["data"];
            for (var c in clients) {
              if (c["ContactPersons"] is String) {
                c["ContactPersons"] = jsonDecode(c["ContactPersons"]);
              }
            }
          });
          _fadeController.forward(from: 0);
        }
      }
    } catch (e) {
      debugPrint("CLIENT ERROR $e");
    } finally {
      setState(() => loading = false);
    }
  }

  Uint8List? decodeImage(String? img) {
    if (img == null || img.isEmpty) return null;
    try {
      return base64Decode(img.split(",").last);
    } catch (_) {
      return null;
    }
  }

  List get filteredClients {
    if (searchQuery.isEmpty) return clients;
    final q = searchQuery.toLowerCase();
    return clients.where((c) {
      return (c["CompanyName"] ?? "").toLowerCase().contains(q) ||
          (c["Email"] ?? "").toLowerCase().contains(q) ||
          (c["Phone"] ?? "").toLowerCase().contains(q) ||
          (c["ProjectLocation"] ?? "").toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            _buildSearchBar(),
            _buildCountBadge(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  // ── HEADER ──────────────────────────────────────────────────────
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(lg, lg, lg, sm),
      child: Row(
        children: [
          // Back button
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                size: 16,
                color: textPrimary,
              ),
            ),
          ),
          const SizedBox(width: md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  "Clients",
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
                Text(
                  "Existing accounts",
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: textSecondary,
                  ),
                ),
              ],
            ),
          ),
          // Refresh icon
          GestureDetector(
            onTap: getClients,
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: primary,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: primary.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.refresh_rounded,
                size: 20,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── SEARCH BAR ──────────────────────────────────────────────────
  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: lg, vertical: sm),
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: borderColor),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: TextField(
          onChanged: (v) => setState(() => searchQuery = v),
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: textPrimary,
          ),
          decoration: InputDecoration(
            hintText: "Search by name, email, location…",
            hintStyle: const TextStyle(color: textSecondary, fontSize: 14),
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: textSecondary,
              size: 20,
            ),
            suffixIcon: searchQuery.isNotEmpty
                ? GestureDetector(
                    onTap: () => setState(() => searchQuery = ''),
                    child: const Icon(
                      Icons.close_rounded,
                      color: textSecondary,
                      size: 18,
                    ),
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: md,
              vertical: md,
            ),
          ),
        ),
      ),
    );
  }

  // ── COUNT BADGE ─────────────────────────────────────────────────
  Widget _buildCountBadge() {
    if (loading) return const SizedBox(height: sm);
    final count = filteredClients.length;
    return Padding(
      padding: const EdgeInsets.fromLTRB(lg, xs, lg, sm),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: md, vertical: xs),
            decoration: BoxDecoration(
              color: primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(radiusBadge),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.people_alt_rounded, size: 13, color: primary),
                const SizedBox(width: 4),
                Text(
                  "$count ${count == 1 ? 'Client' : 'Clients'}",
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── BODY ────────────────────────────────────────────────────────
  Widget _buildBody() {
    if (loading) {
      return const Center(
        child: CircularProgressIndicator(color: primary, strokeWidth: 2.5),
      );
    }

    final list = filteredClients;

    if (list.isEmpty) {
      return _buildEmptyState();
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: RefreshIndicator(
        onRefresh: getClients,
        color: primary,
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(lg, 0, lg, xxl),
          itemCount: list.length,
          itemBuilder: (context, index) {
            return _CustomerCard(
              data: list[index],
              decodeImage: decodeImage,
              index: index,
            );
          },
        ),
      ),
    );
  }

  // ── EMPTY STATE ─────────────────────────────────────────────────
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              Icons.people_outline_rounded,
              size: 36,
              color: primary,
            ),
          ),
          const SizedBox(height: lg),
          const Text(
            "No customers found",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: xs),
          const Text(
            "Try adjusting your search",
            style: TextStyle(fontSize: 13, color: textSecondary),
          ),
        ],
      ),
    );
  }
}

// ── CUSTOMER CARD ────────────────────────────────────────────────
class _CustomerCard extends StatefulWidget {
  final Map data;
  final Uint8List? Function(String?) decodeImage;
  final int index;

  const _CustomerCard({
    required this.data,
    required this.decodeImage,
    required this.index,
  });

  @override
  State<_CustomerCard> createState() => _CustomerCardState();
}

class _CustomerCardState extends State<_CustomerCard>
    with SingleTickerProviderStateMixin {
  static const Color primary = Color(0xFF1433C3);
  static const Color primaryLight = Color(0xFF6F7FDB);
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color borderColor = Color(0xFFE5E7EB);
  static const Color cardBg = Colors.white;
  static const Color success = Color(0xFF16A34A);

  //   void _openClientDetails() {
  //   Navigator.push(
  //     context,
  //     MaterialPageRoute(
  //       builder: (_) => clientRequirementPage(
  //         client: widget.data,
  //       ),
  //     ),
  //   );
  // }
  // void _openClientDetails() {
  //   Navigator.push(
  //     context,
  //     MaterialPageRoute(
  //       builder: (_) => ClientRequirementPage(
  //         client: widget.data,
  //       ),
  //     ),
  //   );
  // }
  void _openClientDetails() {
    final c = widget.data;

    final safeClient = {
      "ClientID": c["ClientID"] ?? c["AccountID"],
      "AccountID": c["AccountID"] ?? c["ClientID"],
      "CompanyName": c["CompanyName"] ?? "",
    };

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ClientRequirementPage(client: safeClient),
      ),
    );
  }

  Future<void> _openLocation() async {
    final c = widget.data;

    final lat = c["Latitude"];
    final lng = c["Longitude"];

    if (lat == null || lng == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Location not available")));
      return;
    }

    final Uri googleMapUrl = Uri.parse("google.navigation:q=$lat,$lng");

    final Uri browserUrl = Uri.parse(
      "https://www.google.com/maps/search/?api=1&query=$lat,$lng",
    );

    try {
      if (await launchUrl(googleMapUrl, mode: LaunchMode.externalApplication)) {
        return;
      }

      await launchUrl(browserUrl, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint("MAP ERROR $e");

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Unable to open Google Maps")),
      );
    }
  }

  bool _expanded = false;
  late AnimationController _ctrl;
  late Animation<double> _expandAnim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _expandAnim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _toggle() {
    setState(() => _expanded = !_expanded);
    _expanded ? _ctrl.forward() : _ctrl.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.data;
    final image = widget.decodeImage(c["Image"]);
    final contacts = c["ContactPersons"] as List? ?? [];
    final remark = (c["Remark"] ?? "").toString();
    final hasExtra = contacts.isNotEmpty || remark.isNotEmpty;

    return GestureDetector(
      // onTap: hasExtra ? _toggle : null,
      onTap: _openClientDetails,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _expanded ? primary.withOpacity(0.25) : borderColor,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            // ── MAIN ROW ───────────────────────────────────────
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar
                  _buildAvatar(image, c["CompanyName"]),
                  const SizedBox(width: 14),

                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Company name
                        Text(
                          c["CompanyName"] ?? "",
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 6),

                        // Email
                        if ((c["Email"] ?? "").toString().isNotEmpty)
                          _InfoRow(
                            icon: Icons.email_outlined,
                            text: c["Email"],
                          ),

                        // Phone
                        if ((c["Phone"] ?? "").toString().isNotEmpty)
                          _InfoRow(
                            icon: Icons.phone_outlined,
                            text: c["Phone"],
                          ),

                        // Location
                        if ((c["ProjectLocation"] ?? "").toString().isNotEmpty)
                          _InfoRow(
                            icon: Icons.location_on_outlined,
                            text: c["ProjectLocation"],
                          ),
                      ],
                    ),
                  ),

                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // LOCATION ICON
                      if (c["Latitude"] != null && c["Longitude"] != null)
                        GestureDetector(
                          onTap: _openLocation,
                          child: Container(
                            width: 30,
                            height: 30,
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.location_on_rounded,
                              size: 18,
                              color: Colors.red,
                            ),
                          ),
                        ),

                      if (hasExtra)
                        GestureDetector(
                          onTap: _toggle,
                          child: AnimatedRotation(
                            turns: _expanded ? 0.5 : 0,
                            duration: const Duration(milliseconds: 250),
                            child: Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: _expanded
                                    ? primary.withOpacity(0.08)
                                    : const Color(0xFFF5F7FB),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                Icons.keyboard_arrow_down_rounded,
                                size: 18,
                                color: _expanded ? primary : textSecondary,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            // ── EXPANDED SECTION ───────────────────────────────
            SizeTransition(
              sizeFactor: _expandAnim,
              child: Column(
                children: [
                  Divider(height: 1, color: borderColor),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Remark
                        if (remark.isNotEmpty) ...[
                          _SectionLabel(label: "Visit Remark"),
                          const SizedBox(height: 4),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: primary.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              remark,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: primary,
                              ),
                            ),
                          ),
                          if (contacts.isNotEmpty) const SizedBox(height: 12),
                        ],

                        // Contact persons
                        if (contacts.isNotEmpty) ...[
                          _SectionLabel(label: "Contact Persons"),
                          const SizedBox(height: 6),
                          ...contacts.map((p) => _ContactPersonTile(person: p)),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Avatar with initials fallback
  Widget _buildAvatar(Uint8List? image, String? name) {
    final initials = _initials(name);
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: image == null
            ? LinearGradient(
                colors: [primary, const Color(0xFF6F7FDB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: image != null
            ? Image.memory(image, fit: BoxFit.cover)
            : Center(
                child: Text(
                  initials,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
      ),
    );
  }

  String _initials(String? name) {
    if (name == null || name.isEmpty) return "?";
    final parts = name.trim().split(" ");
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return "${parts[0][0]}${parts[1][0]}".toUpperCase();
  }
}

// ── SMALL WIDGETS ────────────────────────────────────────────────

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String? text;
  const _InfoRow({required this.icon, required this.text});

  static const Color textSecondary = Color(0xFF6B7280);

  @override
  Widget build(BuildContext context) {
    if (text == null || text!.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 3),
      child: Row(
        children: [
          Icon(icon, size: 13, color: textSecondary),
          const SizedBox(width: 5),
          Expanded(
            child: Text(
              text!,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w400,
                color: textSecondary,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label.toUpperCase(),
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        color: Color(0xFF6B7280),
        letterSpacing: 0.8,
      ),
    );
  }
}

class _ContactPersonTile extends StatelessWidget {
  final Map person;
  const _ContactPersonTile({required this.person});

  static const Color primary = Color(0xFF1433C3);
  static const Color borderColor = Color(0xFFE5E7EB);

  Future<void> _makeCall(BuildContext context) async {
    final number = person["ContactNumber"]?.toString();

    if (number == null || number.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Phone number not available")),
      );
      return;
    }

    final Uri url = Uri.parse("tel:$number");

    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FB),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor),
      ),

      child: Row(
        children: [
          // Person icon
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.person_outline_rounded,
              size: 16,
              color: primary,
            ),
          ),

          const SizedBox(width: 10),

          // Contact details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  person["ContactPerson"] ?? "",
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF111827),
                  ),
                ),

                Text(
                  person["ContactNumber"] ?? "",
                  style: const TextStyle(
                    fontSize: 12,
                    color: primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),

          // CALL BUTTON
          GestureDetector(
            onTap: () => _makeCall(context),
            child: Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.call, size: 18, color: Colors.green),
            ),
          ),
        ],
      ),
    );
  }
}
