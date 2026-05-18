import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIOptimizationResult {
  titles: string[];
  description: string;
  tags: string[];
  justification: string;
}

export const optimizeProductContent = async (
  currentTitle: string, 
  currentDescription: string,
  category: string = "Geral"
): Promise<AIOptimizationResult> => {
  try {
    const prompt = `
      Atue como um especialista sênior em SEO e Copywriting para Mercado Livre Brasil.
      Sua tarefa é transformar um anúncio existente em algo ÚNICO e ALTAMENTE OTIMIZADO para SEO, evitando detecção de duplicidade pela plataforma.
      
      Título Atual: ${currentTitle}
      Descrição Atual: ${currentDescription}
      Categoria: ${category}
      
      REGRAS PARA O TÍTULO (MÁX 60 CARACTERES):
      1. Use a estrutura: [Produto] + [Marca] + [Modelo] + [Atributo Principal] + [Benefício/Uso].
      2. Mantenha as palavras-chave mais importantes (as que as pessoas pesquisam).
      3. Crie 3 variações com estruturas de frases diferentes.
      
      REGRAS PARA A DESCRIÇÃO:
      1. Torne-a 100% ÚNICA, não apenas um sinônimo. Use um tom profissional e persuasivo.
      2. Estruture com: Introdução curta, Lista de Benefícios (Bullets), Especificações Técnicas e FAQ rápido.
      3. Use linguagem que converte (Venda o valor, não apenas o objeto).
      4. Remova links, dados de contato ou referências a outros sites.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 variações de títulos otimizados para ML"
            },
            description: {
              type: Type.STRING,
              description: "Descrição otimizada e bem formatada"
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5 palavras-chave estratégicas"
            },
            justification: {
              type: Type.STRING,
              description: "Explicação breve de por que essas mudanças ajudam no SEO"
            }
          },
          required: ["titles", "description", "tags", "justification"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("AI Optimization Error:", error);
    throw error;
  }
};
