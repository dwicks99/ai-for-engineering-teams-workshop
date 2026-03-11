# Spec: CustomerCard

## Feature: CustomerCard Component

### Context
- Displays a single customer's summary information as a card in the Customer Intelligence Dashboard
- Rendered within the `CustomerSelector` container component to show a list of customers
- Used by support/account teams to quickly identify customers and assess domain health at a glance
- Serves as the entry point for domain health monitoring — surfacing domains associated with each customer

### Requirements
- Display customer `name`, `company`, and `healthScore`
- Render a color-coded health indicator badge based on `healthScore`:
  - Red for scores 0–30 (poor)
  - Yellow for scores 31–70 (moderate)
  - Green for scores 71–100 (good)
- List customer `domains` when present (e.g. `acmecorp.com`, `portal.acmecorp.com`)
- When a customer has multiple domains, display the domain count (e.g. "2 domains")
- Card-based visual layout, clean and scannable
- Responsive design supporting both mobile and desktop viewports

### Constraints
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Data source:** `src/data/mock-customers.ts` — use the exported `Customer` interface
- **Props interface:**
  ```ts
  interface CustomerCardProps {
    customer: Customer; // from src/data/mock-customers.ts
  }
  ```
- The `domains` field is optional on `Customer` — handle customers with zero, one, or many domains
- Component must be a pure presentational component (no data fetching)
- File location: `src/components/CustomerCard.tsx`
- No inline styles — use Tailwind utility classes only
- Do not render fields not required by this spec (e.g. `email`, `subscriptionTier`, `createdAt`)

### Acceptance Criteria
- [ ] Customer name and company name are visible on the card
- [ ] Health score is displayed with the correct color indicator (red / yellow / green) per the defined thresholds
- [ ] Domains are listed when the `domains` array is present and non-empty
- [ ] Domain count label (e.g. "2 domains") is shown when the customer has more than one domain
- [ ] Card renders without errors when `domains` is undefined or empty
- [ ] Layout is usable on mobile (small viewports) and desktop
- [ ] Component accepts a single `customer` prop typed as `Customer`
- [ ] No TypeScript errors
