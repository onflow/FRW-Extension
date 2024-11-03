import React, { useEffect, useState } from 'react';
import {
  List,
  ListSubheader,
  CardMedia,
  Typography,
  ButtonBase,
  Box,
} from '@mui/material';
import { groupBy, isEmpty } from 'lodash';
import { LLContactCard, LLContactEth, FWContactCard } from '../../FRWComponent';
import { useHistory } from 'react-router-dom';
import { useWallet } from 'ui/utils';
import { withPrefix, isValidEthereumAddress } from '@/ui/utils/address';
import EmptyAddress from 'ui/assets/EmptyAddress.svg';

type ChildAccount = {
  [key: string]: {
    name: string;
    description: string;
    thumbnail: {
      url: string;
    };
  };
};

const AccountsList = ({ filteredContacts, isLoading, handleClick, isSend = true }) => {


  const usewallet = useWallet();

  const [grouped, setGrouped] = useState<any>([]);
  const [childAccounts, setChildAccount] = useState<any[]>([]);

  const [walletList, setWalletList] = useState<any[]>([]);
  const [evmAddress, setEvmAddress] = useState<any[]>([]);

  const getWallet = async () => {
    const wallet = await usewallet.getUserWallets();
    const fData = wallet.filter((item) => item.blockchain !== null);
    const currentNetwork = await usewallet.getNetwork();
    const emojiList = await usewallet.getEmoji();
    let sortData = fData;
    if (!Array.isArray(sortData)) {
      sortData = [];
    }
    const filteredData = (sortData || []).filter((wallet, index) => {
      return wallet.chain_id == currentNetwork;
    });
    const walletData = (filteredData || []).map((wallet, index) => {
      return {
        id: index,
        contact_name: '',
        address: withPrefix(wallet.blockchain[0].address),
        key: index,
      };
    });
    const wdArray = await convertArrayToContactArray(walletData, emojiList)
    const childresp: ChildAccount = await usewallet.checkUserChildAccount();
    if (childresp) {
      const cAccountArray = convertObjectToContactArray(childresp)
      setChildAccount(cAccountArray);

    }
    console.log('childresp ', wdArray)

    // putDeviceInfo(fData);
    await setWalletList(wdArray);
    if (walletData[0].address) {
      const evmAddress = await usewallet.queryEvmAddress(walletData[0].address!);

      if (isValidEthereumAddress(evmAddress)) {

        const evmWallet = evmAddress;
        const evmData = walletData[0]
        evmData.address = evmWallet;
        evmData['avatar'] = emojiList[1].emoji
        evmData['contact_name'] = emojiList[1].name
        evmData['bgcolor'] = emojiList[1].bgcolor
        setEvmAddress([evmData]);
      }

    }
  }

  function convertObjectToContactArray(data) {
    return Object.keys(data).map((address, index) => ({
      id: index,
      contact_name: data[address].name || address,
      username: data[address].name.toLowerCase().replace(/\s+/g, ''),
      avatar: data[address].thumbnail.url,
      address: address,
      contact_type: 1,
      domain: {
        domain_type: 999,
        value: data[address].name
      }
    }));
  }

  async function convertArrayToContactArray(array, emojiList) {
    // Fetch emoji list

    return array.map((item, index) => {

      return {
        id: item.id,
        contact_name: emojiList[0].name, // Use the corresponding emoji name
        username: emojiList[0].name, // Set username from emoji list
        avatar: emojiList[0].emoji, // Set avatar from emoji list
        address: item.address, // Use the address from the original array
        contact_type: 1, // Keep the contact_type constant
        bgColor: emojiList[0].bgcolor, // Set background color
        domain: {
          domain_type: 0, // Keep domain_type constant
          value: ''
        }
      };
    });
  }


  const goEth = (group) => {
    if (isSend) {

      history.push({
        pathname: '/dashboard/wallet/sendeth',
        state: { contact: group },
      })

    }
  }

  useEffect(() => {
    const group = groupBy(
      filteredContacts,
      (contact) => contact.contact_name[0]
    );
    setGrouped(group);
    getWallet();
  }, [filteredContacts]);

  const history = useHistory();

  return (
    <Box sx={{ height: '100%' }}>
      {!isEmpty(walletList) && (
        walletList.map((eachgroup, index) => (
          <List
            dense={false}
            sx={{ paddingTop: '0px', paddingBottom: '0px' }}
            key={index}
          >
            <Box>
              <ButtonBase
                key={`card-${index}`}
                sx={{ display: 'contents' }}
                onClick={() =>
                  handleClick(eachgroup)
                }
              >
                <FWContactCard
                  contact={eachgroup}
                  hideCloseButton={true}
                  key={index}
                />
              </ButtonBase>
            </Box>
          </List>
        ))
      )}
      {(!isEmpty(evmAddress) || !isEmpty(childAccounts)) &&
        <ListSubheader
          sx={{
            lineHeight: '18px',
            marginTop: '0px',
            marginBottom: '0px',
            backgroundColor: '#000000',
            textTransform: 'capitalize',
            py: '4px',
          }}
        >
          {chrome.i18n.getMessage('Linked_Account')}
        </ListSubheader>
      }
      {!isEmpty(evmAddress) && (
        evmAddress.map((eachgroup, index) => (
          <List
            dense={false}
            sx={{ paddingTop: '0px', paddingBottom: '0px' }}
            key={index}
          >
            <Box>
              <ButtonBase
                key={`card-${index}`}
                sx={{ display: 'contents' }}
                onClick={() => isSend ? goEth(eachgroup) : handleClick(eachgroup)}

              >
                <LLContactEth
                  contact={eachgroup}
                  hideCloseButton={true}
                  key={index}
                />
              </ButtonBase>
            </Box>
          </List>
        ))
      )}

      {!isEmpty(childAccounts) && (
        childAccounts.map((eachgroup, index) => (
          <List
            dense={false}
            sx={{ paddingTop: '0px', paddingBottom: '0px' }}
            key={index}
          >
            <Box>
              <ButtonBase
                key={`card-${index}`}
                sx={{ display: 'contents' }}
                onClick={() =>
                  handleClick(eachgroup)
                }
              >
                <LLContactCard
                  contact={eachgroup}
                  hideCloseButton={true}
                  key={index}
                />
              </ButtonBase>
            </Box>
          </List>
        ))
      )}
    </Box>
  );
};

export default AccountsList;
