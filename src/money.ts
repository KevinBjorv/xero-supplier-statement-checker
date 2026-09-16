import { fail } from './types.ts';
import { CURRENCY_MINOR_UNITS } from './currency-data.ts';
export const MINOR_UNITS = CURRENCY_MINOR_UNITS;
export function precision(currency: string): number {
  const value = MINOR_UNITS[currency];
  if (!Object.hasOwn(MINOR_UNITS,currency) || typeof value !== 'number') fail('UNSUPPORTED_CURRENCY', `Unsupported currency: ${currency}`);
  return value;
}
export function minor(value: string, currency: string): bigint {
  const dp = precision(currency);
  if (value.length > 100 || !/^-?\d+(?:\.\d+)?$/.test(value)) fail('INVALID_AMOUNT', 'Expected a plain decimal string.');
  const negative = value.startsWith('-');
  const [integer, fraction = ''] = value.replace(/^-/, '').split('.');
  if (/[1-9]/.test(fraction.slice(dp))) fail('AMOUNT_PRECISION', `Amount has excess precision for ${currency}. No rounding was performed.`);
  const units = BigInt(integer) * 10n ** BigInt(dp) + BigInt(fraction.slice(0, dp).padEnd(dp, '0') || '0');
  return negative ? -units : units;
}
export function decimal(value: bigint, currency: string): string {
  const dp = precision(currency), negative = value < 0n;
  const digits = (negative ? -value : value).toString().padStart(dp + 1, '0');
  return `${negative ? '-' : ''}${dp ? `${digits.slice(0, -dp)}.${digits.slice(-dp)}` : digits}`;
}
export function parseAmount(raw: string, format: 'decimal_dot' | 'decimal_comma'): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (/^\(.*\)$/.test(value)) value = `-${value.slice(1, -1)}`;
  const pattern = format === 'decimal_dot' ? /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/ : /^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/;
  if (!pattern.test(value)) fail('INVALID_AMOUNT_FORMAT', 'Amount does not match the selected decimal/grouping format.');
  return format === 'decimal_dot' ? value.replaceAll(',', '') : value.replaceAll('.', '').replace(',', '.');
}
