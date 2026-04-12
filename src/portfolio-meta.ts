type LastUpdateSource = 'manual' | 'git' | 'document';

interface Window {
    __PORTFOLIO_LAST_COMMIT_DATE__?: string;
    __PORTFOLIO_BUILD_DATE__?: string;
}

function parseDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveLastUpdateDate(label: HTMLElement): { date: Date | null; source: LastUpdateSource } {
    const manualDate = parseDate(label.dataset.manualDate);
    if (manualDate) {
        return { date: manualDate, source: 'manual' };
    }

    const gitDate = parseDate(window.__PORTFOLIO_LAST_COMMIT_DATE__ || window.__PORTFOLIO_BUILD_DATE__);
    if (gitDate) {
        return { date: gitDate, source: 'git' };
    }

    return { date: parseDate(document.lastModified), source: 'document' };
}

function formatLastUpdated(date: Date | null): string {
    if (!date) {
        return 'Ultima atualização';
    }

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);

    return `Ultima atualização: ${formattedDate}`;
}

function updateLastUpdatedLabel(): void {
    const label = document.getElementById('ultima-atualizacao');
    if (!label) {
        return;
    }

    const { date, source } = resolveLastUpdateDate(label);
    label.textContent = formatLastUpdated(date);
    label.setAttribute('data-update-source', source);
}

function getCurrentAcademicSemester(baseSemester: number, baseYear: number, baseMonth: number): number {
    const now = new Date();
    const totalMonthsDiff = (now.getFullYear() - baseYear) * 12 + (now.getMonth() - baseMonth);
    const semesterSteps = Math.max(0, Math.floor(totalMonthsDiff / 6));
    return Math.min(10, baseSemester + semesterSteps);
}

function updateCurrentSemesterLabel(): void {
    const label = document.getElementById('semestre-atual');
    if (!label) {
        return;
    }

    const baseSemester = Number.parseInt(label.dataset.baseSemester || '5', 10);
    const baseYear = Number.parseInt(label.dataset.baseYear || '2026', 10);
    const baseMonth = Number.parseInt(label.dataset.baseMonth || '0', 10);
    const currentSemester = getCurrentAcademicSemester(baseSemester, baseYear, baseMonth);

    label.textContent = `Semestre atual: ${currentSemester}º semestre`;
}

document.addEventListener('DOMContentLoaded', () => {
    updateLastUpdatedLabel();
    updateCurrentSemesterLabel();
});
