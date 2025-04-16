import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {
  Typography,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Container,
  Grid,
  Box,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import React, { forwardRef, useImperativeHandle } from 'react';
import { useHistory } from 'react-router-dom';

import { type NFTCollections } from '@/shared/types/nft-types';
import { refreshNftCatalogCollections } from '@/shared/utils/cache-data-keys';
import ListSkeleton from '@/ui/FRWComponent/NFTs/ListSkeleton';
import { useNetwork } from '@/ui/hooks/useNetworkHook';
import { useNftCatalogCollections } from '@/ui/hooks/useNftHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import { useWallet } from '@/ui/utils/WalletContext';
import placeholder from 'ui/FRWAssets/image/placeholder.png';

import EmptyStatus from '../EmptyStatus';
interface ListTabProps {
  data: any;
  setCount: (count: any) => void;
  accessible: any;
  isActive: boolean;
  activeCollection: any;
}

interface State {
  collectionLoading: boolean;
  collections: NFTCollections[];
  isCollectionEmpty: boolean;
  ownerAddress: string;
}

const useStyles = makeStyles(() => ({
  collectionContainer: {
    width: '100%',
    justifyContent: 'center',
    padding: '0 8px',
  },
  collectionCard: {
    display: 'flex',
    width: '100%',
    height: '64px',
    margin: '12px auto',
    boxShadow: 'none',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
  },
  skeletonCard: {
    display: 'flex',
    width: '100%',
    height: '72px',
    margin: '12px auto',
    boxShadow: 'none',
    padding: 'auto',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '12px',
  },
  collectionImg: {
    borderRadius: '12px',
    width: '48px',
    padding: '8px',
  },
  arrow: {
    position: 'absolute',
    top: 0,
  },
  actionarea: {
    width: '100%',
    height: '100%',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
}));

const CollectionView = ({
  name,
  logo,
  count,
  index,
  contract_name,
  ownerAddress,
  isAccessible,
}: {
  name: string;
  logo: string;
  count: number;
  index: number;
  contract_name: string;
  ownerAddress: string;
  isAccessible: boolean;
}) => {
  const history = useHistory();
  const classes = useStyles();

  const handleClick = () => {
    console.log('handleClick', ownerAddress, contract_name, count);
    history.push({
      pathname: `/dashboard/nested/collectiondetail/${ownerAddress}.${contract_name}.${count}`,
      state: {
        collection: { name, logo, count, index, contract_name, ownerAddress, isAccessible },
        ownerAddress,
        accessible: isAccessible,
      },
    });
  };
  return (
    <Card
      key={name}
      sx={{ borderRadius: '12px', backgroundColor: '#000000' }}
      className={classes.collectionCard}
    >
      <CardActionArea
        sx={{
          borderRadius: '12px',
          paddingRight: '8px',
        }}
        className={classes.actionarea}
        onClick={isAccessible ? handleClick : undefined}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <CardMedia
            component="img"
            sx={{
              width: '48px',
              height: '48px',
              padding: '8px',
              borderRadius: '12px',
              justifyContent: 'center',
              mt: '8px',
            }}
            image={logo || placeholder}
            alt={name}
          />
          <CardContent sx={{ flex: '1 0 auto', padding: '8px 4px' }}>
            <Grid container justifyContent="space-between" alignItems="center" sx={{ pr: 2 }}>
              <Grid item sx={{ flex: 1 }}>
                <Typography component="div" variant="body1" color="#fff" sx={{ mb: 0 }}>
                  {name}
                </Typography>
                {isAccessible ? (
                  <Typography
                    variant="body1"
                    sx={{ fontSize: '14px' }}
                    color="#B2B2B2"
                    component="div"
                  >
                    {count} {chrome.i18n.getMessage('collectibles')}
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: 'neutral.text',
                      fontSize: '10px',
                      width: '80px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {chrome.i18n.getMessage('Inaccessible')}
                  </Box>
                )}
              </Grid>
              <Grid item>
                <ArrowForwardIcon color="primary" />
              </Grid>
            </Grid>
          </CardContent>
        </Box>
      </CardActionArea>
    </Card>
  );
};

const extractContractAddress = (collection) => {
  return collection.split('.')[2];
};

const checkContractAddressInCollections = (
  nftCollections: NFTCollections,
  activeCollection: any
) => {
  console.log('checkContractAddressInCollections', nftCollections, activeCollection);
  const contractAddressWithout0x = nftCollections.collection.contract_name;
  const isActiveCollect = activeCollection.some((collection) => {
    const extractedAddress = extractContractAddress(collection);
    if (extractedAddress === contractAddressWithout0x) {
      console.log('nft is ', contractAddressWithout0x, extractedAddress);
    }
    return extractedAddress === contractAddressWithout0x;
  });
  return isActiveCollect;
};

const ListTab = forwardRef((props: ListTabProps, ref) => {
  const history = useHistory();
  const classes = useStyles();
  const usewallet = useWallet();

  const { currentWallet } = useProfiles();
  const { network } = useNetwork();
  const nftCollectionsList = useNftCatalogCollections(network, currentWallet.address);
  const collectionLoading = nftCollectionsList === undefined;

  const isCollectionEmpty = nftCollectionsList?.length === 0;
  const ownerAddress = currentWallet.address;

  useImperativeHandle(ref, () => ({
    reload: () => {
      refreshNftCatalogCollections(network, currentWallet.address);
    },
  }));

  return (
    <Container className={classes.collectionContainer}>
      {collectionLoading ? (
        <ListSkeleton />
      ) : isCollectionEmpty ? (
        <EmptyStatus />
      ) : (
        nftCollectionsList.map((collections, index) => (
          <CollectionView
            key={collections.collection.name}
            name={collections.collection.name}
            logo={collections.collection.logo}
            count={collections.count}
            index={index}
            contract_name={collections.collection.id}
            ownerAddress={ownerAddress}
            isAccessible={
              props.isActive ||
              checkContractAddressInCollections(collections, props.activeCollection)
            }
          />
        ))
      )}
    </Container>
  );
});

export default ListTab;
