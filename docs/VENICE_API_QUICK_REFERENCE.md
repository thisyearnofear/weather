# Venice AI API - Quick Reference

## ✅ Correct Usage

### Basic Request
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
});

const response = await client.chat.completions.create({
  model: 'llama-3.3-70b', // ✅ Use this for JSON
  messages: [
    { 
      role: 'system', 
      content: 'You are a helpful assistant. Respond with ONLY valid JSON, no other text.' 
    },
    { 
      role: 'user', 
      content: 'Return JSON with "status": "ok"' 
    }
  ],
  temperature: 0.3,
  max_tokens: 1000,
  // ✅ Use venice_parameters for web search
  venice_parameters: {
    enable_web_search: 'auto' // ✅ String "auto", not boolean true
  }
});
```

### Parsing Response
```javascript
let content = response.choices[0].message.content.trim();

// Remove markdown code blocks if present
if (content.startsWith('```')) {
  content = content.replace(/```json\n?|\n?```/g, '').trim();
}

// Extract JSON
const jsonMatch = content.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  content = jsonMatch[0];
}

const parsed = JSON.parse(content);
```

## ❌ Common Mistakes

### 1. Using `response_format`
```javascript
// ❌ WRONG - Venice doesn't support this
const response = await client.chat.completions.create({
  model: 'llama-3.3-70b',
  messages: [...],
  response_format: { type: 'json_object' } // ❌ Not supported
});

// ✅ CORRECT - Use prompt engineering
const response = await client.chat.completions.create({
  model: 'llama-3.3-70b',
  messages: [
    { 
      role: 'system', 
      content: 'Respond with ONLY valid JSON, no other text.' 
    },
    ...
  ]
});
```

### 2. Wrong `enable_web_search` Type
```javascript
// ❌ WRONG - Boolean causes 400 error
venice_parameters: {
  enable_web_search: true // ❌ Boolean not supported
}

// ✅ CORRECT - Use string "auto"
venice_parameters: {
  enable_web_search: 'auto' // ✅ String value
}
```

### 3. Invalid Parameters
```javascript
// ❌ WRONG - These parameters don't exist
venice_parameters: {
  enable_web_search: 'auto',
  include_venice_system_prompt: true, // ❌ Invalid
  strip_thinking_response: true // ❌ Invalid
}

// ✅ CORRECT - Only use valid parameters
venice_parameters: {
  enable_web_search: 'auto' // ✅ Only this is valid
}
```

### 4. Wrong Model for JSON
```javascript
// ❌ WRONG - Outputs thinking tags
const response = await client.chat.completions.create({
  model: 'qwen3-235b', // ❌ Outputs <think> tags
  messages: [...]
});

