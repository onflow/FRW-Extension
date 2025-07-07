import { styled, Button, Tooltip } from '@mui/material';
import React from 'react';

import IconCopy from '@/ui/components/iconfont/IconCopy';

const CopyIconWrapper = styled('div')(() => ({
  cursor: 'pointer',
}));

interface CopyButtonProps {
  textToCopy: string;
}

export const CopyButton = ({ textToCopy }: CopyButtonProps) => {
  return (
    <CopyIconWrapper>
      <Tooltip title={chrome.i18n.getMessage('Copy__Address')} arrow>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(textToCopy);
          }}
          sx={{ maxWidth: '30px', minWidth: '30px' }}
        >
          <IconCopy fill="icon.navi" width="16px" />
        </Button>
      </Tooltip>
    </CopyIconWrapper>
  );
};
