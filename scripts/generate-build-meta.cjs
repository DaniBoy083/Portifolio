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

const distDir = path.join(__dirname, '..', 'dist');
const outputPath = path.join(distDir, 'build-meta.js');

fs.mkdirSync(distDir, { recursive: true });

const content = [
    'window.__PORTFOLIO_BUILD_DATE__ = ' + JSON.stringify(buildDate) + ';',
    'window.__PORTFOLIO_LAST_COMMIT_DATE__ = ' + JSON.stringify(lastCommitDate) + ';',
    ''
].join('\n');

fs.writeFileSync(outputPath, content, 'utf8');
