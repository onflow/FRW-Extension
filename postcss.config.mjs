export default {
  plugins: {
    'postcss-import': {},
    'postcss-nested': {},
    'postcss-custom-properties': {
      preserve: false,
    },
    autoprefixer: {
      grid: 'autoplace',
    },
  },
};
