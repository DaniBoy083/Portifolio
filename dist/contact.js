"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const toastApi = window.showToast;
    const notify = (message, type = 'info') => {
        if (toastApi) {
            toastApi(message, type);
        }
        else {
            console.warn(message);
        }
    };
    const form = document.getElementById('contact-form');
    if (!form)
        return;
    const submitButton = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('contact-name');
        const subjectInput = document.getElementById('contact-subject');
        const messageInput = document.getElementById('contact-message');
        const name = nameInput ? nameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';
        const footerMailAnchor = document.querySelector('footer a[href^="mailto:"]');
        const recipient = footerMailAnchor ? (footerMailAnchor.getAttribute('href') || '').replace(/^mailto:/, '') : '';
        const to = recipient || 'danielcostacarvalhomartins06@gmail.com';
        const finalSubject = subject || `Contato via portfólio: ${name || 'visitante'}`;
        if (!name || !message) {
            notify('Preencha nome e mensagem antes de enviar.', 'error');
            return;
        }
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }
        const request = new XMLHttpRequest();
        request.open('POST', `https://formsubmit.co/ajax/${encodeURIComponent(to)}`);
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Accept', 'application/json');
        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                form.reset();
                notify('Mensagem enviada com sucesso!', 'success');
            }
            else {
                notify('Nao foi possivel enviar agora. Tente novamente em instantes.', 'error');
            }
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar';
            }
        };
        request.onerror = () => {
            notify('Nao foi possivel enviar agora. Tente novamente em instantes.', 'error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar';
            }
        };
        request.send(JSON.stringify({
            name,
            subject: finalSubject,
            message,
            _subject: finalSubject,
            _captcha: 'false'
        }));
    });
});
