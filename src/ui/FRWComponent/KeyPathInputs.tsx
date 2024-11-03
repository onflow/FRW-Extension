import { useEffect, useState, useContext } from 'react';
import React from 'react';
import { Box, Button, Typography, CardMedia, TextareaAutosize, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LLSpinner } from 'ui/FRWComponent';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Expand from '../FRWAssets/svg/expand.svg';
import Hide from '../FRWAssets/svg/hide.svg';
import { styled } from '@mui/material/styles';
import { storage } from 'background/webapi';

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
    width: '312px'
  },
  label: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    color: '#E6E6E6',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    fontSize: '18px'
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
  }
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

const KeyPathInput = (props) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const [path, setPath] = useState("m/44'/539'/0'/0/0");
  const [phrase, setPhrase] = useState('');

  const handleAccordionChange = () => (event, isExpanded) => {
    setExpanded(isExpanded ? true : false);
  };

  const updateStorageWithPath = async (newPath) => {
    const trimmedPath = newPath.trim();
    await storage.set('temp_path', trimmedPath);
  };
  
  const updateStorageWithPhrase = async (newPhrase) => {
    const trimmed = newPhrase.trim();
    await storage.set('temp_key', trimmed);
  };
  
  // Update storage when path changes
  useEffect(() => {
    updateStorageWithPath(path);
  }, [path]);
  
  // Update storage when phrase changes
  useEffect(() => {
    updateStorageWithPhrase(phrase);
  }, [phrase]);

  return (
    <Accordion sx={{ padding: '0', background: 'none', boxShadow: 'none' }} expanded={expanded} onChange={handleAccordionChange()}>
      <StyledAccordionSummary
        expandIcon={expanded ? <CardMedia component="img" sx={{ width: '18px', height: '18px' }} image={Hide} /> : <CardMedia component="img" sx={{ width: '18px', height: '18px' }} image={Expand} />}
        aria-controls="additional-options-content"
        id="additional-options-header"
      >
        <Typography sx={{ marginLeft: '8px', fontSize: '14px' }}>Advance</Typography>
      </StyledAccordionSummary>
      <AccordionDetails sx={{ display: 'flex', flexDirection: 'row', padding: '0', justifyContent: 'space-between' }}>
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
  )
}

export default KeyPathInput;
