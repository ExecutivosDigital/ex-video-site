"use client";
import { ScrollArea } from "@/components/scroll-area";
import { cn } from "@/lib/utils";
import { Mic, Send, Square, X } from "lucide-react";
import Image from "next/image";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AudioPlayer } from "./AudioPlayer"; // Assuming this is a local component
import { useFileHandler } from "./fileManipulation";
import { analyzeFile, handleFunctionCalls, useChatSession } from "./geminiai";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Message } from "./types";

export function Section() {
  const [isClicked, setIsClicked] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const {
    fileData,
    handleFileUpload,
    startRecording,
    stopRecording,
    clearFileData,
    isRecording,
    elapsedTime,
  } = useFileHandler();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatSessionRef = useRef<any | null>(null); // TODO: Type this as GoogleGenerativeAI.ChatSession
  useChatSession(chatSessionRef);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appendMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);
  const handleSendFile = async () => {
    if (!fileData) return;
    appendMessage({
      role: "user",
      content: "Arquivo enviado " + fileData.mimeType,
      file: fileData.dataUrl,
      type: fileData.mimeType,
      name: fileData.name,
    });
    appendMessage({
      role: "assistant",
      content: "...",
    });
    setLoading(true);
    if (fileData.mimeType.startsWith("audio/")) {
      clearFileData();
    }
    clearFileData();
    const response = await analyzeFile(fileData);
    sendMessage(response, true);
    setLoading(false);
    clearFileData();
  };

  const sendMessage = async (text: string, isFile?: boolean) => {
    setInputMessage("");
    if (!isFile) {
      // Append user message
      appendMessage({ role: "user", content: text });
      // Append assistant placeholder message immediately
      appendMessage({ role: "assistant", content: "..." });
    }

    setLoading(true);

    try {
      const initialResponse = await chatSessionRef.current.sendMessage({
        message: text,
      });

      console.log("Initial API Response:", initialResponse);

      let replyText = "";

      if (
        initialResponse.functionCalls &&
        initialResponse.functionCalls.length > 0
      ) {
        console.log("Function calls received, handling...");
        // Delegate function call handling to geminiai.ts
        // handleFunctionCalls sends the tool response and waits for the model's text reply
        replyText = await handleFunctionCalls(
          initialResponse.functionCalls,
          chatSessionRef.current,
        );
      } else if (initialResponse.text) {
        // If no function calls, use the direct text response
        replyText = initialResponse.text;
      } else {
        // Handle cases with no text or function calls (unexpected)
        console.warn(
          "Received response with no text or function calls:",
          initialResponse,
        );
        replyText = "Received an unexpected response from the AI.";
      }

      // Update the last message (the placeholder "...") with the actual reply
      // Find the last message that is the placeholder and update it
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastPlaceholderIndex = newMessages.findLastIndex(
          (m) => m.content === "...",
        );
        if (lastPlaceholderIndex !== -1) {
          newMessages[lastPlaceholderIndex] = {
            ...newMessages[lastPlaceholderIndex],
            content: replyText as string,
          };
        } else {
          // Fallback: just append the reply if placeholder not found (shouldn't happen with current logic)
          newMessages.push({ role: "assistant", content: replyText as string });
        }
        return newMessages;
      });
    } catch (error: any) {
      console.error("Error sending message or handling response:", error);
      // Find and update the specific placeholder message with an error
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastPlaceholderIndex = newMessages.findLastIndex(
          (m) => m.content === "...",
        );
        const errorMessage = `Error: ${error.message || "An unknown error occurred."}`;
        if (lastPlaceholderIndex !== -1) {
          newMessages[lastPlaceholderIndex] = {
            ...newMessages[lastPlaceholderIndex],
            content: errorMessage,
          };
        } else {
          // Fallback: just append the error if placeholder not found
          newMessages.push({ role: "assistant", content: errorMessage });
        }
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  // Old update logic - replaced by the logic inside the try/catch/finally block
  /*
  setMessages((prev) =>
      prev.map((m) =>
        m.content === "..." ? { ...m, content: reply as string } : m,
      ),
    );
    setLoading(false);
  };
  */
  useEffect(() => {
    if (fileData) {
      if (fileData.mimeType.startsWith("audio/")) {
        return;
      } else {
        handleSendFile();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData]);
  useEffect(() => {
    setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          content: "Olá, como posso ajudar?",
        },
      ]);
      setIsClicked(true);
    }, 5000);
  }, []);
  useEffect(() => {
    console.log("aqui", isRecording);
  }, [isRecording]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const [isVideoStarted, setIsVideoStarted] = useState(false);

  const handleVideoStart = (
    event: React.SyntheticEvent<HTMLVideoElement, Event>,
  ) => {
    const videoElement = event.target as HTMLVideoElement;

    // Verifica se o vídeo está carregado e começou a tocar
    if ((videoElement as HTMLVideoElement).currentTime > 0) {
      setIsVideoStarted(true);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] w-full p-2 2xl:h-[calc(100vh-112px)] 2xl:p-8">
      <div className="relative flex h-full w-full flex-col items-center justify-between gap-2 rounded-lg bg-[url('/image.png')] bg-cover bg-center bg-no-repeat p-2 lg:flex-row lg:gap-4 lg:p-4 xl:p-8 2xl:gap-20 2xl:p-20">
        <div className="absolute left-0 h-full w-full rounded-lg bg-black/50" />
        <div className="3xl:w-[800px] z-10 h-2/5 w-full rounded-lg lg:h-full lg:w-[400px] 2xl:w-[600px]">
          <video
            className="h-full w-full rounded-lg object-cover"
            src={"/VSL.mov"}
            autoPlay
            playsInline
            preload="auto"
            muted
            loop
            onTimeUpdate={handleVideoStart} // Garante que a variável muda ao reproduzir
          />
        </div>
        <div className="z-10 flex h-full w-full flex-1 flex-col justify-end rounded-lg border border-zinc-500 p-2 2xl:p-8">
          <div className="relative flex h-full w-full flex-col">
            <div
              className={cn(
                "absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center justify-center gap-4 transition duration-1000",
                isClicked
                  ? "-translate-y-5 2xl:-translate-y-2/5"
                  : "translate-y-1/2",
              )}
            >
              <Image
                src="/logo-badge.png"
                alt=""
                width={1000}
                height={1000}
                className="shadow-primary h-10 w-10 rounded-full shadow-lg lg:h-14 lg:w-14 2xl:h-32 2xl:w-32"
              />
              <div
                className={cn(
                  "flex flex-col items-center gap-2 transition duration-500",
                  isClicked ? "opacity-0" : "opacity-100",
                )}
              >
                <span className="flex items-center gap-2 text-base font-bold text-white xl:text-4xl">
                  SEU
                  <span className="text-primary">ESCOPO</span>
                  <span className="text-primary">ORÇAMENTO</span>
                </span>
                <span className="text-xs font-bold text-white xl:text-2xl">
                  UTILIZANDO NOSSA IA
                </span>
              </div>
            </div>
            <div
              className={cn(
                "absolute top-0 left-0 h-full w-full transition delay-500 duration-300",
                isClicked ? "opacity-100" : "opacity-0",
              )}
            >
              <ScrollArea className="h-full w-full flex-col pt-5 pb-2 xl:pt-0">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-2 self-end",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "user" ? (
                      <div className="flex justify-end gap-2 text-end">
                        <div className="flex flex-col text-white">
                          <span className="ml-auto w-max text-[10px] 2xl:text-base">
                            Eu
                          </span>
                          {message.type?.includes("image") ? (
                            <>
                              <Image
                                src={message.file as string}
                                alt=""
                                width={2500}
                                height={2500}
                                className="h-40 w-auto rounded-md"
                              />
                              <div className="h-5 w-5" />
                            </>
                          ) : message.type?.includes("audio") ? (
                            <div className="flex p-2">
                              <AudioPlayer
                                className="ai z-[9999] flex-1"
                                size="default"
                                audioUrl={message.file as string}
                              />
                            </div>
                          ) : message.type?.includes("video") ? (
                            <video
                              src={message.file as string}
                              controls
                              className="h-60 rounded-md"
                            />
                          ) : message.type?.includes("pdf") ? (
                            <a
                              href={message.file as string}
                              download
                              className="flex flex-col items-center gap-1"
                            >
                              <Image
                                src={"./pdf3.svg"}
                                alt=""
                                width={100}
                                height={100}
                                className="h-12 w-12"
                              />
                              <span>{message.name}</span>
                            </a>
                          ) : (
                            <span className="text-xs lg:text-base">
                              {message.content}
                            </span>
                          )}
                        </div>
                        <Image
                          src="/logo-badge.png"
                          alt=""
                          width={250}
                          height={250}
                          className="h-6 w-6 rounded-full xl:h-10 xl:w-10"
                        />
                      </div>
                    ) : (
                      <div className="my-4 flex justify-start gap-2 text-start">
                        <Image
                          src="/logo-badge.png"
                          alt=""
                          width={250}
                          height={250}
                          className="h-6 w-6 rounded-full xl:h-10 xl:w-10"
                        />
                        <div className="flex flex-col text-[10px] text-white 2xl:text-base">
                          <span className="mr-auto w-max">
                            Executivo&apos;s Digital
                          </span>
                          {message.content === "..." ? (
                            <div className="mt-2 flex items-center justify-center space-x-2">
                              <span className="sr-only">...</span>
                              <div className="border-primary h-2 w-2 animate-bounce rounded-full border bg-black [animation-delay:-0.3s]"></div>
                              <div className="border-primary h-2 w-2 animate-bounce rounded-full border bg-black [animation-delay:-0.15s]"></div>
                              <div className="border-primary h-2 w-2 animate-bounce rounded-full border bg-black"></div>
                            </div>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </ScrollArea>
            </div>
          </div>
          <div className="flex w-full flex-row items-center gap-1">
            <div className="flex flex-row items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="relative flex h-10 w-6 items-center justify-center overflow-hidden rounded-lg border border-zinc-500 p-0.5 md:h-8 2xl:h-11 2xl:w-11">
                      <Image
                        src={"./pdf3.svg"}
                        alt=""
                        width={100}
                        height={100}
                        className="h-full w-full"
                      />
                      <input
                        className="absolute top-0 left-0 z-[2] h-full w-full opacity-0"
                        type="file"
                        accept="application/pdf*"
                        onChange={(e) => handleFileUpload(e)}
                        disabled={loading || !!fileData}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="border-primary border bg-black"
                  >
                    <p className="text-white">PDF</p>
                    <TooltipArrow className="fill-primary" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="relative flex h-10 w-6 items-center justify-center rounded-lg border border-zinc-500 p-0.5 md:h-8 2xl:h-11 2xl:w-11">
                      <Image
                        src={"./photo3.svg"}
                        alt=""
                        width={100}
                        height={100}
                        className="h-full w-full"
                      />
                      <input
                        className="iz-[2] absolute top-0 left-0 h-full w-full rounded-full opacity-0"
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => handleFileUpload(e)}
                        disabled={loading || !!fileData}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="border-primary border bg-black"
                  >
                    <p className="text-white">Imagem ou Vídeo</p>
                    <TooltipArrow className="fill-primary" />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <label
              onClick={() => setIsClicked(true)}
              className="flex h-10 w-full flex-1 items-center justify-between overflow-hidden rounded-lg border border-zinc-500 pl-2 md:h-8 2xl:h-11 2xl:pr-2 2xl:pl-4"
            >
              {fileData && fileData.mimeType.startsWith("audio/") ? (
                <>
                  <AudioPlayer
                    className="ai h-5 max-h-5 flex-1 2xl:h-8"
                    size="default"
                    audioUrl={fileData.dataUrl}
                  />
                  <button onClick={() => clearFileData()}>
                    <X className="h-4 text-red-500 2xl:h-8" />
                  </button>
                </>
              ) : (
                <div className="flex max-w-[60%] flex-1 flex-row items-center gap-1">
                  <input
                    className="flex-1 border-none text-[16px] text-white outline-none placeholder:text-zinc-500 focus:outline-none md:text-[12px] 2xl:text-base"
                    placeholder="Digite aqui sua ideia"
                    disabled={isRecording || loading}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(inputMessage);
                        setInputMessage("");
                      }
                    }}
                  />
                </div>
              )}

              <button
                className="flex h-full items-center gap-2 text-white"
                disabled={loading}
                onClick={() => {
                  if (inputMessage !== "") {
                    sendMessage(inputMessage);
                  } else if (fileData?.mimeType.startsWith("audio/")) {
                    console.log("entrou");
                    handleSendFile();
                  } else if (isRecording) {
                    console.log("entrou2");
                    stopRecording();
                  } else {
                    console.log("entrou3");
                    startRecording();
                  }
                }}
              >
                {isRecording && elapsedTime}
                {inputMessage !== "" ? (
                  <Send className="h-4 text-zinc-500 2xl:h-8" />
                ) : fileData?.mimeType.startsWith("audio/") ? (
                  <Send className="h-4 text-zinc-500 2xl:h-8" />
                ) : isRecording ? (
                  <Square className="h-4 text-zinc-500 2xl:h-8" />
                ) : (
                  <Mic className="h-4 text-zinc-500 2xl:h-8" />
                )}
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
