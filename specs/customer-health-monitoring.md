# Spec: CustomerHealthMonitoring

## Feature: CustomerHealthMonitoring — Health Score Calculator & Display

### Context
- Core analytics feature of the Customer Intelligence Dashboard providing real-time health assessment for each customer
- Combines a pure-function calculation engine (`lib/healthCalculator.ts`) with a display widget (`CustomerHealthDisplay`) to surface actionable risk signals
- Used by account managers and CS teams to prioritize outreach, identify churn risk, and track relationship trends
- Feeds downstream systems including the Predictive Alerts engine which consumes calculated health scores

### Requirements

#### Functional
- Calculate a composite health score (0–100) from four weighted factors:
  - Payment history — 40%
  - Engagement metrics — 30%
  - Contract status — 20%
  - Support satisfaction — 10%
- Classify the resulting score into risk levels: **Healthy** (71–100), **Warning** (31–70), **Critical** (0–30)
- Expose individual sub-scores for each factor alongside the composite score
- Support trend signals: improving vs. declining vs. stable, based on historical comparison
- Handle new customers and missing data gracefully with sensible defaults and documented assumptions

#### Calculator (`lib/healthCalculator.ts`)
- Individual scoring functions for each factor:
  - `scorePaymentHistory(data: PaymentData): number`
  - `scoreEngagement(data: EngagementData): number`
  - `scoreContract(data: ContractData): number`
  - `scoreSupport(data: SupportData): number`
- Main `calculateHealthScore(input: HealthScoreInput): HealthScoreResult` combining all factors
- Input validation with descriptive error messages; throw typed errors for invalid inputs
- All functions must be pure (no side effects)

#### UI Component (`CustomerHealthDisplay`)
- Display overall health score with color-coded badge (red / yellow / green per risk thresholds)
- Expandable breakdown panel showing each factor's sub-score and weight
- Loading skeleton state while score is being calculated
- Error state with user-friendly message and retry option
- Real-time updates when `CustomerSelector` changes the active customer

### Data Requirements

```ts
interface PaymentData {
  daysSinceLastPayment: number;
  averagePaymentDelayDays: number;
  overdueAmountUsd: number;
}

interface EngagementData {
  loginFrequencyPerMonth: number;
  featureUsageCount: number;
  openSupportTickets: number;
}

interface ContractData {
  daysUntilRenewal: number;
  contractValueUsd: number;
  recentUpgrades: number;
}

interface SupportData {
  averageResolutionTimeDays: number;
  satisfactionScore: number; // 0–10
  escalationCount: number;
}

interface HealthScoreInput {
  payment: PaymentData;
  engagement: EngagementData;
  contract: ContractData;
  support: SupportData;
}

interface HealthScoreResult {
  overall: number;            // 0–100
  riskLevel: 'Healthy' | 'Warning' | 'Critical';
  breakdown: {
    payment: number;
    engagement: number;
    contract: number;
    support: number;
  };
  trend?: 'improving' | 'stable' | 'declining';
}
```

### Constraints
- **Stack:** Next.js 15, React 19, TypeScript (strict), Tailwind CSS
- **File locations:**
  - Calculator: `src/lib/healthCalculator.ts`
  - Component: `src/components/CustomerHealthDisplay.tsx`
  - Tests: `src/lib/healthCalculator.test.ts`
- All calculator functions must be pure — no API calls, no module-level state
- Use JSDoc comments on every exported function explaining the formula and business rationale
- Custom error class: `class HealthScoreError extends Error` with a `field` property indicating which input failed validation
- Tailwind CSS only — no inline styles
- Color coding must match the system used in `CustomerCard`: red (0–30), yellow (31–70), green (71–100)
- Component must accept `customerId: string` as its primary prop and retrieve data internally (or via a passed-in data prop for testing)
- No hardcoded magic numbers — derive thresholds from named constants

### Acceptance Criteria
- [ ] `calculateHealthScore` returns a score between 0 and 100 for all valid inputs
- [ ] Weighted factors sum correctly: payment 40%, engagement 30%, contract 20%, support 10%
- [ ] Risk level classification is correct at all boundary values (0, 30, 31, 70, 71, 100)
- [ ] Invalid / missing input fields throw a `HealthScoreError` with a descriptive message
- [ ] New customer edge case (all zeros / minimal data) produces a valid result without throwing
- [ ] `CustomerHealthDisplay` shows the correct color badge for each risk level
- [ ] Factor breakdown is hidden by default and expands on user interaction
- [ ] Loading state renders a skeleton; error state shows a message with a retry button
- [ ] Score updates when a different customer is selected via `CustomerSelector`
- [ ] All calculator functions pass unit tests including boundary and edge cases
- [ ] No TypeScript errors in strict mode
