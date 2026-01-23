import 'package:test/test.dart';
import '../lib/solution.dart';

void main() {
  test('Reverse string basic', () {
    expect(reverseString("abc"), equals("cba"));
  });

  test('Reverse empty', () {
    expect(reverseString(""), equals(""));
  });

  test('Reverse palindrome', () {
    expect(reverseString("madam"), equals("madam"));
  });
}
