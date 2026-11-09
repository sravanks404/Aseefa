import 'dart:convert';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:suitapps/config/api_config.dart';
import 'package:suitapps/shared/utils/responsive.dart';

final RouteObserver<PageRoute> salesOrdersChartRouteObserver =
    RouteObserver<PageRoute>();

class SalesOrdersChart extends StatefulWidget {
  const SalesOrdersChart({super.key});

  @override
  State<SalesOrdersChart> createState() => SalesOrdersChartState();
}

class SalesOrdersChartState extends State<SalesOrdersChart> with RouteAware {
  static const clientColor = Color(0xFF4B4CF6);
  static const requirementColor = Color(0xFF22C7A6);

  List<String> _labels = [];
  List<FlSpot> _clients = [];
  List<FlSpot> _requirements = [];

  bool _loading = true; // first load -> shows the big centered spinner
  bool _refreshing = false; // later loads -> small inline spinner only
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadChart();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    if (route is PageRoute) {
      salesOrdersChartRouteObserver.subscribe(this, route);
    }
  }

  @override
  void dispose() {
    salesOrdersChartRouteObserver.unsubscribe(this);
    super.dispose();
  }

  @override
  void didPopNext() {
    refresh();
  }

  Future<void> refresh() => _loadChart(isRefresh: true);

  Future<void> _loadChart({bool isRefresh = false}) async {
    if (!mounted) return;
    if (isRefresh) {
      setState(() => _refreshing = true);
    } else {
      setState(() {
        _loading = true;
        _errorMessage = null;
      });
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt("UserId")?.toString() ?? "";

      final url = Uri.parse(
        "${ApiConfig.baseUrl}"
        "${ApiConfig.getTodaySummery}"
        "?createdBy=$userId",
      );

      final response = await http.get(url).timeout(const Duration(seconds: 20));

      final Map<DateTime, Map<String, int>> dataByDate = {};

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('Activity report returned ${response.statusCode}.');
      }
      final decoded = jsonDecode(response.body);
      if (decoded is! Map ||
          (decoded['success'] != null &&
              decoded['success'] != true &&
              decoded['success']?.toString() != 'true')) {
        throw const FormatException('Activity report could not be loaded.');
      }
      final chart = decoded['chart'];
      if (chart != null && chart is! List) {
        throw const FormatException('Activity report chart has an invalid shape.');
      }
      for (final item in (chart as List? ?? const [])) {
        if (item is! Map) continue;
        final rawDate = item["CreatedDate"];
        if (rawDate == null) continue;

        final parsed = DateTime.tryParse(rawDate.toString());
        if (parsed == null) continue;
        final dayKey = DateTime(parsed.year, parsed.month, parsed.day);

        dataByDate[dayKey] = {
          "clients": _toInt(item["ClientCount"]),
          "requirements": _toInt(item["RequirementCount"]),
        };
      }

      final today = DateTime.now();
      final last7Days = List.generate(7, (i) {
        final d = today.subtract(Duration(days: 6 - i));
        return DateTime(d.year, d.month, d.day);
      });

      final labels = <String>[];
      final clients = <FlSpot>[];
      final requirements = <FlSpot>[];

      for (int i = 0; i < last7Days.length; i++) {
        final entry = dataByDate[last7Days[i]];

        labels.add(DateFormat("EEE").format(last7Days[i]));
        clients.add(FlSpot(i.toDouble(), (entry?["clients"] ?? 0).toDouble()));
        requirements.add(
          FlSpot(i.toDouble(), (entry?["requirements"] ?? 0).toDouble()),
        );
      }

      _labels = labels;
      _clients = clients;
      _requirements = requirements;
      _errorMessage = null;
    } catch (e) {
      debugPrint("Chart error $e");
      _labels = [];
      _clients = [];
      _requirements = [];
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    }

    if (!mounted) return;

    setState(() {
      _loading = false;
      _refreshing = false;
    });
  }

  int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  bool _hasData() {
    final clientTotal = _clients.fold(0, (a, b) => a + b.y.toInt());
    final requirementTotal = _requirements.fold(0, (a, b) => a + b.y.toInt());
    return clientTotal > 0 || requirementTotal > 0;
  }

  /// Computes a "nice" max for the Y axis based on the actual data instead
  /// of a hardcoded 100, with ~20% headroom so the highest point/dot never
  /// sits flush against the top edge.
  double _calculateMaxY() {
    double maxValue = 0;
    for (final spot in [..._clients, ..._requirements]) {
      if (spot.y > maxValue) maxValue = spot.y;
    }

    if (maxValue <= 0) return 10; // sane default for an all-zero chart

    final withHeadroom = maxValue * 1.2;

    double step;
    if (withHeadroom <= 10) {
      step = 2;
    } else if (withHeadroom <= 50) {
      step = 5;
    } else if (withHeadroom <= 100) {
      step = 10;
    } else if (withHeadroom <= 500) {
      step = 50;
    } else {
      step = 100;
    }

    return (withHeadroom / step).ceil() * step;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 220,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(Responsive.pad(context, 16)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: const [BoxShadow(blurRadius: 18, color: Colors.black12)],
      ),
      child: Column(
        children: [
         
          Wrap(
            spacing: 12,
            runSpacing: 6,
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    "Last 7 days",
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                  ),
                  if (_refreshing) ...[
                    const SizedBox(width: 8),
                    const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ],
                ],
              ),

              _legend(clientColor, "Clients"),
              _legend(requirementColor, "Requirements"),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 220,
            child: _errorMessage != null
                ? _chartError()
                : _hasData()
                    ? LineChart(_chart())
                    : _emptyChart(),
          ),
        ],
      ),
    );
  }

  Widget _legend(Color color, String text) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(
          text,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }

  Widget _chartError() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _errorMessage!,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.black54, fontSize: 12),
          ),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: _refreshing ? null : refresh,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _emptyChart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.show_chart_rounded, size: 48, color: Colors.grey.shade300),
          const SizedBox(height: 10),
          Text(
            "No activity in last 7 days",
            style: TextStyle(
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            "Clients and requirements will appear here",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade400, fontSize: 12),
          ),
        ],
      ),
    );
  }

  LineChartData _chart() {
    final maxY = _calculateMaxY();
    final leftInterval = maxY / 4;

    return LineChartData(
      minX: 0,
      maxX: (_labels.length - 1).toDouble(),
      minY: 0,
      maxY: maxY,
      gridData: const FlGridData(show: true),
      borderData: FlBorderData(show: false),
      titlesData: FlTitlesData(
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles: const AxisTitles(
          sideTitles: SideTitles(showTitles: false),
        ),
        leftTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            interval: leftInterval,
            reservedSize: 32,
            getTitlesWidget: (value, meta) {
              if (value <= 0) return const SizedBox();
              return Text(
                value.toInt().toString(),
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
              );
            },
          ),
        ),
        bottomTitles: AxisTitles(
          sideTitles: SideTitles(
            showTitles: true,
            interval: 1,
            getTitlesWidget: (value, meta) {
              int i = value.toInt();

              if (i < 0 || i >= _labels.length) {
                return const SizedBox();
              }

              return Text(_labels[i]);
            },
          ),
        ),
      ),
      // Tap/drag on the chart to see exact values for that day.
      lineTouchData: LineTouchData(
        enabled: true,
        touchTooltipData: LineTouchTooltipData(
          // `getTooltipColor` is the current fl_chart API (0.66+). If your
          // installed version predates that, swap this line for:
          //   tooltipBgColor: Colors.black87,
          getTooltipColor: (touchedSpot) => Colors.black87,
          tooltipRoundedRadius: 8,
          tooltipPadding: const EdgeInsets.symmetric(
            horizontal: 10,
            vertical: 6,
          ),
          getTooltipItems: (touchedSpots) {
            return touchedSpots.map((spot) {
              final isClient = spot.barIndex == 0;
              final label = isClient ? "Clients" : "Requirements";

              return LineTooltipItem(
                "$label: ${spot.y.toInt()}",
                const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              );
            }).toList();
          },
        ),
        getTouchedSpotIndicator: (barData, spotIndexes) {
          return spotIndexes.map((index) {
            return TouchedSpotIndicatorData(
              FlLine(
                color: (barData.color ?? Colors.grey).withOpacity(0.3),
                strokeWidth: 2,
                dashArray: [4, 4],
              ),
              FlDotData(
                show: true,
                getDotPainter: (spot, percent, bar, index) =>
                    FlDotCirclePainter(
                      radius: 5,
                      color: Colors.white,
                      strokeWidth: 2,
                      strokeColor: bar.color ?? Colors.grey,
                    ),
              ),
            );
          }).toList();
        },
      ),
      lineBarsData: [
        LineChartBarData(
          spots: _clients,
          isCurved: true,
          color: clientColor,
          barWidth: 3,
          dotData: const FlDotData(show: true),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                clientColor.withOpacity(0.28),
                clientColor.withOpacity(0.0),
              ],
            ),
          ),
        ),
        LineChartBarData(
          spots: _requirements,
          isCurved: true,
          color: requirementColor,
          barWidth: 3,
          dotData: const FlDotData(show: true),
          belowBarData: BarAreaData(
            show: true,
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                requirementColor.withOpacity(0.28),
                requirementColor.withOpacity(0.0),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
