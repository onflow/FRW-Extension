import React, { useEffect, useState } from 'react';
import { Typography, Box, CardMedia } from '@mui/material';
import { LLHeader, LLPrimaryButton } from 'ui/FRWComponent';
import StakeCard from './components/StakeCard';
import crown from 'ui/FRWAssets/svg/crown.svg';
import TimeClock from 'ui/FRWAssets/svg/TimeClock.svg';
import Synchronize from 'ui/FRWAssets/svg/Synchronize.svg';
import Dashboard from 'ui/FRWAssets/svg/Dashboard.svg';
import Certificate from 'ui/FRWAssets/svg/Certificate.svg';
import nodeList from './nodeList.json';
import { useWallet } from 'ui/utils';
interface NoStakeProps {
  noStakeOpen: boolean;
  network: string;
  hasSetup: boolean;
  loading: boolean;
  handleClick: () => void;
  amount: number;
}

const NoStake = (props: NoStakeProps) => {
  const usewallet = useWallet();
  const [apr, setApr] = useState<any>(0);
  const getApy = async () => {
    const result = await usewallet.getApr();
    setApr(result);
  };

  useEffect(() => {
    getApy();
  }, []);

  return (
    <Box className="page"
      sx={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        height: '487px',
        background: '#121212'
      }}
    >
      {props.noStakeOpen ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '490px',
            paddingBottom: '20px',
            overflow: 'auto',
          }}
        >
          <LLHeader title="Stakes" help={false}></LLHeader>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              margin: '0',
              backgroundColor: 'background.default',
              padding: '0 18px',
            }}
          >

            <Typography
              variant="body1"
              sx={{
                pb: '15px',
                alignSelf: 'left',
                fontSize: '14px',
                fontWeight: '500',
              }}
              component="span"
              color="text.secondary"
            >
              {chrome.i18n.getMessage('Recommend')}
            </Typography>
            {nodeList
              .filter((item) => item.name == 'Lilico')
              .map((item) => (
                <StakeCard
                  name={item.name}
                  img={item.icon}
                  short={item.type}
                  node={item.id}
                  amount={(apr * 100).toFixed(4)}
                />
              ))}

            <Typography
              variant="body1"
              sx={{
                py: '15px',
                alignSelf: 'left',
                fontSize: '14px',
                fontWeight: '500',
              }}
              component="span"
              color="text.secondary"
            >
              Staking Provider
            </Typography>

            {nodeList
              .filter((item) => item.name != 'Lilico')
              .map((item) => (
                <StakeCard
                  name={item.name}
                  img={item.icon}
                  short={item.type}
                  node={item.id}
                  amount={(apr * 100).toFixed(4)}
                />
              ))}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            padding: '12px 0 0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '60px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src="https://raw.githubusercontent.com/Outblock/Assets/main/ft/flow/logo.png"
                style={{
                  height: '36px',
                  width: '36px',
                  marginRight: '8px',
                  backgroundColor: '#282828',
                  borderRadius: '18px',
                }}
              />

              <Typography
                display="inline"
                sx={{
                  fontWeight: 'bold',
                  fontSize: '24px',
                  color: '#fff',
                }}
                variant="body2"
              >
                Stake FLOW
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{
              // width: '100%',
              display: 'flex',
              padding: '0 30px',
              flexDirection: 'column',
              backgroundColor: '#1F1F1F',
              borderRadius: '24px 24px 0px 0px',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'center',
                padding: '16px 22px 20px',
              }}
            >
              <Box sx={{ width: '32px' }}>
                <CardMedia
                  sx={{ width: '32px', height: '32px' }}
                  image={crown}
                />
              </Box>
              <Typography
                display="inline"
                sx={{
                  fontWeight: 'normal',
                  fontSize: '20px',
                  color: '#fff',
                  paddingLeft: '6px',
                  textAlign: 'center',
                }}
                variant="body2"
              >
                <Typography
                  display="inline"
                  sx={{
                    fontWeight: 'bold',
                    fontSize: '20px',
                    background: '-webkit-linear-gradient(320deg, #FFC062 4.01%, #0BD3FF 62.72%);',
                    backgroundClip: 'text',
                    textFillColor: 'transparent'
                  }}
                  variant="body2"
                >
                  Earn Rewards{' '}
                </Typography>{' '}
                when you stake your FLOW
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'flex-start',
                marginBottom: '17px',
              }}
            >
              <Box
                sx={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <CardMedia
                  sx={{ width: '24px', height: '24px' }}
                  image={Dashboard}
                />
              </Box>
              <Typography
                component="div"
                sx={{
                  textAlign: 'left',
                  lineHeight: '20px',
                  marginLeft: '11px',
                  fontSize: '12px',
                }}
                variant="overline"
                color="text.primary"
              >
                Earn rewards every week, up to{' '}
                <Typography
                  sx={{ fontSize: '12px' }}
                  display="inline"
                  color="#00B881"
                >
                  9.5%{' '}
                </Typography>
                per year.
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'flex-start',
                marginBottom: '17px',
              }}
            >
              <Box
                sx={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <CardMedia
                  sx={{ width: '24px', height: '24px' }}
                  image={Synchronize}
                />
              </Box>
              <Typography
                component="div"
                sx={{
                  textAlign: 'left',
                  lineHeight: '20px',
                  marginLeft: '11px',
                  fontSize: '12px',
                }}
                variant="overline"
                color="text.primary"
              >
                When you stake{' '}
                <Typography
                  display="inline"
                  color="#00B881"
                  sx={{ fontSize: '12px' }}
                >
                  FLOW
                </Typography>{' '}
                you receive{' '}
                <Typography
                  display="inline"
                  color="#00B881"
                  sx={{ fontSize: '12px' }}
                >
                  FLOW 
                </Typography>
                {' '}as a reward. Your rewards are liquid and can be can{' '}
                <Typography
                  color="#00B881"
                  display="inline"
                  sx={{ fontSize: '12px' }}
                >
                  traded
                </Typography>{' '}
                at any time.
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'flex-start',
                marginBottom: '17px',
              }}
            >
              <Box
                sx={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <CardMedia
                  sx={{ width: '24px', height: '24px' }}
                  image={TimeClock}
                />
              </Box>
              <Typography
                component="div"
                sx={{
                  textAlign: 'left',
                  lineHeight: '20px',
                  marginLeft: '11px',
                  fontSize: '12px',
                }}
                variant="overline"
                color="text.primary"
              >
                You'll start earning rewards{' '}
                <Typography
                  sx={{ fontSize: '12px' }}
                  display="inline"
                  color="#00B881"
                >
                  right away
                </Typography>
                .
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'start',
                alignItems: 'flex-start',
              }}
            >
              <Box
                sx={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <CardMedia
                  sx={{ width: '24px', height: '24px' }}
                  image={Certificate}
                />
              </Box>
              <Typography
                component="div"
                sx={{
                  textAlign: 'left',
                  lineHeight: '20px',
                  marginLeft: '11px',
                  fontSize: '12px',
                }}
                variant="overline"
                color="text.primary"
              >
                Rewards are automatically deposited to your account every{' '}
                <Typography
                  display="inline"
                  color="#00B881"
                  sx={{ fontSize: '12px' }}
                >
                  week
                </Typography>
                .
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, minHeight: '30px' }} />
            <Box sx={{ paddingY: '18px', marginBottom: '12px' }}>
              {props.network !== 'mainnet' ? (
                <LLPrimaryButton
                  label="Mainnet required"
                  sx={{
                    borderRadius: '14px',
                    height: '50px',
                    width: '100%',
                    fontSize: '18px',
                    backgroundColor: '#666',
                    textTransform: 'none !important',
                  }}
                />
              ) : (
                <LLPrimaryButton
                  label={
                    props.amount < 50
                      ? 'Require 50 Flow to start staking'
                      : props.hasSetup
                        ? "Let's Stake"
                        : props.loading
                          ? 'Setting up ...'
                          : 'Setup Stake'
                  }
                  onClick={props.handleClick}
                  disabled={props.loading || props.amount < 50}
                  sx={{
                    borderRadius: '14px',
                    height: '50px',
                    width: '100%',
                    fontSize: '18px',
                    backgroundColor: '#60C293',
                    textTransform: 'none !important',
                  }}
                />

              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default NoStake;
