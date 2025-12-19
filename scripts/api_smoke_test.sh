#!/usr/bin/env bash
set -euo pipefail

# API Smoke Test for MCQ Exam System
# - Read-only by default (GET endpoints)
# - Optional mutating tests via --mutating
#
# Usage:
#   TOKEN="<JWT>" BASE_URL="http://localhost:8000" ./scripts/api_smoke_test.sh
#   TOKEN="<JWT>" BASE_URL="http://localhost:8000/api/v1" ./scripts/api_smoke_test.sh
#   TOKEN="<JWT>" ./scripts/api_smoke_test.sh            # auto-reads .env if present
#   TOKEN="<JWT>" ./scripts/api_smoke_test.sh --mutating  # optional POST/PUT flow (admin)

MUTATING=false
SHOW_HELP=false
for arg in "$@"; do
  case "$arg" in
    --mutating) MUTATING=true ;;
    --help|-h) SHOW_HELP=true ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

if [[ "$SHOW_HELP" == true ]]; then
  cat <<'EOF'
API Smoke Test for MCQ Exam System

Read-only by default (GET endpoints).
Optional mutating tests via --mutating.

Usage:
  TOKEN="<JWT>" BASE_URL="http://localhost:8000" ./scripts/api_smoke_test.sh
  TOKEN="<JWT>" BASE_URL="http://localhost:8000/api/v1" ./scripts/api_smoke_test.sh

Auto-detect backend base URL from repo-root env files (if BASE_URL not set):
  - .env, .env.local, .env.development, .env.production
  - prefers VITE_LOCAL_BACKEND_URL, then VITE_API_BASE_URL

Admin-only mutating flow (creates a topic/question/question-set/exam):
  TOKEN="<JWT>" ./scripts/api_smoke_test.sh --mutating
  (requires jq)
EOF
  exit 0
fi

if [[ -z "${TOKEN:-}" ]]; then
  echo "ERROR: TOKEN is required." >&2
  echo "Example: TOKEN=\"<firebase-id-token>\"" >&2
  exit 1
fi

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: Missing required command: $1" >&2
    exit 1
  }
}

need_cmd curl

HAVE_JQ=false
if command -v jq >/dev/null 2>&1; then
  HAVE_JQ=true
fi

