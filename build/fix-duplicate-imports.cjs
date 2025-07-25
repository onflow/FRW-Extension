#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const generate = require('@babel/generator').default;
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

function fixDuplicateImports(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');

  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const importsBySource = new Map();

    // Collect all imports
    traverse(ast, {
      ImportDeclaration(path) {
        const source = path.node.source.value;
        const basePackage = source.split('/').slice(0, 2).join('/');

        if (!importsBySource.has(basePackage)) {
          importsBySource.set(basePackage, []);
        }
        importsBySource.get(basePackage).push(path);
      },
    });

    // Process each package group
    importsBySource.forEach((imports, basePackage) => {
      if (imports.length <= 1) return;

      // Group by exact source
      const byExactSource = new Map();
      imports.forEach((importPath) => {
        const source = importPath.node.source.value;
        if (!byExactSource.has(source)) {
          byExactSource.set(source, []);
        }
        byExactSource.get(source).push(importPath);
      });

      // Merge imports from the same exact source
      byExactSource.forEach((sameSrcImports, source) => {
        if (sameSrcImports.length <= 1) return;

        const allSpecifiers = [];
        const allComments = [];

        sameSrcImports.forEach((importPath) => {
          allSpecifiers.push(...importPath.node.specifiers);
          if (importPath.node.leadingComments) {
            allComments.push(...importPath.node.leadingComments);
          }
        });

        // Keep the first import and remove others
        const firstImport = sameSrcImports[0];
        firstImport.node.specifiers = allSpecifiers;
        if (allComments.length > 0) {
          firstImport.node.leadingComments = allComments;
        }

        // Remove duplicate imports
        for (let i = 1; i < sameSrcImports.length; i++) {
          sameSrcImports[i].remove();
        }
      });
    });

    const { code: fixedCode } = generate(ast, {
      retainLines: true,
      retainFunctionParens: true,
      compact: false,
    });

    // Only write if there were changes
    if (fixedCode !== code) {
      fs.writeFileSync(filePath, fixedCode);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Get all TypeScript/JavaScript files
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('dist') && !file.startsWith('.')) {
        getAllFiles(filePath, fileList);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main execution
const projectRoot = process.cwd();
const files = getAllFiles(projectRoot);
let fixedCount = 0;

console.log(`Checking ${files.length} files for duplicate imports...`);

files.forEach((file) => {
  if (fixDuplicateImports(file)) {
    console.log(`Fixed: ${path.relative(projectRoot, file)}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files with duplicate imports.`);
