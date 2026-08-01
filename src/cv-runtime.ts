const CV_PORTFOLIO_URL = 'https://portifoliodanielcosta.netlify.app';
const CV_IMAGE_LOAD_TIMEOUT_MS = 8000;
const CV_PAGE_BOTTOM_LIMIT = 286;
const CV_DEFAULT_PAGE_TOP = 18;
const CV_PDF_FILE_PREFIX = 'curriculo-daniel-costa';

const CV_PERSONAL_INFO: PersonalProfileInfo = {
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

interface Window {
    __PORTFOLIO_EMBEDDED_PHOTO_DATA_URL__?: string;
    __PORTFOLIO_EMBEDDED_CERTIFICATE_ATTACHMENTS__?: EmbeddedCertificateAttachment[];
}

function cvCreateRuntimeEnvironment(runtimeWindow: Window = window): CvRuntimeEnvironment {
    const runtimeConsole = (runtimeWindow as unknown as { console?: Console }).console || console;

    return {
        runtimeWindow,
        runtimeDocument: runtimeWindow.document,
        locationHref: runtimeWindow.location.href,
        logger: runtimeConsole
    };
}

function cvNotify(runtime: CvRuntimeEnvironment, message: string, type: ToastKind = 'info'): void {
    try {
        const toastApi = (runtime.runtimeWindow as Window & {
            showToast?: (text: string, kind?: ToastKind, duration?: number) => void;
        }).showToast;

        if (toastApi) {
            toastApi(message, type, 4200);
            return;
        }
    } catch (error) {
        runtime.logger.warn('Falha ao exibir notificação de toast.', error);
    }

    runtime.logger.log(message);
}

function cvGetJsPdfConstructor(runtime: CvRuntimeEnvironment): (new () => JsPdfInstance) | null {
    const jspdfWindow = (runtime.runtimeWindow as Window & { jspdf?: JsPdfWindow }).jspdf;
    return jspdfWindow?.jsPDF || null;
}

function cvGetEmbeddedPhotoDataUrl(runtime: CvRuntimeEnvironment): string {
    const embeddedDataUrl = runtime.runtimeWindow.__PORTFOLIO_EMBEDDED_PHOTO_DATA_URL__;
    return typeof embeddedDataUrl === 'string' ? embeddedDataUrl : '';
}

function cvGetEmbeddedCertificateAttachments(runtime: CvRuntimeEnvironment): EmbeddedCertificateAttachment[] {
    const attachments = runtime.runtimeWindow.__PORTFOLIO_EMBEDDED_CERTIFICATE_ATTACHMENTS__;
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
