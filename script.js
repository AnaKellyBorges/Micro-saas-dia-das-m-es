
// 1. Primeiro, capturamos o formulário pelo ID que está no seu HTML
const formulario = document.getElementById('cardForm');

formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    // Captura os dados
    const nomeMae = document.getElementById('nomeMae').value;
    const estilo = document.getElementById('estilo').value;
    const tom = document.querySelector('input[name="tom"]:checked').value;
    const arquivoFoto = document.getElementById('fotoUpload').files[0];

    const botao = document.querySelector('.btn-gerar');
    botao.innerText = "✨ IA escrevendo...";
    botao.disabled = true;

    try {
        // Chamada para a sua API na Vercel
        const respostaServidor = await fetch('/api/gerar-cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomeMae, estilo, tom })
        });

        // Verificação de erro para evitar o "Unexpected end of JSON"
        if (!respostaServidor.ok) throw new Error("Erro na comunicação com o servidor");

        const dados = await respostaServidor.json();
        
        if (dados.texto) {
            exibirCartao(nomeMae, dados.texto, arquivoFoto);
        } else {
            throw new Error("Erro na resposta");
        }

    } catch (erro) {
        console.error("Erro:", erro);
        alert("Houve um erro ao gerar o cartão. Tente novamente!");
    } finally {
        botao.innerText = "Gerar Cartão com IA";
        botao.disabled = false;
    }
});

function exibirCartao(nomeMae, mensagem, arquivoFoto) {
    // Esconde o formulário e mostra o resultado
    document.querySelector('.container').classList.add('hidden');
    document.querySelector('header').classList.add('hidden');
    document.getElementById('resultado').classList.remove('hidden');

    document.getElementById('poemaGerado').innerText = mensagem;

    const imgElemento = document.getElementById('fotoExibida');

    // CORREÇÃO DO BUG DA IMAGEM:
    if (arquivoFoto) {
        const leitor = new FileReader();
        leitor.onload = function (e) {
            // AQUI ESTAVA O ERRO: Faltava atribuir o resultado ao src
            imgElemento.src = e.target.result;
            imgElemento.style.display = "block";
        };
        leitor.readAsDataURL(arquivoFoto);
    } else {
        // Imagem padrão caso não envie foto
        imgElemento.src = "https://images.unsplash.com/photo-1522673607200-1648832cee98?w=500";
        imgElemento.style.display = "block";
    }

    // CONFIGURAÇÃO DO BOTÃO WHATSAPP (COM IMAGEM + LINK)
    const btnZap = document.getElementById('btnWhatsapp');
    btnZap.onclick = () => compartilharCartao(nomeMae, mensagem);

    // CONFIGURAÇÃO DO MODAL PIX
    const btnApoiar = document.getElementById('btnApoiar');
    const modal = document.getElementById('modalPix');

    btnApoiar.onclick = () => modal.classList.remove('hidden');
    window.fecharModal = () => modal.classList.add('hidden');
}

// FUNÇÃO DE COMPARTILHAR CORRIGIDA
async function compartilharCartao(nomeMae, mensagem) {
    const imagemElement = document.getElementById('fotoExibida'); // ID CORRIGIDO AQUI
    const linkSite = window.location.href;
    
    try {
        // 1. Prepara a imagem
        const resposta = await fetch(imagemElement.src);
        const blob = await resposta.blob();
        const arquivo = new File([blob], 'cartao-mae.png', { type: blob.type });

        // 2. Tenta o compartilhamento nativo (com foto e link)
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
            await navigator.share({
                title: `Cartão para ${nomeMae}`,
                text: `${mensagem}\n\nGerado em: ${linkSite}`,
                files: [arquivo]
            });
        } else {
            // Backup apenas texto se o navegador não suportar arquivos
            const textoZap = window.encodeURIComponent(`Olha o cartão que fiz para você, ${nomeMae}!\n\n${mensagem}\n\nCrie o seu em: ${linkSite}`);
            window.open(`https://api.whatsapp.com/send?text=${textoZap}`, '_blank');
        }
    } catch (err) {
        console.error("Erro ao compartilhar:", err);
        alert("Não foi possível compartilhar a imagem. Enviando apenas o link.");
        window.open(`https://api.whatsapp.com/send?text=Veja meu cartão: ${linkSite}`);
    }
}