// import 'dart:convert';

// import 'package:fl_chart/fl_chart.dart';
// import 'package:flutter/material.dart';
// import 'package:http/http.dart' as http;
// import 'package:intl/intl.dart';
// import 'package:shared_preferences/shared_preferences.dart';

// import 'package:suitapps/config/api_config.dart';

// class ChartDataScreen extends StatefulWidget {
//   const ChartDataScreen({super.key});

//   @override
//   State<ChartDataScreen> createState() => _ChartDataScreenState();
// }

// class _ChartDataScreenState extends State<ChartDataScreen> {
//   List<FlSpot> spots = [];
//   List<String> labels = [];

//   bool loading = true;

//   DateTime fromDate = DateTime.now().subtract(const Duration(days: 9));

//   DateTime toDate = DateTime.now();

//   @override
//   void initState() {
//     super.initState();
//     loadChart();
//   }

//   Future<void> loadChart() async {
//     setState(() {
//       loading = true;
//     });

//     try {
//       final prefs = await SharedPreferences.getInstance();

//       final userId = prefs.getInt("UserId")?.toString() ?? "";

//       final url =
//           Uri.parse(
//             "${ApiConfig.baseUrl}"
//             "${ApiConfig.chartData}",
//           ).replace(
//             queryParameters: {
//               "createdBy": userId,

//               "fromDate": DateFormat("yyyy-MM-dd").format(fromDate),

//               "toDate": DateFormat("yyyy-MM-dd").format(toDate),
//             },
//           );

//       debugPrint("Chart URL: $url");

//       final response = await http.get(url);

//       if (response.statusCode == 200) {
//         final json = jsonDecode(response.body);

//         // final List data = json["chart"] ?? [];
//         final List data =
//     json["data"] ?? [];

//         List<FlSpot> tempSpots = [];
//         List<String> tempLabels = [];

//         for (int i = 0; i < data.length; i++) {
//           final item = data[i];

//           DateTime date;

//           try {
//             date = DateTime.parse(item["CreatedDate"]);
//           } catch (_) {
//             continue;
//           }

//           // final value = int.tryParse(item["Count"].toString()) ?? 0;
//           final value =
//     (item["ClientCount"] ?? 0) +
//     (item["RequirementCount"] ?? 0);

//           tempSpots.add(FlSpot(i.toDouble(), value.toDouble()));

//           tempLabels.add(DateFormat("dd MMM").format(date));
//         }

//         setState(() {
//           spots = tempSpots;
//           labels = tempLabels;
//         });
//       }
//     } catch (e) {
//       debugPrint("Chart error $e");
//     }

//     setState(() {
//       loading = false;
//     });
//   }

//   Future<void> selectFromDate() async {
//     final picked = await showDatePicker(
//       context: context,

//       initialDate: fromDate,

//       firstDate: DateTime(2024),

//       lastDate: DateTime.now(),
//     );

//     if (picked != null) {
//       setState(() {
//         fromDate = picked;
//       });

//       loadChart();
//     }
//   }

//   Future<void> selectToDate() async {
//     final picked = await showDatePicker(
//       context: context,

//       initialDate: toDate,

//       firstDate: DateTime(2024),

//       lastDate: DateTime.now(),
//     );

//     if (picked != null) {
//       setState(() {
//         toDate = picked;
//       });

