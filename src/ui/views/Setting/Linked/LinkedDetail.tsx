import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  Switch,
  Grid,
} from '@mui/material';
import React, { useState, useMemo } from 'react';
import { useHistory, useParams, useLocation } from 'react-router-dom';

import { type NftCollection } from '@/shared/types/network-types';
import { type ChildAccountNFTs, type ChildAccountNFTsStore } from '@/shared/utils/cache-data-keys';
import { CopyIcon } from '@/ui/assets/icons/CopyIcon';
import IconNext from '@/ui/assets/svg/nextgray.svg';
import { LLHeader, LLSecondaryButton } from '@/ui/components';
import CheckCircleIcon from '@/ui/components/iconfont/IconCheckmark';
import AddressCard from '@/ui/components/settings/address-card';
import { LinkedAccountCard } from '@/ui/components/settings/linked-account-card';
import SettingsListCard from '@/ui/components/settings/settings-list-card';
import SlidingTabSwitch from '@/ui/components/settings/sliding-tab-switch';
import { useChildAccountAllowTypes, useCurrentId, useUserInfo } from '@/ui/hooks/use-account-hooks';
import { useChildAccountFt } from '@/ui/hooks/use-coin-hooks';
import { useChildAccountNfts, useNftCollectionList } from '@/ui/hooks/useNftHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import {
  COLOR_GRAY_808080,
  COLOR_WHITE_ALPHA_80_FFFFFFCC,
  COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3,
  COLOR_WHITE_ALPHA_40_FFFFFF66,
} from '@/ui/style/color';
import { formatAddress } from '@/ui/utils';

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
  const filteredNftCollection = hideEmpty
    ? availableNftCollection.filter((item) => item.total > 0)
    : availableNftCollection;

  const items = filteredNftCollection.map((item) => ({
    iconColor: '#292929',
    iconUrl: item.logo,
    iconText: '',
    title: item.name,
    subtitle: `${item.total} ${chrome.i18n.getMessage('Collected')}`,
    onClick: () => navigateWithState(item),
  }));

  if (!items.length) {
    return (
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
    );
  }

  return <SettingsListCard items={items} />;
};

const FtContent = ({ availableFt }: { availableFt: TicketToken[] | undefined }) => {
  const items = (availableFt || []).map((item) => ({
    iconColor: '#333',
    iconText: '',
    title: item.id,
    subtitle: item.balance,
    onClick: () => {},
  }));

  if (!items.length) {
    return (
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
          No accessible Coin
        </Typography>
      </Box>
    );
  }

  return <SettingsListCard items={items} />;
};

const LinkedDetail = () => {
  const location = useParams();
  const locationState = useLocation();

  const history = useHistory();
  const [unlinking, setUnlinking] = useState<boolean>(false);
  const [isEdit, setEdit] = useState<boolean>(false);
  const [hideEmpty, setHide] = useState<boolean>(true);
  const [value, setValue] = useState('one');

  const { activeAccountType, childAccounts, mainAddress, network } = useProfiles();

  // Extract parentName from URL query parameters
  const urlParams = new URLSearchParams(locationState.search);
  const parentName = urlParams.get('parentName') || '';

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
      history.push({
        pathname: `/dashboard/nested/linked/collectiondetail/${childAccountAddress + '.' + storagePath + '.' + data.total + '.linked'}`,
        state: {
          collection: data,
          ownerAddress: childAccountAddress,
        },
      });
    }
  };

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <LLHeader title={chrome.i18n.getMessage('Linked_Account')} help={false} />

      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', padding: '18px', height: '100%' }}>
          <Box
            sx={{
              borderRadius: '16px',
              border: '1px solid #1A1A1A',
              background: 'rgba(255, 255, 255, 0.10)',
              padding: '10px',
              marginBottom: '20px',
            }}
          >
            <LinkedAccountCard
              network={network}
              account={childAccount}
              active={false}
              onClick={() => {}}
              onEditClick={toggleEdit}
              showCard={false}
              data-testid="linked-account-detail-card"
              parentName={parentName}
            />

            <Divider sx={{ marginY: '8px', px: '8px' }} />
            <Box sx={{ padding: '8px' }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  color: COLOR_GRAY_808080,
                }}
              >
                {chrome.i18n.getMessage('Description')}
              </Typography>
              <Typography sx={{ fontSize: '16px', color: COLOR_WHITE_ALPHA_80_FFFFFFCC }}>
                {'No Description'}
              </Typography>
            </Box>
          </Box>

          <AddressCard address={childAccountAddress || ''} label="Address" />

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
                  fontSize: '16px',
                  textTransform: 'capitalize',
                  color: COLOR_WHITE_ALPHA_80_FFFFFFCC,
                }}
              >
                {chrome.i18n.getMessage('Accessible')}
              </Typography>
              <Box sx={{ flexGrow: '1' }}></Box>
              <CardActionArea sx={{ width: 'auto' }}>
                <FormControlLabel
                  labelPlacement="start"
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '12px',
                        color: COLOR_WHITE_ALPHA_40_FFFFFF66,
                        marginRight: '0px',
                      }}
                    >
                      {chrome.i18n.getMessage('View_Empty')}
                    </Typography>
                  }
                  control={
                    <Switch
                      size="small"
                      checked={!hideEmpty}
                      onChange={toggleHide}
                      sx={{
                        width: '51px',
                        height: '27px',
                        pt: 0,
                        '& .MuiSwitch-track': {
                          width: '51px',
                          height: '27px',
                          borderRadius: '27px',
                          pt: 0,
                        },
                        '& .MuiSwitch-thumb': {
                          width: '23px',
                          height: '23px',
                          pt: 0,
                        },
                        '& .MuiSwitch-switchBase': {
                          marginTop: '2px',
                          pt: 0,
                        },
                      }}
                    />
                  }
                  sx={{
                    marginLeft: 'auto',
                    marginRight: 0,
                  }}
                />
              </CardActionArea>
            </Box>
            <SlidingTabSwitch
              value={value}
              onChange={setValue}
              leftLabel="Collections"
              rightLabel="Coins"
              leftValue="one"
              rightValue="two"
            />
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
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Unlink_account')}
              fullWidth
              onClick={() => showUnlink(true)}
              sx={{
                background: '#F04438CC',
                color: '#fff',
                borderRadius: '16px',
                textTransform: 'capitalize',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                '&:hover': {
                  background: '#A93226',
                },
              }}
            />
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
