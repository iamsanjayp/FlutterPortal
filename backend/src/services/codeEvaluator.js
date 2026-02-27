import { VM } from 'vm2';

/**
 * Code Evaluator Service
 * Executes student JavaScript code against test cases in a sandboxed environment
 * Similar to LeetCode's evaluation system
 */

/**
 * Evaluate a CODE-type problem submission
 * @param {string} studentCode - The student's JavaScript function code
 * @param {Array} testCases - Array of test case objects with input_data and expected_output
 * @returns {Object} Evaluation results
 */
export async function evaluateCodeProblem(studentCode, testCases) {
  const results = {
    passed: 0,
    failed: 0,
    total: testCases.length,
    testResults: [],
    status: 'FAIL',
    executionTime: 0,
    error: null
  };

  const startTime = Date.now();

  try {
    // Create sandboxed VM
    const vm = new VM({
      timeout: 5000, // 5 second timeout per test
      sandbox: {
        console // Allow console.log for debugging
      }
    });

    // Execute student code in sandbox to define the function
    let studentFunction;
    try {
      studentFunction = vm.run(studentCode + '; solution;');
    } catch (err) {
      results.error = `Syntax Error: ${err.message}`;
      results.status = 'ERROR';
      return results;
    }

    // Run each test case
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testResult = {
        testNumber: i + 1,
        input: testCase.input_data,
        expectedOutput: testCase.expected_output,
        actualOutput: null,
        passed: false,
        isPublic: !testCase.is_hidden,
        error: null,
        executionTime: 0
      };

      try {
        const testStartTime = Date.now();
        
        // Parse input (JSON array format)
        const parsedInput = JSON.parse(testCase.input_data);
        const inputArgs = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
        
        // Execute function with inputs
        const actualOutput = vm.run(`
          (${studentCode})
          solution(...${JSON.stringify(inputArgs)})
        `);

        testResult.actualOutput = JSON.stringify(actualOutput);
        testResult.executionTime = Date.now() - testStartTime;

        // Compare with expected output
        const expectedOutput = JSON.parse(testCase.expected_output);
        const matches = deepEqual(actualOutput, expectedOutput);
        
        testResult.passed = matches;
        
        if (matches) {
          results.passed++;
        } else {
          results.failed++;
        }

      } catch (err) {
        testResult.error = err.message;
        testResult.passed = false;
        results.failed++;
      }

      results.testResults.push(testResult);
    }

    results.executionTime = Date.now() - startTime;
    
    // Determine overall status (must pass ALL tests)
    results.status = results.passed === results.total ? 'PASS' : 'FAIL';

  } catch (err) {
    results.error = `Execution Error: ${err.message}`;
    results.status = 'ERROR';
  }

  return results;
}

/**
 * Deep equality check for comparing outputs
 */
function deepEqual(a, b) {
  if (a === b) return true;
  
  if (typeof a !== typeof b) return false;
  
  if (a === null || b === null) return a === b;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => deepEqual(a[key], b[key]));
  }
  
  return false;
}

/**
 * Validate test cases for CODE problems
 * Ensures 2 sample + 5 hidden format
 */
export function validateCodeTestCases(testCases) {
  const publicTests = testCases.filter(tc => !tc.is_hidden);
  const hiddenTests = testCases.filter(tc => tc.is_hidden);
  
  const errors = [];
  
  if (publicTests.length !== 2) {
    errors.push(`Must have exactly 2 sample test cases (found ${publicTests.length})`);
  }
  
  if (hiddenTests.length !== 5) {
    errors.push(`Must have exactly 5 hidden test cases (found ${hiddenTests.length})`);
  }
  
  // Validate JSON format
  testCases.forEach((tc, idx) => {
    try {
      JSON.parse(tc.input_data);
    } catch (err) {
      errors.push(`Test case ${idx + 1}: Invalid JSON in input_data`);
    }
    
    try {
      JSON.parse(tc.expected_output);
    } catch (err) {
      errors.push(`Test case ${idx + 1}: Invalid JSON in expected_output`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  evaluateCodeProblem,
  validateCodeTestCases
};
