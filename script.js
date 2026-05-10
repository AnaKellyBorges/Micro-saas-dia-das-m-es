
// --- script.js V3: Robusto para Produção ---
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
        const respostaServidor = await fetch('/api/gerar-cartao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomeMae, estilo, tom })
        });

        if (!respostaServidor.ok) throw new Error("Erro na API");

        const dados = await respostaServidor.json();
        
        if (dados.texto) {
            // Chamamos a exibição com 'await' para segurar o loading
            await exibirCartao(nomeMae, dados.texto, arquivoFoto);
        }

    } catch (erro) {
        console.error("Erro geral:", erro);
        alert("Ops, algo deu errado. Tente novamente em breve.");
    } finally {
        botao.innerText = "Gerar Cartão com IA";
        botao.disabled = false;
    }
});

async function exibirCartao(nomeMae, mensagem, arquivoFoto) {
    const imgElemento = document.getElementById('fotoExibida');
    const poemaElemento = document.getElementById('poemaGerado');

    poemaElemento.innerText = mensagem;

    // LÓGICA DE FOTO RESILIENTE V3
    if (arquivoFoto) {
        // Plano A: Tentar o Conversor/Canvas (Limpa CMYK, orienta, comprime)
        try {
            console.log("Tentando sanitização via Canvas...");
            const fotoSanificada = await converterParaJpegResiliente(arquivoFoto);
            if (fotoSanificada && fotoSanificada.length > 100) { // Verifica se não voltou vazio
                imgElemento.src = fotoSanificada;
            } else {
                throw new Error("Canvas falhou ou voltou vazio");
            }
        } catch (error) {
            // Plano B: Backup Rápido (URL.createObjectURL)
            // Se o canvas travar (comum em JPG de 10MB+ no iOS), usamos o arquivo bruto
            console.warn("Canvas bloqueado ou falhou, usando backup bruto.", error);
            const urlTemporaria = URL.createObjectURL(arquivoFoto);
            imgElemento.src = urlTemporaria;
            
            // Gerencia memória: Revoga a URL quando carregar
            imgElemento.onload = () => URL.revokeObjectURL(urlTemporaria);
        }
    } else {
        // Plano C: Imagem padrão
        imgElemento.src = "https://images.unsplash.com/photo-1522673607200-1648832cee98?w=500";
    }

   // 1. Esconde com força total a área do formulário e o cabeçalho
const containerForm = document.querySelector('.container');
const header = document.querySelector('header');

if (containerForm) {
    containerForm.style.display = 'none'; // Remove do layout
}
if (header) {
    header.style.display = 'none'; // Remove do layout
}

// 2. Mostra a seção de resultado
const secaoResultado = document.getElementById('resultado');
if (secaoResultado) {
    secaoResultado.classList.remove('hidden');
    secaoResultado.style.display = 'block'; // Garante que apareça
}

    // Configura botões (Igual antes)
    document.getElementById('btnWhatsapp').onclick = () => compartilharCartao(nomeMae, mensagem);
    document.getElementById('btnApoiar').onclick = () => document.getElementById('modalPix').classList.remove('hidden');
}

// CONVERSOR RESILIENTE (Com tratamento de erro rigoroso)
function converterParaJpegResiliente(arquivo) {
    return new Promise((resolve, reject) => {
        // Tempo limite de 5 segundos para não travar o site
        const timeout = setTimeout(() => reject("Tempo limite de conversão excedido"), 5000);

        const leitor = new FileReader();
        leitor.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                clearTimeout(timeout); // Limpa o tempo limite se der certo
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Redimensiona agressivamente para garantir que o Canvas abra no celular (max 600px)
                const escala = Math.min(1, 600 / Math.max(img.width, img.height));
                canvas.width = img.width * escala;
                canvas.height = img.height * escala;

                // Tenta desenhar. Se falhar aqui, o 'catch' da exibirCartao pega.
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Qualidade baixa (0.6) para garantir leveza
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => { clearTimeout(timeout); reject("Erro ao carregar Image()"); };
            img.src = e.target.result;
        };
        leitor.onerror = () => { clearTimeout(timeout); reject("Erro no FileReader"); };
        leitor.readAsDataURL(arquivo);
    });
}

// (Função compartilharCartao e fecharModal continuam iguais)
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
window.fecharModal = () => document.getElementById('modalPix').classList.add('hidden');