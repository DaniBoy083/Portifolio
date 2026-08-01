function cvDrawSectionTitle(doc: JsPdfInstance, title: string, cursorY: number): number {
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(title, 14, cursorY);
    doc.setDrawColor(28, 28, 28);
    doc.setLineWidth(0.25);
    doc.line(14, cursorY + 1.2, 196, cursorY + 1.2);
    return cursorY + 6;
}

function cvDrawParagraph(doc: JsPdfInstance, text: string, cursorY: number, left = 14, width = 182, size = 10): number {
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width);
    doc.text(lines, left, cursorY);
    return cursorY + (lines.length * 4.9);
}

function cvDrawBulletList(doc: JsPdfInstance, items: string[], cursorY: number, left = 16, width = 178): number {
    if (!items.length) {
        return cvDrawParagraph(doc, '- Não informado', cursorY, left, width);
    }

    let y = cursorY;
    items.forEach((item) => {
        y = cvDrawParagraph(doc, `- ${item}`, y, left, width);
        y += 1;
    });
    return y;
}

function cvDrawLinkLine(doc: JsPdfInstance, label: string, text: string, url: string, cursorY: number, left = 16, width = 176): number {
    const fullText = `${label}: ${text}`;
    const lines = doc.splitTextToSize(fullText, width);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.4);
    doc.setTextColor(0, 90, 180);
    doc.text(lines, left, cursorY);
    doc.link(left, cursorY - 3.5, width, lines.length * 5, { url });
    return cursorY + (lines.length * 5.1);
}

function cvSummarizeSkillItems(items: string[], maxItems: number): string[] {
    return items.slice(0, maxItems);
}

function cvEnsurePage(doc: JsPdfInstance, cursorY: number, neededHeight: number): number {
    if (cursorY + neededHeight <= CV_PAGE_BOTTOM_LIMIT) {
        return cursorY;
    }

    doc.addPage();
    return CV_DEFAULT_PAGE_TOP;
}

