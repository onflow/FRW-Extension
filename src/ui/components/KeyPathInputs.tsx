import {
  Box,
  Typography,
  CardMedia,
  TextareaAutosize,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import React, { useState } from 'react';

import Expand from '../assets/svg/expand.svg';
import Hide from '../assets/svg/hide.svg';

const useStyles = makeStyles((theme) => ({
  form: {
    width: '100%', // Fix full width
    display: 'flex',
    flexDirection: 'column',
  },
  textarea: {
    width: '100%', // Fix full width
    borderRadius: '16px',
    backgroundColor: '#2C2C2C',
    padding: '20px',
    color: '#fff',
    marginBottom: '16px',
    resize: 'none',
    fontSize: '16px',
    fontFamily: 'Inter',
  },
  button: {
    width: '100%', // Fix full width
    fontWeight: 'bold',
  },
  textareaContainer: {
    position: 'relative',
    marginRight: '16px',
    width: '312px',
  },
  label: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    color: '#E6E6E6',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    fontSize: '18px',
  },
  textareaPath: {
    width: '100%', // Fix full width
    borderRadius: '16px',
    backgroundColor: '#2C2C2C',
    padding: '46px 20px 20px',
    color: 'rgba(255, 255, 255, 0.40)',
    resize: 'none',
    fontSize: '16px',
    fontFamily: 'Inter',
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  flexDirection: 'row-reverse',
  alignItems: 'center',
  padding: '0',
  margin: '0',
  '& .MuiAccordionSummary-expandIconWrapper': {
    margin: 0,
  },
  '& .MuiAccordionSummary-content': {
    margin: 0,
  },
}));

const KeyPathInput = ({
  path,
  setPath,
  phrase,
  setPhrase,
}: {
  path: string;
  setPath: (path: string) => void;
  phrase: string;
  setPhrase: (phrase: string) => void;
}) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);

  const handleAccordionChange = () => (event, isExpanded) => {
    setExpanded(isExpanded ? true : false);
  };

  return (
    <Accordion
      sx={{ padding: '0', background: 'none', boxShadow: 'none' }}
      expanded={expanded}
      onChange={handleAccordionChange()}
    >
      <StyledAccordionSummary
        expandIcon={
          expanded ? (
            <CardMedia component="img" sx={{ width: '18px', height: '18px' }} image={Hide} />
          ) : (
            <CardMedia component="img" sx={{ width: '18px', height: '18px' }} image={Expand} />
          )
        }
        aria-controls="additional-options-content"
        id="additional-options-header"
      >
        <Typography sx={{ marginLeft: '8px', fontSize: '14px' }}>Advance</Typography>
      </StyledAccordionSummary>
      <AccordionDetails
        sx={{
          display: 'flex',
          flexDirection: 'row',
          padding: '0',
          justifyContent: 'space-between',
        }}
      >
        <Box className={classes.textareaContainer}>
          <Typography className={classes.label}>Derivation path</Typography>
          <TextareaAutosize
            placeholder={!path ? '' : 'Derivation path'}
            className={classes.textareaPath}
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />
        </Box>
        <Box className={classes.textareaContainer}>
          <Typography className={classes.label}>Passphrase</Typography>
          <TextareaAutosize
            placeholder={'Optional'}
            className={classes.textareaPath}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default KeyPathInput;
