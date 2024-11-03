import * as React from 'react';
import { List, ListItemText, ListItem, ListItemAvatar,Button,Divider} from '@mui/material';
import Avatar from '@mui/material/Avatar';

const Switchaccount = () => {
  const accounts =[
    {id:'@happylee', address:'sjkhdskjfhlsahf', avatar:'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA'},
    {id:'@happylee', address:'sjkhdskjfhlsahf',avatar:'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA'},
    {id:'@happylee', address:'sjkhdskjfhlsahf',avatar:'https://lilico.app/api/avatar/beam/120/anna?colors=FFDD32,FC814A,7678ED,B3DEE2,BCF0DA'},
  ]
  // const [connect,setConnect]= useState(false)

  return (
    <div className="page">
      {accounts.map((account)=>
        <><Divider />
          <List sx={{ paddingTop: '0px', paddingBottom: '0px' }}>
            <ListItem
              sx={{ paddingTop: '16px', paddingBottom: '16px' }}
            >
              <ListItemAvatar>
                <Avatar sx={{ width: '28.8px', height: '28.8px' }}
                  src={account.avatar} />
              </ListItemAvatar>
              <ListItemText primary={account.id} />
              <Button
                variant="contained" size="small" sx={{
                  borderRadius: '8px',
                  color: '#E6E6E6',
                  height: '32px',
                  width: '73px',
                  backgroundColor: '#333333',
                  textTransform: 'capitalize',
                }}>Connect </Button>
            </ListItem>
          </List></>
      )}
      <Button
        variant="contained" size="medium" sx={{
          borderRadius: '8px',
          color: '#E6E6E6',
          height: '48px',
          width: '364px',
          marginTop: '230px',
          marginLeft: '18px',
              
          backgroundColor: '#333333',
          textTransform: 'capitalize',
        }}>
              Logout

      </Button>
        
    </div>
  );
};

export default Switchaccount;