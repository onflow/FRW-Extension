import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  Box,
  Card,
  Typography,
  IconButton,
  Button,
  ButtonBase,
  Tooltip,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { isValidEthereumAddress } from '@onflow/flow-wallet-shared/utils/address';
import { consoleError, consoleLog } from '@onflow/flow-wallet-shared/utils/console-log';

import {
  getCachedEvmCollectionNftItemListPage,
  getCachedCollectionNftItemsPage,
  triggerEvmCollectionNftItemsPageRefresh,
  triggerNftCollectionRefresh,
} from '@/data-model/cache-data-keys';
import { ReactComponent as SearchIcon } from '@/ui/assets/svg/searchIcon.svg';
import GridView from '@/ui/components/NFTs/GridView';
import SearchDialog from '@/ui/components/NFTs/SearchDialog';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useNftHook } from '@/ui/hooks/useNftHook';
import { truncate } from '@/ui/utils';

// import InfiniteScroll from 'react-infinite-scroller';

interface CollectionDisplay {
  name: string;
  squareImage: SquareImage;
  externalURL: string;
}

interface Info {
  collectionDisplay: CollectionDisplay;
}

interface File {
  url: string;
}

interface SquareImage {
  file: File;
}

interface CollectionDetailState {
  collection: any;
  ownerAddress: string;
  accessible: any;
}

