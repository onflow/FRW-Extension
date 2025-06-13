import * as fs from 'fs';
import * as path from 'path';

// Corrected COLOR_REGEX to prioritize longer hex matches first
const COLOR_REGEX =
  /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[0-9.]+\s*)?\)|hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*(?:,\s*[0-9.]+\s*)?\)|theme\.palette\.\w+\.\w+/gi;

const UI_DIRECTORY = 'src/ui';
const OUTPUT_FILE = 'color_report.txt';
const CSV_OUTPUT_FILE = 'color_report.csv';
const DEBUG_MODE = false; // Set to true for detailed logs

interface ColorData {
  count: number;
  files: Set<string>;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function normalizeColorToUppercaseHex(colorStr: string): string {
  const originalColorStr = colorStr;
  const lowerColorStr = colorStr.toLowerCase();

  if (lowerColorStr.startsWith('theme.palette.')) {
    return originalColorStr;
  }

  if (lowerColorStr.startsWith('#')) {
    let hex = lowerColorStr.substring(1);
    if (hex.length === 3) {
      // #RGB -> #RRGGBB
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    } else if (hex.length === 4) {
      // #RGBA -> #RRGGBBAA
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return ('#' + hex).toUpperCase();
  }

  let match = lowerColorStr.match(/^rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)$/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
  }

  match = lowerColorStr.match(/^rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\)$/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const alpha = parseFloat(match[4]);
    const aHex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${aHex}`.toUpperCase();
  }

  match = lowerColorStr.match(
    /^hsla?\((\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?(?:\s*[,/]\s*([0-9.]+))?\)$/
  );
  if (match) {
    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);
    const [rVal, gVal, bVal] = hslToRgb(h, s, l);
    let hexColor = `#${rVal.toString(16).padStart(2, '0')}${gVal.toString(16).padStart(2, '0')}${bVal.toString(16).padStart(2, '0')}`;
    if (match[4] !== undefined && match[4].trim() !== '') {
      const alpha = parseFloat(match[4]);
      const aHex = Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0');
      hexColor += aHex;
    }
    return hexColor.toUpperCase();
  }

  return originalColorStr.toUpperCase();
}

function findColorsInFile(filepath: string): string[] {
  const colorsFound: string[] = [];
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    if (DEBUG_MODE && content.length < 5000) {
      console.log(`[DEBUG] Content snippet for ${filepath}:\n${content.substring(0, 200)}...`);
    }
    let matchResult;
    COLOR_REGEX.lastIndex = 0;
    while ((matchResult = COLOR_REGEX.exec(content)) !== null) {
      if (DEBUG_MODE) console.log(`[DEBUG] Raw match in ${filepath}: ${matchResult[0]}`);
      colorsFound.push(matchResult[0]);
    }
  } catch (e) {
    console.error(`Error reading file ${filepath}:`, e);
  }
  return colorsFound;
}

function walkDir(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const stat = fs.statSync(dirPath);
    if (stat.isDirectory()) {
      if (DEBUG_MODE) console.log(`[DEBUG] Traversing directory: ${dirPath}`);
      walkDir(dirPath, callback);
    } else {
      if (DEBUG_MODE) console.log(`[DEBUG] Considering file: ${dirPath}`);
      callback(dirPath);
    }
  });
}

function main() {
  const colorData = new Map<string, ColorData>();
  const ignoredFolders = ['iconfont', 'style'];

  if (DEBUG_MODE) console.log(`[DEBUG] Starting color scan in UI_DIRECTORY: ${UI_DIRECTORY}`);

  walkDir(UI_DIRECTORY, (filepath) => {
    if (filepath.endsWith('.svg')) {
      if (DEBUG_MODE) console.log(`[DEBUG] Ignoring SVG file: ${filepath}`);
      return;
    }
    const pathParts = filepath.split(path.sep);
    if (ignoredFolders.some((folder) => pathParts.includes(folder))) {
      if (DEBUG_MODE)
        console.log(
          `[DEBUG] Ignoring file in excluded folder (${ignoredFolders.join(', ')}): ${filepath}`
        );
      return;
    }

    if (DEBUG_MODE) console.log(`[DEBUG] Passed exclusion checks: ${filepath}`);

    if (filepath.match(/\.(ts|tsx|css|scss|js|jsx)$/i)) {
      if (DEBUG_MODE) console.log(`[DEBUG] Processing file (passed extension filter): ${filepath}`);
      const colorsInFile = findColorsInFile(filepath);
      for (const color of colorsInFile) {
        const normalizedColor = normalizeColorToUppercaseHex(color);
        if (DEBUG_MODE)
          console.log(
            `[DEBUG] Found color: ${color}, Normalized: ${normalizedColor} in ${filepath}`
          );
        if (!colorData.has(normalizedColor)) {
          colorData.set(normalizedColor, { count: 0, files: new Set() });
        }
        const data = colorData.get(normalizedColor)!;
        data.count++;
        data.files.add(filepath);
      }
    } else {
      if (DEBUG_MODE) console.log(`[DEBUG] Skipping file (failed extension filter): ${filepath}`);
    }
  });

  if (DEBUG_MODE)
    console.log(`[DEBUG] Total unique normalized colors found before report: ${colorData.size}`);

  let reportContent = 'Color Usage Report\n';
  reportContent += '====================\n\n';

  const sortedColors = Array.from(colorData.entries()).sort((a, b) => b[1].count - a[1].count);

  for (const [color, data] of sortedColors) {
    reportContent += `Color: ${color}\n`;
    reportContent += `  Count: ${data.count}\n`;
    reportContent += `  Files: (Total: ${data.files.size})\n`;
    const sortedFiles = Array.from(data.files).sort();
    for (const fPath of sortedFiles) {
      reportContent += `    - ${fPath}\n`;
    }
    reportContent += '\n';
  }

  fs.writeFileSync(OUTPUT_FILE, reportContent, 'utf-8');
  console.log(`Color report generated: ${OUTPUT_FILE}`);

  // Generate CSV report
  let csvContent = 'Color,Count,FileCount\n';
  for (const [color, data] of sortedColors) {
    // Escape commas in color strings if any (e.g., rgba(0,0,0,1)) by quoting
    const csvColor = color.includes(',') ? `"${color}"` : color;
    csvContent += `${csvColor},${data.count},${data.files.size}\n`;
  }
  fs.writeFileSync(CSV_OUTPUT_FILE, csvContent, 'utf-8');
  console.log(`Color CSV report generated: ${CSV_OUTPUT_FILE}`);

  console.log(`Found ${colorData.size} unique colors/color references.`);
}

main();
