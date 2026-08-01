type LastUpdateDateSource = 'manual' | 'git' | 'document';

interface LastUpdateDateResolution {
    date: Date | null;
    source: LastUpdateDateSource;
}

interface CvImageSourceCandidates {
    currentSrc?: string | null;
    attributeSrc?: string | null;
    propertySrc?: string | null;
}

function cvCleanText(value: string | null | undefined): string {
    return (value || '').replace(/\s+/g, ' ').trim();
}

function cvParseDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function cvResolveLastUpdateDateFromInputs(
    manualDateValue: string | null | undefined,
    gitDateValue: string | null | undefined,
    buildDateValue: string | null | undefined,
    documentLastModified: string | null | undefined
): LastUpdateDateResolution {
    const manualDate = cvParseDate(manualDateValue);
    if (manualDate) {
        return { date: manualDate, source: 'manual' };
    }

    const gitDate = cvParseDate(gitDateValue || buildDateValue);
    if (gitDate) {
        return { date: gitDate, source: 'git' };
    }

    return {
        date: cvParseDate(documentLastModified),
        source: 'document'
    };
}

function cvIsSafeProtocol(protocol: string): boolean {
    return ['http:', 'https:', 'data:', 'blob:'].includes(protocol);
}

function cvTryResolveSafeUrl(rawUrl: string, baseHref: string): URL | null {
    if (!rawUrl) {
        return null;
    }

    try {
        const normalizedUrl = new URL(rawUrl, baseHref);
        return cvIsSafeProtocol(normalizedUrl.protocol) ? normalizedUrl : null;
    } catch {
        return null;
    }
}

function cvSelectImageSourceFromCandidates(candidates: CvImageSourceCandidates): string {
    return candidates.currentSrc
        || candidates.attributeSrc
        || candidates.propertySrc
        || '';
}

function cvGetImageSource(imageElement: HTMLImageElement): string {
    return cvSelectImageSourceFromCandidates({
        currentSrc: imageElement.currentSrc,
        attributeSrc: imageElement.getAttribute('src'),
        propertySrc: imageElement.src
    });
}

function cvGetFileNameFromPath(value: string, baseHref: string): string {
    if (!value) {
        return '';
    }

    try {
        const url = new URL(value, baseHref);
        const encodedFileName = url.pathname.split('/').pop() || '';
        return decodeURIComponent(encodedFileName);
    } catch {
        const normalizedPath = value.replace(/\\/g, '/');
        return normalizedPath.split('/').pop() || normalizedPath;
    }
}

function cvNormalizeCertificateAssetKey(value: string, baseHref: string): string {
    const fileName = cvGetFileNameFromPath(value, baseHref) || value;

    return fileName
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .normalize('NFC')
        .toLocaleLowerCase('pt-BR');
}

function cvParseAcademicBaseValue(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function cvComputeAcademicPeriod(
    basePeriod: number,
    baseYear: number,
    baseMonth: number,
    now: Date = new Date()
): number {
    const totalMonthsDiff = (now.getFullYear() - baseYear) * 12 + (now.getMonth() - baseMonth);
    const semesterSteps = Math.max(0, Math.floor(totalMonthsDiff / 6));
    return Math.min(10, basePeriod + semesterSteps);
}

function cvIsValidWebUrl(value: string): boolean {
    const url = cvTryResolveSafeUrl(value, 'https://example.com');
    if (!url) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
}

declare const module: { exports: Record<string, unknown> } | undefined;
if (typeof module !== 'undefined' && module && module.exports) {
    module.exports = {
        cvCleanText,
        cvParseDate,
        cvResolveLastUpdateDateFromInputs,
        cvIsSafeProtocol,
        cvTryResolveSafeUrl,
        cvSelectImageSourceFromCandidates,
        cvGetImageSource,
        cvGetFileNameFromPath,
        cvNormalizeCertificateAssetKey,
        cvParseAcademicBaseValue,
        cvComputeAcademicPeriod,
        cvIsValidWebUrl
    };
}
