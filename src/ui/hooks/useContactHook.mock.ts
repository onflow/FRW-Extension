import { fn } from 'storybook/test';

// Mock the useContacts hook
export const useContacts = fn().mockName('useContacts').mockReturnValue({
  addressBookContacts: [],
  recentContacts: [],
  cadenceAccounts: [],
  mainAccountContact: [],
  childAccountsContacts: [],
  evmAccounts: [],
});

// Mock the useContact hook
export const useContact = fn()
  .mockName('useContact')
  .mockReturnValue({
    id: 'mock-contact-id',
    contact_name: 'Mock Contact',
    username: '',
    avatar: '',
    address: '0x1234567890abcdef',
    contact_type: 1,
    bgColor: '#000000',
    domain: {
      domain_type: 0,
      value: '',
    },
  });
