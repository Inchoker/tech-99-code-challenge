# Problem 4: Three Ways to Sum to n

This solution provides three unique implementations of a function that calculates the sum of integers from 1 to n.

## Implementations

### 1. Iterative Approach (`sum_to_n_a`)
- **Time Complexity**: O(n)
- **Space Complexity**: O(1)
- **Description**: Uses a simple for loop to iterate through numbers 1 to n and accumulate the sum
- **Pros**: Easy to understand, straightforward logic
- **Cons**: Not optimal for very large values of n

### 2. Mathematical Formula (`sum_to_n_b`)
- **Time Complexity**: O(1)
- **Space Complexity**: O(1)
- **Description**: Uses the arithmetic series formula: `n * (n + 1) / 2`
- **Pros**: Most efficient approach, constant time and space
- **Cons**: Requires knowledge of the mathematical formula

### 3. Recursive Approach (`sum_to_n_c`)
- **Time Complexity**: O(n)
- **Space Complexity**: O(n)
- **Description**: Recursively calculates sum using the relation: `sum(n) = n + sum(n-1)`
- **Pros**: Elegant and demonstrates functional programming concepts
- **Cons**: Least efficient due to function call overhead and potential stack overflow

## Usage

```typescript
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from './index';

console.log(sum_to_n_a(5));  // Output: 15
console.log(sum_to_n_b(5));  // Output: 15
console.log(sum_to_n_c(5));  // Output: 15
```

## Performance Comparison

For `n = 5`: All functions return `15` (1 + 2 + 3 + 4 + 5 = 15)

- **Method A**: 5 iterations, constant memory
- **Method B**: 1 calculation, constant memory (most efficient)
- **Method C**: 5 recursive calls, 5 stack frames (least efficient)

## Recommendation

For production code, **Method B** (mathematical formula) is recommended due to its optimal O(1) time and space complexity. Method A is suitable when the mathematical approach is not known or when step-by-step calculation is needed for debugging purposes. Method C should be avoided for large values of n due to potential stack overflow issues.
