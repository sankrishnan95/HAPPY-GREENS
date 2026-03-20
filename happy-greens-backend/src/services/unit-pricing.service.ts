export type SupportedUnit = 'GRAM' | 'LITRE' | 'DOZEN' | 'PIECE';

export interface UnitConfig {
    unit: SupportedUnit;
    pricePerUnit: number;
    minQty: number;
    stepQty: number;
}

const INTEGER_UNITS = new Set<SupportedUnit>(['GRAM', 'DOZEN', 'PIECE']);
const STEP_TOLERANCE = 0.000001;

export const normalizeUnit = (value: unknown): SupportedUnit => {
    const raw = String(value || '').trim().toUpperCase();
    if (raw === 'G' || raw === 'GRAM' || raw === 'GRAMS' || raw === 'KG' || raw === 'KILOGRAM') return 'GRAM';
    if (raw === 'L' || raw === 'LT' || raw === 'LITRE' || raw === 'LITER' || raw === 'LITRES' || raw === 'LITERS') return 'LITRE';
    if (raw === 'DOZEN' || raw === 'DOZ') return 'DOZEN';
    return 'PIECE';
};

const roundTo = (value: number, digits: number) => {
    const multiplier = 10 ** digits;
    return Math.round(value * multiplier) / multiplier;
};

export const roundCurrency = (value: number) => roundTo(value, 2);

export const buildUnitConfig = (product: any): UnitConfig => {
    const unit = normalizeUnit(product?.unit);
    const pricePerUnit = Number(product?.price_per_unit ?? product?.pricePerUnit ?? product?.price ?? 0);
    const minQty = Number(product?.min_qty ?? product?.minQty ?? 1);
    const stepQty = Number(product?.step_qty ?? product?.stepQty ?? 1);

    return {
        unit,
        pricePerUnit: Number.isFinite(pricePerUnit) && pricePerUnit >= 0 ? roundCurrency(pricePerUnit) : 0,
        minQty: Number.isFinite(minQty) && minQty > 0 ? roundTo(minQty, INTEGER_UNITS.has(unit) ? 0 : 3) : 1,
        stepQty: Number.isFinite(stepQty) && stepQty > 0 ? roundTo(stepQty, INTEGER_UNITS.has(unit) ? 0 : 3) : 1,
    };
};

export const normalizeQuantityForUnit = (quantity: unknown, unit: SupportedUnit): number => {
    const parsed = Number(quantity);
    if (!Number.isFinite(parsed)) return Number.NaN;
    if (INTEGER_UNITS.has(unit)) return Math.round(parsed);
    return roundTo(parsed, 3);
};

export const isValidQuantityForConfig = (quantity: number, config: UnitConfig): boolean => {
    if (!Number.isFinite(quantity) || quantity <= 0) return false;
    if (INTEGER_UNITS.has(config.unit) && !Number.isInteger(quantity)) return false;
    if (quantity + STEP_TOLERANCE < config.minQty) return false;

    const delta = quantity - config.minQty;
    if (Math.abs(delta) <= STEP_TOLERANCE) return true;

    const steps = delta / config.stepQty;
    return Math.abs(steps - Math.round(steps)) <= STEP_TOLERANCE;
};

export const calculateLineTotal = (quantity: number, config: UnitConfig) => {
    const raw = config.unit === 'GRAM'
        ? (quantity / 1000) * config.pricePerUnit
        : quantity * config.pricePerUnit;

    return roundCurrency(raw);
};
