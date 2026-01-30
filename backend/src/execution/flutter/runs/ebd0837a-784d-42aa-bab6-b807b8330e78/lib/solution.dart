bool isPalindrome(String text) {
  // Normalize to lowercase so 'Level' is same as 'level'
  String clean = text.toLowerCase();
  
  // Compare the string to its reversed version
  return clean == clean.split('').reversed.join('');
}