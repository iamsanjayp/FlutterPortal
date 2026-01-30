import 'package:test/test.dart';
import '../lib/solution.dart';

void main() {
  test('TC_11', () {
    expect(isPalindrome("noon"), equals(true));
  });

  test('TC_12', () {
    expect(isPalindrome("radar"), equals(true));
  });

  test('TC_13', () {
    expect(isPalindrome("a"), equals(true));
  });

  test('TC_14', () {
    expect(isPalindrome("ab"), equals(false));
  });

  test('TC_15', () {
    expect(isPalindrome("level"), equals(true));
  });

  test('TC_16', () {
    expect(isPalindrome("flutter"), equals(false));
  });

  test('TC_17', () {
    expect(isPalindrome("madam"), equals(true));
  });

  test('TC_18', () {
    expect(isPalindrome("coding"), equals(false));
  });

  test('TC_19', () {
    expect(isPalindrome("refer"), equals(true));
  });

  test('TC_20', () {
    expect(isPalindrome("hello"), equals(false));
  });

}
