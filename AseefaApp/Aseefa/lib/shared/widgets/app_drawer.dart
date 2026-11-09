import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:suitapps/shared/utils/responsive.dart';
import 'package:suitapps/features/auth/profile/profile_page.dart';
import 'package:suitapps/features/auth/settings/settings_page.dart';
import 'package:suitapps/features/costEstimation/cost_estimation.dart';
import 'package:suitapps/features/customer/existing_customers_page.dart';
import 'package:suitapps/features/property_management/property_management_page.dart';
import 'package:suitapps/features/property_management/rental_info_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key, required this.onLogout, this.profileUrl});

  final String? profileUrl;
  final VoidCallback onLogout;

  Future<_DrawerUserData> _loadUserData() async {
    final prefs = await SharedPreferences.getInstance();

    final name = (prefs.getString('Name') ?? '').trim();
    final role = (prefs.getString('UserRoleName') ?? '').trim();
    final company = (prefs.getString('SelectedCompanyName') ?? '').trim();

    final loginDate = (prefs.getString('loginDate') ?? '').trim();
    final loginTime = (prefs.getString('loginTime') ?? '').trim();

    String loginText = '';
    if (loginDate.isNotEmpty && loginTime.isNotEmpty) {
      loginText = "$loginDate • $loginTime";
    } else if (loginDate.isNotEmpty) {
      loginText = loginDate;
    }

    String versionText = '';
    try {
      final info = await PackageInfo.fromPlatform();
      versionText = "v${info.version} (${info.buildNumber})";
    } catch (_) {}

    return _DrawerUserData(
      name: name.isEmpty ? "User" : name,
      role: role,
      company: company,
      loginText: loginText,
      versionText: versionText,
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenW = Responsive.w(context);

    // ✅ Auto drawer width (no breakpoints)
    final double drawerW = (screenW * 0.78).clamp(280.0, 380.0);

    final double pad = Responsive.pad(context, 16);
    final double logoH = Responsive.scale(context, 44);
    final double sectionGap = Responsive.pad(context, 14);

    return Drawer(
      width: drawerW,
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(pad),
          child: FutureBuilder<_DrawerUserData>(
            future: _loadUserData(),
            builder: (context, snap) {
              final d =
                  snap.data ??
                  const _DrawerUserData(
                    name: "User",
                    role: "",
                    company: "",
                    loginText: "",
                    versionText: "",
                  );

              final String nameWithRole = (d.role.trim().isNotEmpty)
                  ? "${d.name} (${d.role})"
                  : d.name;

              return Column(
                children: [
                  // LOGO
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Image.asset(
                      "assets/images/sp-logo.png",
                      height: logoH,
                    ),
                  ),

                  SizedBox(height: sectionGap),
                  Divider(height: Responsive.scale(context, 1)),
                  SizedBox(height: Responsive.pad(context, 8)),

                  // MENU
                  Expanded(
                    child: ListView(
                      padding: EdgeInsets.zero,
                      children: [
                        _drawerItem(
                          context,
                          icon: Icons.home_rounded,
                          title: "Home",
                          onTap: () => Navigator.pop(context),
                        ),
                        ExpansionTile(
                          leading: Icon(
                            Icons.people_rounded,
                            color: Colors.black87,
                          ),
                          title: const Text("Customer list"),
                          children: [

                            // Customer List
                            // ListTile(
                            //   dense: true,
                            //   leading: const Icon(Icons.list_alt),
                            //   title: const Text("Customer List"),
                            //   onTap: () {
                            //     Navigator.pop(context);

                            //     Navigator.push(
                            //       context,
                            //       MaterialPageRoute(
                            //         builder: (_) => const CustomerListPage(),
                            //       ),
                            //     );
                            //   },
                            // ),
                            // Existing Customers
                            ListTile(
                              dense: true,
                              leading: const Icon(Icons.people_alt_rounded),
                              title: const Text("Existing Customers"),
                              onTap: () {
                                Navigator.pop(context);

                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) =>
                                        const ExistingCustomersPage(),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                        ListTile(
                          leading: const Icon(
                            Icons.key_rounded,
                            color: Colors.black87,
                          ),
                          title: const Text("Rental management"),
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const RentalRegistrationScreen(),
                              ),
                            );
                          },
                        ),
                        ExpansionTile(
                          leading: const Icon(
                            Icons.real_estate_agent_rounded,
                            color: Colors.black87,
                          ),
                          title: const Text("Property Management"),
                          children: [
                            ...PropertyManagementPage.menuItems.map((item) {
                              return ListTile(
                                dense: true,
                                leading: const Icon(Icons.arrow_right_rounded),
                                title: Text(item.title),
                                onTap: () {
                                  Navigator.pop(context);
                                  PropertyManagementPage.openMenuItem(
                                    context,
                                    key: item.key,
                                    title: item.title,
                                  );
                                },
                              );
                            }),
                          ],
                        ),
                        _drawerItem(
                          context,
                          icon: Icons.receipt_long_rounded,
                          title: "Orders",
                          onTap: () => Navigator.pop(context),
                        ),
                        _drawerItem(
                          context,
                          icon: Icons.bar_chart_rounded,
                          title: "Reports",
                          onTap: () => Navigator.pop(context),
                        ),
                        _drawerItem(
                          context,
                          icon: Icons.description_rounded,
                          title: "Invoices",
                          onTap: () => Navigator.pop(context),
                        ),
                        ExpansionTile(
                          leading: const Icon(
                            Icons.person_rounded,
                            color: Colors.black87,
                          ),
                          title: const Text("Profile"),
                          children: [
                            ListTile(
                              dense: true,
                              leading: const Icon(Icons.account_circle_outlined),
                              title: const Text("My Profile"),
                              onTap: () {
                                Navigator.pop(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const ProfilePage(),
                                  ),
                                );
                              },
                            ),
                            ListTile(
                              dense: true,
                              leading: const Icon(Icons.calculate_outlined),
                              title: const Text("Cost Estimation"),
                              onTap: () {
                                Navigator.pop(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => const CostEstimationPage(),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                        _drawerItem(
                          context,
                          icon: Icons.settings_rounded,
                          title: "Settings",
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const SettingsPage(),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  Divider(height: Responsive.scale(context, 1)),
                  SizedBox(height: Responsive.pad(context, 10)),

                  // PROFILE SECTION
                  Row(
                    children: [
                      _profileAvatar(context),
                      SizedBox(width: Responsive.pad(context, 10)),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              nameWithRole,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: Responsive.font(context, 14),
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            if (d.company.isNotEmpty) ...[
                              SizedBox(height: Responsive.pad(context, 2)),
                              Text(
                                d.company,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: Responsive.font(context, 11.5),
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black54,
                                ),
                              ),
                            ],
                            if (d.loginText.isNotEmpty) ...[
                              SizedBox(height: Responsive.pad(context, 2)),
                              Text(
                                "Logged in: ${d.loginText}",
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: Responsive.font(context, 11.0),
                                  fontWeight: FontWeight.w700,
                                  color: Colors.black45,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),

                  SizedBox(height: Responsive.pad(context, 12)),

                  // LOGOUT BUTTON
                  SizedBox(
                    width: double.infinity,
                    height: Responsive.scale(context, 46),
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                            Responsive.radius(context, 14),
                          ),
                        ),
                        elevation: 0,
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        onLogout();
                      },
                      icon: Icon(
                        Icons.logout_rounded,
                        size: Responsive.scale(context, 18),
                      ),
                      label: Text(
                        "Logout",
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: Responsive.font(context, 13.5),
                        ),
                      ),
                    ),
                  ),

                  SizedBox(height: Responsive.pad(context, 10)),

                  // FOOTER
                  Column(
                    children: [
                      Text(
                        "MICROTECH SOFTWARE SOLUTIONS",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: Responsive.font(context, 10.8),
                          fontWeight: FontWeight.w800,
                          color: Colors.black,
                        ),
                      ),
                      SizedBox(height: Responsive.pad(context, 4)),
                      if (d.versionText.isNotEmpty)
                        Text(
                          d.versionText,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: Responsive.font(context, 10.8),
                            fontWeight: FontWeight.w700,
                            color: Colors.black45,
                          ),
                        ),
                    ],
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _profileAvatar(BuildContext context) {
    final double size = Responsive.scale(context, 46);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: const Color(0xFFEAF0FF),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
      ),
      child: ClipOval(
        child: (profileUrl != null && profileUrl!.trim().isNotEmpty)
            ? Image.network(
                profileUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Icon(
                  Icons.person_rounded,
                  size: Responsive.scale(context, 22),
                  color: const Color(0xFF2300C4),
                ),
              )
            : Icon(
                Icons.person_rounded,
                size: Responsive.scale(context, 22),
                color: const Color(0xFF2300C4),
              ),
      ),
    );
  }

  Widget _drawerItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      contentPadding: EdgeInsets.symmetric(
        horizontal: Responsive.pad(context, 6),
      ),
      leading: Icon(
        icon,
        color: Colors.black87,
        size: Responsive.scale(context, 22),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontSize: Responsive.font(context, 13.8),
          fontWeight: FontWeight.w800,
          color: Colors.black,
        ),
      ),
      onTap: onTap,
      dense: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Responsive.radius(context, 12)),
      ),
    );
  }
}

class _DrawerUserData {
  final String name;
  final String role;
  final String company;
  final String loginText;
  final String versionText;

  const _DrawerUserData({
    required this.name,
    required this.role,
    required this.company,
    required this.loginText,
    required this.versionText,
  });
}
