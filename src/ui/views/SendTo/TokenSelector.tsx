import { Box, Dialog, DialogContent, List } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { type ExtendedTokenInfo } from '@onflow/frw-shared/types';

import { LLHeader } from '@/ui/components';
import SearchInput from '@/ui/components/search-input';
import TokenItem from '@/ui/components/TokenLists/TokenItem';
import { useCoins } from '@/ui/hooks/useCoinHook';
import { COLOR_PRIMARY_DARK_121212 } from '@/ui/style/color';

interface TokenSelectorProps {
  open: boolean;
  onClose: () => void;
  onTokenSelect: (token: ExtendedTokenInfo) => void;
  currentToken?: ExtendedTokenInfo;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  open,
  onClose,
  onTokenSelect,
  currentToken,
}) => {
  const { coins } = useCoins();
  const [keyword, setKeyword] = useState('');
  const [filteredTokens, setFilteredTokens] = useState<ExtendedTokenInfo[]>([]);

  const handleSearch = useCallback(
    (searchTerm: string) => {
      setKeyword(searchTerm);
      if (!coins) return;

      const filtered = coins.filter((token) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          token.name.toLowerCase().includes(searchLower) ||
          token.symbol.toLowerCase().includes(searchLower) ||
          token.unit.toLowerCase().includes(searchLower)
        );
      });
      setFilteredTokens(filtered);
    },
    [coins]
  );

  const handleTokenClick = useCallback(
    (token: ExtendedTokenInfo, enabled: boolean) => {
      onTokenSelect(token);
      onClose();
    },
    [onTokenSelect, onClose]
  );

  React.useEffect(() => {
    if (coins) {
      setFilteredTokens(coins);
    }
  }, [coins]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: {
          borderRadius: 0,
        },
      }}
    >
      <DialogContent
        sx={{ p: '60px 0 0', height: '100%', backgroundColor: COLOR_PRIMARY_DARK_121212 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <LLHeader title={chrome.i18n.getMessage('Tokens')} help={false} onBackClick={onClose} />
          <Box sx={{ px: '16px', py: '16px' }}>
            <SearchInput
              value={keyword}
              onChange={handleSearch}
              placeholder={chrome.i18n.getMessage('Search_Token')}
              sx={{
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
            />
          </Box>

          <List
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              px: '8px',
            }}
          >
            {filteredTokens.map((token) => (
              <TokenItem
                key={token.unit}
                token={token}
                enabled={true}
                onClick={handleTokenClick}
                showSwitch={false}
                backgroundColor={COLOR_PRIMARY_DARK_121212}
                fontSize="16px"
                selected={currentToken?.unit === token.unit}
                showBalance={true}
                showPrice={true}
                customSx={{
                  borderRadius: 0,
                  border: 'none',
                  borderBottom: '1px solid #2A2A2A',
                }}
              />
            ))}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;
