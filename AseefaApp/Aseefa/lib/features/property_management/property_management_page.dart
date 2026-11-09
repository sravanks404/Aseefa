import 'package:flutter/material.dart';

import 'dashboard_screen.dart';
import 'property_information_screen.dart';
import 'PropertyMaster.dart';
import 'property_specification_screen.dart';
import 'amenities_screen.dart';
import 'maintenance_screen.dart';
import 'occupancy_screen.dart';
import 'rental_info_screen.dart';
import 'utilities_screen.dart';
import 'ownership_screen.dart';
import 'document_screen.dart';
import 'financial_screen.dart';
import 'media_screen.dart';

class PropertyManagementPage extends StatelessWidget {
  const PropertyManagementPage({super.key});

  static const Color primary = Color.fromARGB(255, 35, 0, 196);
  static const Color primaryLight = Color(0xFF6F7FDB);
  static const Color bgColor = Color(0xFFF5F7FB);
  static const Color cardBg = Colors.white;
  static const Color textPrimary = Color(0xFF111827);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color borderColor = Color(0xFFE5E7EB);

  static const double radiusCard = 16;
  static const double radiusButton = 12;

  static const List<_PropertyMenuItem> menuItems = [
    _PropertyMenuItem('Dashboard', 'dashboard', Icons.dashboard_outlined),
    _PropertyMenuItem(
      'Property Information',
      'property_information',
      Icons.home_work_outlined,
    ),
    _PropertyMenuItem(
      'Property Master',
      'property_master',
      Icons.real_estate_agent_outlined,
    ),
    _PropertyMenuItem(
      'Property Specification',
      'property_specification',
      Icons.description_outlined,
    ),

    _PropertyMenuItem('Amenities', 'amenities', Icons.apartment_outlined),
    _PropertyMenuItem(
      'Utilities',
      'utilities',
      Icons.electrical_services_outlined,
    ),
    _PropertyMenuItem('Ownership', 'ownership', Icons.people_outline),
    _PropertyMenuItem('Occupancy', 'occupancy', Icons.groups_outlined),
    _PropertyMenuItem(
      'Tenants & Rentals',
      'rental_info',
      Icons.real_estate_agent_outlined,
    ),
    _PropertyMenuItem('Maintenance', 'maintenance', Icons.build_outlined),

    _PropertyMenuItem(
      'Financial',
      'financial',
      Icons.account_balance_wallet_outlined,
    ),

    _PropertyMenuItem('Document', 'document', Icons.folder_outlined),
    _PropertyMenuItem('Media', 'media', Icons.perm_media_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: bgColor,
        foregroundColor: textPrimary,
        centerTitle: false,
        title: const Text(
          'Property suite',
          style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            _buildHeader(context),
            const SizedBox(height: 22),
            _buildSection(
              context,
              'Portfolio',
              'Properties, units and core details',
              [
                'dashboard',
                'property_information',
                'property_master',
                'property_specification',
              ],
            ),
            const SizedBox(height: 20),
            _buildSection(
              context,
              'Leasing',
              'Tenant relationships and occupancy',
              ['rental_info', 'occupancy'],
            ),
            const SizedBox(height: 20),
            _buildSection(
              context,
              'Operations',
              'Ownership, services and records',
              [
                'amenities',
                'utilities',
                'ownership',
                'maintenance',
                'document',
                'financial',
                'media',
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [primary, Color(0xFF5746E8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(radiusCard),
        boxShadow: [
          BoxShadow(
            color: primary.withOpacity(0.15),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(.14),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withOpacity(.2)),
            ),
            child: const Text(
              'PROPERTY MANAGEMENT',
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.1,
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Manage your portfolio',
            style: TextStyle(
              color: Colors.white,
              fontSize: 23,
              height: 1.15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 7),
          const Text(
            'Properties, tenants and day-to-day operations in one place.',
            style: TextStyle(
              color: Color(0xFFDCD8FF),
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          const PropertyInformationScreen(openCreate: true),
                    ),
                  ),
                  icon: const Icon(Icons.add_home_work_outlined, size: 18),
                  label: const Text('Add property'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(color: Colors.white.withOpacity(.55)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    textStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () => openMenuItem(
                    context,
                    key: 'rental_info',
                    title: 'Tenants & Rentals',
                  ),
                  icon: const Icon(Icons.key_rounded, size: 18),
                  label: const Text('New rental'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: primary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    textStyle: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    String subtitle,
    List<String> keys,
  ) {
    final items = menuItems.where((item) => keys.contains(item.key)).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 3),
        Text(
          subtitle,
          style: const TextStyle(fontSize: 12, color: textSecondary),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          itemCount: items.length,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.38,
          ),
          itemBuilder: (context, index) =>
              _buildMenuCard(context, items[index]),
        ),
      ],
    );
  }

  Widget _buildMenuCard(BuildContext context, _PropertyMenuItem item) {
    return Material(
      color: cardBg,
      borderRadius: BorderRadius.circular(radiusCard),
      child: InkWell(
        borderRadius: BorderRadius.circular(radiusCard),
        onTap: () {
          openMenuItem(context, key: item.key, title: item.title);
        },
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radiusCard),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(item.icon, color: primary, size: 21),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: textPrimary,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Manage ${item.title.toLowerCase()}',
                      style: const TextStyle(
                        color: textSecondary,
                        fontSize: 10.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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

  static void openMenuItem(
    BuildContext context, {
    required String key,
    required String title,
  }) {
    Widget screen;

    switch (key) {
      case 'dashboard':
        screen = const DashboardScreen();
        break;

      case 'property_information':
        screen = const PropertyInformationScreen();
        break;

      case 'property_master':
        screen = const PropertyMasterPage();
        break;

      case 'property_specification':
        screen = const PropertySpecificationScreen();
        break;

      case 'amenities':
        screen = const AmenitiesScreen();
        break;

      case 'rental_info':
        screen = const RentalInformationScreen();
        break;
      case 'utilities':
        screen = const UtilitiesScreen();
        break;
      case 'ownership':
        screen = const PropertyOwnershipScreen();
        break;

      case 'occupancy':
        screen = const OccupancyScreen();
        break;

      case 'maintenance':
        screen = const MaintenanceScreen();
        break;

      case 'document':
        screen = const DocumentScreen();
        break;
      case 'financial':
        screen = const FinancialScreen();
        break;
      case 'media':
        screen = const MediaScreen();
        break;

      default:
        screen = PropertyManagementSubPage(title: title, sectionKey: key);
        break;
    }

    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }
}

class PropertyManagementSubPage extends StatelessWidget {
  const PropertyManagementSubPage({
    super.key,
    required this.title,
    required this.sectionKey,
  });

  final String title;
  final String sectionKey;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PropertyManagementPage.bgColor,
      appBar: AppBar(
        backgroundColor: PropertyManagementPage.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(
                PropertyManagementPage.radiusCard,
              ),
              border: Border.all(color: PropertyManagementPage.borderColor),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: PropertyManagementPage.primary.withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.construction_outlined,
                    color: PropertyManagementPage.primary,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: PropertyManagementPage.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'This section is ready for implementation.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: PropertyManagementPage.textSecondary,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: PropertyManagementPage.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          PropertyManagementPage.radiusButton,
                        ),
                      ),
                    ),
                    child: const Text(
                      'Go Back',
                      style: TextStyle(fontWeight: FontWeight.w600),
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
}

class _PropertyMenuItem {
  const _PropertyMenuItem(this.title, this.key, this.icon);

  final String title;
  final String key;
  final IconData icon;
}
