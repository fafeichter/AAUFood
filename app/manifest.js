const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'public/dist/manifest.json');

let cachedManifest = null;

function readManifest() {
    // In production the file only changes when you redeploy (i.e. restart the process
    // after `npm run build`), so it's safe to read once and cache in memory.
    // In development we re-read on every request so a rebuild is picked up without a restart.
    if (process.env.FOOD_ENV === 'PROD' && cachedManifest) {
        return cachedManifest;
    }
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    cachedManifest = JSON.parse(raw);

    return cachedManifest;
}

// Usage in your main server file:
//   const manifestMiddleware = require('./app/utils/manifest');
//   app.use(manifestMiddleware);
// Then in any .ejs view: <link href="<%= manifest.fonts.scss %>" rel="stylesheet">
module.exports = function manifestMiddleware(req, res, next) {
    res.locals.manifest = readManifest();
    next();
};