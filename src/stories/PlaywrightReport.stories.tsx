import React from 'react';

export default {
  title: 'Test Reports/Playwright Report',
};

export const Report = () => (
  <iframe
    src="/test-results/playwright-report/index.html"
    style={{ width: '100%', height: '80vh', border: 'none' }}
    title="Playwright Report"
  />
);
