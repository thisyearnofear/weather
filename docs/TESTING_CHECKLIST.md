# Venice AI Integration - Testing Checklist

## Pre-Testing Setup

- [ ] Verify `VENICE_API_KEY` is set in `.env.local`
  ```bash
  grep VENICE_API_KEY .env.local
  ```

- [ ] Verify API key is valid (42 characters)
  ```bash
  node -e "const fs = require('fs'); const env = fs.readFileSync('.env.local', 'utf-8'); const match = env.match(/VENICE_API_KEY=(.+)/); console.log('Key length:', match?.[1]?.trim().length);"
  ```

## Unit Tests

### Test 1: Basic Venice API Connectivity
```bash
node scripts/test-venice-api.js
```

**Expected Output:**
```
✅ All tests passed! Venice API is working correctly.
```

**If Failed:**
- Check API key is correct
- Verify internet connection
- Check Venice API status

---

### Test 2: Parameter Configuration
```bash
node scripts/test-venice-params.js
```

**Expected Output:**
```
✅ SUCCESS for "No venice_parameters"
✅ SUCCESS for "enable_web_search: 'auto'"
❌ FAILED for "enable_web_search: true" (expected)
```

**If Different:**
- Review parameter usage in code
- Check Venice API documentation

---

### Test 3: Model Comparison
```bash
node scripts/test-venice-models.js
```

**Expected Output:**
```
✅ Valid JSON! for llama-3.3-70b
✅ Valid JSON! for mistral-31-24b
❌ Contains thinking tags for qwen3-235b (expected)
```

**If Different:**
- Verify model names are correct
- Check Venice API model availability

---

### Test 4: Fixed Integration
```bash
node scripts/test-fixed-venice.js
```

**Expected Output:**
```
✅ Venice AI integration test PASSED!
✅ All required keys present
✅ Key factors is valid array
✅ Analysis has meaningful content
```

**If Failed:**
- Review error message
- Check API key
- Verify model is llama-3.3-70b
- Ensure enable_web_search is "auto"

---

### Test 5: Production Flow
```bash
node scripts/test-production-flow.js
```

**Expected Output:**
```
✅ Production flow test PASSED!

Assessment:
  Weather Impact: LOW/MEDIUM/HIGH
  Odds Efficiency: FAIR/OVERPRICED/UNDERPRICED
  Confidence: LOW/MEDIUM/HIGH
```

**If Failed:**
- Check all previous tests pass
- Verify weather API key (separate issue)
- Review error logs

## Integration Tests

### Test 6: Start Development Server
```bash
npm run dev
```

**Expected:**
- [ ] Server starts without errors
- [ ] No Venice API errors in console
- [ ] Application loads at http://localhost:3000

---

### Test 7: Navigate to Markets Page
1. Open browser to http://localhost:3000/markets
2. Wait for markets to load

**Expected:**
- [ ] Markets list displays
- [ ] No console errors
- [ ] Events show with odds

---

### Test 8: Analyze a Market
1. Click on any market (e.g., "Will Randers FC win on 2025-11-24?")
2. Click "Analyze" button
3. Wait for analysis to complete

**Expected:**
- [ ] Loading indicator appears
- [ ] Analysis completes within 5-10 seconds
- [ ] No 400 errors in console
- [ ] Weather conditions display
- [ ] AI reasoning displays
- [ ] Key factors list displays
- [ ] Recommended action displays

**Console Logs to Check:**
```
✅ Should see:
🤖 Calling Venice AI...
🤖 Venice AI raw response: {...
🤖 Venice AI parsed response: {...

❌ Should NOT see:
Venice AI error: Error: 400 status code (no body)
```

---

### Test 9: Analyze Multiple Markets
1. Go back to markets list
2. Select a different market
3. Click "Analyze"
4. Repeat for 2-3 different markets

**Expected:**
- [ ] All analyses complete successfully
- [ ] Different analyses for different markets
- [ ] No errors in console
- [ ] Consistent response format

---

### Test 10: Check Caching
1. Analyze a market
2. Go back and analyze the same market again
3. Check response time

