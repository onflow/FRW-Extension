import { Box, Dialog, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useState } from 'react';

import { type NFTItem } from '@onflow/flow-wallet-shared/types/nft-types';

import NftSearch from './NftSearch';

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  items: NFTItem[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onFilteredResults: (results: NFTItem[]) => void;
  createGridCard: (item: any, index: number) => JSX.Element;
  total: number;
  isLoadingAll: boolean;
  loadingMore: boolean;
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onClose,
  items,
  searchTerm,
  setSearchTerm,
  onFilteredResults,
  createGridCard,
  total,
  isLoadingAll,
  loadingMore,
}) => {
  const [filteredList, setFilteredList] = useState<NFTItem[]>([]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
          padding: '8px',
          overflowY: 'auto',
          paddingTop: '66px',
          boxShadow: 'none',
          backgroundImage: 'none',
        },
      }}
    >
      <Box>
        <Box
          sx={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <NftSearch
            items={items}
            onFilteredResults={(results) => {
              setFilteredList(results);
              onFilteredResults(results);
            }}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sx={{
              height: '52px',
              borderRadius: '16px',
            }}
          />
          <Typography
            variant="body1"
            color="text.secondary"
            onClick={onClose}
            sx={{ cursor: 'pointer', paddingRight: '8px' }}
          >
            Cancel
          </Typography>
        </Box>
        {items.length < total ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: '123px',
              alignItems: 'center',
              height: '100%',
              gap: '16px',
              padding: '16px',
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.60)', fontWeight: '400' }}
            >
              Loading NFTs...
            </Typography>
            <Box
              sx={{
                width: '144px',
                height: '8px',
                backgroundColor: '#FFFFFF29',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${(items.length / total) * 100}%`,
                  height: '100%',
                  backgroundColor: '#0AC26C',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.60)', fontWeight: '700' }}
            >
              {items.length} / {total} NFTs
            </Typography>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                padding: '8px',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.40)', fontWeight: '400' }}
              >
                {searchTerm ? 'Results' : 'Total'}
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.40)', fontWeight: '400' }}
              >
                {searchTerm ? filteredList.length : total} NFTs
              </Typography>
            </Box>
            <Box sx={{ maxHeight: '100vh' }}>
              {filteredList.length === 0 && searchTerm ? (
                <Box
                  sx={{
                    p: 4,
                    mt: '119px',
                    textAlign: 'center',
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.60))',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No relevent NFT found
                  </Typography>
                </Box>
              ) : (
                <Grid container sx={{ padding: '0', justifyContent: 'space-between' }}>
                  {(searchTerm ? filteredList : items).map((item, index) =>
                    createGridCard(item, index)
                  )}
                  {(searchTerm ? filteredList.length : items.length) % 2 !== 0 && (
                    <Box sx={{ height: '100%' }} />
                  )}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
};

export default SearchDialog;
