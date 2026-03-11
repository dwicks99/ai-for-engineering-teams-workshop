# Spec: DashboardOrchestrator

## Feature: DashboardOrchestrator — Production-Ready Dashboard Shell

### Context
- Top-level orchestration layer that composes all Customer Intelligence Dashboard widgets into a cohesive, production-grade application
- Responsible for error isolation, performance, accessibility, and export capabilities across the entire dashboard
- Used by internal CS and account management teams in business-critical daily operations; must meet enterprise reliability and compliance standards
- Wraps all previously built widgets (CustomerSelector, CustomerHealthDisplay, MarketIntelligenceWidget, PredictiveAlerts, etc.) without breaking their existing behavior

### Requirements

#### Error Handling & Resilience
- Multi-level React Error Boundary hierarchy:
  - `DashboardErrorBoundary` — catches application-level failures, renders a full-page fallback
  - `WidgetErrorBoundary` — wraps each individual widget, allows healthy widgets to continue rendering when one fails
- All error boundaries display user-friendly messages with retry buttons
- Development mode shows full stack traces; production mode shows sanitized messages only
- Error events are logged with structured context (widget name, customer ID, timestamp) — no sensitive data in logs

#### Data Export
- Export customer data, health score reports, and alert history in **CSV** and **JSON** formats
- Configurable filters: date range, customer segment, risk level
- File names include a timestamp and filter context (e.g. `health-scores_2026-03-11_critical.csv`)
- Progress indicator for exports exceeding 1 second; support cancellation for long-running exports
- Export actions are audit-logged (user, timestamp, filters applied)

#### Performance Optimization
- `React.memo` on all leaf widget components to prevent unnecessary re-renders
- `useMemo` / `useCallback` for expensive derived data and stable callbacks
- Route-level code splitting via `next/dynamic` with Suspense fallback skeletons
- Virtual scrolling for customer lists exceeding 50 rows
- Core Web Vitals targets: FCP < 1.5s, LCP < 2.5s, CLS < 0.1, TTI < 3.5s

#### Accessibility (WCAG 2.1 AA)
- Semantic landmark regions: `<header>`, `<main>`, `<nav>`, `<aside>` used appropriately
- All interactive elements reachable and operable via keyboard; logical tab order
- Skip-to-main-content link as the first focusable element
- Focus trapped inside modals/drawers; restored to trigger on close
- `aria-live` regions announce dynamic content updates (new alerts, score changes)
- Color is never the sole differentiator — icons or text labels accompany all color indicators
- All images and charts have descriptive `alt` text or `aria-label`

#### Security Hardening
- Content Security Policy headers configured in `next.config.ts`
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` response headers
- Input sanitization on all user-supplied search/filter values before rendering or querying
- Export endpoint validates permissions and applies rate limiting
- No customer PII or internal IDs exposed in error messages or client-side logs

### Data Requirements
- Orchestrates existing widget data flows — no new data models required
- `ExportRequest` interface for parameterizing export jobs:
  ```ts
  interface ExportRequest {
    format: 'csv' | 'json';
    dataType: 'customers' | 'health-scores' | 'alerts';
    filters: {
      dateRange?: { from: string; to: string };
      riskLevel?: 'Healthy' | 'Warning' | 'Critical';
      customerIds?: string[];
    };
  }
  ```

### Constraints
- **Stack:** Next.js 15 App Router, React 19, TypeScript (strict), Tailwind CSS
- **File locations:**
  - Orchestrator: `src/components/Dashboard.tsx` (update existing)
  - Error boundaries: `src/components/errors/DashboardErrorBoundary.tsx`, `WidgetErrorBoundary.tsx`
  - Export utilities: `src/lib/exportUtils.ts`
  - Security headers: `next.config.ts`
- Error boundary components must be class components (React requirement for `componentDidCatch`)
- Export must work entirely client-side using Blob/URL.createObjectURL — no server round-trip for data already in memory
- Performance optimizations must not alter observable widget behavior
- All accessibility changes must pass `axe-core` automated checks with zero violations
- Tailwind CSS only — no inline styles or CSS modules
- Rate limit export to 10 requests per minute per session (client-side enforcement)

### Acceptance Criteria
- [ ] A failing widget renders its `WidgetErrorBoundary` fallback without crashing other widgets
- [ ] `DashboardErrorBoundary` catches unrecoverable errors and displays a full-page recovery UI
- [ ] Retry button in error boundaries re-mounts the failed component
- [ ] CSV and JSON exports download correctly with the expected file name format
- [ ] Export includes only data matching the selected filters
- [ ] Export progress indicator appears for operations > 1 second and can be cancelled
- [ ] Initial page load meets all Core Web Vitals targets under simulated broadband throttling
- [ ] Lighthouse accessibility score ≥ 95 with zero axe-core critical violations
- [ ] Skip-to-content link is the first focusable element and navigates to `<main>`
- [ ] All modals trap focus and restore it correctly on close
- [ ] Dynamic content changes (new alert, score update) are announced by screen readers via live regions
- [ ] CSP and security headers are present on all page responses
- [ ] No sensitive data appears in client-side console logs or error messages in production mode
- [ ] No TypeScript errors in strict mode
