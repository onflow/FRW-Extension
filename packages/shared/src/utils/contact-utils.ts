import { ContactType, type Contact } from '@/shared/types/network-types';

export const filterContacts = (keyword: string, contacts: Contact[]) => {
  // Look for the keyword in any of the contact properties
  return contacts.filter((contact) =>
    Object.values(contact).some((value) => value.toString().includes(keyword))
  );
};

export const checkAddressBookContacts = (contacts: Contact[], addressBookContacts: Contact[]) => {
  // Mark contacts that are in the address book as AddressBook type
  return contacts.map((contact) => {
    if (addressBookContacts.some((c) => c.address === contact.address)) {
      return {
        ...contact,
        type: ContactType.AddressBook,
      };
    }
    return contact;
  });
};
