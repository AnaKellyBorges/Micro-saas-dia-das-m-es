import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    // Só permite pedidos do tipo POST (envio de dados)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // Pega a chave que você vai cadastrar na Vercel
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { nomeMae, estilo, tom } = req.body;

    try {
        const prompt = `Escreva uma mensagem de Dia das Mães para ${nomeMae}. Ela gosta de ${estilo}. O tom deve ser ${tom}. Máximo 3 linhas.`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Devolve o texto para o seu site
        return res.status(200).json({ texto: text });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao gerar mensagem' });
    }
}