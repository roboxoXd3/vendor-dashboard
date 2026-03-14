-- Add Pay on Delivery (COD) column to products table.
-- Run this in Supabase: Dashboard → SQL Editor → New query → paste and Run.
-- Vendors toggle COD per product in the dashboard; the website reads this to show/hide COD at checkout.

ALTER TABLE products
ADD COLUMN IF NOT EXISTS cod_allowed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN products.cod_allowed IS 'When true, customers can pay on delivery (COD) for this product.';
