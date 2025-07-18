import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Divider, Drawer, ListItem, Stack, Typography } from '@mui/material';
import React, { useState } from 'react';

import { ContactType, type Contact } from '@onflow/flow-wallet-shared/types/network-types';

import { LLContactCard, LLPrimaryButton, LLSecondaryButton } from '@/ui/components';
import IconSubtract from '@/ui/components/iconfont/IconSubtract';

interface AddressBookItemProps {
  index: number;
  contact: Contact;
  onEditClicked: (contact: Contact) => void;
  onDeleteClicked: (contact: Contact) => void;
}

const AddressBookItem = (props: AddressBookItemProps) => {
  const [isEditOrDeleteShown, setIsEditOrDeleteShown] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const renderDeleteContactDialog = () => {
    return (
      <Drawer open={isDeleteDialogOpen} anchor="bottom" transitionDuration={300}>
        <Box
          px="18px"
          sx={{
            width: '100%',
            height: '470px',
            background: 'rgba(0, 0, 0, 0.5)',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ margin: '54px 0 38px' }}>
              <IconSubtract size={48} />
            </Box>
            <Box sx={{ width: '228px' }}>
              <Typography variant="h1" align="center" py="14px" fontWeight="bold" fontSize="24px">
                {chrome.i18n.getMessage('Are__you__sure__you__want__to__remove__this__contact')}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: '14px',
                  fontFamily: 'Inter',
                  fontStyle: 'normal',
                  color: '#BABABA',
                  textAlign: 'center',
                  margin: '18px 36px 52px',
                  cursor: 'pointer',
                }}
              >
                {chrome.i18n.getMessage(
                  'You__will__no__longer__find__this__contact__in__your__address__book'
                )}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1}>
            <LLSecondaryButton
              label={chrome.i18n.getMessage('Cancel')}
              fullWidth
              onClick={() => setIsDeleteDialogOpen(false)}
            />
            <LLPrimaryButton
              label={chrome.i18n.getMessage('Next')}
              fullWidth
              onClick={() => props.onDeleteClicked(props.contact)}
            />
          </Stack>
        </Box>
      </Drawer>
    );
  };

  return (
    <>
      <ListItem
        key={props.index}
        disablePadding
        onMouseEnter={() => setIsEditOrDeleteShown(true)}
        onMouseLeave={() => setIsEditOrDeleteShown(false)}
        sx={{
          height: '60px',
          '&:hover': {
            backgroundColor: 'neutral.main',
          },
        }}
        secondaryAction={
          isEditOrDeleteShown && (
            <Stack
              direction="row"
              divider={
                <Divider orientation="vertical" flexItem sx={{ height: '20px', my: '15px' }} />
              }
              spacing={1}
            >
              {props.contact.contact_type === ContactType.External && (
                <EditIcon
                  sx={{ color: 'icon.navi', cursor: 'pointer' }}
                  onClick={() => props.onEditClicked(props.contact)}
                />
              )}

              <DeleteIcon
                sx={{ color: 'icon.navi', cursor: 'pointer' }}
                onClick={() => setIsDeleteDialogOpen(true)}
              />
            </Stack>
          )
        }
      >
        <LLContactCard key={props.index} contact={props.contact} hideCloseButton={true} />
      </ListItem>
      {renderDeleteContactDialog()}
    </>
  );
};

export default AddressBookItem;
