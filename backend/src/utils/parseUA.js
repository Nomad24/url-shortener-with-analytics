import { UAParser } from 'ua-parser-js';

export function parseUA(userAgent) {
  if (!userAgent) {
    return { device: 'desktop', browser: undefined, os: undefined };
  }

  const parser = new UAParser(userAgent);
  const device = parser.getDevice().type || 'desktop';

  return {
    device,
    browser: parser.getBrowser().name,
    os: parser.getOS().name,
  };
}
