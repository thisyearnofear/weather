# Venice AI API Integration Fixes

## Problem Summary

The Venice AI API was returning `400 status code (no body)` errors when analyzing sports betting markets. The application was unable to provide AI-powered weather impact analysis.

## Root Causes Identified

### 1. **Unsupported `response_format` Parameter**
- **Issue**: Code was using `response_format: { type: "json_object" }`
- **Problem**: Venice AI API does not support this OpenAI parameter
- **Solution**: Removed `response_format` and use prompt engineering instead

### 2. **Incorrect `enable_web_search` Value**
- **Issue**: Code was using `enable_web_search: true` (boolean)
- **Problem**: Venice API requires string value `"auto"`, not boolean `true`
- **Solution**: Changed to `enable_web_search: "auto"`

### 3. **Invalid `strip_thinking_response` Parameter**
- **Issue**: Code was using `strip_thinking_response: true`
- **Problem**: This parameter doesn't exist in Venice API
- **Solution**: Removed this parameter entirely

### 4. **Model Outputs Thinking Tags**
- **Issue**: `qwen3-235b` model outputs `<think>...</think>` tags
- **Problem**: These tags break JSON parsing
- **Solution**: Switched to `llama-3.3-70b` which outputs clean JSON

## Changes Made

### File: `services/aiService.server.js`

#### 1. Fixed Venice API Parameters
```javascript
// BEFORE (BROKEN)
const response = await client.chat.completions.create({
  model: "qwen3-235b",
  messages,
  temperature: 0.3,
  max_tokens: 1000,
  response_format: { type: "json_object" }, // ❌ Not supported
  venice_parameters: {
    enable_web_search: true, // ❌ Wrong type (boolean)
    include_venice_system_prompt: true,
    strip_thinking_response: true, // ❌ Invalid parameter
  },
});

// AFTER (FIXED)
const veniceParams = {};
if (webSearch) {
  veniceParams.enable_web_search = "auto"; // ✅ Correct string value
}

const response = await client.chat.completions.create({
  model: "llama-3.3-70b", // ✅ Model that outputs clean JSON
  messages,
  temperature: 0.3,
  max_tokens: 1000,
  // ✅ Removed response_format - use prompt engineering instead
  venice_parameters: Object.keys(veniceParams).length > 0 ? veniceParams : undefined,
});
```

#### 2. Enhanced JSON Parsing
```javascript
// Added robust parsing to handle markdown and thinking tags
let content = response.choices[0].message.content;
content = content.trim();

// Remove thinking tags if present (defensive)
if (content.includes('<think>')) {
  const thinkEnd = content.lastIndexOf('</think>');
  if (thinkEnd !== -1) {
    content = content.substring(thinkEnd + 8).trim();
  }
}

// Remove markdown code blocks if present
if (content.startsWith('```')) {
  content = content.replace(/```json\n?|\n?```/g, '').trim();
}

// Extract JSON if there's text before/after
const jsonMatch = content.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  content = jsonMatch[0];
}

const parsed = JSON.parse(content);
```

#### 3. Updated System Prompts
Added explicit instructions to ensure JSON-only output:
```javascript
content: `You are an expert sports betting analyst...

STRICT REQUIREMENTS:
- You MUST respond with ONLY a valid JSON object, no other text before or after
- Do NOT wrap the JSON in markdown code blocks
- Output a single JSON object with the required fields only
`
```

#### 4. Applied Fixes to All Venice API Calls
- `callVeniceAI()` - Main analysis function
- `verifyEventLocation()` - Location verification
- `extractEventMetadataViaVenice()` - Fixture metadata extraction

## Testing

### Test Scripts Created

1. **`scripts/test-venice-api.js`** - Basic API connectivity test
2. **`scripts/test-venice-params.js`** - Parameter configuration test
3. **`scripts/test-venice-models.js`** - Model comparison test
4. **`scripts/test-fixed-venice.js`** - Full integration test

### Running Tests

```bash
# Test basic connectivity
node scripts/test-venice-api.js

# Test parameter configurations
node scripts/test-venice-params.js

# Test different models
node scripts/test-venice-models.js

# Test full integration (recommended)
node scripts/test-fixed-venice.js
```

### Expected Output
```
✅ Venice AI integration test PASSED!

Parsed Analysis:
{
  "weather_impact": "LOW",
  "odds_efficiency": "FAIR",
  "confidence": "MEDIUM",
  "analysis": "...",
  "key_factors": [...],
  "recommended_action": "..."
}
```

## Venice API Best Practices

### ✅ DO:
- Use `enable_web_search: "auto"` (string) for web search
- Use prompt engineering for JSON output
- Use `llama-3.3-70b` or `mistral-31-24b` for JSON responses
- Strip markdown code blocks from responses
- Handle thinking tags defensively

### ❌ DON'T:
- Use `response_format: { type: "json_object" }` - not supported
- Use `enable_web_search: true` (boolean) - must be string "auto"
- Use `strip_thinking_response` - invalid parameter
- Use `qwen3-235b` for JSON - outputs thinking tags
- Assume clean JSON output - always parse defensively

## Model Comparison

| Model | JSON Output | Thinking Tags | Web Search | Recommended |
|-------|-------------|---------------|------------|-------------|
| `llama-3.3-70b` | ✅ Clean | ❌ No | ✅ Yes | ✅ **Best** |
| `mistral-31-24b` | ✅ Clean | ❌ No | ✅ Yes | ✅ Good |
| `qwen3-235b` | ❌ Wrapped | ✅ Yes | ✅ Yes | ❌ Avoid |
| `llama-3.1-405b` | N/A | N/A | N/A | ❌ Not available |

## Verification

To verify the fixes are working in your application:

1. Start your development server
2. Navigate to `/markets`
3. Select any event (e.g., "Will Randers FC win on 2025-11-24?")
4. Click "Analyze"
5. You should see:
   - Weather conditions displayed
   - AI reasoning with specific analysis
   - Key factors listed
   - Recommended action
   - No "400 status code" errors in console

## Additional Improvements

### 1. Better Error Messages
The code now provides specific error messages instead of generic "400 status code (no body)".

### 2. Defensive Parsing
Multiple layers of parsing to handle:
- Markdown code blocks
- Thinking tags (defensive)
- Text before/after JSON
- Malformed responses

### 3. Proper Logging
Added logging to track:
- Raw API responses (truncated)
- Parsing steps
- Final parsed objects

## References

- [Venice AI API Documentation](https://docs.venice.ai/)
- [Venice AI Quickstart](https://docs.venice.ai/quickstart)
- [Venice AI Models](https://docs.venice.ai/models)
- [Venice Parameters](https://docs.venice.ai/venice-parameters)

## Support

If you encounter issues:
1. Check your `VENICE_API_KEY` in `.env.local`
2. Run `node scripts/test-fixed-venice.js` to verify setup
3. Check console logs for specific error messages
4. Verify you're using `llama-3.3-70b` model
5. Ensure `enable_web_search: "auto"` (string, not boolean)
