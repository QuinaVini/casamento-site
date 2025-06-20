document.addEventListener('DOMContentLoaded', () => {
    const mesasContainer = document.getElementById('mesas-container');
    const modal = document.getElementById('modal');
    const closeButton = document.querySelector('.close-button');
    const reservaForm = document.getElementById('reserva-form');
    const cadeiraSelecionadaInfo = document.getElementById('cadeira-selecionada-info');
    const nomeConvidadoInput = document.getElementById('nome-convidado');
    const modalMessage = document.getElementById('modal-message');

    let cadeiraSelecionadaId = null; // Para armazenar o ID da cadeira selecionada

    // Função para buscar e renderizar as cadeiras
    async function fetchAndRenderCadeiras() {
        try {
            const response = await fetch('/api/cadeiras');
            const data = await response.json();
            const cadeiras = data.cadeiras;

            mesasContainer.innerHTML = ''; // Limpa o container antes de renderizar

            // Agrupar cadeiras por mesa
            const mesas = {};
            cadeiras.forEach(c => {
                if (!mesas[c.mesa]) {
                    mesas[c.mesa] = [];
                }
                mesas[c.mesa].push(c);
            });

            // Renderizar cada mesa e suas cadeiras
            for (const mesaLetra in mesas) {
                const mesaDiv = document.createElement('div');
                mesaDiv.classList.add('mesa');
                mesaDiv.innerHTML = `<h2>Mesa ${mesaLetra}</h2>`;

                // Posicionamento circular das cadeiras (exemplo simplificado)
                // Você pode usar matemática (seno/cosseno) para um posicionamento mais preciso
                const angleStep = (2 * Math.PI) / 8; // 8 cadeiras
                const radius = 80; // Raio para posicionar as cadeiras ao redor da mesa

                mesas[mesaLetra].sort((a, b) => a.numero - b.numero).forEach((cadeira, index) => {
                    const cadeiraElement = document.createElement('div');
                    cadeiraElement.classList.add('cadeira');
                    cadeiraElement.dataset.id = cadeira.id;
                    cadeiraElement.dataset.mesa = cadeira.mesa;
                    cadeiraElement.dataset.numero = cadeira.numero;
                    cadeiraElement.textContent = `C${cadeira.numero}`;

                    if (cadeira.ocupado) {
                        cadeiraElement.classList.add('ocupada');
                        cadeiraElement.title = `Ocupada por: ${cadeira.convidado || 'Desconhecido'}`;
                    } else {
                        cadeiraElement.addEventListener('click', () => openModal(cadeira));
                    }

                    // Posicionar a cadeira ao redor da mesa
                    const angle = index * angleStep;
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    cadeiraElement.style.position = 'absolute';
                    cadeiraElement.style.left = `calc(50% + ${x}px - 20px)`; /* 20px = metade da largura da cadeira */
                    cadeiraElement.style.top = `calc(50% + ${y}px - 20px)`; /* 20px = metade da altura da cadeira */


                    mesaDiv.appendChild(cadeiraElement);
                });

                mesasContainer.appendChild(mesaDiv);
            }

        } catch (error) {
            console.error('Erro ao buscar cadeiras:', error);
            alert('Não foi possível carregar as informações das cadeiras. Tente novamente mais tarde.');
        }
    }

    // Abre o modal de reserva
    function openModal(cadeira) {
        cadeiraSelecionadaId = cadeira.id;
        cadeiraSelecionadaInfo.textContent = `${cadeira.mesa}${cadeira.numero}`;
        nomeConvidadoInput.value = ''; // Limpa o campo
        modalMessage.textContent = ''; // Limpa a mensagem de erro/sucesso
        modal.style.display = 'block';
    }

    // Fecha o modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Envia a reserva para o servidor
    reservaForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nomeConvidado = nomeConvidadoInput.value.trim();

        if (!nomeConvidado || !cadeiraSelecionadaId) {
            modalMessage.textContent = 'Por favor, preencha seu nome e selecione uma cadeira.';
            return;
        }

        try {
            const response = await fetch('/api/reservar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: cadeiraSelecionadaId, convidado: nomeConvidado })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                modal.style.display = 'none';
                fetchAndRenderCadeiras(); // Atualiza a lista de cadeiras
            } else {
                modalMessage.textContent = data.message || 'Erro ao reservar cadeira.';
            }
        } catch (error) {
            console.error('Erro ao enviar reserva:', error);
            modalMessage.textContent = 'Erro de conexão. Tente novamente.';
        }
    });

    // Carrega as cadeiras quando a página é carregada
    fetchAndRenderCadeiras();

    // Opcional: Atualizar a lista de cadeiras periodicamente (ex: a cada 10 segundos)
    // Isso simula uma atualização "em tempo real" sem WebSockets.
    // Para uma experiência em tempo real perfeita, WebSockets seriam melhores.
    // setInterval(fetchAndRenderCadeiras, 10000);
});