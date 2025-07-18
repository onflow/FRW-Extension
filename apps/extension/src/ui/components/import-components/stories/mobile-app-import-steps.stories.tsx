import React from 'react';
import { withRouter } from 'storybook-addon-remix-react-router';

import MobileAppImportSteps from '@/ui/components/import-components/mobile-app-import-steps';

export default {
  title: 'components/import-components/MobileAppImportSteps',
  tags: ['autodocs'],

  component: MobileAppImportSteps,
  decorators: [withRouter],

  argTypes: {
    isLogin: {
      control: 'boolean',
    },
  },
};

export const Default = (args: { isLogin: boolean }) => <MobileAppImportSteps {...args} />;
