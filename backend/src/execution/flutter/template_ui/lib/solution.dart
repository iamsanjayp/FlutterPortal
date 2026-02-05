import 'package:flutter/material.dart';

Widget buildUI() {
  return const AdminDashboardScreen();
}

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const red = Color(0xFFD62828);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Welcome card
              Container(
                padding:
                    const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                decoration: BoxDecoration(
                  color: red,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: const [
                    Text(
                      'Welcome, Pastor John',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 12),
                    ),
                    SizedBox(height: 1),
                    Text(
                      'Grace Community Church • Admin',
                      style: TextStyle(color: Colors.white70, fontSize: 10),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Stats grid (2x2)
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 1.75,
                children: const [
                  StatCard(title: 'Total Members', value: '247'),
                  StatCard(title: 'Ministers', value: '12'),
                  StatCard(title: 'Ministries', value: '15'),
                  StatCard(title: 'Active Events', value: '8'),
                ],
              ),
              const SizedBox(height: 8),

              // Quick Actions
              SectionCard(
                title: 'Quick Actions',
                child: GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                  childAspectRatio: 1.5,
                  children: const [
                    ActionCard(icon: Icons.add, label: 'Add Member'),
                    ActionCard(
                        icon: Icons.campaign, label: 'Send Notification'),
                    ActionCard(icon: Icons.event, label: 'Create Event'),
                    ActionCard(icon: Icons.church, label: 'Add Ministry'),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Pending Actions
              SectionCard(
                title: 'Pending Actions',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('• 5 new member registrations pending approval',
                        style: TextStyle(fontSize: 9)),
                    SizedBox(height: 1),
                    Text('• 2 event requests awaiting confirmation',
                        style: TextStyle(fontSize: 9)),
                    SizedBox(height: 1),
                    Text('• 3 profile updates need review',
                        style: TextStyle(fontSize: 9)),
                  ],
                ),
              ),
              const SizedBox(height: 6),

              // Recent Activity
              SectionCard(
                title: 'Recent Activity',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('• Sarah Johnson completed profile setup',
                        style: TextStyle(fontSize: 9)),
                    SizedBox(height: 1),
                    Text('• Youth Ministry event scheduled',
                        style: TextStyle(fontSize: 9)),
                    SizedBox(height: 1),
                    Text('• New prayer request from Mike Wilson',
                        style: TextStyle(fontSize: 9)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const _DashboardNav(),
    );
  }
}

class _DashboardNav extends StatelessWidget {
  const _DashboardNav();

  @override
  Widget build(BuildContext context) {
    const red = Color(0xFFD62828);
    return BottomNavigationBar(
      selectedItemColor: red,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      iconSize: 20,
      selectedFontSize: 10,
      unselectedFontSize: 10,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
        BottomNavigationBarItem(icon: Icon(Icons.group), label: 'Members'),
        BottomNavigationBarItem(icon: Icon(Icons.event), label: 'Events'),
        BottomNavigationBarItem(icon: Icon(Icons.campaign), label: 'Notify'),
        BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
      ],
    );
  }
}

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  const StatCard({super.key, required this.title, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE6E6E6)),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(value,
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFD62828))),
          const SizedBox(height: 2),
          Text(title,
              style: const TextStyle(fontSize: 9, color: Colors.black54)),
        ],
      ),
    );
  }
}

class ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  const ActionCard({super.key, required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF7F7F9),
        border: Border.all(color: const Color(0xFFE6E6E6)),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: const Color(0xFFD62828), size: 18),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 9)),
        ],
      ),
    );
  }
}

class SectionCard extends StatelessWidget {
  final String title;
  final Widget child;
  const SectionCard({super.key, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE6E6E6)),
        borderRadius: BorderRadius.circular(10),
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style:
                  const TextStyle(fontWeight: FontWeight.w600, fontSize: 11)),
          const SizedBox(height: 4),
          child,
        ],
      ),
    );
  }
}
