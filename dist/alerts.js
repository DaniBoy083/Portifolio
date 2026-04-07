"use strict";
function ensureToastRoot() {
    const existing = document.getElementById('toast-root');
    if (existing) {
        return existing;
    }
    const root = document.createElement('div');
    root.id = 'toast-root';
    root.className = 'toast-root';
    document.body.appendChild(root);
    return root;
}
function showToast(message, type = 'info', duration = 3800) {
    const root = ensureToastRoot();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    const text = document.createElement('p');
    text.className = 'toast-message';
    text.textContent = message;
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'toast-close';
    closeButton.setAttribute('aria-label', 'Fechar notificacao');
    closeButton.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 6L18 18M18 6L6 18" />
        </svg>
    `;
    const progress = document.createElement('span');
    progress.className = 'toast-progress';
    toast.style.setProperty('--toast-duration', `${duration}ms`);
    toast.append(text, closeButton, progress);
    root.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });
    let closed = false;
    const closeToast = () => {
        if (closed) {
            return;
        }
        closed = true;
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-hide');
        window.setTimeout(() => {
            toast.remove();
        }, 220);
    };
    closeButton.addEventListener('click', closeToast);
    window.setTimeout(closeToast, duration);
}
window.showToast = showToast;
document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessages = [
        'Ola, seja bem-vindo ao portfolio virtual do desenvolvedor Daniel Costa.',
        'Aproveite para conhecer um pouco do meu trabalho.',
        'Espero que goste.'
    ];
    welcomeMessages.forEach((message, index) => {
        window.setTimeout(() => {
            showToast(message, 'info', 4200);
        }, index * 550);
    });
});
