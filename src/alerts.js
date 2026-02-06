function criarModal(titulo, mensagem) {
    // Remove modal existente se houver
    const modalExistente = document.getElementById('modal-alerta');
    if (modalExistente) {
        modalExistente.remove();
    }

    // Criar estrutura do modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'modal-alerta';
    modalOverlay.className = 'modal-overlay';

    const modalConteudo = document.createElement('div');
    modalConteudo.className = 'modal-conteudo';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';

    const modalTitulo = document.createElement('h2');
    modalTitulo.textContent = titulo;
    modalHeader.appendChild(modalTitulo);

    const botaoFechar = document.createElement('button');
    botaoFechar.className = 'modal-fechar';
    botaoFechar.innerHTML = '&times;';
    botaoFechar.onclick = () => fecharModal();
    modalHeader.appendChild(botaoFechar);

    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.textContent = mensagem;

    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';

    const botaoOk = document.createElement('button');
    botaoOk.className = 'modal-botao-ok';
    botaoOk.textContent = 'Fechar';
    botaoOk.onclick = () => fecharModal();

    modalFooter.appendChild(botaoOk);

    modalConteudo.appendChild(modalHeader);
    modalConteudo.appendChild(modalBody);
    modalConteudo.appendChild(modalFooter);

    modalOverlay.appendChild(modalConteudo);
    document.body.appendChild(modalOverlay);

    // Fechar modal ao clicar fora
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            fecharModal();
        }
    };
}

function fecharModal() {
    const modal = document.getElementById('modal-alerta');
    if (modal) {
        modal.classList.add('fechando');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Mostrar alertas
criarModal("Bem-vindo!", "Olá, seja bem-vindo ao portfólio virtual do desenvolvedor Daniel Costa.");
setTimeout(() => {
    criarModal("Aproveite", "Aproveite para conhecer um pouco do meu trabalho.");
}, 2000);
setTimeout(() => {
    criarModal("Obrigado", "Espero que goste.");
}, 4000);
