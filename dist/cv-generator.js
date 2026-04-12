"use strict";
function notify(message, type = 'info') {
    const toastApi = window.showToast;
    if (toastApi) {
        toastApi(message, type, 4200);
        return;
    }
    console.log(message);
}
function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
}
function getTextBySelector(selector) {
    return cleanText(document.querySelector(selector)?.textContent);
}
function getListText(selector) {
    const values = Array.from(document.querySelectorAll(selector))
        .map((item) => cleanText(item.textContent))
        .filter(Boolean);
    return Array.from(new Set(values));
}
function getProjects() {
    const projectNodes = Array.from(document.querySelectorAll('.projeto'));
    return projectNodes.map((node) => {
        const title = cleanText(node.querySelector('h2')?.textContent);
        const description = cleanText(node.querySelector('p')?.textContent);
        const links = Array.from(node.querySelectorAll('.projeto-link a'))
            .map((anchor) => anchor.href)
            .filter(Boolean);
        return {
            title,
            description,
            links: Array.from(new Set(links))
        };
    }).filter((project) => Boolean(project.title));
}
function getProfileLinks() {
    const actionLinks = Array.from(document.querySelectorAll('.topo-acoes a'));
    const linkedInUrl = actionLinks.find((link) => /linkedin\.com/i.test(link.href))?.href || '';
    const githubUrl = actionLinks.find((link) => /github\.com/i.test(link.href))?.href || '';
    return { linkedInUrl, githubUrl };
}
function getEmail() {
    const mailAnchor = document.querySelector('footer a[href^="mailto:"]');
    return cleanText((mailAnchor?.getAttribute('href') || '').replace(/^mailto:/i, ''));
}
function collectPortfolioSnapshot() {
    const links = getProfileLinks();
    return {
        name: getTextBySelector('.topo-cabeçalho h1'),
        role: getTextBySelector('.topo-cabeçalho p1'),
        summary: getTextBySelector('.topo-paragrafo p2').replace(/^"|"$/g, ''),
        lastUpdated: getTextBySelector('#ultima-atualizacao'),
        email: getEmail(),
        linkedInUrl: links.linkedInUrl,
        githubUrl: links.githubUrl,
        education: getListText('#formações .formação h2'),
        languages: getListText('#linguagens .linguagem h2'),
        libraries: getListText('#bibliotecas .biblioteca h2'),
        frameworks: getListText('#frameworks .framework h2'),
        databases: getListText('#bancos-de-dados .banco-de-dado h2'),
        virtualization: getListText('#virtualizações .virtualização h2'),
        certifications: getListText('#certificados .certificado h2'),
        studies: getListText('#estudos .estudo h2'),
        projects: getProjects()
    };
}
function extractGitHubUsername(githubUrl) {
    const match = githubUrl.match(/github\.com\/([^/?#]+)/i);
    return match ? match[1] : '';
}
async function fetchGitHubSummary(githubUrl) {
    const username = extractGitHubUsername(githubUrl);
    if (!username) {
        return null;
    }
    try {
        const profileResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
        if (!profileResponse.ok) {
            return null;
        }
        const profileData = await profileResponse.json();
        const reposResponse = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
        const reposData = reposResponse.ok
            ? await reposResponse.json()
            : [];
        const topRepos = reposData
            .filter((repo) => !repo.fork)
            .sort((left, right) => (right.stargazers_count || 0) - (left.stargazers_count || 0))
            .slice(0, 5)
            .map((repo) => ({
            name: cleanText(repo.name),
            stars: repo.stargazers_count || 0,
            url: cleanText(repo.html_url),
            updatedAt: cleanText(repo.updated_at)
        }))
            .filter((repo) => Boolean(repo.name) && Boolean(repo.url));
        return {
            username,
            profileUrl: cleanText(profileData.html_url) || githubUrl,
            followers: profileData.followers || 0,
            publicRepos: profileData.public_repos || 0,
            topRepos
        };
    }
    catch {
        return null;
    }
}
function toBulletList(items) {
    return items.length ? items.map((item) => `- ${item}`).join('\n') : '- Nao informado';
}
function buildProjectsSection(projects, mode) {
    if (!projects.length) {
        return '- Nao informado';
    }
    const selected = mode === 'curto' ? projects.slice(0, 5) : projects;
    return selected.map((project) => {
        const links = project.links.length
            ? project.links.slice(0, mode === 'curto' ? 1 : project.links.length).map((url) => `  - ${url}`).join('\n')
            : '  - Sem link publico';
        const description = mode === 'curto'
            ? (project.description || 'Nao informado').slice(0, 160)
            : project.description || 'Nao informado';
        return [
            `- ${project.title}`,
            `  - Resumo: ${description}${mode === 'curto' && description.length >= 160 ? '...' : ''}`,
            '  - Links:',
            links
        ].join('\n');
    }).join('\n');
}
function buildGitHubSection(summary, fallbackUrl, mode) {
    if (!summary) {
        if (!fallbackUrl) {
            return '- Perfil GitHub nao informado';
        }
        return [
            `- Perfil: ${fallbackUrl}`,
            '- Estatisticas indisponiveis no momento (limite de API ou conexao).'
        ].join('\n');
    }
    const topCount = mode === 'curto' ? 3 : 5;
    const repoLines = summary.topRepos.length
        ? summary.topRepos.slice(0, topCount).map((repo) => `  - ${repo.name} (${repo.stars} stars): ${repo.url}`).join('\n')
        : '  - Nenhum repositorio publico encontrado.';
    return [
        `- Perfil: ${summary.profileUrl}`,
        `- Usuario: ${summary.username}`,
        `- Seguidores: ${summary.followers}`,
        `- Repositorios publicos: ${summary.publicRepos}`,
        '- Repositorios em destaque:',
        repoLines
    ].join('\n');
}
function buildCurriculumMarkdown(snapshot, githubSummary, mode) {
    const generatedAt = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date());
    const heading = mode === 'curto' ? 'Curriculo Curto' : 'Curriculo Completo';
    const lines = [
        `# ${heading} - ${snapshot.name || 'Profissional'}`,
        '',
        `Gerado automaticamente em: ${generatedAt}`,
        snapshot.lastUpdated ? `${snapshot.lastUpdated}` : '',
        '',
        '## Perfil',
        `- Nome: ${snapshot.name || 'Nao informado'}`,
        `- Cargo/objetivo: ${snapshot.role || 'Nao informado'}`,
        `- Resumo: ${snapshot.summary || 'Nao informado'}`,
        '',
        '## Contato',
        `- Email: ${snapshot.email || 'Nao informado'}`,
        `- LinkedIn: ${snapshot.linkedInUrl || 'Nao informado'}`,
        `- GitHub: ${snapshot.githubUrl || 'Nao informado'}`,
        '',
        '## Formacao',
        toBulletList(snapshot.education),
        '',
        '## Competencias tecnicas',
        '### Linguagens',
        toBulletList(snapshot.languages),
        '',
        '### Frameworks',
        toBulletList(snapshot.frameworks),
        '',
        '### Bancos de dados',
        toBulletList(snapshot.databases),
        ''
    ];
    if (mode === 'completo') {
        lines.push('### Bibliotecas', toBulletList(snapshot.libraries), '', '### Virtualizacao', toBulletList(snapshot.virtualization), '');
    }
    lines.push('## Projetos', buildProjectsSection(snapshot.projects, mode), '', '## Certificacoes', toBulletList(snapshot.certifications), '');
    if (mode === 'completo') {
        lines.push('## Em aprendizado', toBulletList(snapshot.studies), '');
    }
    lines.push('## Dados GitHub (publicos)', buildGitHubSection(githubSummary, snapshot.githubUrl, mode), '', '## Observacao sobre LinkedIn', '- O LinkedIn e referenciado pelo link publico no portfolio.', '- Para incluir detalhes adicionais (experiencias e formacoes detalhadas), complemente manualmente no documento final.');
    return lines.filter(Boolean).join('\n');
}
function markdownToPlainText(markdown) {
    return markdown
        .replace(/^###\s+/gm, '')
        .replace(/^##\s+/gm, '')
        .replace(/^#\s+/gm, '')
        .replace(/\*\*/g, '')
        .trim();
}
function downloadFile(content, name, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = name;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
}
function buildFileBaseName(snapshot, mode) {
    const slugName = (snapshot.name || 'curriculo')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const date = new Date();
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${slugName || 'curriculo'}-${mode}-${yyyy}-${mm}-${dd}`;
}
function chooseCurriculumMode() {
    const useComplete = window.confirm('Clique em OK para curriculo completo. Clique em Cancelar para curriculo curto.');
    return useComplete ? 'completo' : 'curto';
}
async function generateCurriculum() {
    const mode = chooseCurriculumMode();
    const snapshot = collectPortfolioSnapshot();
    const githubSummary = await fetchGitHubSummary(snapshot.githubUrl);
    const markdown = buildCurriculumMarkdown(snapshot, githubSummary, mode);
    const plainText = markdownToPlainText(markdown);
    const baseName = buildFileBaseName(snapshot, mode);
    downloadFile(markdown, `${baseName}.md`, 'text/markdown;charset=utf-8');
    downloadFile(plainText, `${baseName}.txt`, 'text/plain;charset=utf-8');
    return mode;
}
document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('gerar-curriculo');
    if (!trigger) {
        return;
    }
    trigger.addEventListener('click', async (event) => {
        event.preventDefault();
        if (trigger.dataset.loading === 'true') {
            return;
        }
        trigger.dataset.loading = 'true';
        const previousLabel = trigger.textContent;
        trigger.textContent = 'Gerando curriculo...';
        try {
            const mode = await generateCurriculum();
            notify(`Curriculo ${mode} gerado em .md e .txt.`, 'success');
        }
        catch {
            notify('Nao foi possivel gerar o curriculo agora. Tente novamente.', 'error');
        }
        finally {
            trigger.dataset.loading = 'false';
            trigger.textContent = previousLabel || 'Gerar curriculo inteligente';
        }
    });
});
