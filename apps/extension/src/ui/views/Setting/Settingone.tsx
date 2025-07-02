import SearchIcon from '@mui/icons-material/Search';
import { List, ListItemText, ListItem, ListSubheader, ListItemAvatar, Input } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import _ from 'lodash';
import React, { useState } from 'react';

const CONTACTS = [
  {
    name: 'Andy',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Bob',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Tom Hulk',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Tom Hank',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Audra',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Anna',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Tom',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Tom Riddle',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
  {
    name: 'Bolo',
    address: 'wjqhewqjifgiue',
    avatar: 'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA',
  },
];

const Settingone = () => {
  const group = CONTACTS.sort((a, b) => a.name.localeCompare(b.name));
  const grouped = _.groupBy(group, (contact) => contact.name[0]);

  const [name, setName] = useState('');
  const [foundContacts, setFoundContacts] = useState(group);

  const filter = (e1) => {
    const keyword = e1.target.value;

    if (keyword !== '') {
      const results = group.filter((contact) => {
        return contact.name.toLowerCase().includes(keyword.toLowerCase());
      });
      setFoundContacts(results);
    } else {
      setFoundContacts(group);
    }

    setName(keyword);
  };
  const filterResult = _.groupBy(foundContacts, (contact) => contact.name[0]);
  return (
    <div>
      <Input
        type="search"
        value={name}
        onChange={filter}
        sx={{
          width: '364px',
          height: '32px',
          padding: '16px,16px,0px,16px',
          zIndex: '999',
          border: '1px solid #5E5E5E',
          borderRadius: '16px',
          boxSizing: 'border-box',
          margin: '17px 18px 16px 18px',
        }}
        placeholder={chrome.i18n.getMessage('Search')}
        autoFocus
        disableUnderline
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        }
      />

      <div>
        {filterResult && filterResult.value !== null ? (
          Object.keys(filterResult).map((key) => (
            <List dense={false} sx={{ paddingTop: '0px', paddingBottom: '0px' }}>
              <ListSubheader
                sx={{
                  lineHeight: '18px',
                  marginTop: '0px',
                  marginBottom: '0px',
                  backgroundColor: '#121212',
                }}
              >
                #{key}
              </ListSubheader>
              <div>
                {filterResult[key].map((eachgroup, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      marginTop: '10px',
                      marginBottom: '10px',
                      paddingTop: '0px',
                      paddingBottom: '0px',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: '40px', height: '40px' }} src={eachgroup.avatar} />
                    </ListItemAvatar>
                    <ListItemText primary={eachgroup.name} secondary={eachgroup.address} />
                  </ListItem>
                ))}
                ,
              </div>
            </List>
          ))
        ) : (
          <List>
            <ListItem>
              <ListItemText primary="No results found!" sx={{ paddingLeft: '120px' }} />
            </ListItem>
          </List>
        )}
      </div>
    </div>
  );
};

export default Settingone;
