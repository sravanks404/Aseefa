import 'package:flutter/material.dart';
import 'features/property_management/property_management_page.dart';
import 'features/splash/splash_page.dart';

void main() => runApp(const SuitAppsApp());

class SuitAppsApp extends StatelessWidget {
  const SuitAppsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Suitapps',
      theme: ThemeData(useMaterial3: true),
      initialRoute: '/splash',
      routes: {
        '/splash': (_) => const SuitappsSplashPage(),
        '/property-management': (_) => const PropertyManagementPage(),
      },
    );
  }
}
