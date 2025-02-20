import SearchIcon from '@mui/icons-material/Search';
import {
  Typography,
  Box,
  InputAdornment,
  Input,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Skeleton,
  ButtonGroup,
  Button,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { type NFTModel } from '@/shared/types/network-types';
import { LLHeader } from '@/ui/FRWComponent';
import { useWallet } from 'ui/utils';

import CollectionCard from './AddNFTCard';
import AddNFTConfirmation from './AddNFTConfirmation';

const useStyles = makeStyles(() => ({
  inputWrapper: {
    paddingLeft: '18px',
    paddingRight: '18px',
    // width: '100%',
  },
  inputBox: {
    minHeight: '56px',
    backgroundColor: '#282828',
    zIndex: '999',
    borderRadius: '16px',
    boxSizing: 'border-box',
    width: '100%',
  },
  grid: {
    width: '100%',
    margin: 0,
    // paddingLeft: '15px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'flex-start',
    padding: '10px 13px',
    // marginLeft: 'auto'
  },
  skeletonCard: {
    display: 'flex',
    backgroundColor: '#000000',
    width: '100%',
    height: '72px',
    margin: '12px auto',
    boxShadow: 'none',
    padding: 'auto',
  },
}));

export interface CollectionItem {
  name?: string;
  description?: string;
  official_website?: string;
  logo?: string;
  address?: {
    mainnet?: string;
    testnet?: string;
    crescendo?: string;
  };
  contract_name?: string;
  banner?: string;
  marketplace?: string;
  hidden?: boolean;
  added?: boolean;
}

const AddList = () => {
  const classes = useStyles();
  const history = useHistory();
  const usewallet = useWallet();
  const [collections, setCollections] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState('all');

  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTModel | null>(null);

  const filteredCollections = collections.filter((ele) => {
    if (filter === 'all') return true;
    if (filter === 'enabled') return ele.added;
    if (filter === 'notEnabled') return !ele.added;
    return true;
  });

  const fetchList = useCallback(
    async (data) => {
      setStatusLoading(true);
      try {
        const enabledList = await usewallet.openapi.getEnabledNFTList();
        if (enabledList.length > 0) {
          data.map((item) => {
            item.added =
              enabledList.filter(
                (enabled) =>
                  enabled.contract_name === item.contractName && enabled.address === item.address
              ).length > 0;
          });
        }

        setCollections(data);
      } finally {
        setStatusLoading(false);
      }
    },
    [usewallet, setStatusLoading, setCollections]
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const nftList = await usewallet.openapi.getAllNft();
      console.log('nftList', nftList);
      setCollections(nftList);
      return nftList;
    } finally {
      setLoading(false);
    }
  }, [usewallet, setLoading, setCollections]);

  useEffect(() => {
    fetchData().then((data) => {
      fetchList(data);
    });
  }, [fetchData, fetchList]);

  const handleNFTClick = (token) => {
    // if (!isEnabled) {
    setSelectedNFT(token);
    setConfirmationOpen(true);
    // }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const filteredCollections = collections.map((collection: CollectionItem) => {
      if (
        !collection.name?.toLowerCase().includes(e.target.value.toLowerCase()) &&
        !collection.description?.toLowerCase().includes(e.target.value.toLowerCase())
      ) {
        return {
          ...collection,
          hidden: true,
        };
      } else {
        return {
          ...collection,
          hidden: false,
        };
      }
    });
    setCollections(filteredCollections);
  };

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Add__Collection')} help={false} />

      <Box>
        <div className={classes.inputWrapper}>
          <Input
            type="search"
            className={classes.inputBox}
            placeholder={chrome.i18n.getMessage('Seach__NFT__Collection')}
            autoFocus
            disableUnderline
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon color="primary" sx={{ ml: '10px', my: '5px', fontSize: '24px' }} />
              </InputAdornment>
            }
            onChange={handleSearch}
          />
        </div>
        <Box sx={{ padding: '8px 18px', display: 'flex', flexDirection: 'column' }}>
          {loading && (
            <Grid container className={classes.grid}>
              {[...Array(4).keys()].map((key) => (
                <Card
                  key={key}
                  sx={{ borderRadius: '12px', backgroundColor: 'transparent', padding: '12px' }}
                  className={classes.skeletonCard}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    <CardMedia
                      sx={{
                        width: '48px',
                        height: '48px',
                        justifyContent: 'center',
                      }}
                    >
                      <Skeleton variant="circular" width={48} height={48} />
                    </CardMedia>
                    <CardContent sx={{ flex: '1 0 auto', padding: '0 8px' }}>
                      <Skeleton variant="text" width={280} />
                      <Skeleton variant="text" width={150} />
                    </CardContent>
                  </Box>
                </Card>
              ))}
            </Grid>
          )}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
            }}
          >
            {/* Button group for filter options */}
            <Box sx={{ display: 'inline-flex', gap: '10px' }}>
              <Button
                onClick={() => setFilter('all')}
                sx={{
                  display: 'inline-flex',
                  height: '36px',
                  padding: '9px 12px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                  borderRadius: '36px',
                  border: `1.5px solid ${filter === 'all' ? '#41CC5D' : '#FFFFFF66'}`,
                  backgroundColor: 'transparent',
                  color: filter === 'all' ? '#41CC5D' : '#FFFFFF66',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#41CC5D',
                  },
                }}
              >
                All
              </Button>
              <Button
                onClick={() => setFilter('enabled')}
                sx={{
                  display: 'inline-flex',
                  height: '36px',
                  padding: '9px 12px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                  borderRadius: '36px',
                  border: `1.5px solid ${filter === 'enabled' ? '#41CC5D' : '#FFFFFF66'}`,
                  backgroundColor: 'transparent',
                  color: filter === 'enabled' ? '#41CC5D' : '#FFFFFF66',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#41CC5D',
                  },
                }}
              >
                Enabled
              </Button>
              <Button
                onClick={() => setFilter('notEnabled')}
                sx={{
                  display: 'inline-flex',
                  height: '36px',
                  padding: '9px 12px',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  flexShrink: 0,
                  borderRadius: '36px',
                  border: `1.5px solid ${filter === 'notEnabled' ? '#41CC5D' : '#FFFFFF66'}`,
                  backgroundColor: 'transparent',
                  color: filter === 'notEnabled' ? '#41CC5D' : '#FFFFFF66',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: '#41CC5D',
                  },
                }}
              >
                Not Enabled
              </Button>
            </Box>
          </Box>

          <Typography sx={{ color: '#5E5E5E', fontSize: '14px', fontWeight: 600 }}>
            {chrome.i18n.getMessage('COLLECTION__LIST')}
          </Typography>
          {filteredCollections
            .filter((ele) => !ele.hidden)
            .map((ele, index) => (
              <CollectionCard
                item={ele}
                key={index}
                setAlertOpen={setAlertOpen}
                isLoading={statusLoading}
                onClick={handleNFTClick}
              />
            ))}
        </Box>
      </Box>

      <AddNFTConfirmation
        isConfirmationOpen={isConfirmationOpen}
        data={selectedNFT}
        handleCloseIconClicked={() => setConfirmationOpen(false)}
        handleCancelBtnClicked={() => setConfirmationOpen(false)}
        handleAddBtnClicked={() => {
          setConfirmationOpen(false);
        }}
      />
    </div>
  );
};

export default AddList;
