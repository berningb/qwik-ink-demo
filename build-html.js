import { readFileSync, writeFileSync } from 'fs';

// Read the manifest to get the correct bundle names
const manifest = JSON.parse(readFileSync('dist/q-manifest.json', 'utf-8'));
const qwikLoader = manifest.qwikLoader;

// Find the entry bundle by looking for src/entry.jsx in origins
let entryFile = null;
if (manifest.bundles) {
  for (const [bundle, data] of Object.entries(manifest.bundles)) {
    if (data && data.origins && data.origins.includes('src/entry.jsx')) {
      entryFile = bundle;
      break;
    }
  }
}

if (!entryFile) {
  console.error('Could not find entry bundle in manifest');
  process.exit(1);
}

// Get CSS file name from injections
let cssFile = 'BMadfdZN-style.css';
if (manifest.injections && manifest.injections.length > 0) {
  for (const inj of manifest.injections) {
    if (inj.attributes && inj.attributes['data-src']) {
      const src = inj.attributes['data-src'];
      if (src.endsWith('.css')) {
        cssFile = src.replace(/^\//, '').replace(/^assets\//, 'assets/');
        break;
      }
    }
  }
}

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Qwik RTE</title>
    <link rel="stylesheet" href="/${cssFile}">
  </head>
  <body>
    <script type="module">
      (async () => {
        await import('/build/${qwikLoader}');
        const entry = await import('/build/${entryFile}');
        entry.default();
      })();
    </script>
  </body>
</html>`;

writeFileSync('dist/index.html', html);
console.log(`✓ Generated dist/index.html with entry: ${entryFile}, loader: ${qwikLoader}`);
