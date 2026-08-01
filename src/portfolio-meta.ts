type LastUpdateSource = 'manual' | 'github' | 'git' | 'document';

const GITHUB_MAIN_COMMIT_API_URL = 'https://api.github.com/repos/DaniBoy083/Portifolio/commits/main';

interface GitHubCommitResponse {
    commit?: {
        committer?: {
            date?: string;
        };
    };
}

interface Window {
    __PORTFOLIO_LAST_COMMIT_DATE__?: string;
    __PORTFOLIO_BUILD_DATE__?: string;
}

interface SummaryPanelCounts {
    technologies: number;
    formations: number;
    certificates: number;
    projects: number;
}

const TECHNOLOGY_TITLE_SELECTORS = [
    '#linguagens .linguagem h2',
    '#bibliotecas .biblioteca h2',
    '#frameworks .framework h2',
    '#bancos-de-dados .banco-de-dado h2',
    '#virtualizações .virtualização h2'
];

function cleanSummaryText(value: string | null | undefined): string {
    return cvCleanText(value);
}

function countUniqueTextBySelectors(selectors: string[]): number {
    const values = selectors.reduce<string[]>((accumulator, selector) => {
        const selectorValues = Array.from(document.querySelectorAll(selector))
            .map((item) => cleanSummaryText(item.textContent))
            .filter(Boolean);

        return accumulator.concat(selectorValues);
    }, []);

    return new Set(values).size;
}

function collectSummaryPanelCounts(): SummaryPanelCounts {
    return {
        technologies: countUniqueTextBySelectors(TECHNOLOGY_TITLE_SELECTORS),
        formations: document.querySelectorAll('#formações .formação').length,
        certificates: document.querySelectorAll('#certificados .certificado').length,
        projects: document.querySelectorAll('#projetos .projeto').length
    };
}

function setSummaryPanelValue(elementId: string, value: number): void {
    const target = document.getElementById(elementId);
    if (!target) {
        return;
    }

    target.textContent = new Intl.NumberFormat('pt-BR').format(value);
}

function updateSummaryPanel(): void {
    const panel = document.getElementById('painel-resumo');
    if (!panel) {
        return;
    }

    const counts = collectSummaryPanelCounts();
    setSummaryPanelValue('resumo-tecnologias', counts.technologies);
    setSummaryPanelValue('resumo-formacoes', counts.formations);
    setSummaryPanelValue('resumo-certificados', counts.certificates);
    setSummaryPanelValue('resumo-projetos', counts.projects);
}

function resolveLastUpdateDate(label: HTMLElement): { date: Date | null; source: LastUpdateSource } {
    return cvResolveLastUpdateDateFromInputs(
        label.dataset.manualDate,
        window.__PORTFOLIO_LAST_COMMIT_DATE__,
        window.__PORTFOLIO_BUILD_DATE__,
        document.lastModified
    );
}

async function fetchGitHubMainCommitDate(): Promise<Date | null> {
    try {
        const response = await fetch(GITHUB_MAIN_COMMIT_API_URL, {
            headers: {
                Accept: 'application/vnd.github+json'
            }
        });

        if (!response.ok) {
            return null;
        }

        const payload = await response.json() as GitHubCommitResponse;
        return cvParseDate(payload.commit?.committer?.date);
    } catch {
        return null;
    }
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

async function updateLastUpdatedLabel(): Promise<void> {
    const label = document.getElementById('ultima-atualizacao');
    if (!label) {
        return;
    }

    const { date, source } = resolveLastUpdateDate(label);
    label.textContent = formatLastUpdated(date);
    label.setAttribute('data-update-source', source);

    if (source === 'manual') {
        return;
    }

    const githubDate = await fetchGitHubMainCommitDate();
    if (!githubDate) {
        return;
    }

    label.textContent = formatLastUpdated(githubDate);
    label.setAttribute('data-update-source', 'github');
}

function updateCurrentSemesterLabel(): void {
    const label = document.getElementById('semestre-atual');
    if (!label) {
        return;
    }

    const baseSemester = cvParseAcademicBaseValue(label.dataset.baseSemester, 5);
    const baseYear = cvParseAcademicBaseValue(label.dataset.baseYear, 2026);
    const baseMonth = cvParseAcademicBaseValue(label.dataset.baseMonth, 0);
    const currentSemester = cvComputeAcademicPeriod(baseSemester, baseYear, baseMonth);

    label.textContent = `Semestre atual: ${currentSemester}º semestre`;
}

document.addEventListener('DOMContentLoaded', () => {
    void updateLastUpdatedLabel();
    updateCurrentSemesterLabel();
    updateSummaryPanel();
});
