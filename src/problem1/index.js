// Problem 1: Three ways to sum to n
// Provide 3 unique implementations of the following function in JavaScript.
// Input: n - any integer
// Output: return - summation to n, i.e. sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15

// Implementation A: Using a for loop (iterative approach)
var sum_to_n_a = function(n) {
    if (n <= 0) return 0;
    
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

// Implementation B: Using mathematical formula (arithmetic series)
var sum_to_n_b = function(n) {
    if (n <= 0) return 0;
    
    // Formula: sum = n * (n + 1) / 2
    return (n * (n + 1)) / 2;
};

// Implementation C: Using recursion
var sum_to_n_c = function(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    
    return n + sum_to_n_c(n - 1);
};

// Test the functions
console.log("Testing sum_to_n_a(5):", sum_to_n_a(5)); // Should output 15
console.log("Testing sum_to_n_b(5):", sum_to_n_b(5)); // Should output 15
console.log("Testing sum_to_n_c(5):", sum_to_n_c(5)); // Should output 15

console.log("Testing sum_to_n_a(10):", sum_to_n_a(10)); // Should output 55
console.log("Testing sum_to_n_b(10):", sum_to_n_b(10)); // Should output 55
console.log("Testing sum_to_n_c(10):", sum_to_n_c(10)); // Should output 55

// Export the functions for potential testing
module.exports = {
    sum_to_n_a,
    sum_to_n_b,
    sum_to_n_c
};
