import fs from 'fs';
import path from 'path';

const appRoot = fs.realpathSync(process.cwd());

const rootResolve = path.resolve.bind(path, appRoot);

const paths = {
  root: appRoot,
  src: rootResolve('src'),
  popupHtml: rootResolve('src/ui/popup.html'),
  notificationHtml: rootResolve('src/ui/notification.html'),
  indexHtml: rootResolve('src/ui/index.html'),
  backgroundHtml: rootResolve('src/background/background.html'),
  dist: rootResolve('dist'),

  rootResolve,
};

export default paths;
