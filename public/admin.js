document.addEventListener('DOMContentLoaded', () => {
    const liberarForm = document.getElementById('liberar-form');
    const liberarIdInput = document.getElementById('liberar-id');
    const liberarMessage = document.getElementById('liberar-message');

    const adicionarReservaForm = document.getElementById('adicionar-reserva-form');
    const adicionarMesaInput = document.getElementById('adicionar-mesa');
    const adicionarNumeroInput = document.getElementById('adicionar-numero');
    const adicionarConvidadoInput = document.getElementById('adicionar-convidado');
    const adicionarMessage = document.getElementById('adicionar-message');

    const adminCadeirasList = document.getElementById('admin-cadeiras-list').querySelector('tbody');

    // Função para buscar e renderizar todas as cadeiras para o admin
    async function fetchAndRenderAdminCadeiras() {
        try {
            const response = await fetch('/api/cadeiras'); // Reutiliza a rota de obter cadeiras
            const data = await response.json();
            const cadeiras = data.cadeiras;

            adminCadeirasList.innerHTML = ''; // Limpa a tabela

            cadeiras.forEach(cadeira => {
                const row = adminCadeirasList.insertRow();
                row.insertCell().textContent = cadeira.id;
                row.insertCell().textContent = cadeira.mesa;
                row.insertCell().textContent = cadeira.numero;
                row.insertCell().textContent = cadeira.ocupado ? 'Sim' : 'Não';
                row.insertCell().textContent = cadeira.convidado || '-'; // Mostra '-' se não houver convidado

                const actionCell = row.insertCell();
                if (cadeira.ocupado) {
                    const liberarButton = document.createElement('button');
                    liberarButton.textContent = 'Liberar';
                    liberarButton.classList.add('liberar-button');
                    liberarButton.addEventListener('click', () => liberarCadeira(cadeira.id));
                    actionCell.appendChild(liberarButton);
                } else {
                    actionCell.textContent = '-'; // Ou um botão para ocupar manualmente se preferir
                }
            });

        } catch (error) {
            console.error('Erro ao buscar cadeiras para o admin:', error);
            alert('Não foi possível carregar as informações das cadeiras no painel de admin.');
        }
    }

    // Função para liberar uma cadeira
    async function liberarCadeira(cadeiraId) {
        if (!confirm(`Tem certeza que deseja liberar a cadeira ID ${cadeiraId}?`)) {
            return;
        }
        try {
            const response = await fetch('/api/admin/liberar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: cadeiraId })
            });

            const data = await response.json();

            if (response.ok) {
                liberarMessage.textContent = data.message;
                liberarMessage.style.color = 'green';
                fetchAndRenderAdminCadeiras(); // Atualiza a lista
            } else {
                liberarMessage.textContent = data.message || 'Erro ao liberar cadeira.';
                liberarMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Erro ao enviar requisição de liberação:', error);
            liberarMessage.textContent = 'Erro de conexão ao tentar liberar cadeira.';
            liberarMessage.style.color = 'red';
        }
    }

    // Event listener para o formulário de liberar cadeira
    liberarForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const cadeiraId = parseInt(liberarIdInput.value);
        if (isNaN(cadeiraId)) {
            liberarMessage.textContent = 'Por favor, insira um ID de cadeira válido.';
            liberarMessage.style.color = 'red';
            return;
        }
        await liberarCadeira(cadeiraId);
        liberarIdInput.value = ''; // Limpa o campo
    });

    // Função para adicionar uma reserva (admin)
    adicionarReservaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const mesa = adicionarMesaInput.value.trim().toUpperCase();
        const numero = parseInt(adicionarNumeroInput.value);
        const convidado = adicionarConvidadoInput.value.trim();

        if (!mesa || !numero || !convidado) {
            adicionarMessage.textContent = 'Por favor, preencha todos os campos.';
            adicionarMessage.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('/api/admin/adicionar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mesa, numero, convidado })
            });

            const data = await response.json();

            if (response.ok) {
                adicionarMessage.textContent = data.message;
                adicionarMessage.style.color = 'green';
                adicionarMesaInput.value = '';
                adicionarNumeroInput.value = '';
                adicionarConvidadoInput.value = '';
                fetchAndRenderAdminCadeiras(); // Atualiza a lista
            } else {
                adicionarMessage.textContent = data.message || 'Erro ao adicionar reserva.';
                adicionarMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('Erro ao enviar requisição de adição de reserva:', error);
            adicionarMessage.textContent = 'Erro de conexão ao tentar adicionar reserva.';
            adicionarMessage.style.color = 'red';
        }
    });

    // Carrega as cadeiras quando a página de admin é carregada
    fetchAndRenderAdminCadeiras();

    // Opcional: Atualizar a lista de cadeiras periodicamente na página de admin
    // setInterval(fetchAndRenderAdminCadeiras, 10000);
});