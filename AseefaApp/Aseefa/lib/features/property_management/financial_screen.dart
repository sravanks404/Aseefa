import 'package:flutter/material.dart';

class FinancialScreen extends StatelessWidget {
  const FinancialScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Financial')),
      body: const Center(
        child: Text('Financial Screen - mock initialized'),
      ),
    );
  }
}
