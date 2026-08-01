type CurriculumMode = 'curto' | 'completo';
type ImageFormat = 'JPEG' | 'PNG';

/**
 * Represents a portfolio project entry displayed on the page and PDF.
 */
interface ProjectSummary {
    /** Project title shown to the reader. */
    title: string;
    /** Short explanatory text about the project. */
    description: string;
    /** Canonical links associated with the project. */
    links: string[];
}

/**
 * Represents a certificate image source gathered from the DOM.
 */
interface CertificateAttachment {
    /** Human-friendly certificate name. */
    title: string;
    /** Original image source URL from the page. */
    src: string;
    /** Image node from the DOM when available. */
    imageElement: HTMLImageElement | null;
}

/**
 * Snapshot of all portfolio data required to render the curriculum PDF.
 */
interface PortfolioSnapshot {
    /** Person full name. */
    name: string;
    /** Professional role headline. */
    role: string;
    /** Professional summary paragraph. */
    summary: string;
    /** Last update label rendered in the page. */
    lastUpdated: string;
    /** Primary contact email. */
    email: string;
    /** Public LinkedIn profile URL. */
    linkedInUrl: string;
    /** Public GitHub profile URL. */
    githubUrl: string;
    /** Soft skills list. */
    softSkills: string[];
    /** Reading and study progress list. */
    readings: string[];
    /** Language technologies list. */
    languages: string[];
    /** Libraries list. */
    libraries: string[];
    /** Frameworks list. */
    frameworks: string[];
    /** Databases list. */
    databases: string[];
    /** Virtualization/tooling list. */
    virtualization: string[];
    /** Certification titles list. */
    certifications: string[];
    /** Certificate attachments used in PDF annexes. */
    certificateAttachments: CertificateAttachment[];
    /** Project entries to be shown in the curriculum. */
    projects: ProjectSummary[];
}

/**
 * jsPDF public methods used by this project.
 */
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

interface EmbeddedCertificateAttachment {
    title: string;
    dataUrl: string;
}

interface PreparedCertificateAttachment {
    title: string;
    dataUrl: string;
    format: ImageFormat;
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

interface AcademicBasePeriod {
    period: number;
    year: number;
    month: number;
}

interface CvRuntimeEnvironment {
    runtimeWindow: Window;
    runtimeDocument: Document;
    locationHref: string;
    logger: Pick<Console, 'log' | 'warn' | 'error'>;
}

interface CurriculumWindow extends Window {
    gerarCurriculo?: (mode?: CurriculumMode) => Promise<void>;
    generateCurriculum?: (mode?: CurriculumMode) => Promise<void>;
}
