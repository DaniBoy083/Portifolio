"use strict";
document.addEventListener('DOMContentLoaded', function () {
    var toastApi = window.showToast;
    var notify = function (message, type) {
        if (type === void 0) { type = 'info'; }
        if (toastApi) {
            toastApi(message, type);
        }
        else {
            console.warn(message);
        }
    };
    var form = document.getElementById('contact-form');
    if (!form)
        return;
    var submitButton = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = document.getElementById('contact-name');
        var subjectInput = document.getElementById('contact-subject');
        var messageInput = document.getElementById('contact-message');
        var name = nameInput ? nameInput.value.trim() : '';
        var subject = subjectInput ? subjectInput.value.trim() : '';
        var message = messageInput ? messageInput.value.trim() : '';
        var footerMailAnchor = document.querySelector('footer a[href^="mailto:"]');
        var recipient = footerMailAnchor ? (footerMailAnchor.getAttribute('href') || '').replace(/^mailto:/, '') : '';
        var to = recipient || 'danielcostacarvalhomartins06@gmail.com';
        var finalSubject = subject || "Contato via portf\u00F3lio: ".concat(name || 'visitante');
        if (!name || !message) {
            notify('Preencha nome e mensagem antes de enviar.', 'error');
            return;
        }
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }
        var request = new XMLHttpRequest();
        request.open('POST', "https://formsubmit.co/ajax/".concat(encodeURIComponent(to)));
        request.setRequestHeader('Content-Type', 'application/json');
        request.setRequestHeader('Accept', 'application/json');
        request.onload = function () {
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
        request.onerror = function () {
            notify('Nao foi possivel enviar agora. Tente novamente em instantes.', 'error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Enviar';
            }
        };
        request.send(JSON.stringify({
            name: name,
            subject: finalSubject,
            message: message,
            _subject: finalSubject,
            _captcha: 'false'
        }));
    });
});