load_dotenv() {
  # Lightweight .env loader (Vite-style): KEY=VALUE, ignores comments and blank lines.
  # Loads from repo root only.
  local env_file
  for env_file in .env .env.local .env.development .env.production; do
    if [[ -f "$env_file" ]]; then
      while IFS= read -r line || [[ -n "$line" ]]; do
        [[ -z "$line" ]] && continue
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        # Remove leading 'export '
        line=${line#export }

        # Only accept KEY=VALUE
        if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
          local key=${line%%=*}
          local val=${line#*=}
          # Trim surrounding quotes
          val=${val%\"}
          val=${val#\"}
          val=${val%\'}
          val=${val#\'}
          export "$key=$val"
        fi
      done < "$env_file"
      return 0
    fi
  done
  return 0
}

normalize_api_base() {
  # Ensures the returned URL ends with /api/v1 (no trailing slash).
  local base="$1"
  base="${base%/}"
  if [[ "$base" == */api/v1 ]]; then
    echo "$base"
    return 0
  fi
  echo "$base/api/v1"
}

if [[ -z "${BASE_URL:-}" ]]; then
  load_dotenv
  # Prefer the same variable your frontend uses.
  if [[ -n "${VITE_LOCAL_BACKEND_URL:-}" ]]; then
    BASE_URL="${VITE_LOCAL_BACKEND_URL}"
  elif [[ -n "${VITE_API_BASE_URL:-}" ]]; then
    BASE_URL="${VITE_API_BASE_URL}"
  elif [[ -n "${API_BASE_URL:-}" ]]; then
    BASE_URL="${API_BASE_URL}"
  fi
fi

API_BASE_URL=$(normalize_api_base "${BASE_URL:-http://localhost:8000}")
ROOT_BASE_URL="${API_BASE_URL%/api/v1}"

header_auth=( -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" )

# Curl wrapper: prints method + url, captures body and status.
request() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}";

  echo "\n==> ${method} ${url}" >&2

  local resp
  if [[ "$method" == "GET" || "$method" == "DELETE" ]]; then
    resp=$(curl -sS -w "\n__HTTP_STATUS__:%{http_code}\n" -X "$method" "${url}" "${header_auth[@]}")
  else
    resp=$(curl -sS -w "\n__HTTP_STATUS__:%{http_code}\n" -X "$method" "${url}" "${header_auth[@]}" --data "$data")
  fi

  local status
  status=$(printf '%s' "$resp" | sed -n 's/^__HTTP_STATUS__:\([0-9][0-9][0-9]\)$/\1/p')
  local body
  body=$(printf '%s' "$resp" | sed '/^__HTTP_STATUS__:/d')

  echo "$body"
  echo "HTTP $status" >&2

  # Return non-zero only for transport failures; keep HTTP failures visible but continue.
  return 0
}

json_get() {
  local path="$1"
  request GET "${API_BASE_URL}${path}"
}

json_post() {
  local path="$1"
  local payload="$2"
  request POST "${API_BASE_URL}${path}" "$payload"
}

json_patch() {
  local path="$1"
  local payload="$2"
  request PATCH "${API_BASE_URL}${path}" "$payload"
}

json_put() {
  local path="$1"
  local payload="$2"
  request PUT "${API_BASE_URL}${path}" "$payload"
}

json_delete() {
  local path="$1"
  request DELETE "${API_BASE_URL}${path}"
}

extract() {
  # extract <jq_query> from stdin; prints empty on failure
  local query="$1"
  if [[ "$HAVE_JQ" == true ]]; then
    jq -r "$query" 2>/dev/null || true
  else
    # jq is optional; without it we can't reliably extract IDs.
    echo ""
  fi
}

echo "API_BASE_URL=${API_BASE_URL}" >&2
if [[ "$HAVE_JQ" == true ]]; then
  echo "jq: available" >&2
else
  echo "jq: not found (install jq for deeper tests)" >&2
fi

# Health (public)
echo "\n--- SYSTEM ---" >&2
request GET "${ROOT_BASE_URL}/health" || true

# /me determines role
echo "\n--- AUTH/PROFILE ---" >&2
ME_JSON=$(json_get "/me")
ROLE=$(printf '%s' "$ME_JSON" | extract '.data.role // empty')
USER_ID=$(printf '%s' "$ME_JSON" | extract '.data.id // empty')
EMAIL=$(printf '%s' "$ME_JSON" | extract '.data.email // empty')
IS_ENROLLED=$(printf '%s' "$ME_JSON" | extract '.data.is_enrolled // empty')

if [[ -n "${ROLE}" ]]; then
  echo "Detected role: ${ROLE} (email: ${EMAIL}, enrolled: ${IS_ENROLLED})" >&2
else
  echo "WARNING: Could not parse role from /me. Response above." >&2
fi

# Read-only endpoints (should work for any authenticated user)
echo "\n--- TOPICS (GET) ---" >&2
TOPICS_JSON=$(json_get "/topics?skip=0&take=5&include_count=true")
TOPIC_ID=$(printf '%s' "$TOPICS_JSON" | extract '.data[0].id // empty')

echo "\n--- QUESTIONS (GET) ---" >&2
if [[ -n "$TOPIC_ID" ]]; then
  json_get "/questions?topic_id=${TOPIC_ID}&skip=0&take=5" >/dev/null
else
  json_get "/questions?skip=0&take=5" >/dev/null
fi

echo "\n--- QUESTION SETS (GET) ---" >&2
QS_JSON=$(json_get "/question-sets?skip=0&take=5")
QS_ID=$(printf '%s' "$QS_JSON" | extract '.data[0].id // empty')

echo "\n--- EXAMS (GET) ---" >&2
EXAMS_JSON=$(json_get "/exams?skip=0&take=5")
EXAM_ID=$(printf '%s' "$EXAMS_JSON" | extract '.data[0].id // empty')
EXAM_LINK=$(printf '%s' "$EXAMS_JSON" | extract '.data[0].exam_link // empty')

if [[ -n "$EXAM_ID" ]]; then
  echo "\n--- EXAM BY ID (GET) ---" >&2
  json_get "/exams/${EXAM_ID}" >/dev/null
fi

if [[ -n "$EXAM_LINK" ]]; then
  echo "\n--- EXAM BY LINK (GET) ---" >&2
  json_get "/exams/link/${EXAM_LINK}" >/dev/null
fi

echo "\n--- ATTEMPTS (GET) ---" >&2
MY_ATTEMPTS_JSON=$(json_get "/me/attempts?skip=0&take=5")

if [[ "$HAVE_JQ" == true ]]; then
  ATTEMPT_ID=$(printf '%s' "$MY_ATTEMPTS_JSON" | jq -r '.data[0].id // empty')
  if [[ -n "$ATTEMPT_ID" ]]; then
    echo "\n--- ATTEMPT DETAILS (GET) ---" >&2
    json_get "/attempts/${ATTEMPT_ID}" >/dev/null
    echo "\n--- ATTEMPT TOPIC PERFORMANCE (GET) ---" >&2
    json_get "/attempts/${ATTEMPT_ID}/topic-performance" >/dev/null
    echo "\n--- ATTEMPT TIME REMAINING (GET) ---" >&2
    json_get "/attempts/${ATTEMPT_ID}/time-remaining" >/dev/null
  fi
fi

# User analytics (self)
if [[ -n "$USER_ID" ]]; then
  echo "\n--- USER ANALYTICS (SELF) ---" >&2
  json_get "/analytics/users/${USER_ID}" >/dev/null
  json_get "/analytics/users/${USER_ID}/history?skip=0&take=5" >/dev/null
  json_get "/analytics/users/${USER_ID}/topics" >/dev/null
  json_get "/analytics/users/${USER_ID}/trend" >/dev/null
fi

# Admin-only
if [[ "${ROLE}" == "ADMIN" ]]; then
  echo "\n--- ADMIN ANALYTICS ---" >&2
  json_get "/analytics/system" >/dev/null
  json_get "/analytics/exams/usage" >/dev/null
  json_get "/analytics/topics/top-performing" >/dev/null

  if [[ -n "$EXAM_ID" ]]; then
    echo "\n--- EXAM ANALYTICS (ADMIN) ---" >&2
    json_get "/analytics/exams/${EXAM_ID}" >/dev/null
    json_get "/analytics/exams/${EXAM_ID}/detailed" >/dev/null
    json_get "/exams/${EXAM_ID}/attempts?skip=0&take=5" >/dev/null
  fi

  echo "\n--- USERS (ADMIN) ---" >&2
  json_get "/users?page=1&limit=5" >/dev/null
fi

if [[ "$MUTATING" == true ]]; then
  echo "\n--- MUTATING TESTS ENABLED ---" >&2

  if [[ "${ROLE}" != "ADMIN" ]]; then
    echo "Skipping admin-only mutating tests (role=${ROLE:-unknown})" >&2
  else
    # Minimal admin-only creation flow; tries to clean up after itself.
    # Requires jq to extract IDs. If jq missing, warn and skip.
    if [[ "$HAVE_JQ" != true ]]; then
      echo "Skipping mutating tests: install jq to extract IDs." >&2
    else
      # Create topic
      NEW_TOPIC_NAME="smoke-topic-$(date +%s)"
      TOPIC_CREATE=$(json_post "/topics" "{\"name\":\"${NEW_TOPIC_NAME}\",\"explanation_video_url\":null}")
      NEW_TOPIC_ID=$(printf '%s' "$TOPIC_CREATE" | jq -r '.data.id // empty')

      # Create question
      if [[ -n "$NEW_TOPIC_ID" ]]; then
        QUESTION_CREATE=$(json_post "/questions" "{\"topic_id\":\"${NEW_TOPIC_ID}\",\"question_text\":\"Smoke test question?\",\"question_latex\":null,\"image_url\":null,\"correct_answer_index\":2,\"explanation_latex\":\"Because\",\"video_solution_url\":null,\"options\":[{\"option_index\":1,\"option_text\":\"A\"},{\"option_index\":2,\"option_text\":\"B\"},{\"option_index\":3,\"option_text\":\"C\"},{\"option_index\":4,\"option_text\":\"D\"}]}")
        NEW_QUESTION_ID=$(printf '%s' "$QUESTION_CREATE" | jq -r '.data.id // empty')
      else
        NEW_QUESTION_ID=""
      fi

      # Create question set
      QS_TITLE="smoke-qs-$(date +%s)"
      QS_CREATE=$(json_post "/question-sets" "{\"title\":\"${QS_TITLE}\",\"description\":\"smoke\"}")
      NEW_QS_ID=$(printf '%s' "$QS_CREATE" | jq -r '.data.id // empty')

      # Set questions in question set
      if [[ -n "$NEW_QS_ID" && -n "$NEW_QUESTION_ID" ]]; then
        json_put "/question-sets/${NEW_QS_ID}/questions" "{\"questions\":[{\"question_id\":\"${NEW_QUESTION_ID}\",\"position\":1}]}" >/dev/null
      fi

      # Create exam
      EXAM_LINK_NEW="smoke-exam-$(date +%s)"
      EXAM_CREATE=$(json_post "/exams" "{\"title\":\"Smoke Exam\",\"time_limit_seconds\":600,\"exam_link\":\"${EXAM_LINK_NEW}\"}")
      NEW_EXAM_ID=$(printf '%s' "$EXAM_CREATE" | jq -r '.data.id // empty')

      # Set question sets in exam
      if [[ -n "$NEW_EXAM_ID" && -n "$NEW_QS_ID" ]]; then
        json_put "/exams/${NEW_EXAM_ID}/question-sets" "{\"question_sets\":[{\"question_set_id\":\"${NEW_QS_ID}\",\"position\":1}]}" >/dev/null
      fi

      echo "Mutating test created: topic=${NEW_TOPIC_ID}, question=${NEW_QUESTION_ID}, qs=${NEW_QS_ID}, exam=${NEW_EXAM_ID}" >&2
      echo "NOTE: Cleanup is not auto-performed to avoid deleting data unexpectedly." >&2
      echo "If you want cleanup support, tell me and I’ll add a --cleanup flag." >&2
    fi
  fi
fi

echo "\nDone." >&2
