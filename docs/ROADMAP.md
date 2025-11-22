# Product Roadmap - Fourcast

**Status:** Phase 7 Complete → Phase 8 (Aptos Integration) In Progress

---

## Current State: What's Built ✅

### Core Infrastructure
- ✅ **Markets Page** - Consolidated Sports + Discovery with tabbed interface
- ✅ **Signals Page** - Registry with filters, per-event timelines
- ✅ **Weather Service** - Real-time weather data integration
- ✅ **AI Analysis** - Venice AI integration for market analysis
- ✅ **Venue Extraction** - 80+ stadiums, NFL + EPL teams mapped
- ✅ **SQLite Signals** - Local persistence with author_address tracking
- ✅ **EVM Wallet** - ConnectKit integration (MetaMask, Coinbase, etc.)

### Data Flow (Current)
```
Polymarket API → Weather Analysis → AI Edge Detection → Display
                                                          ↓
                                    User publishes → SQLite (with EVM address)
```

### What's Missing
- ❌ Aptos wallet integration (code ready, not deployed)
- ❌ On-chain signal publishing (Move module ready, not deployed)
- ❌ Reputation/incentive system
- ❌ In-app trading (currently external links)

---

## Vision: Hybrid Architecture

### The Model
```
┌─────────────────────────────────────────────────────────┐
│                  User Experience                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Browse markets (Polymarket, 9lives, etc.)            │
│  2. Get weather + AI edge analysis                       │
│  3. Trade on platform (MetaMask) → Build trading history │
│  4. Publish signal (Petra) → Build reputation on Aptos   │
│  5. Earn from reputation → Premium signals, referrals    │
│                                                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Technical Architecture                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Trading Layer (EVM - Read Only)                         │
│  ├── Polymarket API (Polygon) - Fetch markets            │
│  ├── 9lives API (Arbitrum) - Future                      │
│  └── User trades with MetaMask (external/in-app)         │
│                                                           │
│  Intelligence Layer (Aptos - Write)                      │
│  ├── Signal registry (Move smart contract)               │
│  ├── Reputation system (on-chain)                        │
│  ├── Accuracy tracking (verifiable)                      │
│  └── Monetization (premium signals, referrals)           │
│                                                           │
│  Application (Bridge)                                     │
│  ├── Fetch markets (no wallet needed)                    │
│  ├── Analyze with weather + AI                           │
│  ├── Display to user                                     │
│  └── Dual wallet UX (MetaMask + Petra)                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 8: Aptos Integration + Incentive System

**Goal:** Deploy Move module, integrate dual wallets, establish reputation system

### Week 1: Aptos Deployment

**Tasks:**
1. Deploy Move module to devnet
2. Add AptosProvider to layout.js
3. Update Markets page with dual wallet UX
4. Test signal publishing end-to-end
5. Verify on Aptos Explorer

**Files:**
- ✅ `/move/sources/signal_registry.move` - Ready
- ✅ `/services/aptosPublisher.js` - Ready
- ✅ `/hooks/useAptosSignalPublisher.js` - Ready
- ✅ `/app/providers/AptosProvider.js` - Ready
- ✅ `/app/components/AptosConnectButton.js` - Ready
- 🔄 `/app/layout.js` - Add AptosProvider
- 🔄 `/app/markets/page.js` - Add Aptos wallet button + publishing

**Success Metrics:**
- [ ] Module deployed to devnet
- [ ] 10+ test signals published on-chain
- [ ] tx_hash displayed in Signals page
- [ ] Events visible in Aptos Explorer

### Week 2-3: Dual Wallet UX

**User Flow:**
```
1. User visits /markets
2. Sees two wallet buttons:
   ┌─────────────────────────────────────┐
   │ 🦊 Connect MetaMask (Trading)       │
   │ 🟣 Connect Petra (Signals)          │
   └─────────────────────────────────────┘

3. Analyzes market → sees edge
4. Options:
   - "Trade on Polymarket" → Opens Polymarket (uses MetaMask)
   - "Publish Signal" → Petra signs → Aptos transaction
```

**Implementation:**
```javascript
// Header component
<div className="flex items-center space-x-4">
  <PageNav currentPage="Markets" isNight={isNight} />
  
  {/* Trading wallet */}
  <div className="flex flex-col items-center">
    <ConnectKitButton mode={isNight ? "dark" : "light"} />
    <span className="text-xs opacity-60 mt-1">Trading</span>
  </div>
  
  {/* Signals wallet */}
  <div className="flex flex-col items-center">
    <AptosConnectButton isNight={isNight} />
    <span className="text-xs opacity-60 mt-1">Signals</span>
  </div>
