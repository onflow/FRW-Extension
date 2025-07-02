import { Box, Chip, Tooltip, Typography } from '@mui/material';
import React, { useCallback } from 'react';

import packageJson from '../../../package.json' assert { type: 'json' };
const { version } = packageJson;
import { COLOR_PRIMARY_TEXT_282828 } from '../style/color';

const deploymentEnv = process.env.DEPLOYMENT_ENV || 'local';
const isBeta = process.env.IS_BETA === 'true';
const betaVersion = process.env.BETA_VERSION || ''; // This is the whole tag name like 2.8.5-beta.1

export const BuildIndicator = () => {
  // Function to construct GitHub comparison URL
  const getComparisonUrl = useCallback(() => {
    const repoUrl = process.env.REPO_URL || 'https://github.com/onflow/FRW-Extension';
    const latestTag = process.env.LATEST_TAG || '';
    const commitSha = process.env.COMMIT_SHA || '';

    if (latestTag && commitSha) {
      return `${repoUrl}/compare/${latestTag}...${commitSha}`;
    }

    return `${repoUrl}/commits`;
  }, []);

  if (deploymentEnv === 'production' && !isBeta) {
    return null;
  }

  const buildText = isBeta ? betaVersion : `${deploymentEnv} build`;
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        position: 'absolute',
        justifyContent: 'flex-end',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          position: 'absolute',
          padding: { xs: '0 8px', sm: '0 16px', md: '0 24px' },
          margin: { xs: '0', sm: '0 16px', md: '0 24px' },
          borderRadius: '0 0 16px 16px',
          backgroundColor: COLOR_PRIMARY_TEXT_282828,
        }}
      >
        <Tooltip
          title={
            <Box>
              <Typography variant="caption">{`Build: ${process.env.DEPLOYMENT_ENV}`}</Typography>
              {process.env.LATEST_TAG && process.env.COMMIT_SHA && (
                <Typography variant="caption" display="block">
                  {`Compare: ${process.env.LATEST_TAG}...${process.env.COMMIT_SHA?.substring(0, 7)}`}
                </Typography>
              )}
              <Typography variant="caption" display="block">
                {`Repo: ${process.env.REPO_URL?.replace('https://github.com/', '') || 'onflow/FRW-Extension'}`}
              </Typography>
              <Typography variant="caption" display="block">
                Click to view changes
              </Typography>
            </Box>
          }
          arrow
        >
          <Typography
            color={
              deploymentEnv === 'staging' || isBeta
                ? 'default'
                : deploymentEnv === 'development'
                  ? 'warning'
                  : 'error'
            }
            sx={{
              height: '18px',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '16px',
              maxWidth: '90px',
              cursor: 'pointer',
            }}
            onClick={() => {
              const url = getComparisonUrl();
              window.open(url, '_blank');
            }}
          >
            {buildText}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
};
