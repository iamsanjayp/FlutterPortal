import 'package:flutter/material.dart';

import 'solution.dart';

void main() {
  runApp(const _PortalApp());
}

class _PortalApp extends StatelessWidget {
  const _PortalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Builder(
        builder: (context) => buildUI(),
      ),
    );
  }
}
