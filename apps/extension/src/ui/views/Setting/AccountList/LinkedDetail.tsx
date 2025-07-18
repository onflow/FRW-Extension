import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Divider,
  FormControlLabel,
  List,
  Skeleton,
  Switch,
  Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

import { type NFTCollections } from '@onflow/flow-wallet-shared/types/nft-types';

import { EditIcon } from '@/ui/assets/icons/settings/Edit';
import { LLHeader, LLSecondaryButton } from '@/ui/components';
import { AccountCard } from '@/ui/components/account/account-card';
import SettingsListCard from '@/ui/components/settings/settings-list-card';
import SlidingTabSwitch from '@/ui/components/settings/sliding-tab-switch';
import {
  useChildAccountAllowTypes,
  useChildAccountDescription,
  useCurrentId,
  useMainAccount,
  useUserInfo,
} from '@/ui/hooks/use-account-hooks';
import { useChildAccountFt } from '@/ui/hooks/use-coin-hooks';
import { useWallet } from '@/ui/hooks/use-wallet';
import { useNftCatalogCollections, useNftCollectionList } from '@/ui/hooks/useNftHook';
import { useProfiles } from '@/ui/hooks/useProfileHook';
import {
  COLOR_GRAY_808080,
  COLOR_WHITE_ALPHA_40_FFFFFF66,
  COLOR_WHITE_ALPHA_80_FFFFFFCC,
} from '@/ui/style/color';

import EditAccount from './Linked/EditAccount';
import UnlinkAccount from './Linked/UnlinkAccount';

interface TicketToken {
  id: string;
  balance: string;
}

