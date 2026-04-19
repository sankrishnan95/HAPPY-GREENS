# Happy Greens Production Readiness

## Recommended scalable structure

### Frontend

```text
src/
  app/
    router/
    providers/
  components/
  features/
    cart/
    checkout/
    products/
    auth/
  lib/
    monitoring/
    analytics/
  pages/
  services/
  store/
  utils/
```

### Backend

```text
src/
  bootstrap/
  config/
  controllers/
  db/
    migrations/
  lib/
    logger.ts
    sentry.ts
  middleware/
  models/
  routes/
  services/
  utils/
```

## Database health check explanation

- `Duplicate orders`: finds duplicate purchases caused by retries, double-clicking, or payment retry collisions.
- `Critical null fields`: catches broken records early before they affect checkout, admin reporting, or customer support.
- `Orphan records`: finds data integrity issues where child rows exist without valid parent rows.

## Slow endpoint improvement checklist

- Add DB indexes for frequently filtered columns such as `orders.user_id`, `orders.created_at`, `products.category_id`, and `products.is_active`.
- Avoid repeated count queries on large product lists unless pagination metadata is required.
- Cache category trees and homepage offer data when they do not change often.
- Use `EXPLAIN ANALYZE` on admin analytics and order reporting queries before adding more joins.
- Move long-running analytics aggregation into materialized views or scheduled summaries if dashboard latency grows.
