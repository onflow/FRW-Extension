import { Typography, Button } from '@mui/material';
import Box from '@mui/material/Box';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';

import { LLHeader } from '@/ui/components';
import IconCopy from '@/ui/components/iconfont/IconCopy';
import { useWallet } from 'ui/utils';

const RecoveryPhasesDetail = () => {
  const location = useLocation();
  const wallet = useWallet();
  const [recoveryphases, setRecovery] = useState<string>('');

  const verify = useCallback(async () => {
    const pwd = location.state.password;
    const result = await wallet.getMnemonic(pwd);
    setRecovery(result);
  }, [location.state.password, wallet]);

  const setTab = useCallback(async () => {
    await wallet.setDashIndex(3);
  }, [wallet]);

  useEffect(() => {
    setTab();
    verify();
  }, [setTab, verify]);

  return (
    <div className="page">
      <LLHeader title={chrome.i18n.getMessage('Recovery__Phrase')} help={false} />

      <Box
        sx={{
          border: '2px solid #5E5E5E',
          borderRadius: '12px',
          position: 'relative',
          width: '364px',
          height: '166px',
          marginLeft: '16px',
          // overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoFlow: 'row',
            gridGap: '8px',
            gridColumn: '4',
            borderRadius: '12px',
            transition: 'all .3s linear',
            // margin: '-2%',
            // py: '16px',
            // px: '24px',
            justifyContent: 'center',
            paddingLeft: '16px',
          }}
        >
          {recoveryphases.split(' ').map((word, i) => {
            return (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  marginBottom: '10px',
                }}
              >
                {/* <Chip label={i+1} sx={{ color: '#41CC5D',backgroundColor: '#282828',marginRight: '10px',
                                    fontSize: '12px', fontWeight: 'Semibold', borderRadius: '100%',height: '24px',width: '24px',justifyContent: 'center'}} /> */}
                <Box
                  sx={{
                    backgroundColor: '#282828',
                    marginRight: '10px',
                    borderRadius: '100%',
                    height: '24px',
                    width: '24px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontColor: '#41CC5D',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#41CC5D',
                      textAlign: 'center',
                      marginTop: '4px',
                    }}
                  >
                    {i + 1}
                  </Typography>
                </Box>
                <Typography
                  key={'key_' + i}
                  variant="body1"
                  sx={{ color: 'text.primary', fontSize: '14px' }}
                >
                  {word}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box
        sx={{
          width: '85px',
          height: '30px',
          backgroundColor: '#282828',
          borderRadius: '15px',
          marginLeft: '150px',
          marginTop: '20px',
          align: 'center',
          marginBottom: '56px',
        }}
      >
        <Button
          onClick={() => {
            navigator.clipboard.writeText(recoveryphases);
          }}
          variant="text"
          color="primary"
          startIcon={<IconCopy />}
          sx={{
            height: '30px',
            width: '85px',
            justifySelf: 'center',
            borderRadius: '15px',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {chrome.i18n.getMessage('COPY')}
          </Typography>
        </Button>
      </Box>
      <Box
        sx={{
          backgroundColor: 'rgba(247, 87, 68, 0.1)',
          borderRadius: '16px',
          width: '360px',
          height: '90px',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          margin: '18px',
          padding: '16px',
        }}
      >
        <Typography
          sx={{
            alignSelf: 'center',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: '600',
            lineHeight: '16px',
            color: '#E54040',
            paddingBottom: '16px',
            paddingTop: '0px',
          }}
        >
          {chrome.i18n.getMessage('Do__not__share__your__secret__phrase')}
        </Typography>
        <Typography
          sx={{
            alignSelf: 'center',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: '400',
            lineHeight: '16px',
            color: '#E54040',
          }}
        >
          {chrome.i18n.getMessage('If__someone__has__your__secret__phrase')}
        </Typography>
      </Box>
      {/* <Box
        sx={{
          display: 'flex',
          px: '18px',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Button
          variant="contained"
          component={Link}
          to="/dashboard"
          size="large"
          sx={{
            backgroundColor: '#333333',
            display: 'flex',
            flexGrow: 1,
            height: '48px',
            width: '364px',
            borderRadius: '8px',
            textTransform: 'capitalize',
          }}
        >
          <Typography
            sx={{ fontWeight: '600',
              fontSize: '14px', fontFamily:'Inter',
              fontColor:'white',
            }}
          >
            {chrome.i18n.getMessage('Done')}
          </Typography>
        </Button>
      </Box> */}
    </div>
  );
};

export default RecoveryPhasesDetail;
