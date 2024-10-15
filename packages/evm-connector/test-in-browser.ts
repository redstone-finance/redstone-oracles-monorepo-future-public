import { RedstoneCommon } from "@redstone-finance/utils";
import http from "http";
import { createServer } from "http-server";
import puppeteer, { ConsoleMessage, Page, SupportedBrowser } from "puppeteer";

export const PORT_NUMBER = 8088;

function startServer(path: string, port: number): Promise<http.Server> {
  return new Promise((resolve, _) => {
    const server = createServer({ root: path });
    server.listen(port, "localhost", () => {
      console.log(`Server is listening on http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function waitForSuccess(
  page: Page,
  expectedMessage: string,
  port: number,
  timeout: number = 2000
) {
  const url = `http://localhost:${port}`;

  const waitForSuccessPromise = new Promise<void>((resolve) => {
    page.on("pageerror", (error: Error) => {
      console.error(`${url} [error]: ${error.message}`);
      throw error;
    });

    page.on("console", (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();
      console.log(`${url} [${type}] ${text}`);
      if (text.includes(expectedMessage)) {
        resolve();
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    page
      .goto(url)
      .then(() =>
        console.log(`${url} loaded successfully, waiting ${timeout} [ms]`)
      );
  });

  await RedstoneCommon.timeout(
    waitForSuccessPromise,
    timeout,
    `${url} didn't succeed in ${timeout} [ms].`
  );
}

export async function testInBrowser(
  path: string,
  expectedMessage: string,
  product?: SupportedBrowser,
  port: number = PORT_NUMBER
) {
  const server = await startServer(path, port);
  const browser = await puppeteer.launch({
    browser: product,
    protocol: product === "firefox" ? "webDriverBiDi" : undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    await RedstoneCommon.retry({
      fn: async () => {
        const page = await browser.newPage();
        return await waitForSuccess(page, expectedMessage, port);
      },
      maxRetries: 4,
      waitBetweenMs: 1000,
      backOff: {
        backOffBase: 2,
      },
    })();
  } catch (e) {
    console.error(RedstoneCommon.stringifyError(e));
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
}
