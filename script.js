
// 1. Primeiro, capturamos o formulário pelo ID que está no seu HTML
const formulario = document.getElementById('cardForm');

// 2. Agora o seu código vai entender o que é "formulario"
formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    // Captura os dados
    const nomeMae = document.getElementById('nomeMae').value;
    const estilo = document.getElementById('estilo').value;
    const tom = document.querySelector('input[name="tom"]:checked').value;
    // Captura o arquivo usando o novo ID do campo de upload
    const arquivoFoto = document.getElementById('fotoUpload').files[0];

    const botao = document.querySelector('.btn-gerar');
    botao.innerText = "✨ IA escrevendo...";
    botao.disabled = true;

    try {
    // Chamamos a NOSSA ponte em vez do Google
    const respostaServidor = await fetch('/api/gerar-cartao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeMae, estilo, tom })
    });

    const dados = await respostaServidor.json();
    
    if (dados.texto) {
        exibirCartao(nomeMae, dados.texto, arquivoFoto);
    } else {
        throw new Error("Erro na resposta");
    }

} catch (erro) {
    console.error("Erro:", erro);
    alert("Houve um erro ao gerar o cartão.");
}
});

// O segundo item aqui deve se chamar "mensagem" para combinar com o código lá de dentro
function exibirCartao(nomeMae, mensagem, arquivoFoto) {
    // 1. Esconde o que não precisa e mostra o resultado
    document.querySelector('.container').classList.add('hidden');
    document.querySelector('header').classList.add('hidden');
    document.getElementById('resultado').classList.remove('hidden');

    // 2. Coloca o texto da IA no cartão
    document.getElementById('poemaGerado').innerText = mensagem;

    // 3. Pega o elemento correto onde a foto vai aparecer
    const imgElemento = document.getElementById('fotoExibida');

    if (!imgElemento) {
        console.error("ERRO: O JavaScript não encontrou o elemento 'fotoExibida'.");
        return;
    }

    // 4. Lógica da Foto (Onde estava o erro)
    if (arquivoFoto) {
        // Se existe um arquivo, precisamos do FILEREADER para lê-lo
        const leitor = new FileReader();

        leitor.onload = function (e) {
            const campoImagem = document.getElementById('fotoExibida');
            imgElemento.style.display = "block";
        };

        leitor.readAsDataURL(arquivoFoto);
    } else {
        // Se a pessoa NÃO subiu foto, aí sim usamos a reserva
        imgElemento.src = "https://images.unsplash.com/photo-1522673607200-1648832cee98?w=500";
    }
    // Pega os botões
    const btnZap = document.getElementById('btnWhatsapp');

    // Prepara o texto para o link (remove espaços e caracteres especiais)
    const textoParaCompartilhar = window.encodeURIComponent(`Olha o cartão que fiz para você, ${nomeMae}: \n\n${mensagem}`);

    // Configura o link do WhatsApp
    btnZap.onclick = function () {
        const urlZap = `https://api.whatsapp.com/send?text=${textoParaCompartilhar}`;
        window.open(urlZap, '_blank');
    };
    // para fazer pagamentos por modalPix

    const btnApoiar = document.getElementById('btnApoiar');
    const modal = document.getElementById('modalPix');

    btnApoiar.onclick = () => modal.classList.remove('hidden');
    window.fecharModal = () => modal.classList.add('hidden');
}

async function compartilharCartao() {
    // 1. Pegamos a imagem que está no seu cartão (em formato Blob ou arquivo)
    const imagemElement = document.getElementById('fotoGerada'); // Onde a foto aparece no cartão
    
    try {
        // Transformamos a imagem do cartão em um arquivo real para o sistema
        const resposta = await fetch(imagemElement.src);
        const blob = await resposta.blob();
        const arquivo = new File([blob], 'cartao-mae.png', { type: blob.type });

        // 2. Verificamos se o navegador suporta compartilhamento de arquivos
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            await navigator.share({
                title: 'Cartão de Dia das Mães',
                text: `Olha o cartão que fiz para você! Gerado em: ${window.location.href}`, // Seu link automático
                files: [arquivo]
            });
        } else {
            // Caso o navegador seja antigo, fazemos o compartilhamento só de texto como backup
            window.open(`https://wa.me/?text=Olha o cartão que fiz no site: ${window.location.href}`);
        }
    } catch (err) {
        console.error("Erro ao compartilhar:", err);
    }
}
