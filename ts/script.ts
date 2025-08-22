//Alerta de boas vindas para a pagina usando a biblioteca SweetAlert2.

import Swal from 'sweetalert2';

const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: 'OK'
    });
};

showAlert('Bem-vindo!', 'Esse é o portifolio virtual do desenvolvedor Daniel Costa.', 'success');
showAlert('Espero que goste!', 'Conheça um pouco do trabalho realizado.', 'success');