
const formulario = document.getElementById('cardForm');

formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const nomeMae = document.getElementById('nomeMae').value;
    const estilo = document.getElementById('estilo').value;
    const tom = document.querySelector('input[name="tom"]:checked').value;
    const arquivoFoto = document.getElementById('fotoUpload').files[0];

    const botao = document.querySelector('.btn-gerar');
    botao.innerText = "✨ IA escrevendo...";
    botao.disabled = true;

    try {
        // 1. Chamada para a API na Vercel
        const respostaServidor = await fetch('/api/gerar-cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomeMae, estilo, tom })
        });

        if (!respostaServidor.ok) throw new Error("Erro na API");

        const dados = await respostaServidor.json();
        
        if (dados.texto) {
            // 2. Chama a exibição (a conversão de foto acontece lá dentro agora)
            await exibirCartao(nomeMae, dados.texto, arquivoFoto);
        }

    } catch (erro) {
        console.error("Erro geral:", erro);
        alert("Houve um erro. Verifique sua conexão e tente novamente.");
    } finally {
        botao.innerText = "Gerar Cartão com IA";
        botao.disabled = false;
    }
});

// FUNÇÃO DE EXIBIÇÃO (Com conversor embutido e seguro)
async function exibirCartao(nomeMae, mensagem, arquivoFoto) {
    const imgElemento = document.getElementById('fotoExibida');
    const poemaElemento = document.getElementById('poemaGerado');

    poemaElemento.innerText = mensagem;

    // Tentativa de processar a foto
    if (arquivoFoto) {
        try {
            console.log("Iniciando conversão de imagem...");
            const fotoConvertida = await converterParaJpeg(arquivoFoto);
            imgElemento.src = fotoConvertida;
            imgElemento.style.display = "block";
        } catch (e) {
            console.warn("Falha na conversão, usando imagem padrão", e);
            imgElemento.src = "https://images.unsplash.com/photo-1522673607200-1648832cee98?w=500";
            imgElemento.style.display = "block";
        }
    } else {
        imgElemento.src = "https://images.unsplash.com/photo-1522673607200-1648832cee98?w=500";
        imgElemento.style.display = "block";
    }

    // Mostra o resultado
    document.querySelector('.container').classList.add('hidden');
    document.querySelector('header').classList.add('hidden');
    document.getElementById('resultado').classList.remove('hidden');

    // Configura botões
    document.getElementById('btnWhatsapp').onclick = () => compartilharCartao(nomeMae, mensagem);
    document.getElementById('btnApoiar').onclick = () => document.getElementById('modalPix').classList.remove('hidden');
}

// FUNÇÃO DE COMPARTILHAR
async function compartilharCartao(nomeMae, mensagem) {
    const imagemElement = document.getElementById('fotoExibida');
    const linkSite = window.location.href;
    
    try {
        const resposta = await fetch(imagemElement.src);
        const blob = await resposta.blob();
        const arquivo = new File([blob], 'cartao.jpg', { type: 'image/jpeg' });

        if (navigator.share && navigator.canShare({ files: [arquivo] })) {
            await navigator.share({
                title: `Cartão para ${nomeMae}`,
                text: `${mensagem}\n\nCrie o seu em: ${linkSite}`,
                files: [arquivo]
            });
        } else {
            const textoZap = window.encodeURIComponent(`Olha o cartão que fiz para você!\n\n${mensagem}\n\nLink: ${linkSite}`);
            window.open(`https://api.whatsapp.com/send?text=${textoZap}`, '_blank');
        }
    } catch (err) {
        window.open(`https://api.whatsapp.com/send?text=Veja meu cartão: ${linkSite}`);
    }
}

// FUNÇÃO TRABALHADORA: CONVERSOR (A que resolve o bug do JPG/iPhone)
function converterParaJpeg(arquivo) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Redimensiona para não travar o celular (max 800px)
                const escala = Math.min(1, 800 / Math.max(img.width, img.height));
                canvas.width = img.width * escala;
                canvas.height = img.height * escala;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        leitor.onerror = reject;
        leitor.readAsDataURL(arquivo);
    });
}

// Global para fechar o modal
window.fecharModal = () => document.getElementById('modalPix').classList.add('hidden');