//       loadChart();
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Container(
//       padding: const EdgeInsets.all(16),

//       decoration: BoxDecoration(
//         color: Colors.white,

//         borderRadius: BorderRadius.circular(22),

//         boxShadow: const [BoxShadow(blurRadius: 18, color: Colors.black12)],
//       ),

//       child: Column(
//         children: [
//           Row(
//             children: [
//               Expanded(
//                 child: InkWell(
//                   onTap: selectFromDate,

//                   child: Text(
//                     "From\n${DateFormat("dd-MM-yyyy").format(fromDate)}",

//                     style: const TextStyle(fontWeight: FontWeight.bold),
//                   ),
//                 ),
//               ),

//               Expanded(
//                 child: InkWell(
//                   onTap: selectToDate,

//                   child: Text(
//                     "To\n${DateFormat("dd-MM-yyyy").format(toDate)}",

//                     style: const TextStyle(fontWeight: FontWeight.bold),
//                   ),
//                 ),
//               ),
//             ],
//           ),

//           const SizedBox(height: 20),

//           SizedBox(
//             height: 220,

//             child: loading
//                 ? const Center(child: CircularProgressIndicator())
//                 : spots.isEmpty
//                 ? const Center(
//                     child: Text(
//                       "No data",
//                       style: TextStyle(fontWeight: FontWeight.bold),
//                     ),
//                   )
//                 : LineChart(chartData()),
//           ),
//         ],
//       ),
//     );
//   }

//   LineChartData chartData() {
//     return LineChartData(
//       minX: 0,

//       maxX: spots.length.toDouble() - 1,

//       minY: 0,

//       maxY: maxValue(),

//       borderData: FlBorderData(show: false),

//       gridData: const FlGridData(show: true),

//       titlesData: FlTitlesData(
//         topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),

//         rightTitles: const AxisTitles(
//           sideTitles: SideTitles(showTitles: false),
//         ),

//         bottomTitles: AxisTitles(
//           sideTitles: SideTitles(
//             showTitles: true,

//             interval: 1,

//             getTitlesWidget: (value, meta) {
//               int i = value.toInt();

//               if (i >= labels.length) {
//                 return const SizedBox();
//               }

//               return Text(labels[i], style: const TextStyle(fontSize: 10));
//             },
//           ),
//         ),
//       ),

//       lineBarsData: [
//         LineChartBarData(
//           spots: spots,

//           isCurved: true,

//           barWidth: 3,

//           color: Colors.blue,

//           dotData: const FlDotData(show: true),
//         ),
//       ],
//     );
//   }

//   double maxValue() {
//     double max = 0;

//     for (final item in spots) {
//       if (item.y > max) {
//         max = item.y;
//       }
//     }

//     return max == 0 ? 10 : max * 1.2;
//   }
// }

import 'dart:convert';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:suitapps/config/api_config.dart';

class ChartDataScreen extends StatefulWidget {
  const ChartDataScreen({super.key});

  @override
  State<ChartDataScreen> createState() => _ChartDataScreenState();
}

/// Holds one parsed data point from the API response.
class _ChartPoint {
  final DateTime date;
  final double clientCount;
  final double supplierCount;
  final double requirementCount;

  _ChartPoint({
    required this.date,
    required this.clientCount,
    required this.supplierCount,
    required this.requirementCount,
  });
}

/// Small config object so each line's color/label/data live in one place
/// instead of being repeated across chartData(), legend, and tooltip.
class _SeriesConfig {
  final String label;
  final Color color;
  final List<FlSpot> spots;

  _SeriesConfig({
    required this.label,
    required this.color,
    required this.spots,
  });
}

class _ChartDataScreenState extends State<ChartDataScreen> {
  List<_ChartPoint> points = [];
  List<String> labels = [];

  bool loading = true;
  String? errorMessage;

  static final DateTime _defaultFrom =
      DateTime.now().subtract(const Duration(days: 9));
  static final DateTime _defaultTo = DateTime.now();

  DateTime fromDate = _defaultFrom;
  DateTime toDate = _defaultTo;

  // Series colors centralized here so the legend, lines, and tooltip
  // never fall out of sync with each other.
  static const Color _clientColor = Color(0xFF2563EB); // blue
  static const Color _supplierColor = Color(0xFFF59E0B); // amber
  static const Color _requirementColor = Color(0xFF10B981); // emerald

  @override
  void initState() {
    super.initState();
    loadChart();
  }

  bool get _isDefaultRange =>
      _isSameDay(fromDate, _defaultFrom) && _isSameDay(toDate, _defaultTo);

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  Future<void> loadChart() async {
    setState(() {
      loading = true;
      errorMessage = null;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt("UserId")?.toString() ?? "";

      final url = Uri.parse(
        "${ApiConfig.baseUrl}"
        "${ApiConfig.chartData}",
      ).replace(
        queryParameters: {
          "createdBy": userId,
          "fromDate": DateFormat("yyyy-MM-dd").format(fromDate),
          "toDate": DateFormat("yyyy-MM-dd").format(toDate),
        },
      );

      debugPrint("Chart URL: $url");

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);

        if (json["success"] != true) {
          setState(() {
            errorMessage = "Could not load chart data";
            points = [];
            labels = [];
          });
          return;
        }

        final List data = json["data"] ?? [];

        List<_ChartPoint> tempPoints = [];
        List<String> tempLabels = [];

        for (final item in data) {
          DateTime date;
          try {
            date = DateTime.parse(item["CreatedDate"]);
          } catch (_) {
            continue;
          }

          tempPoints.add(
            _ChartPoint(
              date: date,
              clientCount: _toDouble(item["ClientCount"]),
              supplierCount: _toDouble(item["SupplierCount"]),
              requirementCount: _toDouble(item["RequirementCount"]),
            ),
          );

          tempLabels.add(DateFormat("dd MMM").format(date));
        }

        setState(() {
          points = tempPoints;
          labels = tempLabels;
        });
      } else {
        setState(() {
          errorMessage = "Server error (${response.statusCode})";
          points = [];
          labels = [];
        });
      }
    } catch (e) {
      debugPrint("Chart error $e");
      setState(() {
        errorMessage = "Something went wrong loading the chart";
        points = [];
        labels = [];
      });
    }

    setState(() {
      loading = false;
    });
  }

  double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }

  Future<void> selectFromDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: fromDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
    );

    if (picked == null) return;

    setState(() {
      fromDate = picked;
      // Validation: from cannot be after to -> push `to` forward to match.
      if (fromDate.isAfter(toDate)) {
        toDate = fromDate;
      }
    });

    loadChart();
  }

  Future<void> selectToDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: toDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
    );

    if (picked == null) return;

    setState(() {
      toDate = picked;
      // Validation: to cannot be before from -> pull `from` back to match.
      if (toDate.isBefore(fromDate)) {
        fromDate = toDate;
      }
    });

    loadChart();
  }

  void _clearFilters() {
    setState(() {
      fromDate = _defaultFrom;
      toDate = _defaultTo;
    });
    loadChart();
  }

  List<_SeriesConfig> get _series {
    final clientSpots = <FlSpot>[];
    final supplierSpots = <FlSpot>[];
    final requirementSpots = <FlSpot>[];

    for (int i = 0; i < points.length; i++) {
      final p = points[i];
      clientSpots.add(FlSpot(i.toDouble(), p.clientCount));
      supplierSpots.add(FlSpot(i.toDouble(), p.supplierCount));
      requirementSpots.add(FlSpot(i.toDouble(), p.requirementCount));
    }

    return [
      _SeriesConfig(
        label: "Clients",
        color: _clientColor,
        spots: clientSpots,
      ),
      _SeriesConfig(
        label: "Suppliers",
        color: _supplierColor,
        spots: supplierSpots,
      ),
      _SeriesConfig(
        label: "Requirements",
        color: _requirementColor,
        spots: requirementSpots,
      ),
    ];
  }

  double get _maxY {
    double max = 0;
    for (final p in points) {
      max = [max, p.clientCount, p.supplierCount, p.requirementCount]
          .reduce((a, b) => a > b ? a : b);
    }
    if (max == 0) return 10;
    // Round up to a clean-ish interval so axis labels aren't fractional.
    final padded = max * 1.25;
    return padded;
  }

  double get _yInterval {
    final max = _maxY;
    final raw = max / 4;
    if (raw <= 1) return 1;
    // round to nearest "nice" step
    final magnitude = (raw).floor();
    return magnitude.toDouble();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 380;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            boxShadow: const [
              BoxShadow(
                blurRadius: 18,
                color: Colors.black12,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 16),
              _buildDateFilterBar(isNarrow),
              const SizedBox(height: 18),
              _buildLegend(),
              const SizedBox(height: 12),
              _buildChartArea(),
            ],
          ),
        );
      },
    );
  }

  // ---------- Header ----------

  Widget _buildHeader() {
    return Row(
      children: [
        const Icon(Icons.show_chart_rounded, color: Color(0xFF2563EB)),
        const SizedBox(width: 8),
        const Expanded(
          child: Text(
            "Activity Overview",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (loading)
          const SizedBox(
            width: 18,
            height: 18,
            child: CircularProgressIndicator(strokeWidth: 2.2),
          ),
      ],
    );
  }

  // ---------- Date filter ----------

  Widget _buildDateFilterBar(bool isNarrow) {
    final dateChips = Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        _DateChip(
          label: "From",
          date: fromDate,
          onTap: selectFromDate,
        ),
        _DateChip(
          label: "To",
          date: toDate,
          onTap: selectToDate,
        ),
      ],
    );

    final clearButton = TextButton.icon(
      onPressed: _isDefaultRange ? null : _clearFilters,
      icon: const Icon(Icons.clear_rounded, size: 16),
      label: const Text("Clear"),
      style: TextButton.styleFrom(
        foregroundColor: const Color(0xFF6B7280),
        padding: const EdgeInsets.symmetric(horizontal: 8),
      ),
    );

    if (isNarrow) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          dateChips,
          Align(alignment: Alignment.centerRight, child: clearButton),
        ],
      );
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: dateChips),
        clearButton,
      ],
    );
  }

  // ---------- Legend ----------

  Widget _buildLegend() {
    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: _series
          .map(
            (s) => Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: s.color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  s.label,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF374151),
                  ),
                ),
              ],
            ),
          )
          .toList(),
    );
  }

  // ---------- Chart area ----------

  Widget _buildChartArea() {
    return SizedBox(
      height: 240,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _resolveChartChild(),
      ),
    );
  }

  Widget _resolveChartChild() {
    if (loading) {
      return const Center(
        key: ValueKey("loading"),
        child: CircularProgressIndicator(),
      );
    }

    if (errorMessage != null) {
      return _buildErrorState();
    }

    if (points.isEmpty) {
      return _buildEmptyState();
    }

    return Padding(
      key: const ValueKey("chart"),
      padding: const EdgeInsets.only(top: 8, right: 12),
      child: LineChart(chartData(), duration: const Duration(milliseconds: 300)),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      key: const ValueKey("empty"),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.insert_chart_outlined_rounded,
              size: 36, color: Colors.grey.shade400),
          const SizedBox(height: 8),
          Text(
            "No data for this range",
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            "Try a different date range",
            style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      key: const ValueKey("error"),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.error_outline_rounded,
              size: 32, color: Colors.red.shade300),
          const SizedBox(height: 8),
          Text(
            errorMessage!,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.red.shade400,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: loadChart,
            child: const Text("Retry"),
          ),
        ],
      ),
    );
  }

  LineChartData chartData() {
    final series = _series;
    final maxY = _maxY;

    return LineChartData(
      minX: 0,
      maxX: (points.length - 1).toDouble().clamp(0, double.infinity),
      minY: 0,
      maxY: maxY,
      borderData: FlBorderData(show: false),
      gridData: FlGridData(
        show: true,
        drawVerticalLine: false,
        horizontalInterval: _yInterval,
        getDrawingHorizontalLine: (value) => FlLine(
          color: Colors.grey.shade200,
          strokeWidth: 1,
        ),
      ),
      titlesData: FlTitlesData(
        topTitles:
            const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles:
            const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            reservedSize: 30,
            interval: _yInterval,
            getTitlesWidget: (value, meta) {
              if (value == 0) return const SizedBox();
              return Text(
                value.toInt().toString(),
                style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
              );
            },
          ),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            interval: _bottomLabelInterval(),
            getTitlesWidget: (value, meta) {
              int i = value.toInt();
              if (i < 0 || i >= labels.length) return const SizedBox();
              return Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  labels[i],
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                ),
              );
            },
          ),
        ),
      ),
      lineTouchData: LineTouchData(
        touchTooltipData: LineTouchTooltipData(
          getTooltipColor: (_) => const Color(0xFF111827),
          tooltipRoundedRadius: 8,
          getTooltipItems: (touchedSpots) {
            return touchedSpots.map((spot) {
              final seriesConfig = series[spot.barIndex];
              return LineTooltipItem(
                "${seriesConfig.label}\n${spot.y.toInt()}",
                TextStyle(
                  color: seriesConfig.color,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              );
            }).toList();
          },
        ),
      ),
      lineBarsData: series.map((s) {
        final isPrimary = s.label == "Requirements";
        return LineChartBarData(
          spots: s.spots,
          isCurved: true,
          barWidth: isPrimary ? 3 : 2,
          color: s.color,
          dotData: FlDotData(
            show: points.length <= 14,
            getDotPainter: (spot, percent, bar, index) =>
                FlDotCirclePainter(
              radius: 3,
              color: s.color,
              strokeWidth: 2,
              strokeColor: Colors.white,
            ),
          ),
          belowBarData: isPrimary
              ? BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      s.color.withValues(alpha: 0.28),
                      s.color.withValues(alpha: 0.02),
                    ],
                  ),
                )
              : BarAreaData(show: false),
        );
      }).toList(),
    );
  }

  // Avoid label crowding when there are many points: skip every Nth label.
  double _bottomLabelInterval() {
    final count = labels.length;
    if (count <= 7) return 1;
    if (count <= 14) return 2;
    if (count <= 30) return 4;
    return (count / 8).ceilToDouble();
  }
}

/// Small rounded "date chip" used for both From and To pickers.
class _DateChip extends StatelessWidget {
  final String label;
  final DateTime date;
  final VoidCallback onTap;

  const _DateChip({
    required this.label,
    required this.date,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minWidth: 140),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              blurRadius: 6,
              color: Colors.black.withValues(alpha: 0.04),
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.calendar_today_rounded,
                size: 14, color: Color(0xFF9CA3AF)),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF9CA3AF),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  DateFormat("dd MMM yyyy").format(date),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111827),
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