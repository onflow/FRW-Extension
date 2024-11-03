import React, { useState, useEffect } from 'react';
import { Stack, Box, Typography, Divider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';
import { useHistory } from 'react-router-dom';
import { Presets } from 'react-component-transition';
import IconFlow from '../../../../../../components/iconfont/IconFlow';
import Highlight from 'react-highlight';
import { getScripts } from 'background/utils';
import placeholder from 'ui/FRWAssets/image/placeholder.png';


export const DefaultBlock = ({ title, host, auditor, expanded, data, method, logo, setExpanded, dedent, lilicoEnabled }) => {
  const history = useHistory();

  const [contract, setContract] = useState<string>('')

  const hexToAscii = (hex) => {
    let str = '';
    for (let i = 2; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  };

  useEffect(() => {
    if (method === 'eth_sendTransaction') {
      getContract();
    }
  }, [method]);

  const getContract = async () => {
    const script = await getScripts('evm', 'callContract');
    setContract(script)
  };

  const hexToString = (hex) => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  };


  const processItem = (item) => {
    console.log('item ', item)
    if (Array.isArray(item)) {
      return `[\n${item.map(value => `\t${value}`).join(',\n')}\n]`;
    } else if (typeof item === 'object' && item !== null) {
      return `{\n${Object.entries(item).map(([key, value]) => `\t${key}: ${value}`).join(',\n')}\n}`;
    } else {
      return hexToString(item);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', margin: '18px', gap: '12px' }}>
      <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
        <img style={{ height: '60px', width: '60px', borderRadius: '12px', backgroundColor: 'text.secondary' }} src={logo ? logo : placeholder} />
        <Stack direction="column" spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Typography>{title}</Typography>
          <Typography color="secondary.main" variant="overline">{host}</Typography>
        </Stack>
      </Box>
      <Divider />
      {method === 'personal_sign' &&

        <Box sx={{ borderRadius: '12px', overflow: 'hidden', width: '100%', height: '100%' }}>
          <Accordion key="Cadence" disableGutters sx={{ color: '#BABABA', background: '#282828', borderRadius: '12px !important', overflow: 'hidden' }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#41CC5D', fontSize: 20 }} />}
              aria-controls="panel1a-content"
              sx={{ height: '40px !important' }}
            >
              <Typography sx={{ fontWeight: '500', fontSize: '12px', fontFamily: 'Inter' }}>{chrome.i18n.getMessage('SIGN__MESSAGE')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '0 10px' }}>
              {data.length > 0 && (<Box sx={{ background: '#333333', borderRadius: '12px', padding: '12px 8px', mb: '12px', overflow: 'hidden' }} >
                <Typography component='pre' sx={{ fontWeight: '400', fontSize: '10px', fontFamily: 'Inter' }}>
                  <Highlight className='swift'>
                    {`${processItem(data[0])}`}
                  </Highlight>
                </Typography>
              </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Box>
      }

      {method === 'eth_sendTransaction' &&
        <Box sx={{ borderRadius: '12px', overflow: 'hidden', width: '100%', display: 'table' }}>
          <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)} disableGutters sx={{ color: '#BABABA', background: '#282828', borderRadius: '12px !important', overflow: 'hidden' }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#41CC5D', fontSize: 20 }} />}
              aria-controls="panel1a-content"
              sx={{ height: '40px !important' }}
            >
              <Typography sx={{ fontWeight: '500', fontSize: '12px', fontFamily: 'Inter' }}>{chrome.i18n.getMessage('Transaction__Fee')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '0 10px' }}>
              <Box sx={{ background: '#282828', borderRadius: '12px', height: '100%', padding: '2px 8px', mb: '6px', overflow: 'hidden' }} >
                {lilicoEnabled ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconFlow size={16} />
                      <Typography sx={{ fontWeight: '600', fontSize: '25px', fontFamily: 'Inter', ml: '8px' }}>
                        0
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: '400', fontSize: '12px', fontFamily: 'Inter', color: 'info.main' }}>
                      {chrome.i18n.getMessage('lilico__covers__this__gas__fee__for__you')}
                    </Typography>
                  </Box>
                ) :
                  (
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconFlow size={16} />
                        <Typography sx={{ fontWeight: '600', fontSize: '25px', fontFamily: 'Inter', ml: '8px' }}>
                          0.00001
                        </Typography>
                      </Box>
                    </Box>
                  )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      }
      {method === 'eth_sendTransaction' &&

        <Box sx={{ borderRadius: '12px', overflow: 'hidden', width: '100%', height: '100%' }}>
          <Accordion key="Cadence" disableGutters sx={{ color: '#BABABA', background: '#282828', borderRadius: '12px !important', overflow: 'hidden' }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#41CC5D', fontSize: 20 }} />}
              aria-controls="panel1a-content"
              sx={{ height: '40px !important' }}
            >
              <Typography sx={{ fontWeight: '500', fontSize: '12px', fontFamily: 'Inter' }}>{chrome.i18n.getMessage('SCRIPT')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '0 10px' }}>
              {data.length > 0 && (<Box sx={{ background: '#333333', borderRadius: '12px', padding: '12px 8px', mb: '12px', overflow: 'hidden' }} >
                <Typography component='pre' sx={{ fontWeight: '400', fontSize: '10px', fontFamily: 'Inter' }}>
                  <Highlight className='swift'>
                    {`[\n${data.map(item => `\t${processItem(item)}`).join(',\n')}\n]`}
                  </Highlight>
                </Typography>
              </Box>
              )}

              <Box sx={{ background: '#333333', borderRadius: '12px', height: '100%', padding: '12px 8px', mb: '12px', overflow: 'hidden' }} >
                <Typography component='pre' sx={{ fontWeight: '400', fontSize: '10px', fontFamily: 'Inter' }}>
                  <Highlight className='swift'>
                    {contract && dedent(contract)}
                  </Highlight>
                </Typography>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      }

    </Box>
  );
};
