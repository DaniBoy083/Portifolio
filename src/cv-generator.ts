type ToastKind = 'info' | 'success' | 'error';
type CurriculumMode = 'curto' | 'completo';

interface ProjectSummary {
    title: string;
    description: string;
    links: string[];
}

interface CertificateAttachment {
    title: string;
    src: string;
    imageElement: HTMLImageElement | null;
}

interface PortfolioSnapshot {
    name: string;
    role: string;
    summary: string;
    lastUpdated: string;
    email: string;
    linkedInUrl: string;
    githubUrl: string;
    softSkills: string[];
    readings: string[];
    languages: string[];
    libraries: string[];
    frameworks: string[];
    databases: string[];
    virtualization: string[];
    certifications: string[];
    certificateAttachments: CertificateAttachment[];
    projects: ProjectSummary[];
}

interface JsPdfInstance {
    setFont(fontName: string, fontStyle?: string): void;
    setFontSize(size: number): void;
    setTextColor(r: number, g?: number, b?: number): void;
    setFillColor(r: number, g?: number, b?: number): void;
    setDrawColor(r: number, g?: number, b?: number): void;
    setLineWidth(width: number): void;
    rect(x: number, y: number, width: number, height: number, style?: string): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    text(text: string | string[], x: number, y: number): void;
    splitTextToSize(text: string, size: number): string[];
    addImage(imageData: string | HTMLImageElement, format: string, x: number, y: number, width: number, height: number): void;
    link(x: number, y: number, width: number, height: number, options: { url: string }): void;
    addPage(): void;
    save(fileName: string): void;
}

interface JsPdfWindow {
    jsPDF: new () => JsPdfInstance;
}

type ImageFormat = 'JPEG' | 'PNG';

interface EmbeddedCertificateAttachment {
    title: string;
    dataUrl: string;
}

interface PersonalProfileInfo {
    endereco: string;
    bairro: string;
    cidade: string;
    cep: string;
    telefone: string;
    email: string;
    nacionalidade: string;
    naturalidade: string;
    estadoCivil: string;
    dataNascimento: string;
    genero: string;
}

const PERSONAL_INFO: PersonalProfileInfo = {
    endereco: 'Rua Bacharel Wilson Flavio Moreira Coutinho',
    bairro: 'Jardim Cidade Universitária',
    cidade: 'João Pessoa',
    cep: '58052510',
    telefone: '+55 83 999828967',
    email: 'danielcostacarvalhomartins06@gmail.com',
    nacionalidade: 'Brasileiro',
    naturalidade: 'João Pessoa',
    estadoCivil: 'Solteiro',
    dataNascimento: '31/01/2006',
    genero: 'Masculino'
};

const PORTFOLIO_URL = 'https://portifoliodanielcosta.netlify.app';
const IMAGE_LOAD_TIMEOUT_MS = 8000;
const PAGE_BOTTOM_LIMIT = 286;
const DEFAULT_PAGE_TOP = 18;
const PDF_FILE_PREFIX = 'curriculo-daniel-costa';

interface PreparedCertificateAttachment {
    title: string;
    dataUrl: string;
    format: ImageFormat;
}

interface CurriculumWindow extends Window {
    gerarCurriculo?: (mode?: CurriculumMode) => Promise<void>;
    generateCurriculum?: (mode?: CurriculumMode) => Promise<void>;
}

function notify(message: string, type: ToastKind = 'info'): void {
    const toastApi = (window as Window & {
        showToast?: (text: string, kind?: ToastKind, duration?: number) => void;
    }).showToast;

    if (toastApi) {
        toastApi(message, type, 4200);
        return;
    }

    console.log(message);
}

function getJsPdf(): (new () => JsPdfInstance) | null {
    const jspdfWindow = (window as Window & { jspdf?: JsPdfWindow }).jspdf;
    return jspdfWindow?.jsPDF || null;
}

function getEmbeddedPhotoDataUrl(): string {
    const embeddedDataUrl = (window as Window & {
        __PORTFOLIO_EMBEDDED_PHOTO_DATA_URL__?: string;
    }).__PORTFOLIO_EMBEDDED_PHOTO_DATA_URL__;

    return typeof embeddedDataUrl === 'string' ? embeddedDataUrl : '';
}

