// FirebaseFixPlugin.js
class FirebaseFixPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('FirebaseFixPlugin', (compilation, callback) => {
      for (const asset in compilation.assets) {
        if (/\.(js|jsx)$/.test(asset)) {
          let content = compilation.assets[asset].source();

          // Replace the _loadJS function
          content = content.replace(
            /function\s*\w*\s*_loadJS\([\w\s,]*\)\s*{([\w\W]*?)}$/gim,
            'function _loadJS() { return Promise.resolve(); };'
          );

          // Replace the Google reCAPTCHA string
          content = content.replace(
            'https://www.google.com/recaptcha/enterprise.js?render=',
            ''
          );

          content = content.replace(
            'https://www.google.com/recaptcha/api.js?',
            ''
          );

          content = content.replace(
            /_loadJS\(`https:\/\/apis\.google\.com\/js\/api\.js\?onload=\$\{([^}]+)\}`\)/g,
            '_loadJS(`${$1}`)'
          );

          content = content.replace(
            /\(`https:\/\/apis\.google\.com\/js\/api\.js\?onload=\$\{t\}`\)/g,
            '(`${t}`)'
          );
          
          compilation.assets[asset] = {
            source: () => content,
            size: () => content.length,
          };
        }
      }
      callback();
    });
  }
}

module.exports = FirebaseFixPlugin;
