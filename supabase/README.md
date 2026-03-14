# Supabase migrations

Run migrations in the **Supabase Dashboard**:

1. Open your project → **SQL Editor** → **New query**
2. Paste the contents of the migration file
3. Click **Run**

## Migrations

- **`migrations/20250313000000_add_products_cod_allowed.sql`** – Adds `cod_allowed` (Pay on Delivery) column to `products`. Run this so the COD toggle in the vendor dashboard saves correctly.
