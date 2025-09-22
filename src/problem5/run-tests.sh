#!/bin/bash

echo "📚 Book Management API Test Runner"
echo "=================================="

# Function to check if server is running
check_server() {
    curl -s http://localhost:3000/health > /dev/null 2>&1
    return $?
}

# Function to wait for server to start
wait_for_server() {
    echo "⏳ Waiting for server to start..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_server; then
            echo "✅ Server is running!"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - Server not ready yet..."
        sleep 1
        ((attempt++))
    done
    
    echo "❌ Server failed to start within 30 seconds"
    return 1
}

# Check if server is already running
if check_server; then
    echo "✅ Server is already running at http://localhost:3000"
    echo "🧪 Running API tests..."
    npm run test:api
else
    echo "🚀 Server not running. Starting server and running tests..."
    echo ""
    echo "This will:"
    echo "1. Start the development server"
    echo "2. Wait for it to be ready"
    echo "3. Run the comprehensive API tests"
    echo "4. Stop the server when done"
    echo ""
    
    # Start server in background
    npm run dev > server.log 2>&1 &
    SERVER_PID=$!
    
    # Wait for server to be ready
    if wait_for_server; then
        echo ""
        echo "🧪 Running comprehensive API tests..."
        echo "=================================="
        npm run test:api
        TEST_EXIT_CODE=$?
        
        echo ""
        echo "🛑 Stopping server..."
        kill $SERVER_PID 2>/dev/null || true
        
        if [ $TEST_EXIT_CODE -eq 0 ]; then
            echo "🎉 All tests passed successfully!"
        else
            echo "❌ Some tests failed"
        fi
        
        exit $TEST_EXIT_CODE
    else
        echo "❌ Failed to start server"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
fi
