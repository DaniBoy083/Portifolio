"use strict";
const GITHUB_MAIN_COMMIT_API_URL = 'https://api.github.com/repos/DaniBoy083/Portifolio/commits/main';
function parseDate(value) {
    if (!value) {
        return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function resolveLastUpdateDate(label) {
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
async function fetchGitHubMainCommitDate() {
    try {
        const response = await fetch(GITHUB_MAIN_COMMIT_API_URL, {
            headers: {
                Accept: 'application/vnd.github+json'
            }
        });
        if (!response.ok) {
            return null;
        }
        const payload = await response.json();
        return parseDate(payload.commit?.committer?.date);
    }
    catch {
        return null;
    }
}
function formatLastUpdated(date) {
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
async function updateLastUpdatedLabel() {
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
function getCurrentAcademicSemester(baseSemester, baseYear, baseMonth) {
    const now = new Date();
    const totalMonthsDiff = (now.getFullYear() - baseYear) * 12 + (now.getMonth() - baseMonth);
    const semesterSteps = Math.max(0, Math.floor(totalMonthsDiff / 6));
    return Math.min(10, baseSemester + semesterSteps);
}
function updateCurrentSemesterLabel() {
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
    void updateLastUpdatedLabel();
    updateCurrentSemesterLabel();
});
