import { QuantityType } from '@/lib/types';

export function getQuantityTypeLabel(quantityType?: QuantityType | null): string {
  switch (quantityType) {
    case QuantityType.QUARTER:
      return '250gm (Quarter)';
    case QuantityType.HALF:
      return '500gm (Half)';
    case QuantityType.THREE_QUARTER:
      return '750gm (Three Quarter)';
    case QuantityType.FULL:
      return '1kg (Full)';
    case QuantityType.CUSTOM:
      return 'Custom';
    default:
      return '1kg (Full)';
  }
}

export function getQuantityTypeMultiplier(quantityType?: QuantityType | null): number {
  switch (quantityType) {
    case QuantityType.QUARTER:
      return 0.25;
    case QuantityType.HALF:
      return 0.5;
    case QuantityType.THREE_QUARTER:
      return 0.75;
    case QuantityType.FULL:
      return 1.0;
    default:
      return 1.0;
  }
}





