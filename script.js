
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

// Nova versão da função com 'async' para poder esperar a imagem
async function exibirCartao(nomeMae, mensagem, arquivoFoto) {
    
    // 1. Pegamos os elementos
    const containerForm = document.querySelector('.container');
    const header = document.querySelector('header');
    const secaoResultado = document.getElementById('resultado');
    const poemaElemento = document.getElementById('poemaGerado');
    const imgElemento = document.getElementById('fotoExibida');

    // 2. Colocamos o texto (isso é rápido)
    poemaElemento.innerText = mensagem;

    // 3. Lógica da Foto (Ajustada para Celular)
   // Dentro de exibirCartao...
if (arquivoFoto) {
    try {
        // O código vai parar aqui, converter a foto e guardar o resultado em 'fotoLimpa'
        const fotoLimpa = await converterParaJpeg(arquivoFoto);
        
        imgElemento.src = fotoLimpa; // Usa a versão convertida e leve
        imgElemento.style.display = "block";
    } catch (erro) {
        console.error("Erro ao converter:", erro);
        imgElemento.src = "https://images.unsplash.com/photo-1522673607200-1648832cee98?w=500";
    }
} else {
        // Imagem padrão se não houver upload
        imgElemento.src = "https://images.unsplash.com/photo-1522673607200-1648832cee98?w=500";
        imgElemento.style.display = "block";
    }

    // 4. SÓ AGORA mostramos o resultado na tela
    // Isso garante que quando o cartão aparecer, a foto já estará lá.
    containerForm.classList.add('hidden');
    header.classList.add('hidden');
    secaoResultado.classList.remove('hidden');

    // 5. Configurações dos botões (PIX, Zap, etc) - Igual antes
    const btnZap = document.getElementById('btnWhatsapp');
    btnZap.onclick = () => compartilharCartao(nomeMae, mensagem);

    const btnApoiar = document.getElementById('btnApoiar');
    const modal = document.getElementById('modalPix');
    btnApoiar.onclick = () => modal.classList.remove('hidden');
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

async function converterParaJpeg(arquivo) {
    return new Promise((resolve) => {
        const leitor = new FileReader();
        leitor.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Criamos um canvas (palco invisível)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Redimensionamos para não ficar pesado (máximo 1080px)
                let largura = img.width;
                let altura = img.height;
                const max = 1080;

                if (largura > altura && largura > max) {
                    altura *= max / largura;
                    largura = max;
                } else if (altura > max) {
                    largura *= max / altura;
                    altura = max;
                }

                canvas.width = largura;
                canvas.height = altura;

                // Desenhamos a imagem no canvas
                ctx.drawImage(img, 0, 0, largura, altura);

                // Convertemos para JPEG com 80% de qualidade
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.src = e.target.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}