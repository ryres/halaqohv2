const fs = require('fs');
const path = require('path');
(async () => {
  try {
    const mdPath = path.join(__dirname, 'halaqohv2_description.md');
    if (!fs.existsSync(mdPath)) throw new Error('Markdown file not found: ' + mdPath);
    const md = fs.readFileSync(mdPath, 'utf8');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Halaqohv2 Description</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:28px;color:#111}pre{white-space:pre-wrap;font-family:inherit;line-height:1.4}h1{font-size:20px;margin-bottom:10px}</style></head><body><h1>Halaqohv2 Codebase Description</h1><pre>${escapeHtml(md)}</pre></body></html>`;

    const puppeteerModule = await import('puppeteer');
    const puppeteer = puppeteerModule.default || puppeteerModule;
    const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const out = path.join(__dirname, 'halaqohv2_description.pdf');
    await page.pdf({ path: out, format: 'A4', printBackground: true });
    await browser.close();
    console.log('PDF generated at', out);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
