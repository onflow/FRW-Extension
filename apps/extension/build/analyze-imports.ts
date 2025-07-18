import parser from '@babel/parser';
import traverse from '@babel/traverse';
import fs from 'fs';
import { glob } from 'glob';
import path from 'path';

type PackageLocations = {
  background: Set<string>;
  ui: Set<string>;
  content: Set<string>;
};

function analyzeFile(
  filePath: string,
  imports: Map<string, Set<string>>,
  packageLocations: PackageLocations
) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  try {
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const processImport = (importPath: string) => {
      if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
        const packageName = importPath.startsWith('@')
          ? importPath.split('/').slice(0, 2).join('/')
          : importPath.split('/')[0];

        if (!imports.has(packageName)) {
          imports.set(packageName, new Set());
        }
        imports.get(packageName)?.add(relativePath);

        if (relativePath.includes('background/')) {
          packageLocations.background.add(packageName);
        } else if (relativePath.includes('ui/')) {
          packageLocations.ui.add(packageName);
        } else if (relativePath.includes('content/')) {
          packageLocations.content.add(packageName);
        }
      }
    };

    traverse(ast, {
      ImportDeclaration: (path) => {
        processImport(path.node.source.value);
      },
      CallExpression(path) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'require') {
          const arg = path.node.arguments[0];
          if (arg && arg.type === 'StringLiteral') {
            processImport(arg.value);
          }
        }
      },
    });
  } catch (error) {
    console.error(`Failed to parse ${relativePath}:`, error.message);
  }
}

function generateReport(imports: Map<string, Set<string>>, packageLocations: PackageLocations) {
  let report = '# Dependency Usage Analysis\n\n';
  report += `> Generated on ${new Date().toLocaleString()}\n\n`;

  report += '## Package Usage by Location\n\n';
  Object.entries(packageLocations).forEach(([location, packages]) => {
    report += `### ${location.charAt(0).toUpperCase() + location.slice(1)}\n\n`;
    Array.from(packages)
      .sort()
      .forEach((pkg) => {
        const usageCount = imports.get(pkg)?.size ?? 0;
        report += `- \`${pkg}\` (${usageCount} ${usageCount === 1 ? 'file' : 'files'})\n`;
      });
    report += '\n';
  });

  report += '## Detailed Package Usage\n\n';
  Array.from(imports.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([pkg, files]) => {
      report += `### \`${pkg}\`\n\n`;
      Array.from(files)
        .sort()
        .forEach((file) => {
          report += `- ${file}\n`;
        });
      report += '\n';
    });

  return report;
}

// Run the analysis

console.log('Starting import analysis...');

const imports = new Map<string, Set<string>>();
const packageLocations: PackageLocations = {
  background: new Set(),
  ui: new Set(),
  content: new Set(),
};

const files = glob.sync('src/**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**'],
});

files.forEach((file) => {
  analyzeFile(file, imports, packageLocations);
});

const report = generateReport(imports, packageLocations);
fs.writeFileSync('dependency-usage.md', report);

console.log('Analysis complete! Check dependency-usage.md');
