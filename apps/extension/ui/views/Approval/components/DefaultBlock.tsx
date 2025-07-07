import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import {
  Stack,
  Box,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import Fade from '@mui/material/Fade';
import React from 'react';
import Highlight from 'react-highlight';

import { consoleError } from '@/shared/utils/console-log';
import IconFlow from '@/ui/components/iconfont/IconFlow';

export const DefaultBlock = ({
  title,
  host,
  auditor,
  expanded,
  lilicoEnabled,
  cadenceArguments,
  logo,
  cadenceScript,
  setExpanded,
  dedent,
}) => {
  const processItem = (item) => {
    if (Array.isArray(item)) {
      return `[ ${item.map((value) => processItem(value)).join(', ')} ]`;
    } else if (typeof item === 'object' && item !== null) {
      if (item.type && item.value !== undefined) {
        return `${processItem(item.value)}`;
      } else {
        return `${Object.entries(item)
          .map(([_, value]) => processItem(value))
          .join('\n')}`;
      }
    } else {
      return JSON.stringify(item);
    }
  };

  const displayCadenceArguments = (cadenceArguments) => {
    if (!Array.isArray(cadenceArguments)) {
      consoleError('cadenceArguments is not an array:', cadenceArguments);
      return;
    }
    return cadenceArguments.map((item) => processItem(item)).join('\n\n');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '12px' }}>
      <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
        <img
          style={{
            height: '60px',
            width: '60px',
            borderRadius: '12px',
            backgroundColor: 'text.secondary',
          }}
          src={logo}
        />
        <Stack direction="column" spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Typography>{title}</Typography>
          <Typography color="secondary.main" variant="overline">
            {host}
          </Typography>
        </Stack>
      </Box>
      <Divider />

      <Fade in={true}>
        {auditor ? (
          <Stack direction="column" spacing="12px" sx={{ justifyContent: 'space-between' }}>
            <Box
              sx={{
                borderRadius: '12px',
                width: '100%',
                py: '12px',
                display: 'flex',
                background: '#192E0F',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              <GppGoodRoundedIcon fontSize="small" color="success" />
              <Typography
                color="success.main"
                variant="body2"
              >{`Verified by ${auditor.auditor.name}`}</Typography>
            </Box>

            <Box
              sx={{
                borderRadius: '12px',
                width: '100%',
                py: '12px',
                px: '16px',
                display: 'flex',
                background: '#282828',
                gap: '12px',
                flexDirection: 'column',
              }}
            >
              <Typography color="neutral.contrastText" variant="body2" sx={{ fontWeight: 'bold' }}>
                {auditor.template?.data?.messages?.title?.i18n['en-US']}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8f8f8f' }}>
                {auditor.template?.data?.messages?.description?.i18n['en-US']}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Stack />
        )}
      </Fade>

      <Box sx={{ borderRadius: '12px', overflow: 'hidden', width: '100%', display: 'table' }}>
        <Accordion
          expanded={expanded}
          onChange={() => setExpanded(!expanded)}
          disableGutters
          sx={{
            color: '#BABABA',
            background: '#282828',
            borderRadius: '12px !important',
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#41CC5D', fontSize: 20 }} />}
            aria-controls="panel1a-content"
            sx={{ height: '40px !important' }}
          >
            <Typography sx={{ fontWeight: '500', fontSize: '12px', fontFamily: 'Inter' }}>
              {chrome.i18n.getMessage('Transaction__Fee')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: '0 10px' }}>
            <Box
              sx={{
                background: '#282828',
                borderRadius: '12px',
                height: '100%',
                padding: '2px 8px',
                mb: '6px',
                overflow: 'hidden',
              }}
            >
              {lilicoEnabled ? (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconFlow size={16} />
                    <Typography
                      sx={{ fontWeight: '600', fontSize: '25px', fontFamily: 'Inter', ml: '8px' }}
                    >
                      0
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: '400',
                      fontSize: '12px',
                      fontFamily: 'Inter',
                      color: 'info.main',
                    }}
                  >
                    {chrome.i18n.getMessage('lilico__covers__this__gas__fee__for__you')}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconFlow size={16} />
                    <Typography
                      sx={{ fontWeight: '600', fontSize: '25px', fontFamily: 'Inter', ml: '8px' }}
                    >
                      0.00001
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box sx={{ borderRadius: '12px', overflow: 'hidden', width: '100%', height: '100%' }}>
        <Accordion
          key="Cadence"
          disableGutters
          sx={{
            color: '#BABABA',
            background: '#282828',
            borderRadius: '12px !important',
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#41CC5D', fontSize: 20 }} />}
            aria-controls="panel1a-content"
            sx={{ height: '40px !important' }}
          >
            <Typography sx={{ fontWeight: '500', fontSize: '12px', fontFamily: 'Inter' }}>
              {chrome.i18n.getMessage('SCRIPT')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: '0 10px' }}>
            {cadenceArguments.length > 0 && (
              <Box
                sx={{
                  background: '#333333',
                  borderRadius: '12px',
                  padding: '12px 8px',
                  mb: '12px',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  component="pre"
                  sx={{ fontWeight: '400', fontSize: '10px', fontFamily: 'Inter' }}
                >
                  <Highlight className="swift">
                    {`\n${displayCadenceArguments(cadenceArguments)}\n`}
                  </Highlight>
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                background: '#333333',
                borderRadius: '12px',
                height: '100%',
                padding: '12px 8px',
                mb: '12px',
                overflow: 'hidden',
              }}
            >
              <Typography
                component="pre"
                sx={{ fontWeight: '400', fontSize: '10px', fontFamily: 'Inter' }}
              >
                <Highlight className="swift">{cadenceScript && dedent(cadenceScript)}</Highlight>
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};
