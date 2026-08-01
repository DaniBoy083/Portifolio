const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const vm = require('node:vm');

function loadCvHelpers() {
    const sourcePath = path.resolve(__dirname, '../src/cv-helpers.ts');
    const source = fs.readFileSync(sourcePath, 'utf8');

    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020
        }
    }).outputText;

    const sandbox = {
        module: { exports: {} },
        exports: {},
        require,
        console,
        URL
    };

    vm.runInNewContext(transpiled, sandbox, { filename: 'cv-helpers.js' });
    return sandbox.module.exports;
}

const helpers = loadCvHelpers();

test('cvResolveLastUpdateDateFromInputs prioritizes manual date', () => {
    const result = helpers.cvResolveLastUpdateDateFromInputs(
        '2026-07-10',
        '2026-06-01T00:00:00.000Z',
        '2026-05-01T00:00:00.000Z',
        '2020-01-01T00:00:00.000Z'
    );

    assert.equal(result.source, 'manual');
    assert.ok(result.date);
    assert.equal(Number.isNaN(result.date.getTime()), false);
    assert.equal(result.date.toISOString().slice(0, 10), '2026-07-10');
});

test('cvResolveLastUpdateDateFromInputs falls back to git date', () => {
    const result = helpers.cvResolveLastUpdateDateFromInputs(
        '',
        '2026-06-01T00:00:00.000Z',
        '',
        '2020-01-01T00:00:00.000Z'
    );

    assert.equal(result.source, 'git');
    assert.equal(result.date.toISOString().slice(0, 10), '2026-06-01');
});

test('cvTryResolveSafeUrl blocks javascript protocol', () => {
    const safe = helpers.cvTryResolveSafeUrl('https://example.com/logo.png', 'https://base.local/page');
    const unsafe = helpers.cvTryResolveSafeUrl('javascript:alert(1)', 'https://base.local/page');

    assert.ok(safe);
    assert.equal(safe.protocol, 'https:');
    assert.equal(unsafe, null);
});

test('cvSelectImageSourceFromCandidates chooses first available source', () => {
    const source = helpers.cvSelectImageSourceFromCandidates({
        currentSrc: '',
        attributeSrc: '/img/fallback.png',
        propertySrc: 'https://cdn.example.com/img.png'
    });

    assert.equal(source, '/img/fallback.png');
});

test('cvGetImageSource respects currentSrc precedence', () => {
    const mockImageElement = {
        currentSrc: 'https://cdn.example.com/current.png',
        src: 'https://cdn.example.com/property.png',
        getAttribute: (name) => (name === 'src' ? '/img/attribute.png' : null)
    };

    assert.equal(helpers.cvGetImageSource(mockImageElement), 'https://cdn.example.com/current.png');
});

test('cvNormalizeCertificateAssetKey normalizes filename and accents', () => {
    const key = helpers.cvNormalizeCertificateAssetKey(
        'img/Certificados/Certificado_Udemy-(Full-Stack com react e ts).jpg',
        'https://portfolio.example/'
    );

    assert.equal(key, 'certificado udemy (full stack com react e ts)');
});

test('cvComputeAcademicPeriod advances by semester and caps at 10', () => {
    const january2026 = new Date('2026-01-15T00:00:00.000Z');
    const july2027 = new Date('2027-07-20T00:00:00.000Z');

    assert.equal(helpers.cvComputeAcademicPeriod(5, 2026, 0, january2026), 5);
    assert.equal(helpers.cvComputeAcademicPeriod(5, 2026, 0, july2027), 8);
    assert.equal(helpers.cvComputeAcademicPeriod(9, 2020, 0, july2027), 10);
});