</div>

// Publish signal flow
const handlePublishSignal = async () => {
  // 1. Save to SQLite (fast)
  const sqliteResult = await saveTosqlite({
    authorAddress: evmAddress, // MetaMask address for tracking
  });
  
  // 2. Publish to Aptos (if connected)
  if (aptosConnected) {
    const txHash = await publishToAptos(signalData);
    if (txHash) {
      await updateTxHash(sqliteResult.id, txHash);
      // Link EVM address to Aptos address
      await linkAddresses(evmAddress, aptosAddress);
    }
  }
};
```

---

## Incentive System: Why Publish Signals?

### The Problem
**Users ask:** "Why should I publish my edge on-chain?"

### The Solution: Multi-Layered Incentives

#### 1. **Reputation & Clout** (Social Capital)

**On-Chain Reputation Score:**
```
Reputation = (Accuracy × Volume × Consistency) + Bonus Multipliers

Components:
- Accuracy: % of signals that were correct
- Volume: Number of signals published
- Consistency: Publishing frequency over time
- Bonuses: Early adopter, high-stakes signals, etc.
```

**Leaderboard:**
```
┌─────────────────────────────────────────────────────────┐
│  Top Signal Publishers (Last 30 Days)                   │
├─────────────────────────────────────────────────────────┤
│  1. 0x1234... - 87% accuracy, 45 signals, 🏆 Rank: S    │
│  2. 0x5678... - 82% accuracy, 38 signals, 🥈 Rank: A    │
│  3. 0x9abc... - 79% accuracy, 52 signals, 🥉 Rank: A    │
└─────────────────────────────────────────────────────────┘
```

**Profile Page:**
```
┌─────────────────────────────────────────────────────────┐
│  @weatherking (0x1234...)                               │
│  🏆 S-Tier Signal Publisher                             │
├─────────────────────────────────────────────────────────┤
│  Stats:                                                  │
│  • 87% accuracy (industry avg: 52%)                     │
│  • 45 signals published                                 │
│  • $127K in follower profits                            │
│  • 234 copy traders                                     │
│                                                          │
│  Specialties: NFL weather edges, Soccer rain games      │
│  Best Signal: Chiefs @ Bills snow game (+42% ROI)       │
│                                                          │
│  [Follow] [Copy Trade] [View Signals]                   │
└─────────────────────────────────────────────────────────┘
```

#### 2. **Copy Trading** (Direct Monetization)

**Model:**
```
User publishes signal → Others copy trade → User earns % of profits

Example:
- User publishes: "Chiefs +3.5 (weather edge)"
- 50 people copy trade $100 each = $5,000 total
- Average profit: 20% = $1,000 total profit
- User earns: 10% of profits = $100
```

**Implementation:**
```javascript
// Signal with copy trading
{
  signal_id: "...",
  author: "0x1234...",
  copy_traders: 50,
  total_volume: "$5,000",
  avg_roi: "20%",
  author_earnings: "$100"
}
```

**UX:**
```
┌─────────────────────────────────────────────────────────┐
│  Signal: Chiefs +3.5 (Snow Game Edge)                   │
│  By: @weatherking (87% accuracy)                        │
├─────────────────────────────────────────────────────────┤
│  Analysis: Heavy snow expected, Chiefs excel in snow... │
│                                                          │
│  50 traders copied this signal                          │
│  Average ROI: +20%                                      │
│                                                          │
│  [Copy This Signal] [Follow Publisher]                  │
└─────────────────────────────────────────────────────────┘
```

#### 3. **Referral Program** (Network Effects)

**Model:**
```
User refers friends to Polymarket/9lives → Earns % of trading fees

Tiers:
- Bronze: 5% of referral trading fees (0-10 referrals)
- Silver: 10% of referral trading fees (11-50 referrals)
- Gold: 15% of referral trading fees (51+ referrals)
```

**Integration:**
```javascript
// Link in signal
{
  signal: "...",
  trade_link: "https://polymarket.com/market/xyz?ref=0x1234",
  referral_code: "WEATHERKING"
}
```

**UX:**
```
┌─────────────────────────────────────────────────────────┐
│  Your Referral Stats                                    │
├─────────────────────────────────────────────────────────┤
│  • 23 active referrals                                  │
│  • $45K in referral trading volume                      │
│  • $450 earned this month (10% tier)                    │
│                                                          │
│  Your referral link:                                    │
│  fourcast.app/r/weatherking                             │
│                                                          │
│  Share your signals → Build your network → Earn passive │
└─────────────────────────────────────────────────────────┘
```

#### 4. **Premium Signals** (Subscription)

**Model:**
```
Free Tier:
- Basic analysis
- Public signals
- Standard AI model

