import 'package:flutter/material.dart';

class CallHistoryScreen extends StatelessWidget {
  const CallHistoryScreen({super.key});

  static const Color bg = Color(0xFFFEF8F4);
  static const Color pillIncoming = Color(0xFF28C76F);
  static const Color pillOutgoing = Color(0xFFFF8547);
  static const Color pillCompleted = Color(0xFF9E9E9E);
  static const Color divider = Color(0xFFE7E2DC);

  @override
  Widget build(BuildContext context) {
    final types = ['Outgoing', 'Incoming', 'Completed'];
    final items = List.generate(9, (i) => _CallData(
          type: types[i % types.length],
          name: 'User Name',
          attributes: 'Attributes',
          time: '7:40 AM',
          duration: '04:32',
        ));

    return Scaffold(
      backgroundColor: bg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.black87),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Call History',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),

            // List
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemBuilder: (context, index) => _CallItem(data: items[index]),
                separatorBuilder: (context, index) => const _ListDivider(),
                itemCount: items.length,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CallItem extends StatelessWidget {
  final _CallData data;
  const _CallItem({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Avatar
          const CircleAvatar(
            radius: 26,
            backgroundImage: AssetImage('assets/images/Avtar.png'),
            backgroundColor: Colors.transparent,
          ),

          const SizedBox(width: 12),

          // Status above name + attributes
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: data.type == 'Incoming'
                        ? CallHistoryScreen.pillIncoming
                        : data.type == 'Outgoing'
                            ? CallHistoryScreen.pillOutgoing
                            : CallHistoryScreen.pillCompleted,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    data.type,
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'User Name',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.black),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Attributes',
                  style: TextStyle(fontSize: 12, color: Colors.black54),
                ),
              ],
            ),
          ),

          // Time + duration
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                data.time,
                style: const TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 4),
              Text(
                data.duration,
                style: const TextStyle(fontSize: 12, color: Colors.black54),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ListDivider extends StatelessWidget {
  const _ListDivider();
  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, thickness: 1, color: CallHistoryScreen.divider);
  }
}

class _CallData {
  final String type; // Outgoing, Incoming, Completed
  final String name;
  final String attributes;
  final String time;
  final String duration;
  const _CallData({
    required this.type,
    required this.name,
    required this.attributes,
    required this.time,
    required this.duration,
  });
}