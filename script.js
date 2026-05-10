
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY); // Isso é para back-end
const genAI = new GoogleGenerativeAI(API_KEY);
const modelo = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
        const prompt = `Escreva uma mensagem de Dia das Mães para ${nomeMae}. Ela gosta de ${estilo}. O tom deve ser ${tom}. Máximo 3 linhas.`;

        // Chamada direta para o modelo que definimos no topo
        const resultadoIA = await modelo.generateContent(prompt);
        const resposta = await resultadoIA.response;
        const textoGerado = resposta.text();

        exibirCartao(nomeMae, textoGerado, arquivoFoto);

    } catch (erro) {
        console.error("Erro detalhado:", erro);
        alert("A IA teve um probleminha. Verifique sua chave ou conexão.");
    } finally {
        botao.disabled = false;
        botao.innerText = "Gerar Cartão com IA";
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
            imgElemento.src = e.target.result; // Aqui a foto aparece!
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

