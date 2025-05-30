import React from 'react';

import { formatPrice } from '@/shared/utils/formatTokenValue';
import { numberWithCommas, trimDecimalAmount } from '@/shared/utils/number';

interface TokenBalanceProps {
  value: string;
  decimals?: number;
  className?: string;
  showFull?: boolean;
  prefix?: string;
  postFix?: string;
}

export const TokenBalance: React.FC<TokenBalanceProps> = ({
  value,
  decimals = 18, // default to max decimals
  className = '',
  showFull = false,
  prefix = '',
  postFix = '',
}) => {
  if (!value || value === '') {
    return <span className={className}>{''}</span>;
  }
  if (value === '0') {
    return <span className={className}>{'0'}</span>;
  }
  if (showFull) {
    return (
      <span className={className} data-testid={`token-balance-${value}`}>
        {prefix}
        <span>{numberWithCommas(value)}</span>
        {postFix && <span style={{ marginLeft: '0.25rem' }}>{postFix}</span>}
      </span>
    );
  }
  const decimalBalance = trimDecimalAmount(value, decimals, 'exact');

  const { formattedPrice } = formatPrice(decimalBalance);
  const { leadingPart, zeroPart, endingPart } = formattedPrice;

  return (
    <span className={className} data-testid={`token-balance-${value}`}>
      {prefix}
      <span style={leadingPart === '' ? { padding: '0 0.25rem' } : undefined}>
        {numberWithCommas(leadingPart)}
      </span>
      {zeroPart !== null && (
        <sub
          style={{
            fontSize: '0.7em',
            verticalAlign: 'baseline',
            position: 'relative',
            lineHeight: '1em',
            top: '0.3em',
          }}
        >
          {zeroPart}
        </sub>
      )}
      {endingPart !== null && endingPart}
      {postFix && <span style={{ marginLeft: '0.25rem' }}>{postFix}</span>}
    </span>
  );
};