function getEmbeddedCertificateAttachments(): EmbeddedCertificateAttachment[] {
    const attachments = (window as Window & {
        __PORTFOLIO_EMBEDDED_CERTIFICATE_ATTACHMENTS__?: EmbeddedCertificateAttachment[];
    }).__PORTFOLIO_EMBEDDED_CERTIFICATE_ATTACHMENTS__;

    if (!Array.isArray(attachments)) {
        return [];
    }

    return attachments.filter((item) =>
        Boolean(item) &&
        typeof item.title === 'string' &&
        typeof item.dataUrl === 'string' &&
        item.dataUrl.startsWith('data:image/')
    );
}

function isSafeImageUrl(url: URL): boolean {
    return ['http:', 'https:', 'data:', 'blob:'].includes(url.protocol);
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
    if (!url) {
        return null;
    }

    try {
        const normalizedUrl = new URL(url, window.location.href);
        if (!isSafeImageUrl(normalizedUrl)) {
            return null;
        }

        const response = await fetch(normalizedUrl.href, {
            credentials: normalizedUrl.origin === window.location.origin ? 'same-origin' : 'omit'
        });

        if (!response.ok) {
            return null;
        }

        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) {
            return null;
        }

        return await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                resolve(result.startsWith('data:image/') ? result : null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn('Não foi possível carregar uma imagem do portfólio.', error);
        return null;
    }
}

function getImageSource(imageElement: HTMLImageElement): string {
    return imageElement.currentSrc
        || imageElement.getAttribute('src')
        || imageElement.src
        || '';
}

async function waitForImageElement(imageElement: HTMLImageElement): Promise<void> {
    if (imageElement.loading === 'lazy') {
        imageElement.loading = 'eager';
    }

    if (imageElement.complete && imageElement.naturalWidth > 0 && imageElement.naturalHeight > 0) {
        return;
    }

    await new Promise<void>((resolve, reject) => {
        let settled = false;

        const cleanup = (): void => {
            window.clearTimeout(timeoutId);
            imageElement.removeEventListener('load', onLoad);
            imageElement.removeEventListener('error', onError);
        };

        const settle = (callback: () => void): void => {
            if (settled) {
                return;
            }

            settled = true;
            cleanup();
            callback();
        };

        const onLoad = (): void => settle(resolve);
        const onError = (): void => settle(() => reject(new Error('Falha ao carregar imagem do elemento')));

        const timeoutId = window.setTimeout(() => {
            settle(() => reject(new Error('Timeout ao carregar imagem do elemento')));
        }, IMAGE_LOAD_TIMEOUT_MS);

        imageElement.addEventListener('load', onLoad, { once: true });
        imageElement.addEventListener('error', onError, { once: true });

        const source = getImageSource(imageElement);
        if (source && !imageElement.getAttribute('src')) {
            imageElement.src = source;
        }
    });
}

