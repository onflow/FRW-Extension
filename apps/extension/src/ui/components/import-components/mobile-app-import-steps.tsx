import { Box, Button, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router';

import { IconScan } from '@/ui/assets/icons/IconScan';
import { KeyIcon } from '@/ui/assets/icons/KeyIcon';
import { LockIcon } from '@/ui/assets/icons/LockIcon';
import { UserPlus } from '@/ui/assets/icons/UserPlus';
import {
  COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80,
  COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF,
  COLOR_DARKMODE_WHITE_10pc,
  COLOR_GREEN_FLOW_DARKMODE_00EF8B,
} from '@/ui/style/color';

const ImportStep = ({
  step,
  icon,
  description,
}: {
  icon: React.ReactNode;
  step: number;
  description: string;
}) => {
  return (
    <Box
      sx={{
        width: '142px',
        padding: '16px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyItems: 'center',
        gap: '10px',
      }}
    >
      {icon}
      <Typography variant="body1" color="text.primary" sx={{ fontSize: '16px', fontWeight: 600 }}>
        {chrome.i18n.getMessage(`Step_${step}`)}
      </Typography>
      <Typography
        variant="body1"
        color={COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80}
        sx={{ fontSize: '14px', fontWeight: 400, textAlign: 'center' }}
      >
        {description}
      </Typography>
    </Box>
  );
};
/**
 * Steps that describe the process of importing a profile from a mobile app.
 * @param isLogin - Whether the user is logged in.
 * @returns A component that displays the mobile app import steps.
 */
const MobileAppImportSteps = ({ isLogin = false }: { isLogin: boolean }) => {
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          height: '314px',
          width: '100%',
          padding: '24px',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '24px',
          flexShrink: '0',
          alignSelf: 'stretch',
          borderRadius: '16px',
          background: COLOR_DARKMODE_WHITE_10pc,
        }}
      >
        <Box>
          <Typography
            variant="body1"
            color={COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF}
            sx={{ fontSize: '24px', fontWeight: 600, lineHeight: '120%' }}
          >
            {chrome.i18n.getMessage('Mobile_overview')}
          </Typography>
          <Typography
            variant="body1"
            color={COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80}
            sx={{ fontSize: '14px', fontWeight: 400, lineHeight: '120%' }}
          >
            {chrome.i18n.getMessage(
              'Create_a_new_profile_with_an_account_from_Flow_Wallet_Mobile_App'
            )}
          </Typography>
        </Box>
        <Box
          sx={{
            borderBottom: `1px solid ${COLOR_DARKMODE_WHITE_10pc}`,
            width: '100%',
          }}
        ></Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyItems: 'space-between',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <ImportStep
            step={1}
            icon={<KeyIcon width={34} height={34} color={COLOR_GREEN_FLOW_DARKMODE_00EF8B} />}
            description={chrome.i18n.getMessage('Import_from_Mobile_Step_1')}
          />
          <ImportStep
            step={2}
            icon={<LockIcon width={34} height={34} color={COLOR_GREEN_FLOW_DARKMODE_00EF8B} />}
            description={
              isLogin
                ? chrome.i18n.getMessage('Import_from_Mobile_Step_2_verify')
                : chrome.i18n.getMessage('Import_from_Mobile_Step_2_setup')
            }
          />
          <ImportStep
            step={3}
            icon={<IconScan width={34} height={34} color={COLOR_GREEN_FLOW_DARKMODE_00EF8B} />}
            description={chrome.i18n.getMessage('Import_from_Mobile_Step_3')}
          />
          <ImportStep
            step={4}
            icon={<UserPlus width={34} height={34} color={COLOR_GREEN_FLOW_DARKMODE_00EF8B} />}
            description={chrome.i18n.getMessage('Import_from_Mobile_Step_4')}
          />
        </Box>
      </Box>
      <Button
        className="registerButton"
        variant="contained"
        color="secondary"
        size="large"
        component={Link}
        to="/welcome/sync"
        sx={{
          height: '56px',
          width: '100%',
          borderRadius: '12px',
          textTransform: 'capitalize',
          display: 'flex',
          marginTop: '24px',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }} color="background.paper">
          {chrome.i18n.getMessage('Import_from_Mobile_Submit')}
        </Typography>
      </Button>
    </>
  );
};

export default MobileAppImportSteps;
