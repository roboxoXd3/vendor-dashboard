# Backend Changes Needed — Vendor Dashboard

**Date:** 2026-07-24 (updated 2026-07-25)  
**For:** BeSmartBackendDjango  
**Status:** All requested items are **done** on the backend. Vendor frontend is wired to use them.

---

## Completed

| # | Item | Backend status | Frontend status |
|---|------|----------------|-----------------|
| 1 | `upload_image` keeps `images` as a JSON array | Done (`load_product_images` / append / `store_product_images`) | BFF proxies response as array; no repair PATCH needed |
| 2 | Funnel / performance honour `?period=` | Done (`created_at__gte` via `_period_start`) | BFF already forwards `period`; analytics period filter now works |
| 3 | Statistics `inStock` / `lowStock` | Done on `own-products/statistics/` | Inventory widget uses these fields directly (no product-page scan) |

---

## No further backend work required for these items

Nothing else from this doc is outstanding for the vendor panel.
