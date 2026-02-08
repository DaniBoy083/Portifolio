document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('contact-form');
    if (!form)
        return;
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
        var finalSubject = subject || "Contato via portf\xF3lio: " + (name || 'visitante');
        var body = message + "\n\n— " + name;
        var mailto = "mailto:" + encodeURIComponent(to) + "?subject=" + encodeURIComponent(finalSubject) + "&body=" + encodeURIComponent(body);
        window.location.href = mailto;
    });
});
