-- Migration to add applicable_category_id and applicable_product_id to coupons

ALTER TABLE coupons
ADD COLUMN applicable_category_id integer REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN applicable_product_id integer REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX idx_coupons_applicable_category ON coupons(applicable_category_id);
CREATE INDEX idx_coupons_applicable_product ON coupons(applicable_product_id);
