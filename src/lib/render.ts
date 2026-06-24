import { chromium, type Browser } from "playwright";

// Reuse a single browser across calls when possible. On Cloud Run a single
// container handles requests, so this keeps cold renders cheap.
let browserPromise: Promise<Browser> | null = null;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true, args: LAUNCH_ARGS });
  }
  try {
    const b = await browserPromise;
    if (!b.isConnected()) {
      browserPromise = chromium.launch({ headless: true, args: LAUNCH_ARGS });
      return browserPromise;
    }
    return b;
  } catch (e) {
    // Reset so the next call can retry a fresh launch.
    browserPromise = null;
    throw e;
  }
}

export async function renderImage(
  html: string,
  width: number,
  height: number
): Promise<Buffer> {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const buffer = await page.screenshot({ type: "png", fullPage: false });
    return buffer;
  } finally {
    await context.close();
  }
}
