import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  CardMedia,
  Drawer,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemButton,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

import selected from '@/ui/assets/svg/selected.svg';
import { useWallet } from '@/ui/hooks/use-wallet';

const MoveCollectionSelect = ({
  showMoveBoard,
  handleCloseIconClicked,
  handleCancelBtnClicked,
  handleAddBtnClicked,
  selectedCollection,
  setSelected,
  collectionList,
}) => {
  const usewallet = useWallet();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const filteredCollectionList =
    collectionList?.filter((obj) =>
      obj.CollectionName.toLowerCase().includes(filter.toLowerCase())
    ) || [];

  return (
    <Drawer
      anchor="bottom"
      sx={{ zIndex: '1200 !important' }}
      transitionDuration={300}
      open={showMoveBoard}
      PaperProps={{
        sx: {
          width: '100%',
          height: '479px',
          background: '#222',
          borderRadius: '18px 18px 0px 0px',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', px: '18px' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            height: '24px',
            margin: '20px 0 0',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '40px' }}></Box>
          <Typography
            variant="body1"
            component="div"
            display="inline"
            color="text"
            sx={{
              fontSize: '20px',
              textAlign: 'center',
              fontFamily: 'e-Ukraine',
              lineHeight: '24px',
              fontWeight: '700',
            }}
          >
            {chrome.i18n.getMessage('select_collection')}
          </Typography>
          <Box>
            <IconButton onClick={handleCancelBtnClicked}>
              <CloseIcon fontSize="medium" sx={{ color: 'icon.navi', cursor: 'pointer' }} />
            </IconButton>
          </Box>
        </Box>
        {collectionList?.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexDirection: 'column',
              mb: '16px',
              mt: '16px',
              padding: '0',
            }}
          >
            <TextField
              placeholder="Search NFT Collection"
              variant="outlined"
              value={filter}
              onChange={handleFilterChange}
              fullWidth
              sx={{
                marginBottom: '16px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                },
                '& fieldset': {
                  borderRadius: '16px',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {filteredCollectionList.map((obj, index) => (
              <ListItem disablePadding sx={{ marginBottom: '8px' }}>
                <ListItemButton
                  onClick={() => {
                    setSelected(obj.id);
                    handleCancelBtnClicked();
                  }}
                  sx={{
                    width: '100%',
                    padding: '0',
                    borderRadius: '12px',
                    '&:hover': { backgroundColor: 'rgba(44, 44, 44, 0.1)' },
                  }}
                >
                  {' '}
                  <Box
                    sx={{
                      backgroundColor: '#2C2C2C',
                      width: '100%',
                      height: '64px',
                      display: 'flex',
                      overflow: 'hidden',
                      justifyContent: 'space-between',
                      borderRadius: '12px',
                      '&:hover': { backgroundColor: 'rgba(44, 44, 44, 0.5)' },
                    }}
                    key={index}
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        width: '80px',
                        height: '100%',
                        display: 'inline',
                        objectFit: 'cover',
                        objectPosition: 'left',
                      }}
                      image={obj.logo}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        flex: '1',
                        marginLeft: '16px',
                        mt: '12px',
                        height: '100%',
                      }}
                    >
                      <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>
                        {obj.CollectionName}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', fontWeight: 400, color: '#FFFFFFCC' }}>
                        {obj.NftCount} NFTs
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: '100%',
                        width: '16px',
                        marginRight: '24px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {selectedCollection === obj.id && (
                        <CardMedia
                          component="img"
                          sx={{ width: '16px', height: '16px', display: 'inline' }}
                          image={selected}
                        />
                      )}
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100px',
              mb: '16px',
              mt: '16px',
              padding: '0',
            }}
          >
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFFCC' }}>
              No NFT Collections Found
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default MoveCollectionSelect;
