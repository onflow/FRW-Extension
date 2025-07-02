// This strips private keys, passwords, and other sensitive information from the message
export const stripSensitive = (message: string) => {
  const patterns = [
    // Ethereum private keys
    /0x[a-fA-F0-9]{64}/g,
    // Other private keys (base58, hex, etc)
    /[1-9A-HJ-NP-Za-km-z]{50,}/g,
    // Email addresses
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // API keys (common formats)
    /(?:api[_-]?key|apikey)[_-]?[a-zA-Z0-9]{32,}/gi,
    // Passwords (common patterns)
    /(?:password|passwd|pwd)[_-]?[a-zA-Z0-9!@#$%^&*]{8,}/gi,
    // Phone numbers
    /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x\d+)?/g,
    // Credit card numbers
    /\b(?:\d[ -]*?){13,19}\b/g,
    // Session tokens
    /(?:session[_-]?token|jwt)[_-]?[a-zA-Z0-9\-_]{32,}/gi,
    // Seed phrases (12-24 words)
    /(?:\b\w+\b\s+){11,23}\b\w+\b/g,
    // Embedded sensitive values in stringified objects
    /"(?:password|passwd|pwd|privateKey|private_key|privatekey|secretKey|secret_key|secretkey|apiKey|api_key|apikey|mnemonic|seed|seedPhrase|seed_phrase|recoveryPhrase|recovery_phrase|token|jwt|sessionToken|session_token|pk|sk)"\s*:\s*"([^"]+)"/gi,
    // Handle escaped quotes in stringified objects
    /"(?:password|passwd|pwd|privateKey|private_key|privatekey|secretKey|secret_key|secretkey|apiKey|api_key|apikey|mnemonic|seed|seedPhrase|seed_phrase|recoveryPhrase|recovery_phrase|token|jwt|sessionToken|session_token|pk|sk)"\s*:\s*"((?:[^"\\]|\\.)*)"/gi,
    // Handle unquoted values in stringified objects
    /"(?:password|passwd|pwd|privateKey|private_key|privatekey|secretKey|secret_key|secretkey|apiKey|api_key|apikey|mnemonic|seed|seedPhrase|seed_phrase|recoveryPhrase|recovery_phrase|token|jwt|sessionToken|session_token|pk|sk)"\s*:\s*([^,}\s]+)/gi,
  ];

  let sanitizedMessage = message;

  // Apply regex patterns to catch sensitive information
  patterns.forEach((pattern) => {
    sanitizedMessage = sanitizedMessage.replace(pattern, (match, value) => {
      // If the pattern has a capture group (value), replace just the value
      if (value) {
        return match.replace(value, '***');
      }
      return '***';
    });
  });

  return sanitizedMessage;
};
