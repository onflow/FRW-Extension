import React from 'react';

import { TokenBalance } from './TokenBalance';

interface CurrencyValueProps {
  value: string;
  currencyCode: string;
  currencySymbol: string;
  className?: string;
  showCurrencyCode?: boolean;
}

export const CurrencyValue: React.FC<CurrencyValueProps> = ({
  value,
  currencyCode,
  currencySymbol,
  className,
  showCurrencyCode = true,
}) => {
  return (
    <TokenBalance
      value={value}
      className={className}
      prefix={currencySymbol}
      postFix={showCurrencyCode ? currencyCode : undefined}
      displayDecimals={2}
    />
  );
};
