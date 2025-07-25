import { Box, CardMedia, Divider, Stack, Tooltip, Typography } from '@mui/material';
import { isHexString } from 'ethers';
import React from 'react';

import circlecheck from '@/ui/assets/image/circlecheck.png';
import transactionFeeIcon from '@/ui/assets/svg/transactionFeeIcon.svg';
import { CopyButton } from '@/ui/components';
import IconFlow from '@/ui/components/iconfont/IconFlow';
import { formatAddress, HexToDecimalConverter } from '@/ui/utils';

import IconWithPlaceholder from '../EthApprovalComponents/IconWithPlaceholder';
const convertToFlow = (value) => {
  return Number(HexToDecimalConverter(value)) / 1_000_000_000_000_000_000;
};

export const TransactionBlock = ({ title, data, logo, lilicoEnabled, decodedCall }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Box sx={{ display: 'flex', gap: '18px', marginBottom: '0px' }}>
        <IconWithPlaceholder imageUrl={logo} />
        <Stack direction="column" spacing={1} sx={{ justifyContent: 'space-between' }}>
          <Typography color="text.secondary" sx={{ fontSize: '12px' }}>
            Sign Transaction from
          </Typography>
          <Typography variant="overline" sx={{ fontSize: '18px' }}>
            {title}
          </Typography>
        </Stack>
      </Box>
      <Divider />
      <Box
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontWeight: '500',
              fontSize: '12px',
              fontFamily: 'Inter',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CardMedia
              component="img"
              image={transactionFeeIcon}
              sx={{ width: '20px', height: '20px' }}
            />
            {chrome.i18n.getMessage('Transaction__Fee')}
          </Typography>
        </Box>
        <Box
          sx={{
            overflow: 'hidden',
          }}
        >
          {lilicoEnabled ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    mr: '8px',
                    color: '#FFFFFF66',
                    textDecoration: 'line-through',
                  }}
                >
                  0.001
                </Typography>
                <Typography sx={{ fontSize: '14px', fontFamily: 'Inter', mr: '8px' }}>
                  0.00
                </Typography>
                <IconFlow size={16} />
              </Box>
              <Typography
                sx={{
                  fontWeight: '400',
                  fontSize: '10px',
                  fontFamily: 'Inter',
                  color: '#FFFFFF66',
                  textAlign: 'right',
                }}
              >
                Covered by Flow Wallet
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontFamily: 'Inter',
                    mr: '8px',
                  }}
                >
                  ~ 0.001
                </Typography>
                <IconFlow size={16} />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <Divider />
      <Box>
        {data && data.length > 0 && data[0].to && (
          <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
            <Typography
              sx={{
                fontWeight: '600',
                color: 'FFFFFFCC',
                fontSize: '14px',
              }}
            >
              To Address
            </Typography>
            {data[0].to?.length >= 30 ? (
              <Tooltip title={data[0].to} placement="top">
                <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px', textAlign: 'right' }}>
                  {formatAddress(data[0].to)}
                </Typography>
              </Tooltip>
            ) : (
              <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}>
                {formatAddress(data[0].to)}
              </Typography>
            )}
          </Box>
        )}
        {data && data.length > 0 && data[0].value && (
          <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
            <Typography
              sx={{
                fontWeight: '600',
                color: 'FFFFFFCC',
                fontSize: '14px',
              }}
            >
              Amount
            </Typography>
            <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}>
              {isHexString(data[0].value) ? convertToFlow(data[0].value) : data[0].value}
            </Typography>
          </Box>
        )}
      </Box>
      <Divider />
      {decodedCall && (
        <Box>
          <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
            <Typography
              sx={{
                fontWeight: '600',
                color: 'FFFFFFCC',
                fontSize: '14px',
              }}
            >
              Contract
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}>
                {decodedCall.name || 'Unknown'}
              </Typography>
              {decodedCall.is_verified && (
                <CardMedia
                  component="img"
                  sx={{ width: '12px', height: '12px', ml: '4px' }}
                  image={circlecheck}
                />
              )}
            </Box>
          </Box>

          {decodedCall.decodedData.name ? (
            // Original rendering for when we have named parameters
            <>
              <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
                <Typography sx={{ fontWeight: '600', color: 'FFFFFFCC', fontSize: '14px' }}>
                  Function
                </Typography>
                <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}>
                  {decodedCall.decodedData.name}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
                <Typography sx={{ fontWeight: '600', color: 'FFFFFFCC', fontSize: '14px' }}>
                  Parameters
                </Typography>
                <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}></Typography>
              </Box>
              {decodedCall.decodedData.params && (
                <Box
                  sx={{
                    borderRadius: '12px',
                    background: '#222',
                    display: 'flex',
                    width: '100%',
                    padding: '16px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    overflowWrap: 'break-word',
                    margin: '8px 0 16px',
                  }}
                >
                  {decodedCall.decodedData.params.map((param, index) => (
                    <Box
                      key={index}
                      sx={{
                        padding: '0',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography
                        sx={{
                          color: '#FFFFFF66',
                          fontSize: '14px',
                        }}
                      >
                        {param.name || `param${index + 1}`}
                      </Typography>
                      {Array.isArray(param.value) ? (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            width: '100%',
                          }}
                        >
                          {param.value.map((item, i) => (
                            <Typography
                              key={i}
                              sx={{ color: '#FFFFFFCC', fontSize: '12px', textAlign: 'right' }}
                            >
                              {item?.length >= 30 ? (
                                <Tooltip title={item} placement="top">
                                  {formatAddress(item)}
                                </Tooltip>
                              ) : (
                                formatAddress(item)
                              )}
                            </Typography>
                          ))}
                        </Box>
                      ) : param.value?.length >= 30 ? (
                        <Tooltip title={param.value} placement="top">
                          <Typography
                            sx={{ color: '#FFFFFFCC', fontSize: '12px', textAlign: 'right' }}
                          >
                            {formatAddress(param.value)}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography
                          sx={{ color: '#FFFFFFCC', fontSize: '12px', textAlign: 'right' }}
                        >
                          {formatAddress(param.value)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </>
          ) : (
            decodedCall.decodedData.allPossibilities && (
              <>
                <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
                  <Typography sx={{ fontWeight: '400', color: 'FFFFFFCC', fontSize: '14px' }}>
                    Function
                  </Typography>
                  <Typography sx={{ color: '#FFFFFFCC', fontSize: '14px' }}>
                    {decodedCall.decodedData.allPossibilities[0].function}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    borderRadius: '12px',
                    background: '#222',
                    display: 'flex',
                    width: '100%',
                    padding: '16px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    overflowWrap: 'break-word',
                    margin: '8px 0 16px',
                  }}
                >
                  {decodedCall.decodedData.allPossibilities[0].params.map((param, index) => (
                    <Box
                      key={index}
                      display="flex"
                      justifyContent="space-between"
                      sx={{ padding: '0', width: '100%', alignItems: 'center' }}
                    >
                      <Typography sx={{ color: '#FFFFFF66', fontSize: '14px' }}>{''}</Typography>

                      {param?.length >= 30 ? (
                        <Tooltip title={param} placement="top">
                          <Typography
                            sx={{ color: '#FFFFFFCC', fontSize: '12px', textAlign: 'right' }}
                          >
                            {formatAddress(param)}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography
                          sx={{ color: '#FFFFFFCC', fontSize: '12px', textAlign: 'right' }}
                        >
                          {formatAddress(param)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )
          )}
          <Divider />
        </Box>
      )}
      <Box>
        {data && data.length > 0 && data[0].data && (
          <Box>
            <Box display="flex" justifyContent="space-between" sx={{ padding: '0' }}>
              <Typography
                sx={{
                  fontWeight: '600',
                  color: 'FFFFFFCC',
                  fontSize: '14px',
                }}
              >
                Call Data
              </Typography>
              <CopyButton textToCopy={data[0].data} />
            </Box>
            <Box
              sx={{
                borderRadius: '12px',
                background: '#222',
                display: 'flex',
                width: '100%',
                padding: '16px',
                flexDirection: 'column',
                alignItems: 'flex-start',
                overflowWrap: 'break-word',
              }}
            >
              <Typography
                sx={{
                  color: '#FFFFFFCC',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  width: '100%',
                }}
              >
                {data[0].data}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
