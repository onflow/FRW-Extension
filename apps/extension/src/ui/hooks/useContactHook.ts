import { useEffect, useState } from 'react';

import { type Contact, ContactType } from '@onflow/flow-wallet-shared/types/network-types';
import { type WalletAddress } from '@onflow/flow-wallet-shared/types/wallet-types';
import { isValidEthereumAddress, withPrefix } from '@onflow/flow-wallet-shared/utils/address';

import { useWallet } from '@/ui/hooks/use-wallet';
import { useProfiles } from '@/ui/hooks/useProfileHook';

export function useContacts() {
  const wallet = useWallet();
  const {
    mainAddress,
    evmAddress,
    walletList,
    evmWallet,
    childAccounts: childAccountsProfile,
  } = useProfiles();

  const [addressBookContacts, setAddressBookContacts] = useState<Contact[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [cadenceAccounts, setCadenceAccounts] = useState<Contact[]>([]);
  const [mainAccountContact, setMainAccount] = useState<Contact[]>([]);
  const [childAccountsContacts, setChildAccounts] = useState<Contact[]>([]);
  const [evmAccounts, setEvmAccounts] = useState<Contact[]>([]);

  useEffect(() => {
    // Handle main address book
    // Use a separate useEffect as it's an async function to pull through from the background service worker
    let mounted = true;
    // fetch address book
    const fetchAddressBook = async () => {
      const walletAddressBook = await wallet.getAddressBook();
      const recentContacts = await wallet.getRecent();

      // Mark which recent contacts are in the address book
      recentContacts.forEach((recentContact) => {
        const addressBookContact = walletAddressBook.find(
          (c) =>
            c.address === recentContact.address && c.contact_name === recentContact.contact_name
        );
        if (addressBookContact) {
          // Give it a type of 1 to indicate it's in the address book
          recentContact.contact_type = ContactType.AddressBook;
        }
      });

      if (mounted) {
        // Copy the address book before sorting
        const sortedAddressBook = [...walletAddressBook];
        // Sort the address book by contact name. Sort mutates the array in place.
        sortedAddressBook.sort((a, b) =>
          a.contact_name.toLowerCase().localeCompare(b.contact_name.toLowerCase())
        );
        setAddressBookContacts(sortedAddressBook);

        // Set the recent contacts
        setRecentContacts(recentContacts);
      }
    };
    // Fetch the address book and recent contacts asynchronously
    fetchAddressBook();
    // Cleanup
    return () => {
      mounted = false;
    };
  }, [wallet]);

  useEffect(() => {
    // Handle changes from the useProfiles hook

    // List out accounts that are part of this profile
    setCadenceAccounts(
      walletList
        ? walletList.map((item) => ({
            id: item.id,
            contact_name: item.name,
            username: '', // We don't have the proper username from this call
            avatar: item.icon,
            address: withPrefix(item.address) || '',
            contact_type: ContactType.AddressBook,
            bgColor: item.color,
            domain: {
              domain_type: 0,
              value: '',
            },
          }))
        : []
    );

    setMainAccount(
      walletList
        ? walletList
            .filter((item) => item.address === mainAddress)
            .map((item) => ({
              id: item.id,
              contact_name: item.name,
              username: '',
              avatar: item.icon,
              address: withPrefix(item.address) || '',
              contact_type: ContactType.User,
              bgColor: item.color,
              domain: {
                domain_type: 0,
                value: '',
              },
            }))
        : []
    );
    // List out child accounts
    setChildAccounts(
      childAccountsProfile
        ? childAccountsProfile.map((accountDetails, index) => ({
            id: index,
            contact_name: accountDetails.name || accountDetails.address,
            username: '', // We don't have the proper username from this call
            avatar: accountDetails.icon,
            address: accountDetails.address,
            contact_type: ContactType.AddressBook,
            domain: {
              domain_type: 999,
              value: accountDetails.name,
            },
          }))
        : []
    );

    // List out evm accounts
    if (mainAddress && isValidEthereumAddress(evmAddress) && evmWallet) {
      const evmData: Contact = {
        ...evmWallet,
        address: evmAddress,
        avatar: evmWallet.icon,
        contact_name: evmWallet.name || '',
      };
      setEvmAccounts([evmData]);
    }
  }, [childAccountsProfile, evmAddress, evmWallet, mainAddress, walletList]);

  return {
    addressBookContacts,
    recentContacts,
    cadenceAccounts,
    evmAccounts,
    childAccountsContacts,
    mainAccountContact,
  };
}

export const useContact = (address: WalletAddress | string): Contact => {
  const {
    addressBookContacts,
    recentContacts,
    cadenceAccounts,
    evmAccounts,
    childAccountsContacts,
  } = useContacts();

  return (
    cadenceAccounts.find((c) => c.address === address) ||
    evmAccounts.find((c) => c.address === address) ||
    childAccountsContacts.find((c) => c.address === address) ||
    addressBookContacts.find((c) => c.address === address) ||
    recentContacts.find((c) => c.address === address) || {
      // If nothing found then just return an empty contact with the address
      address: address,
      contact_name: address,
      username: address,
      avatar: '',
      contact_type: ContactType.External,
      id: 0,
    }
  );
};
