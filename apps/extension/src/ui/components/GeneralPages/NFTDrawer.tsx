// src/ui/views/MoveBoard/components/NFTMoveDrawer.tsx
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, CardMedia, Drawer, IconButton, Skeleton, Typography } from '@mui/material';
import React, { useState } from 'react';

import moveSelectDrop from '@/ui/assets/svg/moveSelectDrop.svg';
import selected from '@/ui/assets/svg/selected.svg';
import { LLSpinner } from '@/ui/components';
import NftSearch from '@/ui/components/NFTs/NftSearch';

interface NFTMoveDrawerProps {
  showMoveBoard: boolean;
  handleCancelBtnClicked: () => void;
  isLoading: boolean;
  currentCollection: any;
  collectionDetail: any;
  nftIdArray: number[];
  onCollectionSelect: () => void;
  onNFTSelect: (nftId: number) => void;
  sending: boolean;
  failed: boolean;
  onMove: () => void;
  moveType: 'toChild' | 'fromChild' | 'evm';
  AccountComponent: React.ReactNode;
  nfts: any[];
  replaceIPFS?: (url: string) => string;
}

export const NFTMoveDrawer: React.FC<NFTMoveDrawerProps> = ({
  showMoveBoard,
  handleCancelBtnClicked,
  isLoading,
  currentCollection,
  collectionDetail,
  nftIdArray,
  onCollectionSelect,
  onNFTSelect,
  sending,
  failed,
  onMove,
  moveType,
  AccountComponent,
  nfts,
  replaceIPFS = (url) => url,
}) => {
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Determine which NFTs to display based on search term
  const displayNfts = searchTerm ? filteredList : nfts;

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1100 !important' }}
      transitionDuration={300}
      open={showMoveBoard}
      PaperProps={{
        sx: { width: '100%', height: 'calc(100% - 56px)', background: '#222' },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', px: '20px' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            height: '24px',
            margin: '20px 0',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{
              fontSize: '20px',
              textAlign: 'center',
              fontFamily: 'e-Ukraine',
              lineHeight: '24px',
              fontWeight: '700',
            }}
          >
            {chrome.i18n.getMessage('select')} NFTs
          </Typography>
          <IconButton onClick={handleCancelBtnClicked}>
            <CloseIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
          </IconButton>
        </Box>
      </Box>

      {AccountComponent}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: '0',
          mt: '10px',
          padding: '0 18px',
        }}
      >
        <Box sx={{ height: '24px', padding: '6px 0' }}>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{ fontSize: '14px', textAlign: 'center', lineHeight: '24px', fontWeight: '600' }}
          >
            {chrome.i18n.getMessage('collection')}
          </Typography>
        </Box>

        {currentCollection && collectionDetail && (
          <Button onClick={onCollectionSelect}>
            {currentCollection.logo && (
              <CardMedia
                component="img"
                sx={{
                  width: '24px',
                  height: '24px',
                  display: 'inline',
                  borderRadius: '8px',
                  marginRight: '8px',
                  objectFit: 'cover',
                  objectPosition: 'left !important',
                }}
                image={currentCollection.logo}
              />
            )}
            <Typography
              variant="body1"
              component="div"
              display="inline"
              color="text"
              sx={{ fontSize: '14px', textAlign: 'center', lineHeight: '24px', fontWeight: '600' }}
            >
              {currentCollection.CollectionName}
            </Typography>
            <CardMedia
              component="img"
              sx={{ width: '12px', height: '12px', marginLeft: '4px' }}
              image={'https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png'}
            />
            <CardMedia
              component="img"
              sx={{ width: '16px', height: '16px', marginLeft: '4px' }}
              image={moveSelectDrop}
            />
          </Button>
        )}
      </Box>
      <Box sx={{ padding: '0 8px' }}>
        <NftSearch
          items={nfts}
          onFilteredResults={(results) => setFilteredList(results)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sx={{
            fontSize: '14px',
            '& .MuiSvgIcon-root': {
              width: '14px',
              height: '14px',
            },
          }}
        />
      </Box>

      {!isLoading ? (
        <Box
          sx={{
            display: 'flex',
            mb: '0',
            padding: '16px',
            gap: '4px',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            height: '150px',
            overflowY: 'scroll',
          }}
        >
          {displayNfts && displayNfts.length > 0 ? (
            displayNfts.map((nft) => (
              <Box
                key={nft.id}
                sx={{
                  display: 'flex',
                  position: 'relative',
                  width: '84px',
                  height: '84px',
                  borderRadius: '16px',
                  marginBottom: '3px',
                  border: nftIdArray.includes(nft.id) && '1px solid #41CC5D',
                }}
              >
                <Button
                  onClick={() => onNFTSelect(nft.id)}
                  sx={{ padding: 0, borderRadius: '16px', backgroundColor: '#333' }}
                >
                  {nftIdArray.includes(nft.id) && (
                    <Box
                      sx={{
                        backgroundColor: '#00000099',
                        borderRadius: '16px',
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{
                          width: '16px',
                          borderRadius: '16px',
                          height: '16px',
                          top: '8px',
                          right: '8px',
                          zIndex: '2000',
                          position: 'absolute',
                        }}
                        image={selected}
                      />
                    </Box>
                  )}
                  <CardMedia
                    component="img"
                    alt={nft.name}
                    height="84px"
                    width="84px"
                    sx={{ borderRadius: '16px' }}
                    image={moveType === 'evm' ? nft.thumbnail : replaceIPFS(nft.thumbnail)}
                    title={nft.name}
                  />
                </Button>
              </Box>
            ))
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Typography sx={{ color: '#FFFFFF66', fontSize: '14px', fontWeight: '700' }}>
                0 NFTs
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <LoadingGrid />
      )}

      <Box sx={{ flex: '1' }}></Box>
      <Box sx={{ px: '16px' }}>
        <Button
          onClick={onMove}
          variant="contained"
          color="success"
          size="large"
          disabled={!collectionDetail || nfts.length === 0}
          sx={{
            height: '50px',
            width: '100%',
            borderRadius: '12px',
            textTransform: 'capitalize',
            display: 'flex',
            gap: '12px',
            marginBottom: '33px',
          }}
        >
          {sending ? (
            <>
              <LLSpinner size={28} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                {chrome.i18n.getMessage('Sending')}
              </Typography>
            </>
          ) : (
            <>
              {failed ? (
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                  {chrome.i18n.getMessage('Transaction__failed')}
                </Typography>
              ) : (
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="text.primary">
                  {chrome.i18n.getMessage('Move')} {nftIdArray.length > 0 && nftIdArray.length} NFT
                  {nftIdArray.length > 1 && 's'}
                </Typography>
              )}
            </>
          )}
        </Button>
      </Box>
    </Drawer>
  );
};

const LoadingGrid = () => (
  <Box sx={{ display: 'flex', mb: '18px', padding: '18px', gap: '4px' }}>
    {[...Array(4)].map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          width: '84px',
          height: '84px',
          borderRadius: '16px',
          backgroundColor: '#333',
        }}
      >
        <Skeleton
          variant="rectangular"
          width={84}
          height={84}
          sx={{ margin: '0 auto', borderRadius: '16px' }}
        />
      </Box>
    ))}
  </Box>
);

export default NFTMoveDrawer;
