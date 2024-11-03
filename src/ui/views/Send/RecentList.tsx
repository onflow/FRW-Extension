import React, { useEffect, useState } from 'react';
import {
  List,
  CardMedia,
  Typography,
  ButtonBase,
  Box,
} from '@mui/material';
import { groupBy, isEmpty } from 'lodash';
import { LLContactCard, FWContactCard } from '../../FRWComponent';
import { useHistory } from 'react-router-dom';
import EmptyAddress from 'ui/assets/EmptyAddress.svg';
import { isEmoji } from 'ui/utils';

const RecentList = ({ filteredContacts, isLoading, handleClick }) => {



  return (
    <Box sx={{ height: '100%' }}>
      {!isEmpty(filteredContacts) ? (
        filteredContacts.map((eachgroup, index) => (
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
                {isEmoji(eachgroup.avatar) ?
                  <FWContactCard
                    contact={eachgroup}
                    hideCloseButton={true}
                    key={index}
                  />
                  :
                  <LLContactCard
                    contact={eachgroup}
                    hideCloseButton={true}
                    key={index}
                  />
                }
              </ButtonBase>
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
          }}>
          <CardMedia sx={{ width: '154px', height: '120px', margin: '50px auto 0', }} image={EmptyAddress} />
          <Typography
            variant="overline"
            sx={{ lineHeight: '1', textAlign: 'center', color: '#5E5E5E', marginTop: '5px', fontSize: '16px' }}
          >
            {chrome.i18n.getMessage('Search_to_find_more_users')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecentList;