async function imageElementToDataUrl(imageElement: HTMLImageElement | null): Promise<string | null> {
    if (!imageElement) {
        return null;
    }

    const source = getImageSource(imageElement);

    try {
        await waitForImageElement(imageElement);

        if (typeof imageElement.decode === 'function') {
            try {
                await imageElement.decode();
            } catch {
                // Alguns navegadores rejeitam decode() mesmo depois de a imagem carregar.
                // As dimensões naturais abaixo continuam sendo a validação definitiva.
            }
        }

        if (imageElement.naturalWidth <= 0 || imageElement.naturalHeight <= 0) {
            return source ? loadImageAsDataUrl(source) : null;
        }

        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;

        const context = canvas.getContext('2d');
        if (!context) {
            return source ? loadImageAsDataUrl(source) : null;
        }

        context.drawImage(imageElement, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        return dataUrl.startsWith('data:image/') ? dataUrl : null;
    } catch (error) {
        console.warn('Falha ao converter uma imagem do DOM; usando o caminho como fallback.', error);
        return source ? loadImageAsDataUrl(source) : null;
    }
}

function detectImageFormat(dataUrl: string): ImageFormat {
    return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
}

function cleanText(value: string | null | undefined): string {
    return (value || '').replace(/\s+/g, ' ').trim();
}

function getTextBySelector(selector: string): string {
    return cleanText(document.querySelector(selector)?.textContent);
}

function getListText(selector: string): string[] {
    const values = Array.from(document.querySelectorAll(selector))
        .map((item) => cleanText(item.textContent))
        .filter(Boolean);

    return Array.from(new Set(values));
}

function getReadings(): string[] {
    const readingNodes = Array.from(document.querySelectorAll('#leituras .estudo'));

    const readings = readingNodes
        .map((node) => {
            const title = cleanText(node.querySelector('h2')?.textContent);
            const statusRaw = cleanText(node.querySelector('p')?.textContent);
            const status = statusRaw.replace(/^status\s*:\s*/i, '').trim();

            if (!title) {
                return '';
            }

            return status ? `${title} (${status})` : title;
        })
        .filter(Boolean);

    return Array.from(new Set(readings));
}

function getProjects(): ProjectSummary[] {
    const projectNodes = Array.from(document.querySelectorAll('.projeto'));

    return projectNodes.map((node) => {
        const title = cleanText(node.querySelector('h2')?.textContent);
        const description = cleanText(node.querySelector('p')?.textContent);
        const links = Array.from(node.querySelectorAll('.projeto-link a'))
            .map((anchor) => (anchor as HTMLAnchorElement).href)
            .filter(Boolean);

        return {
            title,
            description,
            links: Array.from(new Set(links))
        };
    }).filter((project) => Boolean(project.title));
}

function getProfileLinks(): { linkedInUrl: string; githubUrl: string } {
    const actionLinks = Array.from(document.querySelectorAll('.topo-acoes a')) as HTMLAnchorElement[];

    const linkedInUrl = actionLinks.find((link) => /linkedin\.com/i.test(link.href))?.href || '';
    const githubUrl = actionLinks.find((link) => /github\.com/i.test(link.href))?.href || '';

    return { linkedInUrl, githubUrl };
}

function getCertificateAttachments(): CertificateAttachment[] {
    const certificateNodes = Array.from(document.querySelectorAll('#certificados .certificado'));

    return certificateNodes.map((node) => {
        const title = cleanText(node.querySelector('h2')?.textContent) || 'Certificado';
        const image = node.querySelector('img') as HTMLImageElement | null;
        const srcFromDom = image?.currentSrc || image?.src || image?.getAttribute('src') || '';

        return {
            title,
            src: srcFromDom,
            imageElement: image
        };
    }).filter((item) => Boolean(item.src || item.imageElement));
}

function getEmail(): string {
    const mailAnchor = document.querySelector('footer a[href^="mailto:"]') as HTMLAnchorElement | null;
    return cleanText((mailAnchor?.getAttribute('href') || '').replace(/^mailto:/i, ''));
}

function collectPortfolioSnapshot(): PortfolioSnapshot {
    const links = getProfileLinks();

    return {
        name: getTextBySelector('.topo-cabeçalho h1'),
        role: getTextBySelector('.topo-cabeçalho .topo-cargo'),
        summary: getTextBySelector('.topo-paragrafo p').replace(/^"|"$/g, ''),
        lastUpdated: getTextBySelector('#ultima-atualizacao'),
        email: getEmail(),
        linkedInUrl: links.linkedInUrl,
        githubUrl: links.githubUrl,
        softSkills: getListText('#soft-skills .soft-skill h2'),
        readings: getReadings(),
        languages: getListText('#linguagens .linguagem h2'),
        libraries: getListText('#bibliotecas .biblioteca h2'),
        frameworks: getListText('#frameworks .framework h2'),
        databases: getListText('#bancos-de-dados .banco-de-dado h2'),
        virtualization: getListText('#virtualizações .virtualização h2'),
        certifications: getListText('#certificados .certificado h2'),
        certificateAttachments: getCertificateAttachments(),

        projects: getProjects()
    };
}

function drawSectionTitle(doc: JsPdfInstance, title: string, cursorY: number): number {
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(title, 14, cursorY);
    doc.setDrawColor(28, 28, 28);
    doc.setLineWidth(0.25);
    doc.line(14, cursorY + 1.2, 196, cursorY + 1.2);
    return cursorY + 6;
}

function drawParagraph(doc: JsPdfInstance, text: string, cursorY: number, left = 14, width = 182, size = 10): number {
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, left, cursorY);
    return cursorY + (lines.length * 4.9);
}

