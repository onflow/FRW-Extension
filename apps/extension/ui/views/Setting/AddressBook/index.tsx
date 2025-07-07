import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Input,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Skeleton,
  Typography,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { type Contact } from '@/shared/types/network-types';
import { consoleError } from '@/shared/utils/console-log';
import EmptyStateImage from '@/ui/assets/image/search_user.png';
import { LLHeader } from '@/ui/components/LLHeader';
import { useWallet } from '@/ui/hooks/use-wallet';

import AddOrEditAddress from './AddOrEditAddress';
import AddressBookItem from './AddressBookItem';

const AddressBook = () => {
  const [group, setGroup] = useState<Array<Contact>>([]);
  const grouped = _.groupBy(group, (contact) => contact.contact_name[0]);

  const navigate = useNavigate();
  const wallet = useWallet();

  const [name, setName] = useState('');
  const [foundContacts, setFoundContacts] = useState<Array<Contact>>(group);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEmptyList, setEmptyList] = useState<boolean>(false);
  const [editableContact, setEditableContact] = useState<Contact | undefined>(undefined);
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const filter = (e1) => {
    const keyword = e1.target.value;

    if (keyword !== '') {
      const results = group.filter((contact) => {
        return contact.contact_name.toLowerCase().includes(keyword.toLowerCase());
      });
      setFoundContacts(results);
    } else {
      setFoundContacts(group);
    }
    setName(keyword);
  };

  const filterResult = _.groupBy(foundContacts, (contact) => contact.contact_name[0]);

  const setTab = useCallback(async () => {
    await wallet.setDashIndex(3);
  }, [wallet]);

  const fetchAddressBook = useCallback(async () => {
    try {
      setIsLoading(true);
      const contacts = await wallet.getAddressBook();
      setEmptyList(contacts === null);
      setIsLoading(false);

      const sortedContacts = contacts.sort((a, b) =>
        a.contact_name.toLowerCase().localeCompare(b.contact_name.toLowerCase())
      );

      setGroup(sortedContacts);
      setFoundContacts(sortedContacts);
    } catch (error) {
      // Log error or handle it appropriately
      consoleError('Error fetching address book:', error);
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    setTab();
    fetchAddressBook();
  }, [setTab, fetchAddressBook]);

  const renderLoading = () => {
    return [1, 2, 3].map((index) => {
      return (
        <ListItem key={index}>
          <ListItemAvatar>
            <Skeleton variant="circular" width={35} height={35} />
          </ListItemAvatar>
          <ListItemText
            disableTypography={true}
            primary={<Skeleton variant="text" width={45} height={15} />}
            secondary={<Skeleton variant="text" width={75} height={15} />}
          />
        </ListItem>
      );
    });
  };

  const renderEmptyState = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={EmptyStateImage}
          style={{
            objectFit: 'none',
          }}
        />
        <Typography variant="body1" color="text.secondary">
          {chrome.i18n.getMessage('Empty__List')}
        </Typography>
      </Box>
    );
  };

  const handleEditClicked = (contact: Contact) => {
    setIsEdit(true);
    setEditableContact(contact);

    setIsAddAddressOpen(true);
  };

  const handleDeleteClicked = async (contact: Contact) => {
    const response = await wallet.openapi.deleteAddressBook(contact.id);
    if (response.status === 200) {
      await wallet.refreshAddressBook();
      fetchAddressBook();
    }
  };

  return (
    <Box className="page" style={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
        }}
      >
        <LLHeader
          title={chrome.i18n.getMessage('Address__Book')}
          help={false}
          goBackLink="/dashboard/setting"
          right={
            <AddIcon
              fontSize="medium"
              sx={{ color: 'icon.navi', cursor: 'pointer' }}
              onClick={() => {
                setIsAddAddressOpen(true);
                setIsEdit(false);
              }}
            />
          }
        />
        <Box
          sx={{
            paddingLeft: '18px',
            paddingRight: '18px',
            width: 'auto',
          }}
        >
          <Input
            type="search"
            value={name}
            onChange={filter}
            sx={{
              minHeight: '56px',
              backgroundColor: '#282828',
              zIndex: '999',
              borderRadius: '16px',
              boxSizing: 'border-box',
              width: '100%',
              marginBottom: '16px',
            }}
            placeholder={chrome.i18n.getMessage('Search')}
            autoFocus
            disableUnderline
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon color="primary" sx={{ ml: '10px', my: '5px', fontSize: '24px' }} />
              </InputAdornment>
            }
          />
        </Box>

        <AddOrEditAddress
          isAddAddressOpen={isAddAddressOpen}
          handleCloseIconClicked={() => setIsAddAddressOpen(false)}
          handleCancelBtnClicked={() => setIsAddAddressOpen(false)}
          handleAddBtnClicked={() => {
            setIsAddAddressOpen(false);
            fetchAddressBook();
          }}
          editableContact={editableContact}
          isEdit={isEdit}
        />

        {isLoading ? (
          renderLoading()
        ) : (
          <div
            style={{
              flexGrow: 1,
              overflowY: 'scroll',
              justifyContent: 'space-between',
            }}
          >
            {isEmptyList ? (
              renderEmptyState()
            ) : (
              <div style={{ flexGrow: 1 }}>
                {filterResult && filterResult.value !== null ? (
                  <List
                    dense={false}
                    sx={{
                      paddingTop: '0px',
                      paddingBottom: '0px',
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      overflow: 'auto',
                    }}
                  >
                    {Object.keys(filterResult).map((key) => (
                      <li key={`section-${key}`}>
                        <ul>
                          <ListSubheader
                            sx={{
                              lineHeight: '18px',
                              marginTop: '0px',
                              marginBottom: '0px',
                              backgroundColor: '#121212',
                            }}
                          >
                            #{key.toUpperCase()}
                          </ListSubheader>
                          {filterResult[key].map((contact, index) => (
                            <AddressBookItem
                              key={index}
                              contact={contact}
                              index={index}
                              onEditClicked={handleEditClicked}
                              onDeleteClicked={handleDeleteClicked}
                            />
                          ))}
                        </ul>
                      </li>
                    ))}
                  </List>
                ) : (
                  <List>
                    <ListItem>
                      <ListItemText
                        primary={chrome.i18n.getMessage('No__results__found')}
                        sx={{ paddingLeft: '120px' }}
                      />
                    </ListItem>
                  </List>
                )}
              </div>
            )}
          </div>
        )}
      </Box>
    </Box>
  );
};

export default AddressBook;
