/**
 * Test file for Problem 4: Three ways to sum to n
 */

import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from './index';

// Test cases with expected results
const testCases = [
    { input: 1, expected: 1 },
    { input: 2, expected: 3 },
    { input: 3, expected: 6 },
    { input: 4, expected: 10 },
    { input: 5, expected: 15 },
    { input: 10, expected: 55 },
    { input: 100, expected: 5050 }
];

// Function to run tests
function runTests() {
    console.log('Running tests for sum_to_n implementations...\n');
    
    let allTestsPassed = true;
    
    testCases.forEach(({ input, expected }) => {
        const resultA = sum_to_n_a(input);
        const resultB = sum_to_n_b(input);
        const resultC = sum_to_n_c(input);
        
        const testAPassed = resultA === expected;
        const testBPassed = resultB === expected;
        const testCPassed = resultC === expected;
        
        console.log(`Test n=${input} (expected: ${expected}):`);
        console.log(`  sum_to_n_a: ${resultA} ${testAPassed ? '✓' : '✗'}`);
        console.log(`  sum_to_n_b: ${resultB} ${testBPassed ? '✓' : '✗'}`);
        console.log(`  sum_to_n_c: ${resultC} ${testCPassed ? '✓' : '✗'}`);
        console.log();
        
        if (!testAPassed || !testBPassed || !testCPassed) {
            allTestsPassed = false;
        }
    });
    
    console.log(allTestsPassed ? '🎉 All tests passed!' : '❌ Some tests failed!');
}

// Performance benchmark
function performanceBenchmark() {
    console.log('\nPerformance Benchmark (n=10000):');
    const n = 10000;
    
    // Benchmark Method A
    const startA = performance.now();
    const resultA = sum_to_n_a(n);
    const endA = performance.now();
    
    // Benchmark Method B
    const startB = performance.now();
    const resultB = sum_to_n_b(n);
    const endB = performance.now();
    
    // Note: Skipping Method C for large n to avoid stack overflow
    console.log(`Method A (iterative): ${(endA - startA).toFixed(4)}ms, result: ${resultA}`);
    console.log(`Method B (formula): ${(endB - startB).toFixed(4)}ms, result: ${resultB}`);
    console.log('Method C (recursive): Skipped for large n to avoid stack overflow');
}

// Run the tests
runTests();
performanceBenchmark();
