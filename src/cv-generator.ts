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

async function loadImageAsDataUrl(url: string): Promise<string | null> {
    try {
        const normalizedUrl = new URL(url, window.location.href).href;
        const response = await fetch(normalizedUrl);
        if (!response.ok) {
            return null;
        }

        const blob = await response.blob();

        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Falha ao converter imagem'));
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

async function imageElementToDataUrl(imageElement: HTMLImageElement | null): Promise<string | null> {
    if (!imageElement) {
        return null;
    }

    const loadIfNeeded = async (): Promise<void> => {
        if (imageElement.complete && imageElement.naturalWidth > 0) {
            return;
        }

        if (imageElement.complete && imageElement.naturalWidth === 0) {
            throw new Error('Imagem do elemento indisponivel');
        }

        await new Promise<void>((resolve, reject) => {
            const timeoutId = window.setTimeout(() => {
                imageElement.removeEventListener('load', onLoad);
                imageElement.removeEventListener('error', onError);
                reject(new Error('Timeout ao carregar imagem do elemento'));
            }, 3500);

            const onLoad = () => {
                window.clearTimeout(timeoutId);
                imageElement.removeEventListener('load', onLoad);
                imageElement.removeEventListener('error', onError);
                resolve();
            };
            const onError = () => {
                window.clearTimeout(timeoutId);
                imageElement.removeEventListener('load', onLoad);
                imageElement.removeEventListener('error', onError);
                reject(new Error('Falha ao carregar imagem do elemento'));
            };

            imageElement.addEventListener('load', onLoad);
            imageElement.addEventListener('error', onError);
        });
    };

    try {
        await loadIfNeeded();
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.naturalWidth;
        canvas.height = imageElement.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            return null;
        }

        context.drawImage(imageElement, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.92);
    } catch (error) {
        console.error('Erro na conversão da imagem:', error);
        return null;
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

    console.groupCollapsed('getCertificateAttachments - Certificados encontrados');
    console.table(certificateNodes.map((node, index) => ({
        índice: index,
        título: cleanText(node.querySelector('h2')?.textContent) || 'Certificado',
        currentSrc: (node.querySelector('img') as HTMLImageElement | null)?.currentSrc || '',
        src: (node.querySelector('img') as HTMLImageElement | null)?.src || '',
        complete: (node.querySelector('img') as HTMLImageElement | null)?.complete || false,
        naturalWidth: (node.querySelector('img') as HTMLImageElement | null)?.naturalWidth || 0,
        naturalHeight: (node.querySelector('img') as HTMLImageElement | null)?.naturalHeight || 0
    })));
    console.groupEnd();

    return certificateNodes.map((node) => {
        const title = cleanText(node.querySelector('h2')?.textContent) || 'Certificado';
        const image = node.querySelector('img') as HTMLImageElement | null;
        const srcFromDom = image?.currentSrc || image?.src || image?.getAttribute('src') || '';

        return {
            title,
            src: srcFromDom,
            imageElement: image
        };
    }).filter((item) => Boolean(item.src));
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
    if (cursorY + neededHeight <= 286) {
        return cursorY;
    }

    doc.addPage();
    return 18;
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
            ? `${(project.description || 'Não informado').slice(0, 125)}${project.description.length > 125 ? '...' : ''}`
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

function drawPersonalInfoBlock(doc: JsPdfInstance, snapshot: PortfolioSnapshot, cursorY: number): number {
    const leftX = 14;
    const rightX = 112;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(18, 18, 18);
    doc.text(snapshot.name || 'Daniel Costa', leftX, cursorY);
    doc.text('Desenvolvedor', 94, cursorY);

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
        const lines = doc.splitTextToSize(line, 88);
        doc.text(lines, leftX, yLeft);
        yLeft += lines.length * 5.1;
    });

    rightLines.forEach((line) => {
        const lines = doc.splitTextTo
