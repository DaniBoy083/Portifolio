const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const issues = [];

function lineFromIndex(source, index) {
    return source.slice(0, index).split(/\r?\n/).length;
}

function checkNoLegacyParagraphTags() {
    const match = html.match(/<\/?p[12]\b/i);
    if (match && typeof match.index === 'number') {
        issues.push({
            line: lineFromIndex(html, match.index),
            message: 'Found non-semantic tag p1/p2. Use semantic <p> tags with classes.'
        });
    }
}

function checkNoInvalidBreakClosing() {
    const match = html.match(/<\/br\s*>/i);
    if (match && typeof match.index === 'number') {
        issues.push({
            line: lineFromIndex(html, match.index),
            message: 'Found invalid </br>. Prefer CSS spacing or a valid <br>.'
        });
    }
}

function checkTargetBlankRel() {
    const blankLinkPattern = /<a\b[^>]*target\s*=\s*"_blank"[^>]*>/gi;
    let match;

    while ((match = blankLinkPattern.exec(html)) !== null) {
        const tag = match[0];
        const relMatch = tag.match(/\brel\s*=\s*"([^"]*)"/i);
        const tokens = new Set(
            (relMatch?.[1] || '')
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean)
        );

        if (!tokens.has('noopener') || !tokens.has('noreferrer')) {
            issues.push({
                line: lineFromIndex(html, match.index),
                message: 'Link with target="_blank" must include rel="noopener noreferrer".'
            });
        }
    }
}

function checkImageLoadingAttribute() {
    const imgPattern = /<img\b[^>]*>/gi;
    let match;

    while ((match = imgPattern.exec(html)) !== null) {
        const tag = match[0];
        if (!/\bloading\s*=\s*"(?:lazy|eager)"/i.test(tag)) {
            issues.push({
                line: lineFromIndex(html, match.index),
                message: 'Image tag missing loading attribute (lazy or eager).'
            });
        }
    }
}

function checkHeadScriptsDefer() {
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (!headMatch) {
        return;
    }

    const headContent = headMatch[1];
    const headStartIndex = headMatch.index || 0;
    const scriptPattern = /<script\b[^>]*\bsrc\s*=\s*"[^"]+"[^>]*><\/script>/gi;
    let match;

    while ((match = scriptPattern.exec(headContent)) !== null) {
        const tag = match[0];
        if (!/\bdefer\b/i.test(tag)) {
            issues.push({
                line: lineFromIndex(html, headStartIndex + match.index),
                message: 'Script with src inside <head> must use defer.'
            });
        }
    }
}

checkNoLegacyParagraphTags();
checkNoInvalidBreakClosing();
checkTargetBlankRel();
checkImageLoadingAttribute();
checkHeadScriptsDefer();

if (issues.length) {
    console.error('Markup validation failed:');
    for (const issue of issues) {
        console.error(`- line ${issue.line}: ${issue.message}`);
    }
    process.exit(1);
}

console.log('Markup validation passed.');