function drawBulletList(doc: JsPdfInstance, items: string[], cursorY: number, left = 16, width = 178): number {
    if (!items.length) {
        return drawParagraph(doc, '- Não informado', cursorY, left, width);
    }

    let y = cursorY;
    items.forEach((item) => {
        y = drawParagraph(doc, `- ${item}`, y, left, width);
        y += 1;
    });
    return y;
}

function drawLinkLine(doc: JsPdfInstance, label: string, text: string, url: string, cursorY: number, left = 16, width = 176): number {
    const fullText = `${label}: ${text}`;
    const lines = doc.splitTextToSize(fullText, width);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.4);
    doc.setTextColor(0, 90, 180);
    doc.text(lines, left, cursorY);
    doc.link(left, cursorY - 3.5, width, lines.length * 5, { url });
    return cursorY + (lines.length * 5.1);
}

function summarizeSkillItems(items: string[], maxItems: number): string[] {
    return items.slice(0, maxItems);
}

function ensurePage(doc: JsPdfInstance, cursorY: number, neededHeight: number): number {
    if (cursorY + neededHeight <= PAGE_BOTTOM_LIMIT) {
        return cursorY;
    }

    doc.addPage();
    return DEFAULT_PAGE_TOP;
}

function drawCertificateAttachments(
    doc: JsPdfInstance,
    attachments: Array<{ title: string; dataUrl: string; format: ImageFormat }>
): void {
    if (!attachments.length) {
        return;
    }

    doc.addPage();
    let y = 18;
    y = drawSectionTitle(doc, 'ANEXOS FOTOGRÁFICOS - CERTIFICADOS', y);

    attachments.forEach((attachment) => {
        y = ensurePage(doc, y, 98);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        const titleLines = doc.splitTextToSize(attachment.title, 182);
        doc.text(titleLines, 14, y);
        y += titleLines.length * 5;

        try {
            doc.addImage(attachment.dataUrl, attachment.format, 14, y, 182, 86);
        } catch {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(110, 20, 20);
            doc.text('Não foi possível renderizar este anexo.', 14, y + 7);
        }

        y += 92;
    });
}

function drawProjects(doc: JsPdfInstance, projects: ProjectSummary[], mode: CurriculumMode, cursorY: number): number {
    const selected = mode === 'curto' ? projects.slice(0, 5) : projects;
    if (!selected.length) {
        return drawParagraph(doc, '- Não informado', cursorY, 16, 176);
    }

    let y = cursorY;
    selected.forEach((project) => {
        const description = mode === 'curto'
            ? `${(project.description || 'Não informado').slice(0, 125)}${project.description.length > 125
                ? '...' : ''}`
            : `${(project.description || 'Não informado').slice(0, 210)}${(project.description || '').length > 210 ? '...' : ''}`;

        const estimatedLines = Math.max(2, Math.ceil(description.length / (mode === 'curto' ? 84 : 92)));
        const estimatedHeight = 15 + (estimatedLines * 4.8);
        y = ensurePage(doc, y, estimatedHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.2);
        doc.setTextColor(20, 20, 20);
        doc.text(`- ${project.title}`, 16, y);
        y += 4.5;

        y = drawParagraph(doc, `Resumo: ${description}`, y, 19, 173, 9.5);

        const projectLink = project.links[0];
        if (projectLink) {
            y = drawLinkLine(doc, 'Link', projectLink, projectLink, y + 0.5, 19, 173);
        }

        y += 1.5;
    });

    return y;
}

function drawSkillColumns(
    doc: JsPdfInstance,
    cursorY: number,
    columns: Array<{ title: string; items: string[] }>
): number {
    const leftX = 16;
    const rightX = 108;
    const columnWidth = 84;

    let leftY = cursorY;
    let rightY = cursorY;

    columns.forEach((column, index) => {
        const isLeft = index % 2 === 0;
        const x = isLeft ? leftX : rightX;
        let y = isLeft ? leftY : rightY;

        y = drawParagraph(doc, column.title, y, x, columnWidth, 10.2);
        y = drawBulletList(doc, column.items, y, x + 2, columnWidth - 2);
        y += 2;

        if (isLeft) {
            leftY = y;
        } else {
            rightY = y;
        }
    });

    return Math.max(leftY, rightY);
}

function getCurrentAcademicPeriod(basePeriod: number, baseYear: number, baseMonth: number): number {
    const now = new Date();
    const totalMonthsDiff = (now.getFullYear() - baseYear) * 12 + (now.getMonth() - baseMonth);
    const semesterSteps = Math.max(0, Math.floor(totalMonthsDiff / 6));
    return Math.min(10, basePeriod + semesterSteps);
}

