/**
 * Problem 4: Three ways to sum to n
 * Provide 3 unique implementations of a function that calculates sum from 1 to n
 */

/**
 * Implementation A: Iterative approach using a for loop
 * Time Complexity: O(n) - linear time as we iterate through each number from 1 to n
 * Space Complexity: O(1) - constant space, only using a single variable for accumulation
 * 
 * This is the most straightforward and intuitive approach. It's easy to understand
 * and debug, but not the most efficient for large values of n.
 */
function sum_to_n_a(n: number): number {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

/**
 * Implementation B: Mathematical formula approach
 * Time Complexity: O(1) - constant time, regardless of input size
 * Space Complexity: O(1) - constant space, no additional variables needed
 * 
 * This uses the arithmetic series formula: sum = n * (n + 1) / 2
 * This is the most efficient approach in terms of both time and space complexity.
 * It's based on the mathematical insight that the sum of first n natural numbers
 * follows a predictable pattern.
 */
function sum_to_n_b(n: number): number {
    return (n * (n + 1)) / 2;
}

/**
 * Implementation C: Recursive approach
 * Time Complexity: O(n) - linear time due to n recursive calls
 * Space Complexity: O(n) - linear space due to call stack (each recursive call adds a frame)
 * 
 * This demonstrates the recursive nature of the problem: sum(n) = n + sum(n-1)
 * While elegant and demonstrates functional programming concepts, it's the least
 * efficient due to function call overhead and potential stack overflow for large n.
 * In JavaScript/TypeScript, this could cause stack overflow for very large values.
 */
function sum_to_n_c(n: number): number {
    if (n <= 1) {
        return n;
    }
    return n + sum_to_n_c(n - 1);
}

// Example usage and testing
console.log("Testing sum_to_n implementations:");
console.log(`sum_to_n_a(5) = ${sum_to_n_a(5)}`); // Expected: 15
console.log(`sum_to_n_b(5) = ${sum_to_n_b(5)}`); // Expected: 15
console.log(`sum_to_n_c(5) = ${sum_to_n_c(5)}`); // Expected: 15

console.log(`sum_to_n_a(10) = ${sum_to_n_a(10)}`); // Expected: 55
console.log(`sum_to_n_b(10) = ${sum_to_n_b(10)}`); // Expected: 55
console.log(`sum_to_n_c(10) = ${sum_to_n_c(10)}`); // Expected: 55

// Export the functions for potential use in other modules
export { sum_to_n_a, sum_to_n_b, sum_to_n_c };
