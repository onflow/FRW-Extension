import fs from 'fs/promises';
import JSZip from 'jszip';
import path from 'path';

export async function loadSecrets() {
  const secrets = new Set<string>();
  const projectRoot = process.cwd();
  try {
    const files = await fs.readdir(projectRoot);
    const envFiles = files.filter((file) => file === '.env' || file.startsWith('.env.'));

    for (const file of envFiles) {
      const content = await fs.readFile(path.join(projectRoot, file), 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.startsWith('#') || !line.includes('=')) {
          continue;
        }
        const parts = line.split('=');
        let value = parts.slice(1).join('=').trim();
        // Remove quotes from the value
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.substring(1, value.length - 1);
        }
        if (value) {
          secrets.add(value);
        }
      }
    }
  } catch {
    console.warn('Could not load .env files. Continuing without them.');
  }
  return Array.from(secrets);
}

export function scrubValue(obj: unknown, secrets: string[], objectPath = '') {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  // 64 hex, 32 hex, 40 hex, 20 hex, 12 word seed phrase
  const sensitiveValues =
    /\b(0x[a-fA-F0-9]{64}|[a-zA-Z0-9]{32})\b|\b(0x[a-fA-F0-9]{40}|[a-zA-Z0-9]{20})\b|\b([a-z]+\s+){11}[a-z]+\b/i;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentPath = objectPath ? `${objectPath}.${key}` : key;
      const value = obj[key];
      if (typeof value === 'string') {
        let scrubbedValue = value;
        for (const secret of secrets) {
          if (secret && scrubbedValue.includes(secret)) {
            scrubbedValue = scrubbedValue.replaceAll(secret, '********');
          }
        }
        if (sensitiveValues.test(scrubbedValue)) {
          scrubbedValue = '********';
        }
        if (scrubbedValue !== value) {
          obj[key] = scrubbedValue;
        }
      } else {
        scrubValue(value, secrets, currentPath); // Pass path down in recursion
      }
    }
  }
}

export async function sanitizeTrace(tracePath: string, secrets: string[]) {
  if (!(await fs.stat(tracePath).catch(() => false))) {
    console.error(`Trace file not found: ${tracePath}`);
    return;
  }

  const zipData = await fs.readFile(tracePath);
  const zip = await JSZip.loadAsync(zipData);

  const traceFiles = Object.values(zip.files).filter((f) => f.name.endsWith('.trace'));

  if (traceFiles.length === 0) {
    console.error(`No .trace files found in ${path.basename(tracePath)}.`);
    return;
  }

  for (const traceFile of traceFiles) {
    const traceContent = await traceFile.async('string');
    const lines = traceContent.split('\n');

    const sensitiveKeywords = /password|secret|token|pk|mnemonic|seed|phrase|private/i;

    const sanitizedLines = lines.map((line) => {
      try {
        if (line.trim() === '') {
          return line;
        }
        const event = JSON.parse(line);
        // Legacy sanitization based on selector
        if (
          event.type === 'before' &&
          event.params &&
          event.params.selector &&
          sensitiveKeywords.test(event.params.selector)
        ) {
          if ('value' in event.params) {
            event.params.value = '********';
          }
          if ('text' in event.params) {
            event.params.text = '********';
          }
        }
        // Sanitize any value from .env files
        scrubValue(event, secrets);
        return JSON.stringify(event);
      } catch {
        // Not a valid JSON line, return it as is
        return line;
      }
    });

    const sanitizedTraceContent = sanitizedLines.join('\n');
    zip.file(traceFile.name, sanitizedTraceContent);
  }

  const newZipData = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  await fs.writeFile(tracePath, newZipData);
}

export async function sanitizeAllTraces() {
  const baseDir = path.resolve(process.argv[2] || 'playwright-report');
  const dataDir = path.join(baseDir, 'data');
  const secrets = await loadSecrets();

  if (!(await fs.stat(dataDir).catch(() => false))) {
    console.info(`No reports to sanitize in: ${dataDir}`);
    return;
  }

  const files = await fs.readdir(dataDir);
  const zipFiles = files.filter((file) => file.endsWith('.zip'));

  if (zipFiles.length === 0) {
    console.log('No .zip files found to sanitize.');
    return;
  }

  console.log(`\nFound ${zipFiles.length} zip file(s) to process in ${dataDir}`);

  for (const zipFile of zipFiles) {
    const fullPath = path.join(dataDir, zipFile);
    await sanitizeTrace(fullPath, secrets);
  }
}

// Only run if executed directly
if (import.meta.url.endsWith(path.basename(process.argv[1]))) {
  sanitizeAllTraces().catch((err) => {
    console.error('An error occurred during trace sanitization:', err);
  });
}
