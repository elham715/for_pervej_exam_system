#!/usr/bin/env bash
set -euo pipefail

# Analytics Endpoints Test Script
# Usage: TOKEN="<JWT>" ./scripts/test_analytics_endpoints.sh

if [[ -z "${TOKEN:-}" ]]; then
  echo "ERROR: TOKEN is required." >&2
  echo "Example: TOKEN=\"<firebase-id-token>\" ./scripts/test_analytics_endpoints.sh" >&2
  exit 1
fi

API_BASE_URL="http://localhost:8000/api/v1"
header_auth=( -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" )

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    
    echo ""
    log_info "Testing: $description"
    echo "Endpoint: $method $endpoint"
    
    local response
    local status_code
    
    if [[ "$method" == "GET" ]]; then
        response=$(curl -sS -w "\n__HTTP_STATUS__:%{http_code}\n" -X GET "${API_BASE_URL}${endpoint}" "${header_auth[@]}")
    else
        log_error "Method $method not supported in this script"
        return 1
    fi
    
    status_code=$(echo "$response" | sed -n 's/^__HTTP_STATUS__:\([0-9][0-9][0-9]\)$/\1/p')
    local body=$(echo "$response" | sed '/^__HTTP_STATUS__:/d')
    
    echo "Status: $status_code"
    
    if [[ "$status_code" == "200" ]]; then
        log_success "✓ Endpoint working"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    elif [[ "$status_code" == "400" ]]; then
        log_warning "⚠ Bad Request (400)"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    elif [[ "$status_code" == "401" ]]; then
        log_error "✗ Unauthorized (401) - Check your token"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    elif [[ "$status_code" == "403" ]]; then
        log_error "✗ Forbidden (403) - Insufficient permissions"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    elif [[ "$status_code" == "404" ]]; then
        log_error "✗ Not Found (404) - Endpoint not implemented"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        log_error "✗ Unexpected status: $status_code"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
}

# Get user info first
echo "Getting user information..."
ME_RESPONSE=$(curl -sS "${API_BASE_URL}/me" "${header_auth[@]}")
USER_ID=$(echo "$ME_RESPONSE" | jq -r '.data.id // empty' 2>/dev/null || echo "")
ROLE=$(echo "$ME_RESPONSE" | jq -r '.data.role // empty' 2>/dev/null || echo "")

if [[ -n "$USER_ID" ]]; then
    log_info "User ID: $USER_ID"
    log_info "Role: $ROLE"
else
    log_error "Could not get user information. Check your token."
    exit 1
fi

# Get exam ID for testing
EXAMS_RESPONSE=$(curl -sS "${API_BASE_URL}/exams" "${header_auth[@]}")
EXAM_ID=$(echo "$EXAMS_RESPONSE" | jq -r '.data[0].id // empty' 2>/dev/null || echo "")

if [[ -n "$EXAM_ID" ]]; then
    log_info "Using exam ID for testing: $EXAM_ID"
else
    log_warning "No exams found. Some tests may fail."
fi

echo ""
echo "=========================================="
echo "TESTING ANALYTICS ENDPOINTS"
echo "=========================================="

# User Analytics (Self or Admin)
test_endpoint "GET" "/analytics/users/$USER_ID" "Get User Performance Analytics"
test_endpoint "GET" "/analytics/users/$USER_ID/history?skip=0&take=5" "Get User Exam History"
test_endpoint "GET" "/analytics/users/$USER_ID/topics" "Get User Topic Performance"
test_endpoint "GET" "/analytics/users/$USER_ID/trend" "Get User Improvement Trend"

# Admin-only endpoints
if [[ "$ROLE" == "ADMIN" ]]; then
    echo ""
    log_info "Testing Admin-only endpoints..."
    
    test_endpoint "GET" "/analytics/system" "Get System Analytics"
    test_endpoint "GET" "/analytics/topics/top-performing" "Get Top Performing Topics"
    
    # Test exam usage stats (this was failing)
    test_endpoint "GET" "/analytics/exams/usage" "Get Exam Usage Statistics"
    
    if [[ -n "$EXAM_ID" ]]; then
        test_endpoint "GET" "/analytics/exams/$EXAM_ID" "Get Exam Analytics"
        test_endpoint "GET" "/analytics/exams/$EXAM_ID/detailed" "Get Detailed Exam Results"
    else
        log_warning "Skipping exam-specific tests (no exam ID available)"
    fi
else
    log_warning "Skipping admin-only tests (role: $ROLE)"
fi

echo ""
echo "=========================================="
echo "TESTING COMPLETE"
echo "=========================================="

# Summary of expected vs actual endpoints based on specification
echo ""
log_info "Expected Analytics Endpoints (from specification):"
echo "✓ GET /analytics/users/:id - User Performance Analytics"
echo "✓ GET /analytics/users/:id/history - User Exam History"
echo "✓ GET /analytics/users/:id/topics - User Topic Performance"
echo "✓ GET /analytics/users/:id/trend - User Improvement Trend"
echo "? GET /analytics/exams/:id - Exam Analytics (Admin)"
echo "? GET /analytics/exams/:id/detailed - Detailed Exam Results (Admin)"
echo "✓ GET /analytics/system - System Analytics (Admin)"
echo "✗ GET /analytics/exams/usage - Exam Usage Statistics (Admin) - FAILING"
echo "✓ GET /analytics/topics/top-performing - Top Performing Topics (Admin)"

echo ""
log_info "Issues found:"
echo "1. /analytics/exams/usage endpoint expects exam ID but specification shows it should return all exam usage stats"
echo "2. Some endpoints may have different response formats than specified"
echo ""
log_info "To fix these issues, check your backend implementation for:"
echo "- Correct routing for /analytics/exams/usage (should not require exam ID)"
echo "- Response format matching the API specification"