import { useEffect, useState, useContext } from 'react';
import React from 'react';
import {
  Typography,
  FormControl,
  Input,
  Box,
} from '@mui/material';
import { Presets } from 'react-component-transition';

const SeedPhrase = ({ helperText, msgBgColor, mnemonic, setmnemonic }) => {

  return (
    <Box sx={{ padding: '0' }}>
      <Typography variant="body1" color="text.secondary">
        {chrome.i18n.getMessage('This__is__the__12__or__24__word__phrase__you__were__given')}
      </Typography>

      <Box sx={{ flexGrow: 1, maxWidth: '100%', my: '16px', padding:'0' }}>
        <FormControl sx={{ width: '100%' }}>
          <Input
            id="textfield"
            placeholder={chrome.i18n.getMessage('Please__enter__your__recovery__phrase__using__spaces')}
            autoFocus
            fullWidth
            multiline
            minRows={3}
            disableUnderline
            value={mnemonic}
            onChange={(event) => {
              setmnemonic(event.target.value);
            }}
            sx={{
              height: '128px',
              padding: '16px',
              paddingTop: '0px',
              zIndex: '999',
              overflow: 'scroll',
              backgroundColor: '#282828',
              border: '2px solid #4C4C4C',
              borderRadius: '12px',
              boxSizing: 'border-box',
              '&.Mui-focused': {
                border: '2px solid #FAFAFA',
                boxShadow: '0px 8px 12px 4px rgba(76, 76, 76, 0.24)',
              },
            }}
          />
          <Presets.TransitionSlideUp>
            {mnemonic && (
              <Box
                sx={{
                  width: '95%',
                  backgroundColor: msgBgColor(),
                  mx: 'auto',
                  borderRadius: '0 0 12px 12px',
                }}
              >
                <Box sx={{ p: '4px' }}>{helperText}</Box>
              </Box>
            )}
          </Presets.TransitionSlideUp>
        </FormControl>
      </Box>
    </Box>
  );
};

export default SeedPhrase;
