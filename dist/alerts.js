"use strict";
const WELCOME_TOASTS_SEEN_KEY = 'portfolio-welcome-toasts-seen';
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
function hideToast(toast) {
    if (toast.dataset.closed === 'true') {
        return;
    }
    toast.dataset.closed = 'true';
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hide');
    window.setTimeout(() => {
        toast.remove();
    }, 220);
}
function dismissToasts(origin) {
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach((toast) => {
        if (origin && toast.dataset.origin !== origin) {
            return;
        }
        hideToast(toast);
    });
}
function hasSeenWelcomeMessages() {
    try {
        return window.sessionStorage.getItem(WELCOME_TOASTS_SEEN_KEY) === 'true';
    }
    catch {
        return false;
    }
}
function markWelcomeMessagesAsSeen() {
    try {
        window.sessionStorage.setItem(WELCOME_TOASTS_SEEN_KEY, 'true');
    }
    catch {
        // Ignore environments where sessionStorage is unavailable.
    }
}
function shouldShowWelcomeMessages() {
    return !window.location.hash && window.scrollY < 120 && !hasSeenWelcomeMessages();
}
function showToast(message, type = 'info', duration = 3800, origin = 'default') {
    const root = ensureToastRoot();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.dataset.origin = origin;
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
        hideToast(toast);
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
    const dismissWelcomeToastsOnScroll = () => {
        if (window.scrollY < 120) {
            return;
        }
        dismissToasts('welcome');
        window.removeEventListener('scroll', dismissWelcomeToastsOnScroll);
    };
    window.addEventListener('scroll', dismissWelcomeToastsOnScroll, { passive: true });
    window.setTimeout(() => {
        if (!shouldShowWelcomeMessages()) {
            window.removeEventListener('scroll', dismissWelcomeToastsOnScroll);
            return;
        }
        markWelcomeMessagesAsSeen();
        welcomeMessages.forEach((message, index) => {
            window.setTimeout(() => {
                if (window.scrollY >= 120) {
                    dismissToasts('welcome');
                    return;
                }
                showToast(message, 'info', 4200, 'welcome');
            }, index * 550);
        });
    }, 260);
});
