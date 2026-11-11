// Small static pages, one problem each, shared by the check tests and the fake previewer.

function page(title: string, body: string, style = ''): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { margin: 0; font-family: sans-serif; color: #1f1f1f; background: #fff; }
      main { padding: 16px; }
      button { min-width: 44px; min-height: 44px; }
      ${style}
    </style>
  </head>
  <body><main><h1>${title}</h1>${body}</main></body>
</html>`;
}

export const goodPage = page(
  'Good page',
  `<p>Read the <a href="/terms">terms of use</a> before you continue.</p>
   <label class="choice"><input type="checkbox" /> Remember me</label>
   <button type="button">Continue</button>
   <a class="skip" href="#content">Skip to content</a>
   <div class="scroller"><button type="button">One</button><button type="button">Two</button><button type="button">Three</button></div>`,
  `.choice { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; min-width: 44px; padding-right: 8px; }
   .skip { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
   .scroller { display: flex; gap: 8px; overflow-x: auto; max-width: 100%; }
   .scroller button { flex: none; width: 200px; }`,
);

export const widePage = page('Wide page', '<div style="width: 1200px">A table that does not fit</div>');

export const offscreenButtonPage = page(
  'Offscreen button',
  '<button type="button" style="position: absolute; left: 360px">Save</button>',
  'html, body { overflow-x: hidden; }',
);

export const clippedButtonPage = page(
  'Clipped button',
  `<div style="width: 100px; overflow: hidden; white-space: nowrap">
     <button type="button" style="margin-left: 80px">Delete</button>
   </div>`,
);

export const tinyButtonPage = page(
  'Tiny button',
  '<button type="button" aria-label="Close" style="min-width: 0; min-height: 0; width: 24px; height: 24px; padding: 0">×</button>',
);

/** The DOM shapes Angular Material uses around small native elements (buttons, checkboxes, text fields). */
export const materialHitAreaPage = page(
  'Material hit areas',
  `<button type="button" class="mdc-button" style="position: relative; height: 40px; padding: 0 12px">
     Show more<span class="mat-mdc-button-touch-target" style="position: absolute; inset: -4px 0; height: 48px"></span>
   </button>
   <div class="mdc-checkbox" style="position: relative; width: 40px; height: 40px">
     <input type="checkbox" aria-label="Complete" style="width: 40px; height: 40px; margin: 0" />
     <div class="mat-mdc-checkbox-touch-target" style="position: absolute; inset: -4px; width: 48px; height: 48px"></div>
   </div>
   <div class="mat-mdc-text-field-wrapper" style="height: 56px; padding: 16px">
     <input type="text" aria-label="New task" style="height: 24px; width: 200px" />
   </div>`,
);

export const decoyTouchTargetPage = page(
  'Touch target that is not the element’s',
  `<div><span class="mat-mdc-button-touch-target" style="display: block; width: 48px; height: 48px"></span></div>
   <button type="button" aria-label="Close" style="min-width: 0; min-height: 0; width: 24px; height: 24px; padding: 0">×</button>`,
);

export const standaloneSmallLinkPage = page('Standalone link', '<a href="/help" style="font-size: 12px">Help</a>');

export const axeViolationPage = page(
  'Axe violation',
  '<input type="text" /><p style="color: #c8c8c8">Low contrast text</p>',
  'input { min-height: 44px; min-width: 44px; }',
);

/** What the previewer's render page leaves when a scenario's `play` throws. */
export const playFailedPage = goodPage.replace(
  '<html lang="en">',
  '<html lang="en" data-ligeirinho-preview="play-failed" data-ligeirinho-preview-error="step &quot;Open the menu&quot; failed: no menu button">',
);