function cvDrawCertificateAttachments(
    doc: JsPdfInstance,
    attachments: Array<{ title: string; dataUrl: string; format: ImageFormat }>
): void {
    if (!attachments.length) {
        return;
    }

    doc.addPage();
    let y = 18;
    y = cvDrawSectionTitle(doc, 'ANEXOS FOTOGRÁFICOS - CERTIFICADOS', y);

    attachments.forEach((attachment) => {
        y = cvEnsurePage(doc, y, 98);

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

function cvDrawProjects(doc: JsPdfInstance, projects: ProjectSummary[], mode: CurriculumMode, cursorY: number): number {
    const selected = mode === 'curto' ? projects.slice(0, 5) : projects;
    if (!selected.length) {
        return cvDrawParagraph(doc, '- Não informado', cursorY, 16, 176);
    }

    let y = cursorY;
    selected.forEach((project) => {
        const description = mode === 'curto'
            ? `${(project.description || 'Não informado').slice(0, 125)}${project.description.length > 125 ? '...' : ''}`
            : `${(project.description || 'Não informado').slice(0, 210)}${(project.description || '').length > 210 ? '...' : ''}`;

        const estimatedLines = Math.max(2, Math.ceil(description.length / (mode === 'curto' ? 84 : 92)));
        const estimatedHeight = 15 + (estimatedLines * 4.8);
        y = cvEnsurePage(doc, y, estimatedHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.2);
        doc.setTextColor(20, 20, 20);
        doc.text(`- ${project.title}`, 16, y);
        y += 4.5;

        y = cvDrawParagraph(doc, `Resumo: ${description}`, y, 19, 173, 9.5);

        const projectLink = project.links[0];
        if (projectLink) {
            y = cvDrawLinkLine(doc, 'Link', projectLink, projectLink, y + 0.5, 19, 173);
        }

        y += 1.5;
    });

    return y;
}

function cvDrawSkillColumns(
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

        y = cvDrawParagraph(doc, column.title, y, x, columnWidth, 10.2);
        y = cvDrawBulletList(doc, column.items, y, x + 2, columnWidth - 2);
        y += 2;

        if (isLeft) {
            leftY = y;
        } else {
            rightY = y;
        }
    });

    return Math.max(leftY, rightY);
}

function cvDrawPersonalInfoBlock(
    doc: JsPdfInstance,
    snapshot: PortfolioSnapshot,
    cursorY: number,
    photoDataUrl: string | null,
    runtime: CvRuntimeEnvironment
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
            doc.addImage(photoDataUrl, cvDetectImageFormat(photoDataUrl), 169, cursorY - 5, 27, 27);
        } catch (error) {
            runtime.logger.warn('A foto de perfil não pôde ser adicionada ao PDF.', error);
        }
    }

    let yLeft = cursorY + 8;
    let yRight = cursorY + 8;

    const leftLines = [
        `Endereço: ${CV_PERSONAL_INFO.endereco}`,
        `Bairro: ${CV_PERSONAL_INFO.bairro}`,
        `Cidade: ${CV_PERSONAL_INFO.cidade}`,
        `CEP: ${CV_PERSONAL_INFO.cep}`,
        `Tel.: ${CV_PERSONAL_INFO.telefone}`
    ];

    const rightLines = [
        `Nacionalidade: ${CV_PERSONAL_INFO.nacionalidade}`,
        `Natural de: ${CV_PERSONAL_INFO.naturalidade}`,
        `Estado civil: ${CV_PERSONAL_INFO.estadoCivil}`,
        `Data de nascimento: ${CV_PERSONAL_INFO.dataNascimento}`,
        `Gênero: ${CV_PERSONAL_INFO.genero}`
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

function cvDrawContactLinks(doc: JsPdfInstance, snapshot: PortfolioSnapshot, cursorY: number): number {
    let y = cursorY;

    if (snapshot.email) {
        const emailUrl = `mailto:${snapshot.email}`;
        y = cvDrawLinkLine(doc, 'E-mail', snapshot.email, emailUrl, y);
    }

    if (cvIsValidWebUrl(snapshot.linkedInUrl)) {
        y = cvDrawLinkLine(doc, 'LinkedIn', snapshot.linkedInUrl, snapshot.linkedInUrl, y + 1);
    }

    if (cvIsValidWebUrl(snapshot.githubUrl)) {
        y = cvDrawLinkLine(doc, 'GitHub', snapshot.githubUrl, snapshot.githubUrl, y + 1);
    }

    y = cvDrawLinkLine(doc, 'Portfólio', CV_PORTFOLIO_URL, CV_PORTFOLIO_URL, y + 1);
    return y;
}

function cvDrawMainCurriculumContent(
    doc: JsPdfInstance,
    snapshot: PortfolioSnapshot,
    mode: CurriculumMode,
    photoDataUrl: string | null,
    academicBase: AcademicBasePeriod,
    runtime: CvRuntimeEnvironment
): void {
    let cursorY = CV_DEFAULT_PAGE_TOP;
    cursorY = cvDrawPersonalInfoBlock(doc, snapshot, cursorY, photoDataUrl, runtime) + 5;

    cursorY = cvEnsurePage(doc, cursorY, 30);
    cursorY = cvDrawSectionTitle(doc, 'RESUMO PROFISSIONAL', cursorY);
    cursorY = cvDrawParagraph(
        doc,
        snapshot.summary || 'Profissional de tecnologia em formação, com foco em desenvolvimento de software e análise de dados.',
        cursorY
    ) + 3;

    cursorY = cvEnsurePage(doc, cursorY, 26);
    cursorY = cvDrawSectionTitle(doc, 'FORMAÇÃO ACADÊMICA', cursorY);
    const academicPeriod = cvComputeAcademicPeriod(academicBase.period, academicBase.year, academicBase.month);
    cursorY = cvDrawParagraph(
        doc,
        `Ciência da Computação — ${academicPeriod}º semestre em andamento.`,
        cursorY,
        16,
        178
    ) + 3;

    cursorY = cvEnsurePage(doc, cursorY, 70);
    cursorY = cvDrawSectionTitle(doc, 'COMPETÊNCIAS TÉCNICAS', cursorY);
    const maxItems = mode === 'curto' ? 6 : Number.MAX_SAFE_INTEGER;
    cursorY = cvDrawSkillColumns(doc, cursorY, [
        { title: 'Linguagens', items: cvSummarizeSkillItems(snapshot.languages, maxItems) },
        { title: 'Frameworks', items: cvSummarizeSkillItems(snapshot.frameworks, maxItems) },
        { title: 'Bibliotecas', items: cvSummarizeSkillItems(snapshot.libraries, maxItems) },
        { title: 'Bancos de dados', items: cvSummarizeSkillItems(snapshot.databases, maxItems) },
        { title: 'Virtualização e ferramentas', items: cvSummarizeSkillItems(snapshot.virtualization, maxItems) }
    ]) + 3;

    cursorY = cvEnsurePage(doc, cursorY, 35);
    cursorY = cvDrawSectionTitle(doc, 'SOFT SKILLS', cursorY);
    cursorY = cvDrawBulletList(
        doc,
        mode === 'curto' ? snapshot.softSkills.slice(0, 6) : snapshot.softSkills,
        cursorY
    ) + 3;

    cursorY = cvEnsurePage(doc, cursorY, 35);
    cursorY = cvDrawSectionTitle(doc, 'CERTIFICAÇÕES', cursorY);
    cursorY = cvDrawBulletList(
        doc,
        mode === 'curto' ? snapshot.certifications.slice(0, 8) : snapshot.certifications,
        cursorY
    ) + 3;

    cursorY = cvEnsurePage(doc, cursorY, 45);
    cursorY = cvDrawSectionTitle(doc, 'PROJETOS', cursorY);
    cursorY = cvDrawProjects(doc, snapshot.projects, mode, cursorY) + 3;

    if (mode === 'completo') {
        cursorY = cvEnsurePage(doc, cursorY, 35);
        cursorY = cvDrawSectionTitle(doc, 'LEITURAS E DESENVOLVIMENTO', cursorY);
        cursorY = cvDrawBulletList(doc, snapshot.readings, cursorY) + 3;
    }

    cursorY = cvEnsurePage(doc, cursorY, 40);
    cursorY = cvDrawSectionTitle(doc, 'CONTATO', cursorY);
    cvDrawContactLinks(doc, snapshot, cursorY);
}
