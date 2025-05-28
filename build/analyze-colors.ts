import fs from 'fs';
import path from 'path';
import glob from 'glob';

// Regular expression to match common CSS color formats:
//  - Hex codes: #RGB, #RRGGBB, #RGBA, #RRGGBBAA
//  - rgb(), rgba(), hsl(), hsla()
const COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;

type Location = {
  file: string;
  line: number;
};

type ColorStats = {
  count: number;
  locations: Location[];
};

/**
 * Normalise a colour string so that logically equivalent values are grouped together.
 *  - Hex values are lower-cased.
 *  - rgb/hsl functions have internal whitespace removed and are lower-cased.
 */
function normaliseColour(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
    // Remove all whitespace to avoid treating formatting differences as unique colours
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
}

const colourMap = new Map<string, ColorStats>();

console.log('Scanning UI source for colour usage…');

const uiFiles = glob.sync('src/ui/**/*.{ts,tsx,js,jsx,css,less,scss,html}', {
  ignore: ['**/node_modules/**', '**/dist/**'],
});

uiFiles.forEach((filePath) => {
  const absolutePath = path.resolve(filePath);
  const relativePath = path.relative(process.cwd(), absolutePath);

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const matches = line.match(COLOR_REGEX);
    if (!matches) return;

    matches.forEach((rawColour) => {
      const colour = normaliseColour(rawColour);
      if (!colourMap.has(colour)) {
        colourMap.set(colour, { count: 0, locations: [] });
      }
      const stats = colourMap.get(colour)!;
      stats.count += 1;
      stats.locations.push({ file: relativePath, line: index + 1 });
    });
  });
});

// Generate markdown report
let report = `# UI Colour Usage Report\n\n`;
report += `> Generated on ${new Date().toLocaleString()}\n\n`;
report += `\nColours found: ${colourMap.size}\n\n`;

Array.from(colourMap.entries())
  .sort((a, b) => b[1].count - a[1].count) // Sort by usage desc
  .forEach(([colour, stats]) => {
    report += `## ${colour}\n`;
    report += `*Occurrences*: ${stats.count}\n\n`;
    stats.locations.forEach((loc) => {
      report += `- ${loc.file}:${loc.line}\n`;
    });
    report += `\n`;
  });

fs.writeFileSync('ui-colour-usage.md', report);

console.log('Colour analysis complete! Report saved to ui-colour-usage.md.');
