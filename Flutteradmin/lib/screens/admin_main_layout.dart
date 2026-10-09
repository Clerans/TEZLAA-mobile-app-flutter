import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import 'analytics/admin_analytics_screen.dart';
import 'orders/admin_orders_screen.dart';
import 'menu/admin_menu_screen.dart';
import 'customers/admin_customers_screen.dart';
import 'more/admin_management_hub_screen.dart';

class AdminMainLayout extends StatefulWidget {
  final int initialIndex;
  const AdminMainLayout({super.key, this.initialIndex = 0});

  @override
  State<AdminMainLayout> createState() => _AdminMainLayoutState();
}

class _AdminMainLayoutState extends State<AdminMainLayout> {
  late int _currentIndex;

  final List<Widget> _screens = const [
    AdminAnalyticsScreen(),
    AdminOrdersScreen(),
    AdminMenuScreen(),
    AdminCustomersScreen(),
    AdminManagementHubScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Color(0xFFE2E8F0), width: 1),
          ),
          boxShadow: [
            BoxShadow(
              color: Color.fromRGBO(0, 0, 0, 0.05),
              offset: Offset(0, -2),
              blurRadius: 8,
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (idx) => setState(() => _currentIndex = idx),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: const Color(0xFF94A3B8),
          selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.layoutGrid, size: 22),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.shoppingBag, size: 22),
              label: 'Orders',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.coffee, size: 22),
              label: 'Products',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.users, size: 22),
              label: 'Customers',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.moreHorizontal, size: 22),
              label: 'More',
            ),
          ],
        ),
      ),
    );
  }
}
