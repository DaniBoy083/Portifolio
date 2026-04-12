const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitDate() {
    const commands = [
        'git log -1 --format=%cI -- index.html',
        'git log -1 --format=%cI'
    ];

    for (const command of commands) {
        try {
            const output = execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] })
                .toString()
                .trim();

            if (output) {
                return output;
            }
        } catch (_) {
            // Ignore and try the next command.
        }
    }

    return new Date().toISOString();
}

const buildDate = new Date().toISOString();
const lastCommitDate = getGitDate();

function detectMimeByExtension(filePath) {
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.png') {
        return 'image/png';
    }

    if (extension === '.webp') {
        return 'image/webp';
    }

    return 'image/jpeg';
}

function getEmbeddedPhotoDataUrl() {
    const candidatePaths = [
        path.join(__dirname, '..', 'img', 'Placeholders', 'minhafoto.jpg'),
        path.join(__dirname, '..', 'img', 'Placeholders', 'minhafoto.jpeg'),
        path.join(__dirname, '..', 'img', 'Placeholders', 'minhafoto.png'),
        path.join(__dirname, '..', 'img', 'Placeholders', 'minhafoto.webp')
    ];

    const photoPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));
    if (!photoPath) {
        return '';
    }

    try {
        const mime = detectMimeByExtension(photoPath);
        const fileBuffer = fs.readFileSync(photoPath);
        const base64 = fileBuffer.toString('base64');
        return `data:${mime};base64,${base64}`;
    } catch (_) {
        return '';
    }
}

function normalizeTitleFromFilename(fileName) {
    return fileName
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getEmbeddedCertificateAttachments() {
    const certificatesDir = path.join(__dirname, '..', 'img', 'Certificados');
    if (!fs.existsSync(certificatesDir)) {
        return [];
    }

    try {
        const files = fs.readdirSync(certificatesDir)
            .filter((fileName) => /\.(png|jpe?g|webp)$/i.test(fileName));

        return files.map((fileName) => {
            const filePath = path.join(certificatesDir, fileName);
            const mime = detectMimeByExtension(filePath);
            const base64 = fs.readFileSync(filePath).toString('base64');

            return {
                title: normalizeTitleFromFilename(fileName),
                dataUrl: `data:${mime};base64,${base64}`
            };
        });
    } catch (_) {
        return [];
    }
}

const embeddedPhotoDataUrl = getEmbeddedPhotoDataUrl();
const embeddedCertificateAttachments = getEmbeddedCertificateAttachments();

const distDir = path.join(__dirname, '..', 'dist');
const outputPath = path.join(distDir, 'build-meta.js');

fs.mkdirSync(distDir, { recursive: true });

const content = [
    'window.__PORTFOLIO_BUILD_DATE__ = ' + JSON.stringify(buildDate) + ';',
    'window.__PORTFOLIO_LAST_COMMIT_DATE__ = ' + JSON.stringify(lastCommitDate) + ';',
    'window.__PORTFOLIO_EMBEDDED_PHOTO_DATA_URL__ = ' + JSON.stringify(embeddedPhotoDataUrl) + ';',
    'window.__PORTFOLIO_EMBEDDED_CERTIFICATE_ATTACHMENTS__ = ' + JSON.stringify(embeddedCertificateAttachments) + ';',
    ''
].join('\n');

fs.writeFileSync(outputPath, content, 'utf8');
