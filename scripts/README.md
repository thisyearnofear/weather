# Test Scripts

This folder contains test scripts for validating the Venice AI integration.

## Scripts Overview

### 1. `test-venice-api.js`
**Purpose:** Basic Venice API connectivity test

**What it tests:**
- API key validation
- Client initialization
- Basic chat completion
- JSON response format
- Venice parameters (web search)
- Complex requests

**Run:**
```bash
node scripts/test-venice-api.js
```

**Expected output:**
```
✅ All tests passed! Venice API is working correctly.
```

---

### 2. `test-venice-params.js`
**Purpose:** Test different Venice parameter configurations

**What it tests:**
- No venice_parameters
- enable_web_search: true (should fail)
- enable_web_search: "auto" (should pass)
- All venice_parameters together
- Individual parameters

**Run:**
```bash
node scripts/test-venice-params.js
```

**Expected output:**
```
✅ SUCCESS for "No venice_parameters"
❌ FAILED for "Only enable_web_search: true"
✅ SUCCESS for "enable_web_search: 'auto'"
```

---

### 3. `test-venice-models.js`
**Purpose:** Compare different Venice AI models for JSON output

**What it tests:**
- llama-3.3-70b (recommended)
- llama-3.1-405b
- mistral-31-24b
- qwen3-235b (has issues)

**Run:**
```bash
node scripts/test-venice-models.js
```

**Expected output:**
```
✅ Valid JSON! for llama-3.3-70b
✅ Valid JSON! for mistral-31-24b
❌ Contains thinking tags for qwen3-235b
```

---

### 4. `test-fixed-venice.js`
**Purpose:** Full integration test with fixed parameters

**What it tests:**
- Complete analysis flow
- JSON parsing
- Response structure validation
- All required fields present

**Run:**
```bash
node scripts/test-fixed-venice.js
```

**Expected output:**
```
✅ Venice AI integration test PASSED!
✅ All required keys present
✅ Key factors is valid array
✅ Analysis has meaningful content
```

---

### 5. `test-production-flow.js`
**Purpose:** End-to-end production flow simulation

**What it tests:**
- Complete `analyzeWeatherImpactServer()` function
- Fixture metadata extraction
- Location verification
- Weather data integration
- AI analysis
- Response formatting

**Run:**
```bash
node scripts/test-production-flow.js
```

**Expected output:**
```
✅ Production flow test PASSED!

Assessment:
  Weather Impact: LOW
  Odds Efficiency: FAIR
  Confidence: MEDIUM
```

---

### 6. `test-venice-json-workaround.js`
**Purpose:** Test JSON output without response_format parameter

**What it tests:**
- Prompt engineering for JSON
- Response parsing
- Markdown handling

**Run:**
```bash
node scripts/test-venice-json-workaround.js
```

---

## Quick Start

### Run All Tests
```bash
# Basic connectivity
node scripts/test-venice-api.js

# Parameter validation
node scripts/test-venice-params.js

# Model comparison
node scripts/test-venice-models.js

# Fixed integration
node scripts/test-fixed-venice.js

# Production flow
node scripts/test-production-flow.js
```

### Run Single Test
```bash
node scripts/test-fixed-venice.js
```

## Prerequisites

1. **Environment Variables**
   - `VENICE_API_KEY` must be set in `.env.local`
   - Get your key from https://venice.ai/

2. **Dependencies**
   - All npm packages installed (`npm install`)
   - OpenAI SDK installed

3. **Node.js**
   - Node.js v18+ recommended

## Troubleshooting

### "Cannot find package 'dotenv'"
The scripts load `.env.local` manually, no dotenv needed.

### "Missing credentials"
Check that `VENICE_API_KEY` is set in `.env.local`:
```bash
grep VENICE_API_KEY .env.local
```

### "400 status code"
This means Venice API parameters are incorrect. Check:
- Using `enable_web_search: "auto"` (string, not boolean)
- Not using `response_format` parameter
- Using `llama-3.3-70b` model

### "Thinking tags in response"
You're using `qwen3-235b` model. Switch to `llama-3.3-70b`.

## Test Results Interpretation

### ✅ Success Indicators
- All tests pass
- JSON parsing successful
- Valid response structure
- No 400 errors

### ⚠️ Warning Indicators
- Some tests fail but core functionality works
- Slow response times (>10s)
- Cached responses not working

### ❌ Failure Indicators
- 400 errors
- JSON parsing fails
- Missing required fields
- API key invalid

## Next Steps

After all tests pass:
1. Review `TESTING_CHECKLIST.md` for integration tests
2. Test in your actual application
3. Monitor API usage and costs
4. Implement additional error handling if needed

## Support

- **Documentation:** `docs/VENICE_API_FIXES.md`
- **Quick Reference:** `docs/VENICE_API_QUICK_REFERENCE.md`
- **Architecture:** `docs/AI_ANALYSIS_IMPROVEMENTS.md`
- **Venice Docs:** https://docs.venice.ai/
