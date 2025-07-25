import { Box, ButtonBase, CardMedia, List, ListSubheader, Typography } from '@mui/material';
import { groupBy } from 'lodash';
import React, { useEffect, useState } from 'react';

import { type Contact } from '@onflow/frw-shared/types';

import emptyAddress from '@/ui/assets/emptyAddress.svg';

import { LLContactCard } from '..';

const SearchList = ({ searchContacts, isLoading, handleClick }) => {
  const [grouped, setGrouped] = useState<Record<string, Contact[]>>({});
  useEffect(() => {
    const filterContacts = searchContacts.filter((element) => {
      return element.group !== undefined;
    });

    const group = groupBy(filterContacts, (contact) => contact.group);
    setGrouped(group);
  }, [searchContacts]);

  const groups = Object.keys(grouped);
  return (
    <Box sx={{ height: '100%' }}>
      {groups.length > 0 ? (
        groups.map((key) => (
          <List dense={false} sx={{ paddingTop: '0px', paddingBottom: '0px' }} key={key}>
            <ListSubheader
              sx={{
                lineHeight: '18px',
                marginTop: '0px',
                marginBottom: '0px',
                backgroundColor: '#121212',
                py: '4px',
              }}
            >
              {key}
            </ListSubheader>
            <Box>
              {grouped[key].map((eachgroup, index) => (
                <ButtonBase
                  key={`card-${index}`}
                  sx={{ display: 'contents' }}
                  onClick={() => handleClick(eachgroup)}
                >
                  <LLContactCard
                    contact={eachgroup}
                    hideCloseButton={true}
                    key={index}
                    isLoading={isLoading}
                  />
                </ButtonBase>
              ))}
            </Box>
          </List>
        ))
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            backgroundColor: '#000000',
          }}
        >
          <CardMedia
            sx={{ width: '154px', height: '120px', margin: '50px auto 0' }}
            image={emptyAddress}
          />
          <Typography
            variant="overline"
            sx={{
              lineHeight: '1',
              textAlign: 'center',
              color: '#5E5E5E',
              marginTop: '5px',
              fontSize: '16px',
            }}
          >
            {chrome.i18n.getMessage('Search_to_find_more_users')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SearchList;
