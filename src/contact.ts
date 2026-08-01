document.addEventListener('DOMContentLoaded', () => {
    const CONTACT_REQUEST_TIMEOUT_MS = 12000;
    const CONTACT_COOLDOWN_MS = 20000;
    const CONTACT_LAST_SEND_KEY = 'portfolio-contact-last-send-at';

    const toastApi = (window as Window & {
        showToast?: (message: string, type?: ToastKind, duration?: number) => void;
    }).showToast;

    const notify = (message: string, type: ToastKind = 'info') => {
        if (toastApi) {
            toastApi(message, type);
        } else {
            console.warn(message);
        }
    };

    const form = document.getElementById('contact-form') as HTMLFormElement | null;
    if (!form) return;

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;

    const getLastSendAt = (): number => {
        try {
            const value = Number.parseInt(window.sessionStorage.getItem(CONTACT_LAST_SEND_KEY) || '0', 10);
            return Number.isNaN(value) ? 0 : value;
        } catch {
            return 0;
        }
    };

    const markSendTimestamp = (): void => {
        try {
            window.sessionStorage.setItem(CONTACT_LAST_SEND_KEY, String(Date.now()));
        } catch {
            // Ignore storage failures.
        }
    };

    const isWithinCooldown = (): boolean => {
        const elapsed = Date.now() - getLastSendAt();
        return elapsed >= 0 && elapsed < CONTACT_COOLDOWN_MS;
    };

    const setSubmittingState = (isSubmitting: boolean): void => {
        if (!submitButton) {
            return;
        }

        submitButton.disabled = isSubmitting;
        submitButton.textContent = isSubmitting ? 'Enviando...' : 'Enviar';
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('contact-name') as HTMLInputElement | null;
        const subjectInput = document.getElementById('contact-subject') as HTMLInputElement | null;
        const messageInput = document.getElementById('contact-message') as HTMLTextAreaElement | null;
        const companyInput = document.getElementById('contact-company') as HTMLInputElement | null;

        const name = nameInput ? nameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';
        const company = companyInput ? companyInput.value.trim() : '';

        const footerMailAnchor = document.querySelector('footer a[href^="mailto:"]') as HTMLAnchorElement | null;
        const recipient = footerMailAnchor ? (footerMailAnchor.getAttribute('href') || '').replace(/^mailto:/, '') : '';

        const to = recipient || 'danielcostacarvalhomartins06@gmail.com';
        const finalSubject = subject || `Contato via portfólio: ${name || 'visitante'}`;

        if (!name || !message) {
            notify('Preencha nome e mensagem antes de enviar.', 'error');
            return;
        }

        if (company) {
            notify('Nao foi possivel validar o envio. Atualize a pagina e tente novamente.', 'error');
            return;
        }

        if (isWithinCooldown()) {
            notify('Aguarde alguns segundos antes de enviar uma nova mensagem.', 'info');
            return;
        }

        setSubmittingState(true);

        const request = new XMLHttpRequest();
        request.open('POST', `https://formsubmit.co/ajax/${encodeURIComponent(to)}`);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Accept', 'application/json');
        request.timeout = CONTACT_REQUEST_TIMEOUT_MS;

        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                form.reset();
                markSendTimestamp();
                notify('Mensagem enviada com sucesso!', 'success');
            } else {
                notify('Nao foi possivel enviar agora. Tente novamente em instantes.', 'error');
            }
        };

        request.onerror = () => {
            notify('Nao foi possivel enviar agora. Tente novamente em instantes.', 'error');
        };

        request.ontimeout = () => {
            notify('A requisicao demorou demais para responder. Tente novamente.', 'error');
        };

        request.onloadend = () => setSubmittingState(false);

        request.send(JSON.stringify({
            name,
            subject: finalSubject,
            message,
            _subject: finalSubject,
            _captcha: 'false',
            _honey: company
        }));
    });
});
