/// <reference types="vitest" />
import { type Stats } from 'fs';
import fs from 'fs/promises';
import path from 'path';

import JSZip from 'jszip';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { loadSecrets, scrubValue, sanitizeTrace } from '../sanitize-playwright';

vi.mock('jszip', () => {
  const mockJszipInstance = {
    file: vi.fn().mockReturnThis(),
    generateAsync: vi.fn().mockResolvedValue('mock-zip-data'),
    files: {},
  };
  const JSZip = {
    loadAsync: vi.fn().mockResolvedValue(mockJszipInstance),
  };
  return {
    __esModule: true,
    default: JSZip,
  };
});

describe('sanitize-playwright', () => {
  const secrets = ['secret-value', 'another-secret'];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('loadSecrets', () => {
    it('should load secrets from .env files', async () => {
      const projectRoot = process.cwd();
      const envContent = `SECRET_KEY=secret-value
ANOTHER_KEY="another-secret"`;
      const readdirSpy = vi.spyOn(fs, 'readdir').mockResolvedValue(['.env', '.env.test'] as any);
      const readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValue(envContent);

      const loadedSecrets = await loadSecrets();
      expect(loadedSecrets).toContain('secret-value');
      expect(loadedSecrets).toContain('another-secret');
      expect(readdirSpy).toHaveBeenCalledWith(projectRoot);
      expect(readFileSpy).toHaveBeenCalledWith(path.join(projectRoot, '.env'), 'utf-8');
      expect(readFileSpy).toHaveBeenCalledWith(path.join(projectRoot, '.env.test'), 'utf-8');
    });
  });

  describe('scrubValue', () => {
    it('should scrub secrets from a nested object', () => {
      const obj = {
        key1: 'this contains a secret-value',
        key2: {
          nestedKey: 'and another-secret here',
        },
        keySeed: 'test test test test test test test test test test test junk',
        key3: 'this is safe',
      };

      scrubValue(obj, secrets);

      expect(obj.key1).toBe('this contains a ********');
      expect(obj.key2.nestedKey).toBe('and ******** here');
      expect(obj.key3).toBe('this is safe');
      expect(obj.keySeed).toBe('********');
    });
  });

  describe('sanitizeTrace', () => {
    const tracePath = '/fake/dir/trace.zip';

    it('should sanitize a trace file', async () => {
      const traceContent = JSON.stringify({
        type: 'action',
        params: { value: 'a secret-value' },
      });
      const zipBuffer = Buffer.from('zip file content');

      const statSpy = vi.spyOn(fs, 'stat').mockResolvedValue({ isFile: () => true } as Stats);
      const readFileSpy = vi.spyOn(fs, 'readFile').mockResolvedValue(zipBuffer);
      const writeFileSpy = vi.spyOn(fs, 'writeFile').mockResolvedValue();

      const traceFile = {
        name: 'trace.trace',
        async: vi.fn().mockResolvedValue(traceContent),
      };

      const mockedLoadAsync = vi.mocked(JSZip.loadAsync);
      mockedLoadAsync.mockResolvedValue({
        files: { 'trace.trace': traceFile },
        file: vi.fn().mockReturnThis(),
        generateAsync: vi.fn().mockResolvedValue('mock-zip-data'),
      } as any);

      await sanitizeTrace(tracePath, secrets);

      expect(readFileSpy).toHaveBeenCalledWith(tracePath);
      expect(mockedLoadAsync).toHaveBeenCalledWith(zipBuffer);
      expect(traceFile.async).toHaveBeenCalledWith('string');
      const loadedZip = await mockedLoadAsync.mock.results[0].value;
      expect(loadedZip.file).toHaveBeenCalledWith(
        'trace.trace',
        JSON.stringify({
          type: 'action',
          params: { value: 'a ********' },
        })
      );
      expect(loadedZip.generateAsync).toHaveBeenCalled();
      expect(writeFileSpy).toHaveBeenCalledWith(tracePath, 'mock-zip-data');
    });
  });
});
