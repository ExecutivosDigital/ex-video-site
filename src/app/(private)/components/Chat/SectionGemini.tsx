"use client";
import { ScrollArea } from "@/components/scroll-area";
import { cn } from "@/lib/utils";
import { Mic, Send, X } from "lucide-react";
import Image from "next/image";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AudioPlayer } from "./AudioPlayer";
import { useFileHandler } from "./fileManipulation";
import { analyzeFile, useChatSession } from "./geminiai";
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
  const chatSessionRef = useRef<any | null>(null);
  useChatSession(chatSessionRef);
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
      appendMessage({ role: "user", content: text });
      appendMessage({ role: "assistant", content: "..." });
    }

    setLoading(true);
    const res = await chatSessionRef.current.sendMessage({ message: text });
    const reply = await res.text;
    setMessages((prev) =>
      prev.map((m) =>
        m.content === "..." ? { ...m, content: reply as string } : m,
      ),
    );
    setLoading(false);
  };
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
  return (
    <div className="h-[calc(100vh-80px)] w-full p-2 xl:h-[calc(100vh-112px)] xl:p-8">
      <div className="flex h-full w-full flex-col items-center justify-between gap-2 rounded-lg bg-[url('/image.png')] bg-cover bg-center bg-no-repeat p-2 xl:flex-row xl:gap-32 xl:p-32">
        <div className="h-2/5 w-full rounded-lg bg-white xl:h-full xl:w-[800px]">
          <iframe
            width="100%"
            height="100%"
            className="h-full w-full rounded-lg"
            src="https://www.youtube.com/embed/uaS75cHC3iU?si=ryeyLyGlW_Hc2ryO?&autoplay=1"
            title="YouTube video player"
            allow="autoplay"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
        <div className="flex h-full w-full flex-1 flex-col justify-end rounded-lg border border-zinc-500 p-2 xl:p-8">
          <div className="relative flex h-full w-full flex-col">
            <div
              className={cn(
                "absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center justify-center gap-4 transition duration-1000",
                isClicked
                  ? "-translate-y-5 xl:-translate-y-2/5"
                  : "translate-y-full",
              )}
            >
              <Image
                src="/logo-badge.png"
                alt=""
                width={1000}
                height={1000}
                className="shadow-primary h-10 w-10 rounded-full shadow-lg xl:h-32 xl:w-32"
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
              <ScrollArea className="h-full w-full pt-5 pb-2 xl:pt-0">
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
                          <span className="ml-auto w-max text-[10px] xl:text-base">
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
                              <div className="bg-re-500 h-5 w-5" />
                            </>
                          ) : message.type?.includes("audio") ? (
                            <AudioPlayer
                              className="ai z-[9999] flex-1"
                              size="default"
                              audioUrl={message.file as string}
                            />
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
                            <span className="text-xs font-semibold xl:text-base">
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
                      <div className="flex justify-start gap-2 text-start">
                        <Image
                          src="/logo-badge.png"
                          alt=""
                          width={250}
                          height={250}
                          className="h-6 w-6 rounded-full xl:h-10 xl:w-10"
                        />
                        <div className="flex flex-col text-white">
                          <span className="mr-auto w-max text-[10px] xl:text-base">
                            {message.role}
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
              </ScrollArea>
            </div>
          </div>
          <div className="flex w-full flex-row items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-500 px-4 py-2">
                    <div className="absolute flex h-full w-full items-center justify-center p-1 text-zinc-400">
                      <Image
                        src={"./pdf3.svg"}
                        alt=""
                        width={100}
                        height={100}
                        className="h-full w-full"
                      />
                    </div>
                    <input
                      className="z-[2] h-8 w-8 rounded-full opacity-0"
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
                  <button className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-500 px-4 py-2">
                    <div className="absolute flex h-full w-full items-center justify-center p-1">
                      <Image
                        src={"./photo3.svg"}
                        alt=""
                        width={100}
                        height={100}
                        className="h-full w-full"
                      />
                    </div>
                    <input
                      className="iz-[2] h-8 w-8 rounded-full opacity-0"
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
                  <p className="text-white">Imagem ou video</p>
                  <TooltipArrow className="fill-primary" />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <label
              onClick={() => setIsClicked(true)}
              className="flex h-11 w-full items-center rounded-lg border border-zinc-500 px-4 py-2"
            >
              {fileData && fileData.mimeType.startsWith("audio/") ? (
                <>
                  <AudioPlayer
                    className="ai flex-1"
                    size="default"
                    audioUrl={fileData.dataUrl}
                  />
                  <button
                    onClick={() => clearFileData()}
                    className="mr-2 ml-2 h-full rounded-full bg-zinc-500/20"
                  >
                    <X className="text-red-500" />
                  </button>
                </>
              ) : (
                <div className="flex flex-1 flex-row items-center gap-1">
                  <input
                    className="flex-1 border-none bg-transparent text-white outline-none placeholder:text-zinc-500 focus:outline-none"
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

              <div className="relative">
                <button
                  className="flex h-full w-full items-center gap-2 text-white"
                  disabled={loading}
                  onClick={() => {
                    if (fileData?.mimeType.startsWith("audio/")) {
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
                  {fileData?.mimeType.startsWith("audio/") ? (
                    <Send className="text-zinc-500" />
                  ) : isRecording ? (
                    <X className="text-zinc-500" />
                  ) : (
                    <Mic className="text-zinc-500" />
                  )}
                </button>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
