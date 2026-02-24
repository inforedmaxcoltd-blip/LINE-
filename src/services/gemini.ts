import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  score: number;
  summary: string;
  communicationStyle: string[];
  strengths: string[];
  areasForImprovement: string[];
  advice: string;
}

export async function analyzeLineChat(files: File[]): Promise<AnalysisResult> {
  const parts: any[] = [];

  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      parts.push({
        inlineData: {
          data: base64.split(',')[1],
          mimeType: file.type
        }
      });
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const text = await file.text();
      parts.push({ text: `--- Chat History File: ${file.name} ---\n${text}\n--- End of File ---` });
    }
  }

  parts.push({
    text: `あなたはプロの恋愛カウンセラー・人間関係のアナリストです。
提供されたLINEのトーク履歴（テキストまたはスクリーンショット画像）を分析し、二人の相性を診断してください。
特に直近7日間のやり取りのテンポ、言葉遣い、感情表現、話題のバランスなどに注目してください。

以下の情報をJSON形式で返してください：
- score: 相性スコア（0〜100の整数）
- summary: 全体的な相性の要約（200文字程度）
- communicationStyle: 二人のコミュニケーションスタイルの特徴（配列で2つの要素、それぞれの特徴を記載）
- strengths: この関係の強み・良いところ（3つ程度の配列）
- areasForImprovement: 改善点や注意すべき点（2つ程度の配列）
- advice: 今後のアドバイス（100文字程度）`
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0 to 100" },
          summary: { type: Type.STRING },
          communicationStyle: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Characteristics of each person's communication style"
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          areasForImprovement: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          advice: { type: Type.STRING }
        },
        required: ["score", "summary", "communicationStyle", "strengths", "areasForImprovement", "advice"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
