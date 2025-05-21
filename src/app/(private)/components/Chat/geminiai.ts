import { PostAPI } from "@/lib/axios";
import { Chat, GoogleGenAI, Part, Type } from "@google/genai";
import { useEffect, useRef } from "react";
import {
  PromptChatContext,
  PromptMediaAnalysisContext,
  initialHistory,
} from "./prompts";
import { FileData, ImagePart } from "./types";

const API_KEY = "AIzaSyBbx3wJVC5YYIXAyH000m777pblvlNtQWE";
const genAI = new GoogleGenAI({
  apiKey: API_KEY,
});

export const MediaAnalysis = async (
  prompt = "Explique a imagem ",
  imageParts: ImagePart[],
) => {
  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-pro-preview-05-06",
      contents: [prompt, ...imageParts],
      config: {
        systemInstruction: PromptMediaAnalysisContext,
      },
    });

    const response = result.text;

    const text = response;
    return text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: true, message: error.message };
    } else {
      return { error: true, message: "Unknown error" };
    }
  }
};

export function useChatSession(chatSessionRef: React.RefObject<Chat | null>) {
  const aiInstanceRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    // Só cria a instância do GoogleGenAI uma vez
    if (!aiInstanceRef.current) {
      aiInstanceRef.current = new GoogleGenAI({
        apiKey: API_KEY, // coloque sua chave em .env
      });
    }

    // Só cria a sessão de chat uma vez
    if (aiInstanceRef.current && !chatSessionRef.current) {
      chatSessionRef.current = aiInstanceRef.current.chats.create({
        model: "gemini-2.0-flash",
        config: {
          systemInstruction: PromptChatContext,
          tools: [
            {
              // Function declaration moved outside useEffect
              functionDeclarations: [createClientFunctionDeclaration()],
            },
          ],
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatSessionRef, initialHistory]);
}

export function makePrompt(fd: FileData) {
  const mt = fd.mimeType;
  if (mt.startsWith("image/")) return "Descreva detalhadamente a imagem";
  if (mt === "application/pdf")
    return "Por favor, extraia e resuma o conteúdo deste documento PDF.";
  if (mt.startsWith("audio/")) return "Transcreva o áudio perfeitamente.";
  if (mt.startsWith("video/")) return "Descreva detalhadamente o vídeo";
  return "Analise este arquivo e me dê um resumo:";
}

export async function analyzeFile(fd: FileData) {
  const prompt = makePrompt(fd);
  const payload = { inlineData: { mimeType: fd.mimeType, data: fd.base64 } };
  const result = await MediaAnalysis(prompt, [payload]);
  let message: string;
  const sendPrompt = `O seguinte texto é uma analise de um arquivo de ${fd.mimeType} que eu enviei para nossa outra ai analisar, leve em consideração isso e interprete que o seguinte texto é o conteúdo de um ${fd.mimeType} que eu acabei de mandar. Texto do arquivo: `;
  if (typeof result === "object" && result.error) {
    message = sendPrompt + result.message;
  } else {
    message = sendPrompt + result;
  }
  return await message;
}

// Define the actual logic for the function call
const executeCreateClient = async (args: {
  name: string;
  phone: string;
  summary: string;
  email: string;
}) => {
  const connect = await PostAPI("/lead", {
    name: args.name,
    phone: args.phone,
    aiChat: args.summary,
    email: args.email,
    boardId: "72c955f3-d6d0-4843-9067-fd4889ff37a1",
  });

  console.log("connect: ", connect);

  if (connect.status === 201) {
    return {
      status: "success",
      clientName: args.name,
      message: "Client creation process initiated.",
    };
  }
};

// Function to handle incoming function calls from the model
export const handleFunctionCalls = async (
  // TODO: Type functionCalls more specifically if possible, maybe protos.google.cloud.aiplatform.v1.FunctionCall[]
  functionCalls: { name: string; args: any; toolCallId: string }[], // Basic type based on usage
  chatSession: Chat,
): Promise<string> => {
  const toolResponses: Part[] = []; // Array of Part objects for tool responses
  for (const fnCall of functionCalls) {
    const { name, args } = fnCall;
    let result: any;
    let responseContent: any;

    try {
      if (name === "createClient") {
        // Execute the function logic
        result = await executeCreateClient(args);
        // Prepare the response content for the model
        // The model expects the actual output data within the 'response' key
        // The SDK examples typically show just an 'output' key here.
        responseContent = { output: JSON.stringify(result) };
      } else {
        // Handle unknown function calls
        result = { error: true, message: `Unknown function call: ${name}` };
        responseContent = { toolCode: 1, output: JSON.stringify(result) }; // Use non-zero for error
      }
    } catch (error: any) {
      result = {
        error: true,
        message: `Error executing ${name}: ${error.message}`,
      };
      responseContent = { toolCode: 1, output: JSON.stringify(result) };
    }

    // Construct the Part object for the tool response
    toolResponses.push({
      functionResponse: {
        id: fnCall.toolCallId,
        name: fnCall.name,
        response: responseContent,
      },
    });
  }

  // Send the tool responses back to the model and get the final text response
  // The sendMessage method expects an array of Part objects
  const response = await chatSession.sendMessage({
    message: toolResponses,
  });
  return response.text || "No text response received after tool execution."; // Return text or a default message
};

const createClientFunctionDeclaration = () => {
  return {
    name: "createClient",
    description:
      "Create client after finishing the conversation and get the contact info",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: {
          type: Type.STRING,
          description: "name of the client",
        },
        phone: {
          type: Type.STRING,
          description: "phone number of the client",
        },
        summary: {
          type: Type.STRING,
          description: "summary of the conversation",
        },
        email: {
          type: Type.STRING,
          description: "email of the client",
        },
      },
      required: ["name", "phone", "summary", "email"], // <-- Deve ser assim
    },
  };
};
