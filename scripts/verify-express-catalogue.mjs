// Optional QA runner: install Playwright or set PLAYWRIGHT_MODULE to its module path.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3018', out = process.env.QA_OUT || '/tmp/express-viewport-qa';
(async () => {
    await fs.mkdir(out, { recursive: true });
    const b = await chromium.launch({ channel: 'chrome', headless: true });
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const errors = [];
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(base + '/express', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => +document.querySelector('#template-stage iframe')?.parentElement.style.getPropertyValue('--preview-scale') > 0);
    const tabs = await p.getByRole('tab').allTextContents();
    assert.ok(tabs[0].startsWith('Creator'));
    assert.ok(tabs[0].includes('15% off'));
    assert.match(await p.locator('a[href*="template=creator"]').getAttribute('href'), /promo=INFLUENCE/);
    assert.ok((await p.locator('a[href*="template=creator"]').textContent()).includes('$509.15'));
    const checks = [];
    for (const [width, height] of [[320, 667], [375, 812], [390, 844], [430, 932], [640, 800], [667, 375], [768, 1024], [1440, 900]]) {
        await p.setViewportSize({ width, height });
        await p.locator('[aria-label="Industries"]').evaluate(() => { const root = document.querySelector('#site-root'); root.scrollTop = root.scrollHeight; });
        await p.waitForTimeout(650);
        let footerBottom;
        for (const mode of ['mobile', 'desktop']) {
            await p.getByRole('button', { name: mode === 'mobile' ? 'Mobile' : 'Desktop', exact: true }).click();
            await p.waitForTimeout(650);
            const r = await p.locator('#template-stage iframe').evaluate(el => { const rect = e => e.getBoundingClientRect().toJSON(); const browser = el.closest('[data-device]'), stage = el.closest('#template-stage'), viewer = stage.parentElement, footer = viewer.lastElementChild, controls = viewer.firstElementChild; return { frame: rect(browser), iframe: rect(el), viewport: rect(el.parentElement), stage: rect(stage), viewer: rect(viewer), footer: rect(footer), controls: rect(controls), rail: rect(document.querySelector('[aria-label="Industries"]')), natural: [el.clientWidth, el.clientHeight], rootWidth: document.documentElement.scrollWidth, buy: rect(footer.querySelector('a[href*="checkout"]')) }; });
            assert.ok(r.frame.top >= r.stage.top - .1 && r.frame.bottom <= r.stage.bottom + .1, 'Frame exceeds middle area ' + JSON.stringify({ width, height, mode, r }));
            assert.ok(r.frame.left >= 0 && r.frame.right <= width, 'Frame exceeds width');
            assert.ok(Math.abs(r.iframe.width - r.viewport.width) < .2 && Math.abs(r.iframe.height - r.viewport.height) < .2, 'Scale ratio does not fill final viewport');
            assert.equal(r.rootWidth, width);
            if (width < 768) {
                assert.ok(Math.abs(r.viewer.left) < 1 && Math.abs(r.viewer.right - width) < 1, 'Viewer not edge to edge');
                assert.ok(Math.abs(r.rail.left) < 1 && Math.abs(r.rail.right - width) < 1, 'Industry rail not edge to edge');
                assert.ok(Math.abs(r.viewer.bottom - height) < 1, 'Viewer not viewport bounded');
                assert.ok(Math.abs(r.footer.bottom - height) < 1, 'Footer not on viewport bottom');
                assert.ok(r.buy.bottom <= height && r.buy.top >= r.controls.bottom, 'Buy out of view');
                if (footerBottom)
                    assert.ok(Math.abs(footerBottom - r.footer.bottom) < 1, 'Footer moved on device switch');
                footerBottom = r.footer.bottom;
            }
            checks.push({ width, height, mode, ...r });
            console.log(width, height, mode, 'fits');
            if ([320, 390, 1440].includes(width))
                await p.screenshot({ path: `${out}/${width}-${mode}.png` });
        }
    }
    // Sample the actual transition before it has reached its target.
    await p.setViewportSize({ width: 390, height: 844 });
    await p.getByRole('button', { name: 'Mobile', exact: true }).click();
    await p.waitForTimeout(600);
    const start = await p.locator('[data-device]').boundingBox();
    await p.getByRole('button', { name: 'Desktop', exact: true }).click();
    await p.waitForTimeout(80);
    const middle = await p.locator('[data-device]').boundingBox();
    await p.waitForTimeout(500);
    const end = await p.locator('[data-device]').boundingBox();
    assert.ok(Math.abs(middle.width - start.width) > 1 && Math.abs(middle.width - end.width) > 1, 'Width switched instantly');
    assert.ok(Math.abs(middle.height - start.height) > 1 && Math.abs(middle.height - end.height) > 1, 'Height switched instantly');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await p.locator('[data-device]').evaluate(e => getComputedStyle(e).transitionDuration), '0s');
    // Other industries keep regular prices outside the creator offer.
    await p.getByRole('tab', { name: 'Restaurant and cafe', exact: true }).click();
    await p.waitForTimeout(800);
    const buy = p.locator('a[href*="checkout"]');
    assert.ok((await buy.textContent()).includes('$599'));
    assert.ok(!(await buy.getAttribute('href')).includes('promo=INFLUENCE'));
    await fs.writeFile(out + '/results.json', JSON.stringify({ base, checks, transition: { start, middle, end }, errors }, null, 2));
    console.log(JSON.stringify({ checks: checks.length, errors }));
    await b.close();
})().catch(e => { console.error(e); process.exit(1); });