const NFTCollectionDetail = () => {
  const { network } = useNetwork();
  consoleLog('NFTCollectionDetail', network);
  const usewallet = useWallet();
  const location = useParams();
  const uselocation = useLocation();
  const navigate = useNavigate();
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const collection_info = location['collection_address_name']?.split('.') || [];
  const address = collection_info[0];
  const collection_name = collection_info[1];
  const nftCount = collection_info[2];

  // Check if the collection is an EVM collection
  const isEvm = useMemo(() => isValidEthereumAddress(address), [address]);

  const getCollection = useCallback(
    async (ownerAddress: string, collection: string, offset: number | string = 0) => {
      consoleLog('getCollection', network, ownerAddress, collection, offset);
      if (!network) {
        return undefined;
      }
      if (isEvm) {
        return await getCachedEvmCollectionNftItemListPage(
          network,
          ownerAddress,
          collection,
          offset as number
        );
      }
      return await getCachedCollectionNftItemsPage(
        network,
        ownerAddress,
        collection,
        offset as number
      );
    },
    [network, isEvm]
  );

  const refreshCollection = useCallback(
    async (ownerAddress: string, collection: string, offset: number | string = 0) => {
      if (!network) {
        return;
      }
      if (isEvm) {
        triggerEvmCollectionNftItemsPageRefresh(
          network,
          ownerAddress,
          collection,
          offset as number
        );
      } else {
        triggerNftCollectionRefresh(network, ownerAddress, collection, offset as number);
      }
    },
    [network, isEvm]
  );

  const {
    list,
    allNfts,
    info,
    total,
    loading,
    isLoadingAll,
    loadingMore,
    refreshCollectionImpl,
    searchTerm,
    setSearchTerm,
  } = useNftHook({
    network,
    getCollection,
    refreshCollection,
    ownerAddress: address,
    collectionName: collection_name,
    isEvm: false,
  });

  // Check for saved state when returning from NFT detail view
  useEffect(() => {
    const savedState = localStorage.getItem('nftDetailState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.searchTerm && setSearchTerm) {
          setSearchTerm(parsedState.searchTerm);
        }
        localStorage.setItem('nftDetailState', '');
      } catch (e) {
        consoleError('Error parsing saved state:', e);
      }
    }
  }, [setSearchTerm]);

  const createGridCard = (data, index) => {
    return (
      <GridView
        data={data}
        blockList={[]}
        accessible={uselocation.state ? uselocation.state.accessible : []}
        key={data.unique_id}
        index={index}
        ownerAddress={address}
        collectionInfo={info}
        isEvm={false}
        searchTerm={searchTerm}
      />
    );
  };

  consoleLog(
    'CollectionDetail',
    network,
    address,
    collection_name,
    isEvm,
    list,
    allNfts,
    info,
    total,
    loading,
    isLoadingAll,
    loadingMore
  );

  return (
    <div className="page" id="scrollableDiv" style={{ overflow: 'auto' }}>
      {/* Header - back button and search button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 18px',
          alignItems: 'center',
        }}
      >
        <IconButton
          onClick={() => navigate('/dashboard')}
          sx={{
            padding: '0',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <ArrowBackIcon sx={{ color: 'icon.navi' }} />
        </IconButton>
        <IconButton
          onClick={() => setSearchOpen(true)}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            padding: '0',
            height: '20px',
          }}
        >
          <SearchIcon style={{ width: '20px', height: '20px' }} />
        </IconButton>
      </Box>

      {/* Collection info */}
      <Grid container sx={{ width: '100%', p: '0 25px 18px 25px' }}>
        {info && (
          <Grid
            sx={{
              justifyContent: 'center',
              backgroundColor: '#121212',
              width: '108px',
              height: '108px',
            }}
          >
            <img
              src={info?.collectionDisplay?.squareImage?.file?.url || info?.logo}
              alt="collection avatar"
              style={{ borderRadius: '12px', width: '100%', height: '100%' }}
            />
          </Grid>
        )}
        {!info && <Skeleton variant="rectangular" width={108} height={108} />}

        <Grid sx={{ ml: 0, pl: '18px' }}>
          <Typography component="div" color="text.primary" variant="h6">
            {info ? (
              truncate(info?.name || info?.contract_name, 16)
            ) : (
              <Skeleton variant="text" width={100} height={24} />
            )}
          </Typography>

          <Tooltip title={chrome.i18n.getMessage('Refresh')} arrow>
            <ButtonBase
              sx={{ flexGrow: 1, justifyContent: 'flex-start' }}
              onClick={refreshCollectionImpl}
            >
              <Typography component="div" color="text.secondary" variant="body1">
                {info ? (
                  `${total || 0} ${chrome.i18n.getMessage('NFTs')}`
                ) : (
                  <Skeleton variant="text" width={100} height={24} />
                )}
              </Typography>

              <ReplayRoundedIcon fontSize="inherit" />
            </ButtonBase>
          </Tooltip>

          <Box sx={{ p: 0, mt: '10px' }}>
            {info?.marketplace && (
              <Button
                startIcon={
                  <StorefrontOutlinedIcon width="16px" color="primary" sx={{ ml: '4px', mr: 0 }} />
                }
                sx={{
                  backgroundColor: 'neutral2.main',
                  color: 'text.secondary',
                  borderRadius: '12px',
                  textTransform: 'none',
                  p: '10px 8px',
                  mr: '10px',
                }}
              >
                <a
                  href={info.marketplace}
                  target="_blank"
                  style={{ textTransform: 'none', color: 'inherit', ml: 0 }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                    {chrome.i18n.getMessage('Market')}
                  </Typography>
                </a>
              </Button>
            )}
            {info?.collectionDisplay?.externalURL?.url && (
              <Button
                startIcon={
                  <PublicOutlinedIcon width="16px" color="primary" sx={{ ml: '4px', mr: 0 }} />
                }
                sx={{
                  backgroundColor: 'neutral2.main',
                  color: 'text.secondary',
                  borderRadius: '12px',
                  textTransform: 'none',
                  p: '10px 8px',
                }}
              >
                <a
                  href={info?.collectionDisplay?.externalURL?.url}
                  target="_blank"
                  style={{ textTransform: 'none', color: 'inherit', ml: 0 }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 500, fontSize: '14px' }}>
                    {chrome.i18n.getMessage('Website')}
                  </Typography>
                </a>
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Search dialog */}
      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        items={list}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onFilteredResults={(results) => setFilteredList(results)}
        createGridCard={createGridCard}
        isLoadingAll={isLoadingAll}
        total={total}
        loadingMore={loadingMore}
      />

      {/* NFTs grid */}
      {list && list.length > 0 && (
        <Grid
          container
          sx={{
            padding: '0 8px',
            justifyContent: 'space-between',
          }}
        >
          {list.map(createGridCard)}
          {list.length % 2 !== 0 && (
            <Card
              sx={{
                width: '48%',
                marginBottom: '16px',
                borderRadius: '12px',
                backgroundColor: 'transparent',
              }}
              elevation={0}
            />
          )}
        </Grid>
      )}
      {list && list.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No NFTs found in this collection
          </Typography>
        </Box>
      )}
    </div>
  );
};

export default NFTCollectionDetail;
