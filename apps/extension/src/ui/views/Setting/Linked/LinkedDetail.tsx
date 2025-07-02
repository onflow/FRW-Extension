import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import {
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  Box,
  Tabs,
  Tab,
  CardMedia,
  Skeleton,
  Card,
  CardContent,
  CardActionArea,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';

import { type NftCollection } from '@/shared/types/network-types';
import { type ChildAccountNFTs, type ChildAccountNFTsStore } from '@/shared/utils/cache-data-keys';
import IconNext from '@/ui/assets/svg/nextgray.svg';
import { LLHeader, LLSecondaryButton } from '@/ui/components';
import CheckCircleIcon from '@/ui/components/iconfont/IconCheckmark';
import IconCopy from '@/ui/components/iconfont/IconCopy';
import { useChildAccountAllowTypes, useCurrentId, useUserInfo } from '@/ui/hooks/use-account-hooks';
import { useChildAccountFt } from '@/ui/hooks/use-coin-hooks';
import { useChildAccountNfts, useNftCollectionList } from '@/ui/hooks/useNftHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';

import EditAccount from './EditAccount';
import UnlinkAccount from './UnlinkAccount';

interface TicketToken {
  id: string;
  balance: string;
}
interface Collection {
  id: string;
  contractName: string;
  logo?: string;
  address: string;
  name: string;
  total: number;
  nfts: string[];
}

const extractContractName = (collection: string) => {
  return collection.split('.')[2];
};

const findObjectByContractName = (
  contractName: string,
  collections: NftCollection[] | undefined
): NftCollection | undefined => {
  const extractedContract = extractContractName(contractName);
  const foundObject = extractedContract
    ? collections?.find(
        (item) =>
          item.contract_name === extractedContract || item.contractName === extractedContract
      )
    : undefined;
  return foundObject;
};

const nftCollectionToCollection = (
  nftCollection: NftCollection,
  childAccountNfts: ChildAccountNFTs
) => {
  const nftCollectionContractName = nftCollection.contractName || nftCollection.contract_name;
  const foundNftId = Object.keys(childAccountNfts).find((nftId) => {
    const parts = nftId.split('.');
    const address = `0x${parts[1]}`;
    const contractName = parts[2];
    return nftCollection.address === address && nftCollectionContractName === contractName;
  });
  const nfts = foundNftId ? childAccountNfts[foundNftId] : [];
  return {
    ...nftCollection,
    total: nfts.length,
    nfts: nfts,
  };
};

const NftContent = ({
  availableNftCollection,
  hideEmpty,
  navigateWithState,
}: {
  availableNftCollection: Collection[];
  hideEmpty: boolean;
  navigateWithState: (data: Collection) => void;
}) => {
  const filteredNftCollection = availableNftCollection.filter(
    (item) => !hideEmpty || (hideEmpty && item.total && item.total > 0)
  );

  return (
    <Box sx={{ fontSize: '14px', color: '#FFFFFF', marginTop: '8px' }}>
      {filteredNftCollection.length ? (
        filteredNftCollection.map((item, index) => {
          const collectedText = chrome.i18n.getMessage('Collected');

          return (
            <CardActionArea
              sx={{
                display: 'flex',
                height: '64px',
                marginTop: '8px',
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: '#292929',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
              key={index}
              onClick={() => navigateWithState(item)}
            >
              <img
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '32px',
                }}
                src={item.logo}
                alt={item.name}
              />
              <Typography
                sx={{
                  color: '#FFF',
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: '18px',
                  textTransform: 'capitalize',
                  marginLeft: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '50%',
                  alignItems: 'center',
                }}
              >
                {item.name}
              </Typography>
              <Box sx={{ flex: 1 }}></Box>
              <Typography
                sx={{
                  color: '#BABABA',
                  textAlign: 'right',
                  fontFamily: 'Inter',
                  fontSize: 12,
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: '20px',
                  alignItems: 'center',
                }}
              >
                {item.total + ' '}
                {collectedText}
              </Typography>
              <CardMedia
                sx={{
                  width: '4px',
                  height: '8px',
                  marginLeft: '16px',
                  alignItems: 'center',
                }}
                image={IconNext}
              />
            </CardActionArea>
          );
        })
      ) : (
        <Box
          sx={{
            display: 'flex',
            height: '64px',
            marginTop: '8px',
            padding: '8px 20px',
            borderRadius: '16px',
            backgroundColor: '#292929',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              fontSize: '12px',
              color: '#bababa',
              textAlign: 'center',
            }}
          >
            No accessible NFT
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const FtContent = ({ availableFt }: { availableFt: TicketToken[] | undefined }) => (
  <Box sx={{ fontSize: '14px', color: '#FFFFFF', marginTop: '8px' }}>
    {availableFt?.map((token, index) => {
      return (
        <Box
          sx={{
            display: 'flex',
            height: '64px',
            marginTop: '8px',
            padding: '16px 20px',
            borderRadius: '16px',
            backgroundColor: '#292929',
            justifyContent: 'space-between',
          }}
          key={index}
        >
          <img
            style={{
              height: '32px',
              width: '32px',
              borderRadius: '32px',
              backgroundColor: 'text.secondary',
              objectFit: 'cover',
              marginRight: '8px',
            }}
            src={'https://lilico.app/placeholder-2.0.png'}
          />
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: '#fff',
              textAlign: 'right',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '20px',
            }}
          >
            {token.id.split('.')[2]}
          </Typography>
          <Box sx={{ flex: 1 }}></Box>
          <Typography
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: '#BABABA',
              textAlign: 'right',
              fontFamily: 'Inter',
              fontSize: '12px',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '20px',
            }}
          >
            {parseFloat(token.balance).toFixed(3)} {token.id.split('.')[2]}
          </Typography>
        </Box>
      );
    })}
  </Box>
);

const LinkedDetail = () => {
  const location = useParams();

  const navigate = useNavigate();
  const [unlinking, setUnlinking] = useState<boolean>(false);
  const [isEdit, setEdit] = useState<boolean>(false);
  const [hideEmpty, setHide] = useState<boolean>(false);
  const [value, setValue] = useState('one');

  const { activeAccountType, childAccounts, mainAddress, network } = useProfiles();

  const active = activeAccountType === 'main';
  // The child account address is the key in the url
  const childAccountAddress: string | undefined = location['key'];
  const childAccount = childAccounts?.find((account) => account.address === childAccountAddress);
  const childAccountAllowTypes = useChildAccountAllowTypes(
    network,
    mainAddress,
    childAccountAddress
  );
  const nftCollectionList = useNftCollectionList(network);
  const allChildAccountNfts: ChildAccountNFTsStore | undefined = useChildAccountNfts(
    network,
    mainAddress
  );
  const childAccountNfts: ChildAccountNFTs | undefined = useMemo(
    () => (childAccountAddress ? allChildAccountNfts?.[childAccountAddress] : {}),
    [allChildAccountNfts, childAccountAddress]
  );

  const availableFt = useChildAccountFt(network, mainAddress, childAccountAddress);

  const availableNftCollection: Collection[] | undefined = useMemo(
    () =>
      childAccountAllowTypes === undefined
        ? undefined
        : Object.values(
            childAccountAllowTypes
              .map((active) => {
                const collection = findObjectByContractName(active, nftCollectionList);
                if (collection) {
                  return nftCollectionToCollection(collection, childAccountNfts ?? {});
                }
              })
              .filter((collection) => collection !== undefined)
              .reduce(
                (acc, collection) => {
                  const contractName = collection.contractName || collection.contract_name;
                  if (acc[contractName] !== undefined) {
                    acc[contractName].total += collection.total;
                    acc[contractName].nfts.push(...collection.nfts!);
                  } else {
                    acc[contractName] = {
                      ...collection,
                      contractName: contractName,
                    };
                  }
                  return acc;
                },
                {} as { [key: string]: Collection }
              )
          ),
    [childAccountAllowTypes, nftCollectionList, childAccountNfts]
  );

  const loading = availableNftCollection === undefined;

  const currentId = useCurrentId();
  const userInfo = useUserInfo(currentId);

  const handleChange = (_, newValue: string) => {
    setValue(newValue);
  };

  const showUnlink = async (condition) => {
    await setUnlinking(condition);
  };

  const toggleEdit = () => {
    setEdit(!isEdit);
  };

  const toggleHide = (event) => {
    event.stopPropagation();
    const prevEmpty = hideEmpty;
    setHide(!prevEmpty);
  };

  const navigateWithState = (data) => {
    const state = { nft: data };
    localStorage.setItem('nftLinkedState', JSON.stringify(state));
    const storagePath = data.path.storage_path.split('/')[2];
    if (data.total) {
      navigate(
        `/dashboard/nested/linked/collectiondetail/${childAccountAddress + '.' + storagePath + '.' + data.total + '.linked'}`,
        {
          state: {
            collection: data,
            ownerAddress: childAccountAddress,
          },
        }
      );
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          px: '16px',
        }}
      >
        <LLHeader title={chrome.i18n.getMessage('Linked_Account')} help={false} />

        <IconButton
          onClick={() => {
            toggleEdit();
          }}
        >
          <EditRoundedIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        {/* <img src={logo} alt='logo' className={classes.logo} /> */}
        <Box sx={{ display: 'flex', flexDirection: 'column', padding: '18px', height: '100%' }}>
          <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
            <Stack
              direction="column"
              spacing="12px"
              sx={{ justifyContent: 'space-between', width: '100%' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <img
                    style={{
                      height: '60px',
                      width: '60px',
                      borderRadius: '60px',
                      backgroundColor: 'text.secondary',
                      objectFit: 'cover',
                    }}
                    src={childAccount?.icon ?? 'https://lilico.app/placeholder-2.0.png'}
                  />
                  <Typography
                    sx={{
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginTop: '14px',
                      width: '100%',
                    }}
                    color="text.secondary"
                  >
                    {childAccount?.name ?? chrome.i18n.getMessage('Linked_Account')}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ display: 'block', width: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                borderRadius: '16px',
                justifyContent: 'space-between',
                backgroundColor: '#292929',
                padding: '17px 20px',
                alignItems: 'center',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  color: '#E6E6E6',
                  fontWeight: 'bold',
                  width: '100%',
                }}
              >
                {chrome.i18n.getMessage('Address')}
              </Typography>
              <Typography sx={{ fontSize: '14px', color: '#bababa', width: '100%' }}>
                {childAccountAddress}
              </Typography>
              <Button
                variant="text"
                onClick={() => {
                  if (childAccountAddress) {
                    navigator.clipboard.writeText(childAccountAddress);
                  }
                }}
              >
                <IconCopy fill="icon.navi" width="12px" />
              </Button>
            </Box>
          </Box>
          <Divider sx={{ marginY: '24px' }} />

          <Box
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              width: '100%',
              display: 'table',
              marginBottom: '44px',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                marginBottom: '14px',
                textTransform: 'capitalize',
                color: '#5E5E5E',
              }}
            >
              {chrome.i18n.getMessage('Description')}
            </Typography>
            <Typography sx={{ fontSize: '14px', color: '#FFFFFF' }}> {'No Description'}</Typography>
          </Box>

          <Box
            sx={{
              borderRadius: '12px',
              overflow: 'hidden',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              marginBottom: '44px',
              flexGrow: '1',
            }}
          >
            <Box
              sx={{
                borderRadius: '12px',
                overflow: 'hidden',
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                flexGrow: '1',
              }}
            >
              <Typography
                sx={{
                  fontSize: '14px',
                  textTransform: 'capitalize',
                  color: '#5E5E5E',
                }}
              >
                {chrome.i18n.getMessage('Accessible')}
              </Typography>
              <Box sx={{ flexGrow: '1' }}></Box>
              <CardActionArea sx={{ width: 'auto' }}>
                <FormControlLabel
                  label={
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '12px', color: '#5e5e5e', marginRight: '0px' }}
                    >
                      {chrome.i18n.getMessage('Hide_Empty_collection')}
                    </Typography>
                  }
                  control={
                    <Checkbox
                      size="small"
                      icon={<CircleOutlinedIcon sx={{ width: '16px', height: '16px' }} />}
                      sx={{ paddingLeft: '10px' }}
                      checkedIcon={<CheckCircleIcon color={'#41CC5D'} />}
                      value="mainnet"
                      checked={hideEmpty}
                      onClick={toggleHide}
                    />
                  }
                />
              </CardActionArea>
            </Box>
            <Tabs
              value={value}
              onChange={handleChange}
              textColor="secondary"
              indicatorColor="secondary"
              aria-label="secondary tabs example"
              sx={{
                '.MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              <Tab
                sx={{
                  padding: '4px 16px',
                  flexShrink: 0,
                  borderRadius: 20,
                  background: '#292929',
                  color: '#E6E6E6',
                  fontFamily: 'Inter',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: '20px',
                  textTransform: 'capitalize',
                  minHeight: '0px',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(50, 159, 227, 0.16)',
                    color: ' #329FE3',
                  },
                }}
                value="one"
                label="Collectables"
              />
              <Tab
                sx={{
                  padding: '4px 16px',
                  flexShrink: 0,
                  borderRadius: 20,
                  background: '#292929',
                  color: '#E6E6E6',
                  fontFamily: 'Inter',
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  lineHeight: '20px',
                  textTransform: 'capitalize',
                  marginLeft: '8px',
                  minHeight: '0px',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(50, 159, 227, 0.16)',
                    color: ' #329FE3',
                  },
                }}
                value="two"
                label="Coins"
              />
            </Tabs>
            {loading ? (
              <Box sx={{ marginBottom: '-24px' }}>
                {[...Array(2).keys()].map((key) => (
                  <Card
                    key={key}
                    sx={{ borderRadius: '12px', backgroundColor: '#000000', padding: '0 12px' }}
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
                      <CardContent
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          flex: '1 0 auto',
                          alignItems: 'center',
                        }}
                      >
                        <Skeleton variant="text" width={280} />
                      </CardContent>
                    </Box>
                  </Card>
                ))}
              </Box>
            ) : (
              <Box>
                {value === 'one' ? (
                  <NftContent
                    availableNftCollection={availableNftCollection}
                    hideEmpty={hideEmpty}
                    navigateWithState={navigateWithState}
                  />
                ) : (
                  <FtContent availableFt={availableFt} />
                )}
              </Box>
            )}
          </Box>
          {active && (
            <LLSecondaryButton label={'Unlink'} fullWidth onClick={() => showUnlink(true)} />
          )}
        </Box>
        <UnlinkAccount
          isAddAddressOpen={unlinking}
          handleCloseIconClicked={() => showUnlink(false)}
          handleCancelBtnClicked={() => showUnlink(false)}
          handleAddBtnClicked={() => {
            showUnlink(false);
          }}
          childAccount={childAccount}
          address={childAccountAddress}
          userInfo={userInfo}
        />
        {loading || !childAccount ? (
          // Show a loading indicator or other UI element while data is being fetched
          <div>Loading...</div>
        ) : (
          // Render the EditAccount component when the data is available
          <EditAccount
            isAddAddressOpen={isEdit}
            handleCloseIconClicked={() => setEdit(false)}
            handleCancelBtnClicked={() => setEdit(false)}
            handleAddBtnClicked={() => {
              setEdit(false);
            }}
            childAccount={childAccount}
            address={childAccountAddress}
            userInfo={userInfo}
          />
        )}
      </Box>
    </div>
  );
};

export default LinkedDetail;
