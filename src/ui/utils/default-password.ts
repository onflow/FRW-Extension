if (process.env.NODE_ENV !== 'development') {
  if (!!process.env.DEV_PASSWORD) {
    throw new Error('DEV_PASSWORD should only be set in development environment');
  }
}

export const DEFAULT_PASSWORD =
  process.env.NODE_ENV === 'development' ? process.env.DEV_PASSWORD || '' : '';
