
// --- script.js V3: Robusto para Produção ---
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
inject();

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

    if (arquivoFoto) {
        try {
            console.log("Iniciando sanitização com limite de tempo...");

            // Corrida: Se o conversor demorar mais de 3s, ele pula pro 'catch'
            const fotoProcessada = await Promise.race([
                converterParaJpeg(arquivoFoto),
                new Promise((_, reject) => setTimeout(() => reject("Tempo esgotado"), 3000))
            ]);

            imgElemento.src = fotoProcessada;
        } catch (erro) {
            console.warn("Canvas falhou ou demorou. Usando backup.", erro);
            // Backup: Cria uma URL direta do arquivo sem converter
            imgElemento.src = URL.createObjectURL(arquivoFoto);
        }
        imgElemento.style.display = "block";
    }

    // --- TROCA DE TELAS (A MARRETA) ---
    // Forçamos o sumiço da entrada e o aparecimento do resultado
    const telaEntrada = document.getElementById('tela-entrada');
    const telaResultado = document.getElementById('resultado');

    if (telaEntrada) {
        telaEntrada.style.setProperty('display', 'none', 'important');
    }

    if (telaResultado) {
        const wrapper = document.getElementById('resultadoWrapper');
        wrapper.classList.remove('escondido');
    }
    // Configura botões (Igual antes)
    document.getElementById('btnWhatsapp').onclick = () => compartilharCartao(nomeMae, mensagem);
    document.getElementById('btnApoiar').onclick = () => document.getElementById('modalPix').classList.remove('escondido');
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
window.fecharModal = () => document.getElementById('modalPix').classList.add('escondido');