import React from 'react';

import { formatTokenValueOrPrice } from '@onflow/flow-wallet-shared/utils/formatTokenValue';
import { trimDecimalAmount } from '@onflow/flow-wallet-shared/utils/number';

interface TokenBalanceProps {
  value: string;
  decimals?: number;
  displayDecimals?: number;
  className?: string;
  showFull?: boolean;
  prefix?: string;
  postFix?: string;
}

export const TokenBalance: React.FC<TokenBalanceProps> = ({
  value,
  decimals = 18, // default to max decimals
  displayDecimals = -1,
  className = '',
  showFull = false,
  prefix = '',
  postFix = '',
}) => {
  if (!value || value === '') {
    return <span className={className}>{''}</span>;
  }

  if (showFull) {
    return (
      <span className={className} data-testid={`token-balance-${value}`}>
        {prefix}
        <span>{value}</span>
        {postFix && <span style={{ marginLeft: '0.25rem' }}>{postFix}</span>}
      </span>
    );
  }
  const decimalBalance = trimDecimalAmount(value, decimals, 'exact');

  const { formattedTokenValue } = formatTokenValueOrPrice(decimalBalance, 4, displayDecimals);
  const { leadingPart, zeroPart, endingPart } = formattedTokenValue;

  return (
    <span className={className} data-testid={`token-balance-${value}`}>
      {prefix}
      <span style={leadingPart === '' ? { padding: '0 0.25rem' } : undefined}>{leadingPart}</span>
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