function drawPersonalInfoBlock(
    doc: JsPdfInstance,
    snapshot: PortfolioSnapshot,
    cursorY: number,
    photoDataUrl: string | null
): number {
    const leftX = 14;
    const rightX = 112;
    const leftWidth = 88;
    const rightWidth = photoDataUrl ? 52 : 84;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(18, 18, 18);
    doc.text(snapshot.name || 'Daniel Costa', leftX, cursorY);
    doc.text(snapshot.role || 'Desenvolvedor', 94, cursorY);

    if (photoDataUrl) {
        try {
            doc.addImage(photoDataUrl, detectImageFormat(photoDataUrl), 169, cursorY - 5, 27, 27);
        } catch (error) {
            console.warn('A foto de perfil não pôde ser adicionada ao PDF.', error);
        }
    }

    let yLeft = cursorY + 8;
    let yRight = cursorY + 8;

    const leftLines = [
        `Endereço: ${PERSONAL_INFO.endereco}`,
        `Bairro: ${PERSONAL_INFO.bairro}`,
        `Cidade: ${PERSONAL_INFO.cidade}`,
        `CEP: ${PERSONAL_INFO.cep}`,
        `Tel.: ${PERSONAL_INFO.telefone}`
    ];

    const rightLines = [
        `Nacionalidade: ${PERSONAL_INFO.nacionalidade}`,
        `Natural de: ${PERSONAL_INFO.naturalidade}`,
        `Estado civil: ${PERSONAL_INFO.estadoCivil}`,
        `Data de nascimento: ${PERSONAL_INFO.dataNascimento}`,
        `Gênero: ${PERSONAL_INFO.genero}`
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(24, 24, 24);

    leftLines.forEach((line) => {
        const lines = doc.splitTextToSize(line, leftWidth);
        doc.text(lines, leftX, yLeft);
        yLeft += lines.length * 5.1;
    });

    rightLines.forEach((line) => {
        const lines = doc.splitTextToSize(line, rightWidth);
        doc.text(lines, rightX, yRight);
        yRight += lines.length * 5.1;
    });

    return Math.max(yLeft, yRight, photoDataUrl ? cursorY + 24 : cursorY);
}

function isValidWebUrl(value: string): boolean {
    if (!value) {
        return false;
    }

    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function getProfileImageElement(): HTMLImageElement | null {
    const selectors = [
        '.topo-foto img',
        '.foto-perfil img',
        '.minha-foto img',
        'img[src*="minhafoto"]',
        'img[alt*="Daniel"]'
    ];

    for (const selector of selectors) {
        const image = document.querySelector(selector) as HTMLImageElement | null;
        if (image) {
            return image;
        }
    }

    return null;
}

async function resolveProfilePhotoDataUrl(): Promise<string | null> {
    const embeddedPhoto = getEmbeddedPhotoDataUrl();
    if (embeddedPhoto.startsWith('data:image/')) {
        return embeddedPhoto;
    }

    return imageElementToDataUrl(getProfileImageElement());
}

function isPreparedCertificateAttachment(
    value: PreparedCertificateAttachment | null
): value is PreparedCertificateAttachment {
    return Boolean(value?.dataUrl.startsWith('data:image/'));
}

function getFileNameFromPath(value: string): string {
    if (!value) {
        return '';
    }

    try {
        const url = new URL(value, window.location.href);
        const encodedFileName = url.pathname.split('/').pop() || '';
        return decodeURIComponent(encodedFileName);
    } catch {
        const normalizedPath = value.replace(/\\/g, '/');
        return normalizedPath.split('/').pop() || normalizedPath;
    }
}

function normalizeCertificateAssetKey(value: string): string {
    const fileName = getFileNameFromPath(value) || value;

    return fileName
        .replace(/\.[a-z0-9]+$/i, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .normalize('NFC')
        .toLocaleLowerCase('pt-BR');
}

async function prepareCertificateAttachment(
    attachment: CertificateAttachment,
    embeddedByAssetKey: ReadonlyMap<string, EmbeddedCertificateAttachment>
): Promise<PreparedCertificateAttachment | null> {
    const assetKey = normalizeCertificateAssetKey(attachment.src);
    const embedded = embeddedByAssetKey.get(assetKey);

    // O anexo incorporado no build é a fonte mais confiável: não depende de
    // lazy loading, posição na página, CORS ou disponibilidade do servidor local.
    const dataUrl = embedded?.dataUrl
        || await imageElementToDataUrl(attachment.imageElement)
        || await loadImageAsDataUrl(attachment.src)
        || '';

    if (!dataUrl.startsWith('data:image/')) {
        return null;
    }

    return {
        title: attachment.title,
        dataUrl,
        format: detectImageFormat(dataUrl)
    };
}

async function prepareCertificateAttachments(
    attachments: CertificateAttachment[]
): Promise<PreparedCertificateAttachment[]> {
    const embeddedByAssetKey = new Map(
        getEmbeddedCertificateAttachments().map((attachment) => [
            normalizeCertificateAssetKey(attachment.title),
            attachment
        ])
    );

    const results = await Promise.all(
        attachments.map((attachment) => prepareCertificateAttachment(attachment, embeddedByAssetKey))
    );

    return results.filter(isPreparedCertificateAttachment);
}

function drawContactLinks(doc: JsPdfInstance, snapshot: PortfolioSnapshot, cursorY: number): number {
    let y = cursorY;

    if (snapshot.email) {
        const emailUrl = `mailto:${snapshot.email}`;
        y = drawLinkLine(doc, 'E-mail', snapshot.email, emailUrl, y);
    }

    if (isValidWebUrl(snapshot.linkedInUrl)) {
        y = drawLinkLine(doc, 'LinkedIn', snapshot.linkedInUrl, snapshot.linkedInUrl, y + 1);
    }

    if (isValidWebUrl(snapshot.githubUrl)) {
        y = drawLinkLine(doc, 'GitHub', snapshot.githubUrl, snapshot.githubUrl, y + 1);
    }

    y = drawLinkLine(doc, 'Portfólio', PORTFOLIO_URL, PORTFOLIO_URL, y + 1);
    return y;
}

function drawMainCurriculumContent(
    doc: JsPdfInstance,
    snapshot: PortfolioSnapshot,
    mode: CurriculumMode,
    photoDataUrl: string | null
): void {
    let cursorY = DEFAULT_PAGE_TOP;
    cursorY = drawPersonalInfoBlock(doc, snapshot, cursorY, photoDataUrl) + 5;

    cursorY = ensurePage(doc, cursorY, 30);
    cursorY = drawSectionTitle(doc, 'RESUMO PROFISSIONAL', cursorY);
    cursorY = drawParagraph(
        doc,
        snapshot.summary || 'Profissional de tecnologia em formação, com foco em desenvolvimento de software e análise de dados.',
        cursorY
    ) + 3;

    cursorY = ensurePage(doc, cursorY, 26);
    cursorY = drawSectionTitle(doc, 'FORMAÇÃO ACADÊMICA', cursorY);
    const academicPeriod = getCurrentAcademicPeriod(6, 2026, 6);
    cursorY = drawParagraph(
        doc,
        `Ciência da Computação — ${academicPeriod}º período em andamento.`,
        cursorY,
        16,
        178
    ) + 3;

    cursorY = ensurePage(doc, cursorY, 70);
    cursorY = drawSectionTitle(doc, 'COMPETÊNCIAS TÉCNICAS', cursorY);
    const maxItems = mode === 'curto' ? 6 : Number.MAX_SAFE_INTEGER;
    cursorY = drawSkillColumns(doc, cursorY, [
        { title: 'Linguagens', items: summarizeSkillItems(snapshot.languages, maxItems) },
        { title: 'Frameworks', items: summarizeSkillItems(snapshot.frameworks, maxItems) },
        { title: 'Bibliotecas', items: summarizeSkillItems(snapshot.libraries, maxItems) },
        { title: 'Bancos de dados', items: summarizeSkillItems(snapshot.databases, maxItems) },
        { title: 'Virtualização e ferramentas', items: summarizeSkillItems(snapshot.virtualization, maxItems) }
    ]) + 3;

    cursorY = ensurePage(doc, cursorY, 35);
    cursorY = drawSectionTitle(doc, 'SOFT SKILLS', cursorY);
    cursorY = drawBulletList(
        doc,
        mode === 'curto' ? snapshot.softSkills.slice(0, 6) : snapshot.softSkills,
        cursorY
    ) + 3;

    cursorY = ensurePage(doc, cursorY, 35);
    cursorY = drawSectionTitle(doc, 'CERTIFICAÇÕES', cursorY);
    cursorY = drawBulletList(
        doc,
        mode === 'curto' ? snapshot.certifications.slice(0, 8) : snapshot.certifications,
        cursorY
    ) + 3;

    cursorY = ensurePage(doc, cursorY, 45);
    cursorY = drawSectionTitle(doc, 'PROJETOS', cursorY);
    cursorY = drawProjects(doc, snapshot.projects, mode, cursorY) + 3;

    if (mode === 'completo') {
        cursorY = ensurePage(doc, cursorY, 35);
        cursorY = drawSectionTitle(doc, 'LEITURAS E DESENVOLVIMENTO', cursorY);
        cursorY = drawBulletList(doc, snapshot.readings, cursorY) + 3;
    }

    cursorY = ensurePage(doc, cursorY, 40);
    cursorY = drawSectionTitle(doc, 'CONTATO', cursorY);
    drawContactLinks(doc, snapshot, cursorY);
}

async function drawCurriculumPdf(mode: CurriculumMode = 'completo'): Promise<void> {
    const JsPdfConstructor = getJsPdf();
    if (!JsPdfConstructor) {
        notify('Não foi possível carregar o gerador de PDF. Atualize a página e tente novamente.', 'error');
        return;
    }

    const snapshot = collectPortfolioSnapshot();
    if (!snapshot.email) {
        notify('O e-mail de contato não foi encontrado no portfólio.', 'error');
        return;
    }

    notify('Preparando o currículo em PDF...', 'info');

    try {
        const [photoDataUrl, certificateAttachments] = await Promise.all([
            resolveProfilePhotoDataUrl(),
            prepareCertificateAttachments(snapshot.certificateAttachments)
        ]);

        const doc = new JsPdfConstructor();
        drawMainCurriculumContent(doc, snapshot, mode, photoDataUrl);

        if (certificateAttachments.length > 0) {
            drawCertificateAttachments(doc, certificateAttachments);
        } else {
            console.warn('Nenhuma imagem de certificado válida foi encontrada para anexar ao PDF.');
        }

        const suffix = mode === 'curto' ? 'curto' : 'completo';
        doc.save(`${PDF_FILE_PREFIX}-${suffix}.pdf`);
        notify('Currículo gerado com sucesso.', 'success');
    } catch (error) {
        console.error('Erro ao gerar currículo:', error);
        notify('Não foi possível gerar o currículo. Verifique o console e tente novamente.', 'error');
    }
}

function normalizeCurriculumMode(value: string | null | undefined): CurriculumMode {
    return value?.toLocaleLowerCase('pt-BR').includes('curto') ? 'curto' : 'completo';
}

function inferCurriculumMode(element: HTMLElement): CurriculumMode {
    const explicitMode = element.dataset.curriculumMode || element.dataset.mode;
    if (explicitMode) {
        return normalizeCurriculumMode(explicitMode);
    }

    return normalizeCurriculumMode(`${element.id} ${element.textContent || ''}`);
}

function getCurriculumButtons(): HTMLElement[] {
    const selectors = [
        '[data-curriculum-mode]',
        '[data-action="gerar-curriculo"]',
        '#gerar-curriculo',
        '#gerar-curriculo-curto',
        '#gerar-curriculo-completo',
        '#baixar-curriculo',
        '#baixar-curriculo-curto',
        '#baixar-curriculo-completo',
        '.gerar-curriculo',
        '.baixar-curriculo'
    ];

    return Array.from(document.querySelectorAll<HTMLElement>(selectors.join(',')));
}

function bindCurriculumButtons(): void {
    getCurriculumButtons().forEach((button) => {
        if (button.dataset.curriculumBound === 'true') {
            return;
        }

        button.dataset.curriculumBound = 'true';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            void drawCurriculumPdf(inferCurriculumMode(button));
        });
    });
}

const curriculumWindow = window as CurriculumWindow;
curriculumWindow.gerarCurriculo = drawCurriculumPdf;
curriculumWindow.generateCurriculum = drawCurriculumPdf;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindCurriculumButtons, { once: true });
} else {
    bindCurriculumButtons();
}
