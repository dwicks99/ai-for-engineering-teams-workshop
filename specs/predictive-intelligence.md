# Spec: PredictiveIntelligence

## Feature: PredictiveIntelligence — Alerts Engine & Market Intelligence Integration

### Context
- Advanced analytics layer combining proactive customer risk alerting with real-time market sentiment monitoring
- The Alerts Engine (`lib/alerts.ts`) continuously evaluates customer data against configurable rule sets and surfaces prioritized warnings
- The `MarketIntelligenceWidget` enriches customer context by overlaying external market signals (news sentiment, headline analysis) onto internal risk data
- Used by account managers who need to act on early warning signals before customers churn — combining internal health data with external market context for a complete picture
- Both systems integrate with the existing `CustomerSelector` and consume output from the Health Score Calculator

### Requirements

#### Alerts Engine (`lib/alerts.ts`)

**High Priority Alerts (immediate action required)**
- `PaymentRiskAlert`: payment overdue > 30 days OR health score drops > 20 points within 7 days
- `EngagementCliffAlert`: login frequency drops > 50% vs. 30-day rolling average
- `ContractExpirationRiskAlert`: contract expires in < 90 days AND health score < 50

**Medium Priority Alerts (monitor closely)**
- `SupportTicketSpikeAlert`: > 3 support tickets in 7 days OR any escalated ticket
- `FeatureAdoptionStallAlert`: no new feature usage in 30 days for accounts with growing contract value

**Engine Behavior**
- `alertEngine(customers: CustomerData[]): Alert[]` evaluates all rules and returns a deduplicated, prioritized list
- Deduplication: same customer + same alert type within cooldown window (24h High, 72h Medium) produces only one alert
- Priority scoring combines alert tier, customer ARR, and recency to determine sort order
- Business hours flag: mark alerts generated outside 09:00–17:00 local time for deferred delivery

#### Market Intelligence (`api/market-intelligence/[company]`, `lib/marketIntelligenceService.ts`)
- API route at `/api/market-intelligence/[company]` returning sentiment, news count, and top headlines
- `MarketIntelligenceService` class with 10-minute TTL cache and `MarketIntelligenceError` custom error class
- Mock data generator produces realistic, company-specific sentiment and headlines for workshop reliability
- Simulated API latency (300–800 ms) for authentic UX

#### UI Components
- `PredictiveAlertsWidget`: real-time alert list with color-coded priority badges (red = High, yellow = Medium)
- Alert detail panel: expandable per-alert view with recommended action, customer context, and dismissal control
- `MarketIntelligenceWidget`: company name input (pre-filled from selected customer), sentiment indicator, headline list
- Both widgets show consistent loading skeletons and error states matching other dashboard widgets
- Historical alerts view accessible via a "View History" toggle

### Data Requirements

```ts
type AlertPriority = 'high' | 'medium';
type AlertType =
  | 'PaymentRisk'
  | 'EngagementCliff'
  | 'ContractExpirationRisk'
  | 'SupportTicketSpike'
  | 'FeatureAdoptionStall';

interface Alert {
  id: string;                  // deterministic: `${customerId}-${type}-${windowStart}`
  customerId: string;
  customerName: string;
  type: AlertType;
  priority: AlertPriority;
  triggeredAt: string;         // ISO 8601
  message: string;             // human-readable, no PII beyond name
  recommendedAction: string;
  dismissed: boolean;
  duringBusinessHours: boolean;
}

interface MarketIntelligenceResponse {
  company: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  newsCount: number;
  lastUpdated: string;         // ISO 8601
  headlines: Array<{
    title: string;
    source: string;
    publishedAt: string;
  }>;
}
```

### Constraints
- **Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **File locations:**
  - Alerts engine: `src/lib/alerts.ts`
  - Alert tests: `src/lib/alerts.test.ts`
  - Market service: `src/lib/marketIntelligenceService.ts`
  - API route: `src/app/api/market-intelligence/[company]/route.ts`
  - Alert widget: `src/components/PredictiveAlertsWidget.tsx`
  - Market widget: `src/components/MarketIntelligenceWidget.tsx`
- All alert rule functions must be pure — no side effects, no network calls
- `alertEngine` must scale efficiently to ≥ 500 customers without blocking the main thread (use memoized rule results)
- Company name parameter in the API route must be validated and sanitized to prevent injection
- No sensitive customer data (email, ARR, internal IDs) in alert message strings
- Rate-limit alert generation to prevent runaway re-evaluation loops
- Color coding must match system-wide palette: red (High / Critical), yellow (Medium / Warning), green (healthy)
- Tailwind CSS only — no inline styles

### Security Requirements
- API route validates company name against an allowlist pattern (`/^[a-zA-Z0-9 .,'-]{1,100}$/`)
- Error responses from the market intelligence API must not leak internal service details
- Alert dismissal actions are logged with user context and timestamp
- No PII beyond customer name appears in alert messages or market intelligence responses
- Client-side rate limiting: max 5 market intelligence lookups per minute per session

### Acceptance Criteria
- [ ] `alertEngine` correctly triggers `PaymentRiskAlert` when payment is overdue > 30 days
- [ ] `alertEngine` correctly triggers `EngagementCliffAlert` on > 50% login frequency drop
- [ ] `alertEngine` correctly triggers `ContractExpirationRiskAlert` when contract < 90 days AND health < 50
- [ ] Duplicate alerts within cooldown windows are suppressed (only one alert per customer/type)
- [ ] Alerts are sorted with High priority before Medium, then by ARR descending
- [ ] `PredictiveAlertsWidget` displays red badges for High and yellow for Medium priority alerts
- [ ] Alert detail panel expands to show recommended action and can be dismissed
- [ ] Dismissed alerts do not reappear within their cooldown window
- [ ] `MarketIntelligenceWidget` displays sentiment with correct color indicator and top 3 headlines
- [ ] Market intelligence results are cached and not re-fetched within 10 minutes for the same company
- [ ] Invalid company names return a 400 error from the API route without leaking internals
- [ ] Both widgets update in real time when `CustomerSelector` changes the active customer
- [ ] Loading skeletons appear during data fetching; error states show messages with retry options
- [ ] All alert rule functions pass unit tests including boundary conditions and edge cases
- [ ] No TypeScript errors in strict mode