const NftContent = ({
  availableNftCollection,
  hideEmpty,
  navigateWithState,
}: {
  availableNftCollection: NFTCollections[];
  hideEmpty: boolean;
  navigateWithState: (data: NFTCollections) => void;
}) => {
  const filteredNftCollection = hideEmpty
    ? availableNftCollection.filter((item) => item.count > 0)
    : availableNftCollection;
  const items = filteredNftCollection.map((item) => ({
    iconColor: '#292929',
    iconUrl: item.collection.logo,
    iconText: '',
    title: item.collection.name,
    subtitle: `${item.count} ${chrome.i18n.getMessage('Collected')}`,
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
  const wallet = useWallet();
  const location = useParams();
  const locationState = useLocation();

  const navigate = useNavigate();
  const [unlinking, setUnlinking] = useState<boolean>(false);
  const [isEdit, setEdit] = useState<boolean>(false);
  const [hideEmpty, setHide] = useState<boolean>(true);
  const [value, setValue] = useState('one');

  const { currentWallet, network } = useProfiles();
  // Extract parentName and parentAddress from URL query parameters
  const urlParams = new URLSearchParams(locationState.search);
  const parentName = urlParams.get('parentName') || '';
  const parentAddress = urlParams.get('parentAddress') || '';

  const childAccountAddress: string | undefined = location['key'];
  const childAccounts = useMainAccount(network, parentAddress)?.childAccounts;
  const childAccount = childAccounts?.find((account) => account.address === childAccountAddress);

  //Can only make unlink action if the current wallet is the parent wallet of the linked account
  const active = currentWallet.address === parentAddress;

  const childAccountAllowTypes = useChildAccountAllowTypes(
    network,
    parentAddress,
    childAccountAddress
  );

  const allCollectionList = useNftCollectionList(network);
  const nftCollectionsList = useNftCatalogCollections(network, childAccountAddress);

  const availableFt = useChildAccountFt(network, parentAddress, childAccountAddress);
  const description = useChildAccountDescription(childAccountAddress || '');

  const availableNftCollection: NFTCollections[] | undefined = useMemo(() => {
    if (!nftCollectionsList || !childAccountAllowTypes) {
      return undefined;
    }

    // Start with collections that have NFTs
    const result = [...nftCollectionsList];

    // Create a set of existing collection keys to avoid duplicates
    const existingCollectionKeys = new Set();
    nftCollectionsList.forEach((item) => {
      const key = `${item.collection.address}.${item.collection.contract_name}`;
      existingCollectionKeys.add(key);
    });

    // Add empty collections for allowed types that don't have NFTs
    childAccountAllowTypes.forEach((allowType) => {
      const parts = allowType.split('.');
      const address = parts[1];
      const contractName = parts[2];
      const key = `${address}.${contractName}`;

      // Only add if this collection doesn't already exist
      if (!existingCollectionKeys.has(key)) {
        // Find the collection details in allCollectionList
        // logo is missing from the collection api
        const collectionDetails = allCollectionList?.find((collection) => {
          return collection.address === `0x${address}` && collection.id === contractName;
        });

        const emptyCollection = {
          collection: {
            id: collectionDetails?.id || `${contractName}Collection`,
            contract_name: contractName,
            address: `0x${address}`,
            name: collectionDetails?.name || contractName,
            logo: collectionDetails?.logo || '',
            banner: collectionDetails?.banner || '',
            description: collectionDetails?.description || '',
            path: {
              storage_path: `/storage/${contractName}Collection`,
              public_path: `/public/${contractName}Collection`,
              private_path: 'deprecated/private_path',
            },
            socials: {},
            nftTypeId: allowType,
          },
          ids: [],
          count: 0,
        };
        result.push(emptyCollection);
      }
    });

    return result;
  }, [nftCollectionsList, childAccountAllowTypes, allCollectionList]);

  const loading = availableNftCollection === undefined;

  const currentId = useCurrentId();
  const userInfo = useUserInfo(currentId);

  const showUnlink = async (condition) => {
    await setUnlinking(condition);
  };

  const toggleEdit = () => setEdit((prev) => !prev);

  const toggleHide = (event) => {
    event.stopPropagation();
    const prevEmpty = hideEmpty;
    setHide(!prevEmpty);
  };

  const navigateWithState = (data: NFTCollections) => {
    const state = { nft: data };
    localStorage.setItem('nftLinkedState', JSON.stringify(state));
    const storagePath = data.collection.path.storage_path.split('/')[2];
    if (data.count) {
      navigate(
        `/dashboard/nested/linked/collectiondetail/${childAccountAddress + '.' + storagePath + '.' + data.count + '.linked'}`,
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
      <LLHeader
        title={chrome.i18n.getMessage('Linked_Account')}
        help={false}
        goBackLink="/dashboard/setting/accountlist"
      />

      <Box
        px="20px"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
          color: COLOR_WHITE_ALPHA_80_FFFFFFCC,
        }}
      >
        <Box>
          <List
            sx={{
              borderRadius: '16px',
              padding: '0 2px',
              overflow: 'hidden',
              backgroundColor: '#282828',
              '&:hover': {
                backgroundColor: '#282828',
              },
              margin: '8px auto 8px auto',
              pt: 0,
              pb: 0,
            }}
          >
            {childAccount && (
              <AccountCard
                account={childAccount}
                network={network}
                showCard={false}
                onClick={toggleEdit}
                onClickSecondary={toggleEdit}
                secondaryIcon={<EditIcon width={24} height={24} />}
                showLink={true}
                parentAccount={{
                  address: parentAddress,
                  name: parentName,
                  icon: '👤',
                  color: '#000000',
                  chain: network === 'mainnet' ? 747 : 545,
                  id: 1,
                }}
              />
            )}
            <Divider sx={{ margin: '0 16px' }} />
            <Box sx={{ padding: '16px' }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  color: COLOR_GRAY_808080,
                  marginBottom: '4px',
                }}
              >
                {chrome.i18n.getMessage('Description')}
              </Typography>
              <Typography sx={{ fontSize: '16px', color: COLOR_WHITE_ALPHA_80_FFFFFFCC }}>
                {description || 'No Description'}
              </Typography>
            </Box>
          </List>

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
                  control={<Switch checked={!hideEmpty} onChange={toggleHide} />}
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
                  availableNftCollection && (
                    <NftContent
                      availableNftCollection={availableNftCollection}
                      hideEmpty={hideEmpty}
                      navigateWithState={navigateWithState}
                    />
                  )
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
        {isEdit && childAccount && (
          <EditAccount
            isAddAddressOpen={isEdit}
            handleCloseIconClicked={() => setEdit(false)}
            handleCancelBtnClicked={() => setEdit(false)}
            handleAddBtnClicked={async (desc) => {
              await wallet.setChildAccountDescription(childAccount.address, desc);
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
