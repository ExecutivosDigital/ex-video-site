import { ChangeEvent, useEffect, useRef, useState } from "react";

type FileData = {
  dataUrl: string;
  base64: string;
  mimeType: string;
  name?: string;
};

export function useFileHandler() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const chunksRef = useRef<Blob[]>([]);

  /* ---------- utilidades ---------- */
  const fileToBase64 = (file: File): Promise<FileData> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const [, base64] = reader.result.split(",");
          resolve({ dataUrl: reader.result, base64, mimeType: file.type });
        } else reject(new Error("Unexpected format"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const pickMimeType = () => {
    if (typeof MediaRecorder === "undefined") return undefined;
    const prefer = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/aac",
    ];
    return prefer.find(MediaRecorder.isTypeSupported);
  };

  const clearFileData = () => setFileData(null);

  /* ---------- upload manual ---------- */
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size >= 20_000_000) return;
    const fd = await fileToBase64(file);
    setFileData({ ...fd, name: file.name });
    e.target.value = "";
  };

  /* ---------- timer estilo gravador ---------- */
  useEffect(() => {
    if (!isRecording || !recordStartTime) return;
    const id = setInterval(() => {
      const delta = Math.floor((Date.now() - recordStartTime) / 1000);
      const mm = String(Math.floor(delta / 60)).padStart(2, "0");
      const ss = String(delta % 60).padStart(2, "0");
      setElapsedTime(`${mm}:${ss}`);
    }, 200);
    return () => clearInterval(id);
  }, [isRecording, recordStartTime]);

  /* ---------- gravação ---------- */
  const startRecording = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("getUserMedia indisponível");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const rec = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];

      rec.ondataavailable = (e) =>
        e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType ?? "audio/webm",
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const [, b64] = result.split(",");
          setFileData({ dataUrl: result, base64: b64, mimeType: blob.type });
        };
        reader.readAsDataURL(blob);
        /* libera o microfone */
        stream.getTracks().forEach((t) => t.stop());
      };

      rec.start();
      setMediaRecorder(rec);
      setIsRecording(true);
      setRecordStartTime(Date.now());
      return true;
    } catch (err) {
      console.error("Falha ao iniciar gravação:", err);
      return false; // sinaliza para o componente se quiser mostrar toast/alerta
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    setRecordStartTime(null);
    setElapsedTime("00:00");
  };

  const cancelRecording = () => {
    if (mediaRecorder?.state === "recording") mediaRecorder.stop();
    chunksRef.current = [];
    clearFileData();
    setIsRecording(false);
    setElapsedTime("00:00");
  };

  /* ---------- retorno ---------- */
  return {
    /* dados */
    fileData,
    elapsedTime,
    isRecording,
    /* ações externas */
    handleFileUpload,
    startRecording,
    stopRecording,
    cancelRecording,
    clearFileData,
  };
}
