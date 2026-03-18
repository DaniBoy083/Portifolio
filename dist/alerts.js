"use strict";
function ensureToastRoot() {
    var existing = document.getElementById('toast-root');
    if (existing) {
        return existing;
    }
    var root = document.createElement('div');
    root.id = 'toast-root';
    root.className = 'toast-root';
    document.body.appendChild(root);
    return root;
}
function showToast(message, type, duration) {
    if (type === void 0) { type = 'info'; }
    if (duration === void 0) { duration = 3800; }
    var root = ensureToastRoot();
    var toast = document.createElement('div');
    toast.className = "toast toast-".concat(type);
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    var text = document.createElement('p');
    text.className = 'toast-message';
    text.textContent = message;
    var closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'toast-close';
    closeButton.setAttribute('aria-label', 'Fechar notificacao');
    closeButton.innerHTML = "\n        <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\">\n            <path d=\"M6 6L18 18M18 6L6 18\" />\n        </svg>\n    ";
    var progress = document.createElement('span');
    progress.className = 'toast-progress';
    toast.style.setProperty('--toast-duration', "".concat(duration, "ms"));
    toast.append(text, closeButton, progress);
    root.appendChild(toast);
    requestAnimationFrame(function () {
        toast.classList.add('toast-visible');
    });
    var closed = false;
    var closeToast = function () {
        if (closed) {
            return;
        }
        closed = true;
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hide');
        window.setTimeout(function () {
            toast.remove();
        }, 220);
    };
    closeButton.addEventListener('click', closeToast);
    window.setTimeout(closeToast, duration);
}
window.showToast = showToast;
document.addEventListener('DOMContentLoaded', function () {
    var welcomeMessages = [
        'Ola, seja bem-vindo ao portfolio virtual do desenvolvedor Daniel Costa.',
        'Aproveite para conhecer um pouco do meu trabalho.',
        'Espero que goste.'
    ];
    welcomeMessages.forEach(function (message, index) {
        window.setTimeout(function () {
            showToast(message, 'info', 4200);
        }, index * 550);
    });
});
