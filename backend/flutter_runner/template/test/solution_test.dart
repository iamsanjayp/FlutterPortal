import 'package:flutter_test/flutter_test.dart';
import '../lib/solution.dart';

void main() {
  test('Reverse string basic', () {
    expect(reverseString("abc"), "cba");
  });

  test('Reverse empty', () {
    expect(reverseString(""), "");
  });

  test('Reverse palindrome', () {
    expect(reverseString("madam"), "madam");
  });
}
