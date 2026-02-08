document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form') as HTMLFormElement | null;
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('contact-name') as HTMLInputElement | null;
        const subjectInput = document.getElementById('contact-subject') as HTMLInputElement | null;
        const messageInput = document.getElementById('contact-message') as HTMLTextAreaElement | null;

        const name = nameInput ? nameInput.value.trim() : '';
        const subject = subjectInput ? subjectInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        const footerMailAnchor = document.querySelector('footer a[href^="mailto:"]') as HTMLAnchorElement | null;
        const recipient = footerMailAnchor ? (footerMailAnchor.getAttribute('href') || '').replace(/^mailto:/, '') : '';

        const to = recipient || 'danielcostacarvalhomartins06@gmail.com';
        const finalSubject = subject || `Contato via portfólio: ${name || 'visitante'}`;
        const body = `${message}\n\n— ${name}`;

        const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailto;
    });
});
