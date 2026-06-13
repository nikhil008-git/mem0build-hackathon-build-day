# @rift/cost-calculator

> **Status:** Planned (Phase 1) — no code yet.

Token cost calculation. Maps model name + token counts to USD cost using maintained pricing tables.

## Usage (Planned)

```typescript
import { calculateCost } from '@rift/cost-calculator';

const cost = calculateCost({
  model: 'gpt-4o',
  promptTokens: 450,
  completionTokens: 30,
});
// → 0.0023
```

## Exports

| Export | Description |
|--------|-------------|
| `calculateCost` | Compute USD cost from model + tokens |
| `getModelPricing` | Lookup pricing for a model |
| `MODEL_PRICING` | Pricing table constant |

## Used By

- `apps/worker` — enrich stage cost calculation
- `@rift/sdk-core` — optional client-side cost estimation
