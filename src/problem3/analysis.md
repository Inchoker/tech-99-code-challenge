# Problem 3: Messy React - Code Analysis

## Computational Inefficiencies and Anti-patterns Found

### 1. **Inefficient Sorting and Filtering Operations**
- **Issue**: The code performs expensive operations (`useMemo`, `filter`, `sort`, `map`) on every render without proper memoization
- **Location**: `sortedBalances` computation uses `useMemo()` but chains multiple array operations
- **Impact**: O(n log n) sorting operation runs unnecessarily on every component update

### 2. **Repeated Priority Calculations**
- **Issue**: `getPriority()` function is called multiple times for the same blockchain values during sorting
- **Location**: In the sorting comparison function, `getPriority()` is called for both `lhs.blockchain` and `rhs.blockchain`
- **Impact**: Redundant computations that could be cached or pre-calculated

### 3. **Inefficient Array Operations Chaining**
- **Issue**: Multiple array operations are chained (`filter().sort().map()`) creating intermediate arrays
- **Location**: The entire `sortedBalances` computation chain
- **Impact**: Creates unnecessary intermediate arrays in memory, poor performance for large datasets

### 4. **Switch Statement Anti-pattern**
- **Issue**: The `getPriority()` function uses a switch statement with hardcoded return values
- **Location**: Priority calculation for different blockchain types
- **Impact**: Not extensible, requires code changes for new blockchain types

### 5. **Inline Object Creation in Render**
- **Issue**: Objects are created inline within the map function in JSX
- **Location**: The `rows` mapping where objects with `className`, `key`, etc. are created
- **Impact**: Creates new objects on every render, breaking React's reconciliation optimization

### 6. **Missing Dependencies and Stale Closures**
- **Issue**: The `useMemo` hook might be missing dependencies
- **Location**: Dependencies array for memoization hooks
- **Impact**: Could lead to stale closures or unnecessary re-computations

### 7. **Poor Separation of Concerns**
- **Issue**: Business logic (sorting, filtering, formatting) mixed with presentation logic
- **Location**: All logic is embedded directly in the component
- **Impact**: Difficult to test, maintain, and reuse

### 8. **Unnecessary Re-renders**
- **Issue**: Component structure doesn't prevent unnecessary re-renders of child components
- **Location**: The entire component structure
- **Impact**: Poor performance, especially with large datasets

## Performance Impact Assessment

1. **Time Complexity**: O(n log n) for sorting + O(n) for filtering and mapping = O(n log n) per render
2. **Space Complexity**: O(n) for each intermediate array created in the chain
3. **Render Frequency**: High - operations run on every component update
4. **Memory Usage**: Inefficient due to multiple intermediate arrays and object creation

## Recommendations for Improvement

1. Implement proper memoization with correct dependencies
2. Cache priority calculations
3. Separate business logic from presentation
4. Use React.memo for component optimization
5. Implement virtual scrolling for large datasets
6. Use a more extensible priority system (e.g., configuration object)
7. Optimize data structures and reduce object creation