Premium Tier ($20/month):
- Deep analysis
- Early signal access (1 hour before public)
- Advanced AI model
- Historical accuracy data
- Copy trading enabled

Pro Tier ($100/month):
- All premium features
- API access
- Custom alerts
- Priority support
- Exclusive signals from top publishers
```

**Publisher Revenue Share:**
```
Premium subscriber pays $20/month
→ $10 to platform
→ $10 split among publishers they follow

Example:
- User follows 5 publishers
- Each publisher earns $2/month per subscriber
- Publisher with 100 premium followers = $200/month passive
```

#### 5. **Gamification** (Engagement)

**Achievements:**
```
🏆 First Signal - Publish your first signal
🎯 Sharp Shooter - 10 signals with >70% accuracy
🔥 Hot Streak - 5 correct signals in a row
⚡ Speed Demon - Publish within 1 hour of market opening
🌟 Influencer - 100+ copy traders
💎 Diamond Hands - 50+ signals published
```

**Seasons & Competitions:**
```
Monthly Competitions:
- Top accuracy wins $500
- Most profitable signals wins $300
- Most copy traders wins $200

Seasonal Leaderboards:
- NFL Season Champion
- March Madness Master
- World Cup Weather Wizard
```

---

## Phase 9: In-App Trading (Optional)

**Goal:** Enable trading without leaving the app

### Integration Options

**Option 1: Polymarket SDK (Easiest)**
```javascript
import { PolymarketSDK } from '@polymarket/sdk';

// In Markets page
const sdk = new PolymarketSDK();

const handleTrade = async (market, side, amount) => {
  const order = await sdk.createOrder({
    market: market.id,
    side, // YES or NO
    amount,
  });
  
  // User signs with MetaMask
  const signature = await signer.signTypedData(order);
  await sdk.submitOrder(order, signature);
};
```

**Option 2: Deep Links (Simpler)**
```javascript
// Pre-fill trade on Polymarket
const tradeUrl = `https://polymarket.com/market/${market.id}?side=YES&amount=100`;
window.open(tradeUrl, '_blank');
```

**Recommendation:** Start with Option 2 (deep links), upgrade to Option 1 later.

---

## Phase 10: Multi-Market Support

**Goal:** Support 9lives (Arbitrum), Azuro (Polygon), etc.

### Abstraction Layer

```javascript
// services/marketAdapter.js
class MarketAdapter {
  constructor(platform) {
    this.platform = platform; // 'polymarket', '9lives', 'azuro'
  }
  
  async getMarkets(filters) {
    switch (this.platform) {
      case 'polymarket':
        return await PolymarketAPI.getMarkets(filters);
      case '9lives':
        return await NineLivesAPI.getMarkets(filters);
      case 'azuro':
        return await AzuroAPI.getMarkets(filters);
    }
  }
  
  async getTradingUrl(market) {
    // Return platform-specific URL
  }
}
```

### UX

```
┌─────────────────────────────────────────────────────────┐
│  Select Platform:                                        │
│  [Polymarket] [9lives] [Azuro] [All]                    │
└─────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### Phase 8 (Aptos Integration)
- [ ] 100+ signals on devnet
- [ ] 50+ unique publishers
- [ ] 99%+ transaction success rate
- [ ] <$0.001 average gas cost

### Phase 9 (Incentives)
- [ ] 500+ signals published
- [ ] 100+ users with reputation scores
- [ ] 20+ copy trading relationships
- [ ] $1K+ in referral earnings distributed

### Phase 10 (Growth)
- [ ] 1,000+ monthly active users
- [ ] 5,000+ signals published
- [ ] 50+ premium subscribers
- [ ] $10K+ monthly revenue

---

## Timeline

**Week 1-2:** Aptos deployment + dual wallet UX  
**Week 3-4:** Reputation system + leaderboard  
**Month 2:** Copy trading + referral program  
**Month 3:** Premium tiers + API access  
**Month 4:** Multi-market support  

---

## Revenue Model

### Revenue Streams

1. **Premium Subscriptions** - $20-100/month
2. **Copy Trading Fees** - 10% of profits
3. **Referral Commissions** - 5-15% of trading fees
4. **API Access** - $50-500/month
5. **Enterprise** - Custom pricing

### Projections (Month 6)

```
100 premium users × $20 = $2,000/month
50 copy trading relationships × $50 avg = $2,500/month
200 referrals × $10 avg = $2,000/month
10 API users × $100 = $1,000/month
────────────────────────────────────────
Total: $7,500/month
```

---
