function cvGetTextBySelector(runtimeDocument: Document, selector: string): string {
    return cvCleanText(runtimeDocument.querySelector(selector)?.textContent);
}

function cvGetListText(runtimeDocument: Document, selector: string): string[] {
    const values = Array.from(runtimeDocument.querySelectorAll(selector))
        .map((item) => cvCleanText(item.textContent))
        .filter(Boolean);

    return Array.from(new Set(values));
}

function cvGetReadings(runtimeDocument: Document): string[] {
    const readingNodes = Array.from(runtimeDocument.querySelectorAll('#leituras .estudo'));

    const readings = readingNodes
        .map((node) => {
            const title = cvCleanText(node.querySelector('h2')?.textContent);
            const statusRaw = cvCleanText(node.querySelector('p')?.textContent);
            const status = statusRaw.replace(/^status\s*:\s*/i, '').trim();

            if (!title) {
                return '';
            }

            return status ? `${title} (${status})` : title;
        })
        .filter(Boolean);

    return Array.from(new Set(readings));
}

function cvGetProjects(runtimeDocument: Document): ProjectSummary[] {
    const projectNodes = Array.from(runtimeDocument.querySelectorAll('.projeto'));

    return projectNodes
        .map((node) => {
            const title = cvCleanText(node.querySelector('h2')?.textContent);
            const description = cvCleanText(node.querySelector('p')?.textContent);
            const links = Array.from(node.querySelectorAll('.projeto-link a'))
                .map((anchor) => (anchor as HTMLAnchorElement).href)
                .filter(Boolean);

            return {
                title,
                description,
                links: Array.from(new Set(links))
            };
        })
        .filter((project) => Boolean(project.title));
}

function cvGetProfileLinks(runtimeDocument: Document): { linkedInUrl: string; githubUrl: string } {
    const actionLinks = Array.from(runtimeDocument.querySelectorAll('.topo-acoes a')) as HTMLAnchorElement[];

    const linkedInUrl = actionLinks.find((link) => /linkedin\.com/i.test(link.href))?.href || '';
    const githubUrl = actionLinks.find((link) => /github\.com/i.test(link.href))?.href || '';

    return { linkedInUrl, githubUrl };
}

function cvGetCertificateAttachments(runtimeDocument: Document): CertificateAttachment[] {
    const certificateNodes = Array.from(runtimeDocument.querySelectorAll('#certificados .certificado'));

    return certificateNodes
        .map((node) => {
            const title = cvCleanText(node.querySelector('h2')?.textContent) || 'Certificado';
            const image = node.querySelector('img') as HTMLImageElement | null;
            const srcFromDom = image ? cvGetImageSource(image) : '';

            return {
                title,
                src: srcFromDom,
                imageElement: image
            };
        })
        .filter((item) => Boolean(item.src || item.imageElement));
}

function cvGetEmail(runtimeDocument: Document): string {
    const mailAnchor = runtimeDocument.querySelector('footer a[href^="mailto:"]') as HTMLAnchorElement | null;
    return cvCleanText((mailAnchor?.getAttribute('href') || '').replace(/^mailto:/i, ''));
}

function cvCollectPortfolioSnapshot(runtime: CvRuntimeEnvironment): PortfolioSnapshot {
    const links = cvGetProfileLinks(runtime.runtimeDocument);

    return {
        name: cvGetTextBySelector(runtime.runtimeDocument, '.topo-cabeçalho h1'),
        role: cvGetTextBySelector(runtime.runtimeDocument, '.topo-cabeçalho .topo-cargo'),
        summary: cvGetTextBySelector(runtime.runtimeDocument, '.topo-paragrafo p').replace(/^"|"$/g, ''),
        lastUpdated: cvGetTextBySelector(runtime.runtimeDocument, '#ultima-atualizacao'),
        email: cvGetEmail(runtime.runtimeDocument),
        linkedInUrl: links.linkedInUrl,
        githubUrl: links.githubUrl,
        softSkills: cvGetListText(runtime.runtimeDocument, '#soft-skills .soft-skill h2'),
        readings: cvGetReadings(runtime.runtimeDocument),
        languages: cvGetListText(runtime.runtimeDocument, '#linguagens .linguagem h2'),
        libraries: cvGetListText(runtime.runtimeDocument, '#bibliotecas .biblioteca h2'),
        frameworks: cvGetListText(runtime.runtimeDocument, '#frameworks .framework h2'),
        databases: cvGetListText(runtime.runtimeDocument, '#bancos-de-dados .banco-de-dado h2'),
        virtualization: cvGetListText(runtime.runtimeDocument, '#virtualizações .virtualização h2'),
        certifications: cvGetListText(runtime.runtimeDocument, '#certificados .certificado h2'),
        certificateAttachments: cvGetCertificateAttachments(runtime.runtimeDocument),
        projects: cvGetProjects(runtime.runtimeDocument)
    };
}

