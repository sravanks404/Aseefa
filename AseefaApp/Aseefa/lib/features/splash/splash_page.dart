import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

import 'package:suitapps/features/auth/login/login_page.dart';
import 'package:suitapps/features/auth/dashboard/dashboard_page.dart';
import 'package:suitapps/shared/utils/responsive.dart';

class SuitappsSplashPage extends StatefulWidget {
  const SuitappsSplashPage({super.key});

  @override
  State<SuitappsSplashPage> createState() => _SuitappsSplashPageState();
}

class _SuitappsSplashPageState extends State<SuitappsSplashPage>
    with SingleTickerProviderStateMixin {
  static const Color brandBlue = Color(0xFF2300C4);

  late final AnimationController _controller;

  late final Animation<double> _logoOpacity;
  late final Animation<double> _logoScale;

  late final Animation<double> _copyOpacity;
  late final Animation<Offset> _copySlide;

  late final Animation<double> _poweredOpacity;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 6000),
    );

    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.05, 0.40, curve: Curves.easeOut),
      ),
    );

    _logoScale = Tween<double>(begin: 0.90, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.08, 0.55, curve: Curves.easeOutCubic),
      ),
    );

    _copyOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.45, 0.85, curve: Curves.easeOutQuart),
      ),
    );

    _copySlide =
        Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.45, 0.85, curve: Curves.easeOutQuart),
      ),
    );

    _poweredOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.72, 1.0, curve: Curves.easeOut),
      ),
    );

    _controller.forward();
    Future.delayed(const Duration(milliseconds: 7000), _goNext);
  }

  Future<void> _goNext() async {
    final prefs = await SharedPreferences.getInstance();

    final isLoggedIn = prefs.getBool('isLoggedIn') ?? false;
    final savedDate = prefs.getString('loginDate') ?? '';
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    if (isLoggedIn && savedDate == today) {
      final userStr = prefs.getString('user') ?? '{}';
      Map<String, dynamic> userDecoded;
      try {
        userDecoded = jsonDecode(userStr) as Map<String, dynamic>;
      } catch (_) {
        userDecoded = {};
      }

      final sessionId = prefs.getString('sessionId') ?? '';

      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) =>
              DashboardPage(userDecoded: userDecoded, sessionId: sessionId),
        ),
      );
      return;
    }

    await prefs.remove('isLoggedIn');
    await prefs.remove('loginDate');
    await prefs.remove('sessionId');
    await prefs.remove('user');

    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenW = Responsive.w(context);

    // ✅ Smooth responsive padding
    final double horizontalPad = Responsive.pad(context, 24.0);
    final double bottomPad = Responsive.pad(context, 24.0);

    // ✅ Auto logo width (percentage + clamp)
    final double logoMaxWidth = (screenW * 0.60).clamp(220.0, 340.0);

    final double gapAfterLogo = Responsive.pad(context, 45.0);
    final double gapTitleToSub = Responsive.pad(context, 10.0);

    // ✅ Smooth responsive font sizes
    final double titleSize = Responsive.font(context, 22.0);
    final double subTitleSize = Responsive.font(context, 16.0);
    final double smallTextSize = Responsive.font(context, 12.0);

    // ✅ Limit text line width for better readability (and prevents overflow)
    final double textMaxWidth = (screenW * 0.92).clamp(320.0, 520.0);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: horizontalPad),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const Spacer(flex: 18),

              // LOGO
              Center(
                child: FadeTransition(
                  opacity: _logoOpacity,
                  child: ScaleTransition(
                    scale: _logoScale,
                    child: ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: logoMaxWidth),
                      child: Image.asset(
                        'assets/images/sp-logo.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              ),

              SizedBox(height: gapAfterLogo),

              // TEXT
              Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: textMaxWidth),
                  child: FadeTransition(
                    opacity: _copyOpacity,
                    child: SlideTransition(
                      position: _copySlide,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            'Boost your field sales with SFA automation',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: brandBlue,
                              fontSize: titleSize,
                              fontWeight: FontWeight.w800,
                              height: 1.18,
                              letterSpacing: -0.2,
                            ),
                          ),
                          SizedBox(height: gapTitleToSub),
                          Text(
                            'Track visits, manage leads, and close faster all in SUITAPPS.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.black.withValues(alpha: 0.68),
                              fontSize: subTitleSize,
                              fontWeight: FontWeight.w600,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              const Spacer(flex: 22),

              // POWERED BY
              Padding(
                padding: EdgeInsets.only(bottom: bottomPad),
                child: Center(
                  child: FadeTransition(
                    opacity: _poweredOpacity,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          'Powered by',
                          style: TextStyle(
                            fontSize: smallTextSize,
                            color: Colors.grey,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: Responsive.pad(context, 4.0)),
                        Text(
                          'MICROTECH SOFTWARE SOLUTIONS',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: smallTextSize,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}