**Expected:**
- [ ] Second analysis is faster (<1 second)
- [ ] Console shows "cached: true" or similar
- [ ] Same analysis results returned

## Error Scenarios

### Test 11: Invalid API Key
1. Temporarily change `VENICE_API_KEY` in `.env.local` to invalid value
2. Restart server
3. Try to analyze a market

**Expected:**
- [ ] Graceful error message
- [ ] Fallback analysis provided
- [ ] No application crash

**Restore API key after test**

---

### Test 12: Network Timeout
1. Disconnect internet
2. Try to analyze a market

**Expected:**
- [ ] Timeout error after ~10 seconds
- [ ] Fallback analysis provided
- [ ] User-friendly error message

## Performance Tests

### Test 13: Response Time
Analyze 5 different markets and record times:

| Market | First Analysis | Cached Analysis |
|--------|---------------|-----------------|
| 1      | ___ seconds   | ___ seconds     |
| 2      | ___ seconds   | ___ seconds     |
| 3      | ___ seconds   | ___ seconds     |
| 4      | ___ seconds   | ___ seconds     |
| 5      | ___ seconds   | ___ seconds     |

**Expected:**
- [ ] First analysis: 3-10 seconds
- [ ] Cached analysis: <1 second

---

### Test 14: Concurrent Requests
1. Open 3 browser tabs
2. Navigate to different markets in each
3. Click "Analyze" in all tabs simultaneously

**Expected:**
- [ ] All analyses complete successfully
- [ ] No rate limit errors
- [ ] No server crashes

## Data Quality Tests

### Test 15: Analysis Content Quality
Review 3-5 analysis results and check:

- [ ] Weather impact is relevant (LOW/MEDIUM/HIGH)
- [ ] Odds efficiency makes sense (FAIR/OVERPRICED/UNDERPRICED)
- [ ] Confidence level is appropriate (LOW/MEDIUM/HIGH)
- [ ] Analysis text is specific to the event (not generic)
- [ ] Key factors are relevant to the sport/event
- [ ] Recommended action is clear and actionable

---

### Test 16: Different Event Types
Test analysis for different sports:

- [ ] Soccer match
- [ ] Basketball game
- [ ] Football game
- [ ] Baseball game
- [ ] Other sports

**Expected:**
- [ ] Sport-specific analysis
- [ ] Relevant weather factors for each sport
- [ ] Appropriate key factors

## Final Verification

### Test 17: Production Readiness
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No console errors during normal usage
- [ ] Analysis quality is acceptable
- [ ] Response times are acceptable
- [ ] Caching works correctly
- [ ] Error handling is graceful

### Test 18: Documentation Review
- [ ] Read `docs/VENICE_API_FIXES.md`
- [ ] Read `docs/AI_ANALYSIS_IMPROVEMENTS.md`
- [ ] Read `docs/VENICE_API_QUICK_REFERENCE.md`
- [ ] Understand the changes made
- [ ] Know how to troubleshoot issues

## Sign-Off

**Tested By:** ___________________

**Date:** ___________________

**Status:** 
- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️  Some tests failed - Review issues
- [ ] ❌ Major issues found - Do not deploy

**Notes:**
```
[Add any observations, issues, or recommendations here]
```

---

## Quick Troubleshooting

### If you see 400 errors:
1. Check `enable_web_search` is string `"auto"`, not boolean `true`
2. Verify `response_format` is removed
3. Confirm using `llama-3.3-70b` model
4. Check API key is valid

### If JSON parsing fails:
1. Check for thinking tags in response
2. Verify markdown stripping logic
3. Ensure using `llama-3.3-70b` (not `qwen3-235b`)

### If analysis is generic:
1. Verify web search is enabled (`enable_web_search: "auto"`)
2. Check system prompt includes specificity requirements
3. Review input data quality (location, participants, etc.)

### If caching doesn't work:
1. Check Redis connection (if using Redis)
2. Verify cache key generation
3. Check TTL settings

---

**Need Help?**
- Review documentation in `docs/` folder
- Run test scripts in `scripts/` folder
- Check console logs for specific errors
- Verify environment variables are set correctly
