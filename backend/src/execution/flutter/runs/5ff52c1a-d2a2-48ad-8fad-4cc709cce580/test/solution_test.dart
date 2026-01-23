import 'package:test/test.dart';
import '../lib/solution.dart';

void main() {
  test('TC_1', () {
    expect(reverseString("abc"), equals("cba"));
  });

  test('TC_2', () {
    expect(reverseString(""), equals(""));
  });

  test('TC_3', () {
    expect(reverseString("madam"), equals("madam"));
  });

  test('TC_4', () {
    expect(reverseString("flutter"), equals("rettulf"));
  });

  test('TC_5', () {
    expect(reverseString("a"), equals("a"));
  });

  test('TC_6', () {
    expect(reverseString("racecar"), equals("racecar"));
  });

  test('TC_7', () {
    expect(reverseString(12345), equals(54321));
  });

  test('TC_8', () {
    expect(reverseString("hello"), equals("olleh"));
  });

  test('TC_9', () {
    expect(reverseString("xyz"), equals("zyx"));
  });

  test('TC_10', () {
    expect(reverseString("level"), equals("level"));
  });

}
