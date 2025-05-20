"use client";
import Image from "next/image";

export function Header() {
  return (
    <div className="flex h-20 w-full items-center justify-between border-b border-b-zinc-200 px-4 xl:h-28 xl:px-8">
      <span className="font-manrope hidden text-2xl font-bold xl:block">
        SOLUÇÕES SOB MEDIDA
      </span>
      <Image
        src="/dark-logo.png"
        alt=""
        width={1000}
        height={500}
        className="h-16 w-max object-contain xl:h-20"
      />
      <button
        onClick={() =>
          window.open(
            `https://api.whatsapp.com/send?phone=+554197819114&text=Ol%C3%A1+Eu+venho+atrav%C3%A9s+do+site`,
            "_blank",
          )
        }
        className="font-manrope flex items-center gap-2 rounded-lg border border-black px-2 py-2 text-sm font-bold text-black xl:px-8 xl:text-base"
      >
        Fale Conosco
        <Image
          src="/whats-icon.png"
          alt=""
          width={250}
          height={250}
          className="h-4 w-4 xl:h-6 xl:w-6"
        />
      </button>
    </div>
  );
}