// ✅ CORRECT - Clean JSON output
const response = await client.chat.completions.create({
  model: 'llama-3.3-70b', // ✅ Clean JSON
  messages: [...]
});
```

## Model Selection Guide

| Model | Use Case | JSON Output | Web Search |
|-------|----------|-------------|------------|
| `llama-3.3-70b` | **General use, JSON responses** | ✅ Clean | ✅ Yes |
| `mistral-31-24b` | Vision + function calling | ✅ Clean | ✅ Yes |
| `qwen3-235b` | Complex reasoning (avoid for JSON) | ❌ Thinking tags | ✅ Yes |
| `venice-uncensored` | No content filtering | ⚠️ Varies | ✅ Yes |

## Venice Parameters

### Valid Parameters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `enable_web_search` | string | `"auto"` | Enable web search for current info |

### Invalid Parameters (Don't Use)

- ❌ `include_venice_system_prompt` - Not a valid parameter
- ❌ `strip_thinking_response` - Not a valid parameter
- ❌ `response_format` - Not supported (use prompt engineering)

## Prompt Engineering for JSON

### System Prompt Template
```javascript
{
  role: 'system',
  content: `You are a [role]. 

REQUIREMENTS:
- You MUST respond with ONLY a valid JSON object
- Do NOT include any text before or after the JSON
- Do NOT wrap the JSON in markdown code blocks
- Output format: { "key1": "value1", "key2": "value2" }`
}
```

### User Prompt Template
```javascript
{
  role: 'user',
  content: `[Your question or task]

Return ONLY this JSON structure:
{
  "field1": "description",
  "field2": "description"
}

Respond with ONLY the JSON object, no other text.`
}
```

## Error Handling

### 400 Error Troubleshooting

```javascript
try {
  const response = await client.chat.completions.create({...});
} catch (error) {
  if (error.status === 400) {
    // Check these common issues:
    // 1. Is enable_web_search a string "auto"? (not boolean true)
    // 2. Are you using response_format? (remove it)
    // 3. Are you using invalid venice_parameters? (remove them)
    console.error('400 Error - Check parameters:', {
      model: 'Should be llama-3.3-70b',
      enable_web_search: 'Should be string "auto" or omitted',
      response_format: 'Should be removed'
    });
  }
}
```

## Testing Your Setup

### Quick Test Script
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.VENICE_API_KEY,
  baseURL: 'https://api.venice.ai/api/v1',
});

const response = await client.chat.completions.create({
  model: 'llama-3.3-70b',
  messages: [
    { role: 'system', content: 'Respond with JSON only.' },
    { role: 'user', content: 'Return {"status": "ok", "test": "passed"}' }
  ],
  temperature: 0.3,
  max_tokens: 100
});

console.log(response.choices[0].message.content);
// Expected: {"status": "ok", "test": "passed"}
```

### Run Comprehensive Tests
```bash
# Test basic connectivity
node scripts/test-venice-api.js

# Test parameter configurations
node scripts/test-venice-params.js

# Test different models
node scripts/test-venice-models.js

# Test full integration
node scripts/test-fixed-venice.js
```

## Environment Setup

### .env.local
```bash
# Get your API key from https://venice.ai/
VENICE_API_KEY=your_api_key_here
```

### Verify API Key
```bash
# Check key is loaded
node -e "console.log('Key:', process.env.VENICE_API_KEY?.substring(0, 10) + '...')"
```

## Best Practices

### ✅ DO:
1. Use `llama-3.3-70b` for JSON responses
2. Use `enable_web_search: "auto"` (string) for current info
3. Use prompt engineering for JSON output
4. Parse responses defensively (handle markdown, extra text)
5. Implement retry logic for transient failures
6. Cache responses to reduce API calls

### ❌ DON'T:
1. Use `response_format` parameter (not supported)
2. Use `enable_web_search: true` (boolean - causes 400)
3. Use invalid parameters like `strip_thinking_response`
4. Use `qwen3-235b` for JSON (outputs thinking tags)
5. Assume clean JSON output (always parse defensively)
6. Make unnecessary API calls (implement caching)

## Support Resources

- **Documentation**: https://docs.venice.ai/
- **Quickstart**: https://docs.venice.ai/quickstart
- **Models**: https://docs.venice.ai/models
- **API Reference**: https://docs.venice.ai/api-reference

## Troubleshooting Checklist

- [ ] API key is set in `.env.local`
- [ ] Using `llama-3.3-70b` model (not `qwen3-235b`)
- [ ] `enable_web_search` is string `"auto"` (not boolean `true`)
- [ ] Removed `response_format` parameter
- [ ] Removed invalid `venice_parameters`
- [ ] System prompt requests JSON-only output
- [ ] Response parsing handles markdown and extra text
- [ ] Implemented error handling and retries

## Quick Fix Checklist

If you get 400 errors, check:

```javascript
// ❌ BEFORE (Broken)
{
  model: 'qwen3-235b',
  response_format: { type: 'json_object' },
  venice_parameters: {
    enable_web_search: true,
    strip_thinking_response: true
  }
}

// ✅ AFTER (Fixed)
{
  model: 'llama-3.3-70b',
  // response_format removed
  venice_parameters: {
    enable_web_search: 'auto'
  }
}
```
