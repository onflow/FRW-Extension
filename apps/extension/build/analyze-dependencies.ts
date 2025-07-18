import { parse } from '@babel/parser';
import traverseDefault from '@babel/traverse';
import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

import webpackConfig from '../webpack.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Dependencies = {
  background: Set<string>;
  ui: Set<string>;
  content: Set<string>;
  shared: Set<string>;
};

function analyzeDependencies(stats: webpack.Stats): Dependencies {
  const modules = new Map<string, Set<string>>();
  const dependencies: Dependencies = {
    background: new Set(),
    ui: new Set(),
    content: new Set(),
    shared: new Set(),
  };

  stats.compilation.modules.forEach((module) => {
    if (
      !(module instanceof webpack.NormalModule) ||
      !module.resource ||
      !module.resource.includes('node_modules')
    ) {
      return;
    }

    const pkg = module.resource.split('node_modules/')[1].split('/')[0];
    const chunks = Array.from(module.chunksIterable || []);

    chunks.forEach((chunk) => {
      const target = chunk.name?.includes('background')
        ? 'background'
        : chunk.name?.includes('ui')
          ? 'ui'
          : chunk.name?.includes('content')
            ? 'content'
            : null;

      if (target) {
        if (!modules.has(pkg)) {
          modules.set(pkg, new Set());
        }
        modules.get(pkg)?.add(target);
      }
    });
  });

  // Categorize dependencies
  modules.forEach((targets, pkg) => {
    if (targets.size > 1) {
      dependencies.shared.add(pkg);
    } else {
      const [target] = targets;
      dependencies[target].add(pkg);
    }
  });

  return dependencies;
}

function findSourceImports(): Set<string> {
  const imports = new Set<string>();
  const files = glob.sync('src/**/*.{ts,tsx,js,jsx}');

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'classPrivateProperties',
          'classPrivateMethods',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'throwExpressions',
          'dynamicImport',
        ],
      });

      traverseDefault(ast, {
        ImportDeclaration(path) {
          const importPath = path.node.source.value;
          if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
            const packageName = importPath.startsWith('@')
              ? importPath.split('/').slice(0, 2).join('/')
              : importPath.split('/')[0];
            imports.add(packageName);
          }
        },
      });
    } catch (error) {
      console.error(`Failed to parse ${file}:`, error.message);
    }
  });

  return imports;
}

type UnusedPackageInfo = {
  name: string;
  isDev: boolean;
};

function findUnusedPackages(dependencies: Dependencies): UnusedPackageInfo[] {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const prodDeps = new Set(Object.keys(packageJson.dependencies || {}));
  const devDeps = new Set(Object.keys(packageJson.devDependencies || {}));

  const usedPackages = new Set([
    ...dependencies.background,
    ...dependencies.ui,
    ...dependencies.content,
    ...dependencies.shared,
    ...findSourceImports(),
  ]);

  return [...prodDeps, ...devDeps]
    .filter((pkg) => !usedPackages.has(pkg))
    .map((pkg) => ({
      name: pkg,
      isDev: devDeps.has(pkg),
    }));
}

function generateReport(dependencies: Dependencies): string {
  let report = '# Extension Dependencies Analysis\n\n';
  report += `> Generated on ${new Date().toLocaleString()}\n\n`;

  // Add summary
  report += '## Summary\n\n';
  Object.entries(dependencies).forEach(([target, deps]) => {
    report += `- **${target}**: ${deps.size} packages\n`;
  });
  report += '\n';

  // Add detailed lists
  Object.entries(dependencies).forEach(([target, deps]) => {
    report += `## ${target.charAt(0).toUpperCase() + target.slice(1)} Dependencies\n\n`;
    if (deps.size === 0) {
      report += '_No dependencies_\n\n';
    } else {
      Array.from(deps)
        .sort()
        .forEach((dep) => {
          report += `- \`${dep}\`\n`;
        });
      report += '\n';
    }
  });

  // Add unused packages section
  const unusedPackages = findUnusedPackages(dependencies);
  report += '## Unused Packages\n\n';

  if (unusedPackages.length === 0) {
    report += '_All declared packages are used_\n\n';
  } else {
    report += 'The following packages are declared in package.json but not used in the build:\n\n';

    // Group by prod/dev
    const prodUnused = unusedPackages.filter((p) => !p.isDev);
    const devUnused = unusedPackages.filter((p) => p.isDev);

    if (prodUnused.length > 0) {
      report += '### Production Dependencies\n\n';
      prodUnused.forEach((pkg) => {
        report += `- \`${pkg.name}\`\n`;
      });
      report += '\n';
    }

    if (devUnused.length > 0) {
      report += '### Development Dependencies\n\n';
      devUnused.forEach((pkg) => {
        report += `- \`${pkg.name}\`\n`;
      });
      report += '\n';
    }
  }

  return report;
}

function prepareBuildEnvironment() {
  console.log('Preparing build environment...');

  // Copy manifest
  fs.copyFileSync(
    path.join(__dirname, '../_raw/manifest/manifest.dev.json'),
    path.join(__dirname, '../_raw/manifest.json')
  );

  // Clean dist directory
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
  } else {
    fs.rmSync(distPath, { recursive: true });
    fs.mkdirSync(distPath);
  }

  // Copy _raw contents to dist
  fs.cpSync(path.join(__dirname, '../_raw'), distPath, { recursive: true });
}

// Run the analysis
prepareBuildEnvironment();

const config = webpackConfig({ config: 'dev' });
config.watch = false;

console.log('Starting webpack build and analysis...');

webpack(config, (err, stats) => {
  if (err || !stats || (stats && stats.hasErrors())) {
    console.error('Build failed:', err || stats?.toString());
    process.exit(1);
  }

  console.log('Build complete, analyzing dependencies...');
  const dependencies = analyzeDependencies(stats);
  const report = generateReport(dependencies);

  const reportPath = path.join(__dirname, '../extension-dependencies.md');
  fs.writeFileSync(reportPath, report);

  console.log(`Analysis complete! Check ${reportPath}`);
});
