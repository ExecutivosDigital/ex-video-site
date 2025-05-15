"use client";
import { ScrollArea } from "@/components/scroll-area";
import { cn } from "@/lib/utils";
import { handleSendStreamMessage } from "@/utils/chatFunctions";
import { Mic } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
}

export function Section() {
  const [isClicked, setIsClicked] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isMessageLoading, setIsMessageLoading] = useState(false);

  const handleSendMessageWrapper = () => {
    handleSendStreamMessage({
      assistantId: "asst_6H1bh5CBexvvyurVFmWOWBJL",
      inputMessage,
      threadId: threadId,
      setMessages: setMessages,
      setThreadId: setThreadId,
      setIsMessageLoading: setIsMessageLoading,
      isStream: true,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSendMessageWrapper();
      setInputMessage("");
    }
  };

  //   const handleUploadAudio = async (file: File) => {
  //     console.log("entrou");
  //     const formData = new FormData();
  //     const sanitizedFileName = file.name.replace(/\s+/g, "-");
  //     formData.append("file", file, sanitizedFileName);
  //     console.log("formData", formData);
  //     console.log("file", file);
  //     const test = await transcription(formData);
  //     console.log("test", test);
  //   };

  //   async function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
  //     const selectedFile = e.target.files?.[0];

  //     if (!selectedFile) {
  //       return;
  //     }
  //     const url = await handleUploadAudio(selectedFile);
  //     if (url) {
  //       console.log("URL:", url);
  //     }
  //   }

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
                  <span className="text-primary">ESCOPO</span>E
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
              <ScrollArea className="h-full w-full pt-5 xl:pt-0">
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
                          <span className="text-xs font-semibold xl:text-base">
                            {message.content}
                          </span>
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
                          <span className="text-xs font-semibold xl:text-base">
                            {message.content}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          <label
            onClick={() => setIsClicked(true)}
            className="flex w-full items-center rounded-lg border border-zinc-500 px-4 py-2"
          >
            <input
              disabled={isMessageLoading}
              className="flex-1 border-none bg-transparent text-white outline-none placeholder:text-zinc-500 focus:outline-none"
              placeholder="Digite aqui sua ideia"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="relative">
              <input
                className="absolute h-full w-full opacity-0"
                // disabled={isUploading}
                type="file"
                id="fileInput"
                accept=".m4a"
              />
              <Mic className="text-zinc-500" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
