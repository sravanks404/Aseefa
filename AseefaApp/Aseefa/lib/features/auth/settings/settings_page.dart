import 'package:flutter/material.dart';
import 'package:suitapps/shared/utils/responsive.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Settings"),
        backgroundColor: const Color(0xFF2300C4),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.all(Responsive.pad(context, 16)),
          children: [
            _tile(
              context,
              icon: Icons.lock_outline,
              title: "Change Password",
              onTap: () {},
            ),
            _tile(
              context,
              icon: Icons.notifications_none_rounded,
              title: "Notifications",
              onTap: () {},
            ),
            _tile(
              context,
              icon: Icons.info_outline_rounded,
              title: "About",
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: EdgeInsets.only(bottom: Responsive.pad(context, 10)),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F7FF),
        borderRadius: BorderRadius.circular(Responsive.radius(context, 14)),
        border: Border.all(color: Colors.black.withValues(alpha: 0.06)),
      ),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF2300C4)),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w900,
            fontSize: Responsive.font(context, 13.8),
          ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: onTap,
      ),
    );
  }
}
