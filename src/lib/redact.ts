export interface SecretMatch {
  type: 'API Key' | 'Token' | 'Password' | 'Email' | 'IP Address';
  value: string;
  masked: string;
  index: number;
  length: number;
}

export function scanForSecrets(text: string): SecretMatch[] {
  if (!text) return [];

  const matches: SecretMatch[] = [];

  // 1. Passwords in key-value patterns (e.g. password="...", secret = '...')
  const passwordRegex = /(?:password|passwd|secret|client_secret)\s*[:=]\s*["']?([^\s"';,]+)["']?/gi;
  let match: RegExpExecArray | null;
  while ((match = passwordRegex.exec(text)) !== null) {
    const full = match[0];
    const val = match[1];
    if (val && val.length >= 3) {
      matches.push({
        type: 'Password',
        value: val,
        masked: '[REDACTED_PASSWORD]',
        index: match.index + full.indexOf(val),
        length: val.length,
      });
    }
  }

  // 2. Specific API keys and tokens (Gemini AIza..., OpenAI sk-..., GitHub ghp_..., generic token patterns)
  const tokenPatterns = [
    { regex: /\bAIza[0-9A-Za-z-_]{35}\b/g, type: 'API Key' as const },
    { regex: /\bsk-[A-Za-z0-9]{20,}\b/g, type: 'API Key' as const },
    { regex: /\bghp_[A-Za-z0-9]{36}\b/g, type: 'Token' as const },
    { regex: /\bBearer\s+([A-Za-z0-9\-_=]{20,})\b/gi, type: 'Token' as const },
    { regex: /(?:api[-_]?key|auth[-_]?token|access[-_]?token)\s*[:=]\s*["']?([A-Za-z0-9\-_]{16,})["']?/gi, type: 'API Key' as const },
  ];

  for (const { regex, type } of tokenPatterns) {
    while ((match = regex.exec(text)) !== null) {
      const val = match[1] ?? match[0];
      // Avoid duplicate matches
      if (!matches.some((m) => m.index === match!.index)) {
        matches.push({
          type,
          value: val,
          masked: type === 'API Key' ? '[REDACTED_API_KEY]' : '[REDACTED_TOKEN]',
          index: match.index,
          length: match[0].length,
        });
      }
    }
  }

  // 3. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    const val = match[0];
    // don't flag internal docs mock like example@example.com if not desired, or flag all for safety
    if (!matches.some((m) => m.index === match!.index)) {
      matches.push({
        type: 'Email',
        value: val,
        masked: '[REDACTED_EMAIL]',
        index: match.index,
        length: val.length,
      });
    }
  }

  // 4. IP addresses (IPv4)
  const ipRegex = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
  while ((match = ipRegex.exec(text)) !== null) {
    const val = match[0];
    // Ignore harmless 0.0.0.0 or 127.0.0.1 or version numbers (e.g. 2.3.0 without 4 segments)
    if (val !== '0.0.0.0' && val !== '127.0.0.1' && !matches.some((m) => m.index === match!.index)) {
      matches.push({
        type: 'IP Address',
        value: val,
        masked: '[REDACTED_IP]',
        index: match.index,
        length: val.length,
      });
    }
  }

  // Sort by occurrence in text
  return matches.sort((a, b) => a.index - b.index);
}

/**
 * Replaces all found sensitive secrets with their designated [REDACTED_*] placeholders.
 */
export function redactSecrets(text: string, matches: SecretMatch[]): string {
  if (!matches || matches.length === 0) return text;

  // Replace from end to start to preserve character indices
  const sorted = [...matches].sort((a, b) => b.index - a.index);
  let result = text;
  for (const m of sorted) {
    result = result.slice(0, m.index) + m.masked + result.slice(m.index + m.length);
  }
  return result;
}
