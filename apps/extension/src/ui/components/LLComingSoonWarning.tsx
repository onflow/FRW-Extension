import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Alert, Collapse, useTheme } from '@mui/material';
import React from 'react';

interface ComingSoonProps {
  alertOpen: boolean;
  handleCloseIconClicked: () => void;
}

const LLComingSoonWarning = (props: ComingSoonProps) => {
  const theme = useTheme();
  const onCloseBtnClicked = () => {
    props.handleCloseIconClicked();
  };

  return (
    <Collapse
      in={props.alertOpen}
      sx={{ position: 'absolute', bottom: '10px', alignSelf: 'center' }}
    >
      <Alert
        variant="filled"
        severity="info"
        sx={{ backgroundColor: theme.palette.success.main }}
        action={
          <IconButton aria-label="close" color="inherit" size="small" onClick={onCloseBtnClicked}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        {chrome.i18n.getMessage('Feature_Coming_Soon')}
      </Alert>
    </Collapse>
  );
};

export default LLComingSoonWarning;
