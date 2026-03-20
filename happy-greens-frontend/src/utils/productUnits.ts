export type ProductUnit = 'GRAM' | 'LITRE' | 'DOZEN' | 'PIECE';

export interface UnitAwareProduct {
    unit?: string;
    price?: number;
    discountPrice?: number;
    pricePerUnit?: number;
    minQty?: number;
    stepQty?: number;
}

const INTEGER_UNITS = new Set<ProductUnit>(['GRAM', 'DOZEN', 'PIECE']);
const STEP_TOLERANCE = 0.000001;

export const normalizeUnit = (value?: string): ProductUnit => {
    const raw = String(value || '').trim().toUpperCase();
    if (raw === 'GRAM' || raw === 'GRAMS' || raw === 'G' || raw === 'KG') return 'GRAM';
    if (raw === 'LITRE' || raw === 'LITRES' || raw === 'LITER' || raw === 'L' || raw === 'LT') return 'LITRE';
    if (raw === 'DOZEN' || raw === 'DOZ') return 'DOZEN';
    return 'PIECE';
};

const roundTo = (value: number, digits: number) => {
    const multiplier = 10 ** digits;
    return Math.round(value * multiplier) / multiplier;
};

export const roundCurrency = (value: number) => roundTo(value, 2);

export const getUnitLabel = (unit?: string) => {
    switch (normalizeUnit(unit)) {
        case 'GRAM': return 'kg';
        case 'LITRE': return 'litre';
        case 'DOZEN': return 'dozen';
        default: return 'piece';
    }
};

export const getQuantitySuffix = (unit?: string) => {
    switch (normalizeUnit(unit)) {
        case 'GRAM': return 'g';
        case 'LITRE': return 'L';
        case 'DOZEN': return 'dozen';
        default: return 'pc';
    }
};

export const getQuantityRules = (product: UnitAwareProduct) => {
    const unit = normalizeUnit(product.unit);
    const minQtyRaw = Number(product.minQty ?? 1);
    const stepQtyRaw = Number(product.stepQty ?? 1);
    const minQty = Number.isFinite(minQtyRaw) && minQtyRaw > 0 ? roundTo(minQtyRaw, INTEGER_UNITS.has(unit) ? 0 : 3) : 1;
    const stepQty = Number.isFinite(stepQtyRaw) && stepQtyRaw > 0 ? roundTo(stepQtyRaw, INTEGER_UNITS.has(unit) ? 0 : 3) : 1;
    return { unit, minQty, stepQty };
};

export const normalizeQuantity = (product: UnitAwareProduct, quantity: number) => {
    const { unit } = getQuantityRules(product);
    if (!Number.isFinite(quantity)) return Number.NaN;
    if (INTEGER_UNITS.has(unit)) return Math.round(quantity);
    return roundTo(quantity, 3);
};

export const isValidQuantity = (product: UnitAwareProduct, quantity: number) => {
    const { unit, minQty, stepQty } = getQuantityRules(product);
    if (!Number.isFinite(quantity) || quantity <= 0) return false;
    if (INTEGER_UNITS.has(unit) && !Number.isInteger(quantity)) return false;
    if (quantity + STEP_TOLERANCE < minQty) return false;
    const delta = quantity - minQty;
    if (Math.abs(delta) <= STEP_TOLERANCE) return true;
    const steps = delta / stepQty;
    return Math.abs(steps - Math.round(steps)) <= STEP_TOLERANCE;
};

export const getInitialQuantity = (product: UnitAwareProduct) => getQuantityRules(product).minQty;

export const incrementQuantity = (product: UnitAwareProduct, currentQuantity?: number) => {
    const { minQty, stepQty } = getQuantityRules(product);
    const base = currentQuantity && currentQuantity > 0 ? currentQuantity : minQty - stepQty;
    return normalizeQuantity(product, base + stepQty);
};

export const decrementQuantity = (product: UnitAwareProduct, currentQuantity: number) => {
    const { minQty, stepQty } = getQuantityRules(product);
    const next = normalizeQuantity(product, currentQuantity - stepQty);
    return next < minQty ? 0 : next;
};

export const getEffectivePricePerUnit = (product: UnitAwareProduct) => {
    const discountPrice = Number(product.discountPrice);
    if (Number.isFinite(discountPrice) && discountPrice >= 0) return discountPrice;
    const pricePerUnit = Number(product.pricePerUnit ?? product.price ?? 0);
    return Number.isFinite(pricePerUnit) ? pricePerUnit : 0;
};

export const calculateLineTotal = (product: UnitAwareProduct, quantity: number) => {
    const unit = normalizeUnit(product.unit);
    const pricePerUnit = getEffectivePricePerUnit(product);
    const raw = unit === 'GRAM' ? (quantity / 1000) * pricePerUnit : quantity * pricePerUnit;
    return roundCurrency(raw);
};

export const formatQuantity = (product: UnitAwareProduct, quantity: number) => {
    const { unit } = getQuantityRules(product);
    if (unit === 'GRAM') return `${Math.round(quantity)} g`;
    if (unit === 'LITRE') return `${Number(quantity).toFixed(quantity % 1 === 0 ? 0 : 2)} L`;
    if (unit === 'DOZEN') return `${Math.round(quantity)} dozen`;
    return `${Math.round(quantity)} pc`;
};
