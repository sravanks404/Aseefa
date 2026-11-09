import 'dart:ui';
import 'package:flutter/material.dart';

class ExpandableFab extends StatefulWidget {
  const ExpandableFab({
    super.key,
    this.onRentalRegistrationTap,
    this.onExistingClientTap,
    this.onProductTap,
    this.onAddPropertyTap,
  });

  final VoidCallback? onRentalRegistrationTap;
  final VoidCallback? onExistingClientTap;
  final VoidCallback? onProductTap;
  final VoidCallback? onAddPropertyTap;

  @override
  State<ExpandableFab> createState() => _ExpandableFabState();
}

class _ExpandableFabState extends State<ExpandableFab>
    with TickerProviderStateMixin {
  bool isOpen = false;

  late AnimationController _backdropController;
  late AnimationController _fabController;
  late List<AnimationController> _itemControllers;

  late Animation<double> _backdropAnimation;
  late Animation<double> _fabRotation;
  late Animation<double> _fabScale;

  static const _itemCount = 4;

  final _items = const [
    _FabItem(
      label: 'Rental Management',
      icon: Icons.key_rounded,
      color: Color.fromARGB(255, 35, 0, 196),
    ),

    _FabItem(
      label: 'Existing Client',
      icon: Icons.receipt_long_rounded,
      color: Color.fromARGB(255, 35, 0, 196),
    ),

    _FabItem(
      label: 'Product',
      icon: Icons.inventory_2_rounded,
      color: Color.fromARGB(255, 35, 0, 196),
    ),

    _FabItem(
      label: 'Add Property',
      icon: Icons.home_work_rounded,
      color: Color.fromARGB(255, 35, 0, 196),
    ),
  ];

  @override
  void initState() {
    super.initState();

    _backdropController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    _fabController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );

    _itemControllers = List.generate(
      _itemCount,
      (i) => AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 280),
      ),
    );

    _backdropAnimation = CurvedAnimation(
      parent: _backdropController,
      curve: Curves.easeOut,
    );

    _fabRotation = Tween<double>(begin: 0, end: 0.375).animate(
      CurvedAnimation(parent: _fabController, curve: Curves.easeInOutBack),
    );

    _fabScale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1, end: .88), weight: 40),
      TweenSequenceItem(tween: Tween(begin: .88, end: 1), weight: 60),
    ]).animate(CurvedAnimation(parent: _fabController, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _backdropController.dispose();
    _fabController.dispose();

    for (final c in _itemControllers) {
      c.dispose();
    }

    super.dispose();
  }

  Future<void> _openMenu() async {
    if (isOpen) return;

    setState(() {
      isOpen = true;
    });

    _backdropController.forward();
    _fabController.forward();

    for (final controller in _itemControllers) {
      controller.forward();
    }
  }

  Future<void> _closeMenu() async {
    await Future.wait([
      _fabController.reverse(),

      _backdropController.reverse(),

      ..._itemControllers.map((c) => c.reverse()),
    ]);

    if (mounted) {
      setState(() {
        isOpen = false;
      });
    }
  }

  void toggleMenu() {
    if (isOpen) {
      _closeMenu();
    } else {
      _openMenu();
    }
  }

  void _handleItemTap(VoidCallback? callback) async {
    if (!isOpen) return;

    await _closeMenu();

    if (!mounted) return;

    callback?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,

      alignment: Alignment.bottomRight,

      children: [
        // BACKDROP
        if (isOpen)
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,

              onTap: _closeMenu,

              child: FadeTransition(
                opacity: _backdropAnimation,

                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 3, sigmaY: 3),

                  child: Container(color: Colors.black.withValues(alpha: .08)),
                ),
              ),
            ),
          ),

        Positioned(
          bottom: 0,
          right: 0,

          child: Column(
            mainAxisSize: MainAxisSize.min,

            crossAxisAlignment: CrossAxisAlignment.end,

            children: [
              ...List.generate(_items.length, (i) {
                final item = _items[i];

                final ctrl = _itemControllers[i];

                return FadeTransition(
                  opacity: CurvedAnimation(parent: ctrl, curve: Curves.easeOut),

                  child: ScaleTransition(
                    scale: Tween<double>(begin: .7, end: 1).animate(ctrl),

                    child: _MenuChip(
                      item: item,

                      onTap: () => _handleItemTap(
                        [
                          widget.onRentalRegistrationTap,
                          widget.onExistingClientTap,
                          widget.onProductTap,
                          widget.onAddPropertyTap,
                        ][i],
                      ),
                    ),
                  ),
                );
              }),

              const SizedBox(height: 16),

              ScaleTransition(
                scale: _fabScale,

                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,

                  onTap: toggleMenu,

                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),

                    width: 60,

                    height: 60,

                    decoration: BoxDecoration(
                      color: const Color.fromARGB(255, 35, 0, 196),

                      borderRadius: BorderRadius.circular(isOpen ? 20 : 18),
                    ),

                    child: RotationTransition(
                      turns: _fabRotation,

                      child: const Icon(
                        Icons.add_rounded,

                        color: Colors.white,

                        size: 28,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MenuChip extends StatefulWidget {
  const _MenuChip({required this.item, required this.onTap});

  final _FabItem item;

  final VoidCallback onTap;

  @override
  State<_MenuChip> createState() => _MenuChipState();
}

class _MenuChipState extends State<_MenuChip> {
  bool pressed = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),

      child: GestureDetector(
        behavior: HitTestBehavior.opaque,

        onTap: widget.onTap,

        child: Container(
          width: 180,

          padding: const EdgeInsets.all(14),

          decoration: BoxDecoration(
            color: Colors.white,

            borderRadius: BorderRadius.circular(16),
          ),

          child: Row(
            children: [
              Icon(widget.item.icon, color: widget.item.color),

              const SizedBox(width: 10),

              Text(widget.item.label),
            ],
          ),
        ),
      ),
    );
  }
}

class _FabItem {
  const _FabItem({
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;

  final IconData icon;

  final Color color;
}
