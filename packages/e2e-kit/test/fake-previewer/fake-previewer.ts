import { test } from '@playwright/test';

export const FAKE_PREVIEWER_ORIGIN = 'http://previewer.test';

/** `{ [entryId]: { [scenarioName]: html } }`, served as the render pages of a fake previewer. */
export type FakeScenarioPages = Readonly<Record<string, Readonly<Record<string, string>>>>;

function gridHtml(scenarioPages: FakeScenarioPages): string {
  const manifest = {
    basePath: '/__preview',
    entries: Object.entries(scenarioPages).map(([id, scenarios]) => ({
      id,
      flow: 'Fake',
      title: id,
      scenarios: Object.keys(scenarios),
    })),
  };
  return `<!doctype html><html lang="en"><head><title>Preview</title></head><body>
    <script>window.__ligeirinhoPreview = ${JSON.stringify(manifest)};</script></body></html>`;
}

/** Marks the page rendered, unless it already carries its own mark (a failed play, say). */
function markRendered(html: string): string {
  return html.includes('data-ligeirinho-preview=')
    ? html
    : html.replace('<html lang="en">', '<html lang="en" data-ligeirinho-preview="rendered">');
}

function findScenarioPage(scenarioPages: FakeScenarioPages, pathname: string): string | undefined {
  const [, entryId = '', scenarioName = ''] = /^\/__preview\/render\/([^/]+)\/([^/]+)$/.exec(pathname) ?? [];
  return scenarioPages[entryId]?.[scenarioName];
}

/** A Playwright `test` whose page talks to an in-memory previewer instead of a real app. */
export function fakePreviewerTest(scenarioPages: FakeScenarioPages) {
  return test.extend({
    baseURL: FAKE_PREVIEWER_ORIGIN,
    page: async ({ page }, use) => {
      await page.route(`${FAKE_PREVIEWER_ORIGIN}/**`, async (route) => {
        const pathname = new URL(route.request().url()).pathname;
        const scenarioPage = findScenarioPage(scenarioPages, pathname);
        const body = pathname === '/__preview' ? gridHtml(scenarioPages) : scenarioPage && markRendered(scenarioPage);
        await route.fulfill(
          body === undefined ? { status: 404, body: 'Not found' } : { contentType: 'text/html', body },
        );
      });
      await use(page);
    },
  });
}
