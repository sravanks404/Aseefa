import 'package:flutter/material.dart';

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
  static const Color blue = Color(0xFF2563EB);
  static const Color blueSoft = Color(0xFFE0ECFF);
  static const Color amber = Color(0xFFF59E0B);
  static const Color amberSoft = Color(0xFFFEF3DA);
  static const Color slate = Color(0xFF475569);
  static const Color slateSoft = Color(0xFFE2E8F0);
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
  static const pageTitle = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w800,
    color: PiColors.ink,
    height: 1.15,
  );

  static const pageSubtitle = TextStyle(
    fontSize: 13,
    color: PiColors.muted,
    fontWeight: FontWeight.w500,
  );

  static const screenTitle = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w800,
    color: PiColors.ink,
    height: 1.15,
  );

  static const screenSubtitle = TextStyle(
    fontSize: 13,
    color: PiColors.muted,
    fontWeight: FontWeight.w500,
  );

  static const sectionTitle = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: PiColors.primaryDark,
  );

  static const sectionSubtitle = TextStyle(fontSize: 12, color: PiColors.muted);

  static const cardTitle = TextStyle(
    fontSize: 15,
    fontWeight: FontWeight.w700,
    color: PiColors.ink,
  );

  static const cardMeta = TextStyle(
    fontSize: 12,
    color: PiColors.muted,
    fontWeight: FontWeight.w500,
  );

  static const label = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: .3,
    color: PiColors.primaryMid,
  );

  static const hint = TextStyle(
    fontSize: 11.5,
    color: PiColors.muted,
    fontWeight: FontWeight.w500,
  );
}