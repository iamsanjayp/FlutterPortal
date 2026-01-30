int maxValue(List<int> nums) {
  if (nums.isEmpty) return 0;

  int currentMax = nums[0];
  for (int i = 1; i < nums.length; i++) {
    if (nums[i] > currentMax) {
      currentMax = nums[i];
    }
  }
  return currentMax;
}