# Scripts Directory

This directory contains utility scripts for testing and debugging the Polymarket integration.

## Active Scripts (Keep)

### Core Testing
- **`test-our-service.js`** - Main service integration test
- **`verify-soccer-fix.js`** - Verify soccer filter is working correctly

### Debugging Tools
- **`test-sports-endpoint.js`** - Inspect Polymarket /sports endpoint
- **`test-soccer-leagues.js`** - Test fetching from soccer league tags
- **`analyze-available-sports.js`** - Analyze what sports markets are available

### Feature Testing
- **`test-futures-detection.js`** - Test futures bet detection logic
- **`test-venue-extraction.js`** - Test venue extraction from market data
- **`test-venue-extraction-realistic.js`** - Realistic venue extraction tests

## Usage

Run any script with:
```bash
node scripts/[script-name].js
```

## Maintenance

- Keep active scripts up to date with API changes
- Archive investigation scripts after issues are resolved
- Document new scripts in this README
