'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const ITEMS_TO_COPY = ['src', 'server.js', 'package.json'];
const OPTIONAL_ITEMS = ['package-lock.json', '.env.example'];

const log = (msg) => console.log(`[build] ${msg}`);

const cleanDist = () => {
    if (fs.existsSync(DIST)) {
        fs.rmSync(DIST, { recursive: true, force: true });
        log('wyczyszczono katalog dist/');
    }
    fs.mkdirSync(DIST, { recursive: true });
};

const copyRecursive = (src, dest) => {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
};

const copyArtifacts = () => {
    for (const item of ITEMS_TO_COPY) {
        const srcPath = path.join(ROOT, item);
        if (!fs.existsSync(srcPath)) {
            throw new Error(`Brak wymaganego artefaktu: ${item}`);
        }
        copyRecursive(srcPath, path.join(DIST, item));
        log(`skopiowano ${item}`);
    }

    for (const item of OPTIONAL_ITEMS) {
        const srcPath = path.join(ROOT, item);
        if (fs.existsSync(srcPath)) {
            copyRecursive(srcPath, path.join(DIST, item));
            log(`skopiowano ${item}`);
        }
    }
};

const verifySyntax = () => {
    log('walidacja skladni JS...');
    const checkDir = (dir) => {
        for (const entry of fs.readdirSync(dir)) {
            const full = path.join(dir, entry);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                checkDir(full);
            } else if (full.endsWith('.js')) {
                execSync(`node --check "${full}"`, { stdio: 'pipe' });
            }
        }
    };
    checkDir(path.join(DIST, 'src'));
    execSync(`node --check "${path.join(DIST, 'server.js')}"`, { stdio: 'pipe' });
    log('skladnia OK');
};

const stripDevDependencies = () => {
    const pkgPath = path.join(DIST, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    delete pkg.devDependencies;
    pkg.scripts = {
        start: 'node server.js',
        'db:seed': pkg.scripts['db:seed'],
    };
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    log('zaktualizowano package.json (usunieto devDependencies)');
};

const main = () => {
    log('rozpoczynanie budowy produkcyjnej...');
    cleanDist();
    copyArtifacts();
    verifySyntax();
    stripDevDependencies();
    log(`gotowe -> ${path.relative(ROOT, DIST)}/`);
};

try {
    main();
} catch (err) {
    console.error('[build] blad:', err.message);
    process.exit(1);
}
