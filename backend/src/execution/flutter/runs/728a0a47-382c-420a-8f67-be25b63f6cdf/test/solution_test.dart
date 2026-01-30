import 'package:test/test.dart';
import '../lib/solution.dart';

void main() {
  test('TC_47', () {
    expect(maxValue([1, 5, 3]), equals(5));
  });

  test('TC_48', () {
    expect(maxValue([10]), equals(10));
  });

  test('TC_49', () {
    expect(maxValue([-1, -5, -3]), equals(-1));
  });

  test('TC_50', () {
    expect(maxValue([3, 7, 2]), equals(7));
  });

  test('TC_51', () {
    expect(maxValue([5, 6, 1]), equals(6));
  });

  test('TC_52', () {
    expect(maxValue([99, 4, 21]), equals(99));
  });

  test('TC_53', () {
    expect(maxValue([56, 21, -21]), equals(56));
  });

  test('TC_54', () {
    expect(maxValue([-89, -1, -9]), equals(-1));
  });

  test('TC_55', () {
    expect(maxValue([-23, 1, 0]), equals(1));
  });

  test('TC_56', () {
    expect(maxValue([24, 4, 1]), equals(24));
  });

}
