import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import '../lib/solution.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await loadAppFonts();
  });

  testWidgets('Render UI preview', (WidgetTester tester) async {
    tester.binding.window.physicalSizeTestValue = const Size(375, 812);
    tester.binding.window.devicePixelRatioTestValue = 1.0;

    await tester.pumpWidget(
      RepaintBoundary(
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          home: buildUI(),
        ),
      ),
    );

    await tester.pump();
    
    // robust wait for images
    await tester.runAsync(() async {
      final images = find.byType(Image);
      if (images.evaluate().isNotEmpty) {
        final imageWidgets = tester.widgetList<Image>(images);
        for (final image in imageWidgets) {
          final Completer<void> completer = Completer<void>();
          final ImageStream stream = image.image.resolve(ImageConfiguration.empty);
          final ImageStreamListener listener = ImageStreamListener(
            (ImageInfo info, bool synchronousCall) {
              if (!completer.isCompleted) completer.complete();
            },
            onError: (dynamic exception, StackTrace? stackTrace) {
              if (!completer.isCompleted) completer.complete();
            },
          );
          stream.addListener(listener);
          // Wait for completion or timeout
          await Future.any([
            completer.future,
            Future.delayed(const Duration(seconds: 2)),
          ]);
          stream.removeListener(listener);
        }
      }
      await Future.delayed(const Duration(milliseconds: 500));
    });

    await tester.pumpAndSettle(const Duration(seconds: 2));

    // Capture screenshot without golden comparison
    await tester.binding.runAsync(() async {
      final element = find.byType(RepaintBoundary).evaluate().first;
      final renderObject = element.renderObject as RenderRepaintBoundary;
      final image = await renderObject.toImage(pixelRatio: 1.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      final bytes = byteData!.buffer.asUint8List();

      final goldenFile = File('test/goldens/preview.png');
      await goldenFile.parent.create(recursive: true);
      await goldenFile.writeAsBytes(bytes);

      // Verify file was written
      if (!await goldenFile.exists()) {
        throw Exception('Failed to write preview.png');
      }
      print('✓ Preview saved: ${goldenFile.path} (${bytes.length} bytes)');
    });
  });
}

Future<void> loadAppFonts() async {
  final roboto = FontLoader('Roboto');
  final robotoRegular = File('fonts/Roboto-Regular.ttf');
  final robotoBold = File('fonts/Roboto-Bold.ttf');
  if (await robotoRegular.exists()) {
    roboto.addFont(Future.value(
        Uint8List.fromList(await robotoRegular.readAsBytes())
            .buffer
            .asByteData()));
  }
  if (await robotoBold.exists()) {
    roboto.addFont(Future.value(
        Uint8List.fromList(await robotoBold.readAsBytes())
            .buffer
            .asByteData()));
  }
  await roboto.load();

  // Load Material Icons font from local workspace (copied into fonts/).
  final materialIconsPath = 'fonts/MaterialIcons-Regular.otf';
  final materialIconsFile = File(materialIconsPath);
  if (await materialIconsFile.exists()) {
    final iconsLoader = FontLoader('MaterialIcons');
    iconsLoader.addFont(Future.value(
        Uint8List.fromList(await materialIconsFile.readAsBytes())
            .buffer
            .asByteData()));
    await iconsLoader.load();
  }
}