function cvGetAcademicBaseFromPage(runtimeDocument: Document): AcademicBasePeriod {
    const semesterLabel = runtimeDocument.getElementById('semestre-atual');

    return {
        period: cvParseAcademicBaseValue(semesterLabel?.dataset.baseSemester, 5),
        year: cvParseAcademicBaseValue(semesterLabel?.dataset.baseYear, 2026),
        month: cvParseAcademicBaseValue(semesterLabel?.dataset.baseMonth, 0)
    };
}

async function cvDrawCurriculumPdf(
    mode: CurriculumMode = 'completo',
    runtime: CvRuntimeEnvironment = cvCreateRuntimeEnvironment(window)
): Promise<void> {
    const JsPdfConstructor = cvGetJsPdfConstructor(runtime);
    if (!JsPdfConstructor) {
        cvNotify(runtime, 'Não foi possível carregar o gerador de PDF. Atualize a página e tente novamente.', 'error');
        return;
    }

    const snapshot = cvCollectPortfolioSnapshot(runtime);
    if (!snapshot.email) {
        cvNotify(runtime, 'O e-mail de contato não foi encontrado no portfólio.', 'error');
        return;
    }

    cvNotify(runtime, 'Preparando o currículo em PDF...', 'info');

    try {
        const [photoDataUrl, certificateAttachments] = await Promise.all([
            cvResolveProfilePhotoDataUrl(runtime),
            cvPrepareCertificateAttachments(snapshot.certificateAttachments, runtime)
        ]);

        const doc = new JsPdfConstructor();
        const academicBase = cvGetAcademicBaseFromPage(runtime.runtimeDocument);
        cvDrawMainCurriculumContent(doc, snapshot, mode, photoDataUrl, academicBase, runtime);

        if (certificateAttachments.length > 0) {
            cvDrawCertificateAttachments(doc, certificateAttachments);
        } else {
            runtime.logger.warn('Nenhuma imagem de certificado válida foi encontrada para anexar ao PDF.');
        }

        const suffix = mode === 'curto' ? 'curto' : 'completo';
        doc.save(`${CV_PDF_FILE_PREFIX}-${suffix}.pdf`);
        cvNotify(runtime, 'Currículo gerado com sucesso.', 'success');
    } catch (error) {
        runtime.logger.error('Erro ao gerar currículo:', error);
        cvNotify(runtime, 'Não foi possível gerar o currículo. Verifique o console e tente novamente.', 'error');
    }
}

function cvNormalizeCurriculumMode(value: string | null | undefined): CurriculumMode {
    return value?.toLocaleLowerCase('pt-BR').includes('curto') ? 'curto' : 'completo';
}

function cvInferCurriculumMode(element: HTMLElement): CurriculumMode {
    const explicitMode = element.dataset.curriculumMode || element.dataset.mode;
    if (explicitMode) {
        return cvNormalizeCurriculumMode(explicitMode);
    }

    return cvNormalizeCurriculumMode(`${element.id} ${element.textContent || ''}`);
}

function cvGetCurriculumButtons(runtimeDocument: Document): HTMLElement[] {
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

    return Array.from(runtimeDocument.querySelectorAll<HTMLElement>(selectors.join(',')));
}

function cvBindCurriculumButtons(runtime: CvRuntimeEnvironment): void {
    cvGetCurriculumButtons(runtime.runtimeDocument).forEach((button) => {
        if (button.dataset.curriculumBound === 'true') {
            return;
        }

        button.dataset.curriculumBound = 'true';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            void cvDrawCurriculumPdf(cvInferCurriculumMode(button), runtime);
        });
    });
}

const cvRuntime = cvCreateRuntimeEnvironment(window);
const curriculumWindow = cvRuntime.runtimeWindow as CurriculumWindow;
curriculumWindow.gerarCurriculo = (mode?: CurriculumMode) => cvDrawCurriculumPdf(mode, cvRuntime);
curriculumWindow.generateCurriculum = (mode?: CurriculumMode) => cvDrawCurriculumPdf(mode, cvRuntime);

if (cvRuntime.runtimeDocument.readyState === 'loading') {
    cvRuntime.runtimeDocument.addEventListener('DOMContentLoaded', () => cvBindCurriculumButtons(cvRuntime), { once: true });
} else {
    cvBindCurriculumButtons(cvRuntime);
}
