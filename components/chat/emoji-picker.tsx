"use client";

import { useEffect, useRef } from "react";

const EMOJIS = [
  "\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F602}", "\u{1F60D}",
  "\u{1F525}", "\u{1F389}", "\u{1F44F}", "\u{1F914}",
  "\u{1F622}", "\u{1F60E}", "\u{1F64F}", "\u{1F680}",
  "\u{2705}", "\u{274C}", "\u{1F440}", "\u{1F4AF}",
];

export function EmojiPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="bg-popover absolute right-0 top-full z-50 mt-1 w-[180px] grid grid-cols-4 gap-1 rounded-lg border p-2 shadow-md"
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="hover:bg-muted rounded p-1.5 text-lg transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
