"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send } from "lucide-react";

export function MessageInput() {
  const sendMessage = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const setTyping = useMutation(api.presence.setTyping);

  const [body, setBody] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageStorageId, setImageStorageId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragCounterRef = useRef(0);

  const handleTyping = useCallback(() => {
    setTyping({ isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTyping({ isTyping: false });
    }, 3000);
  }, [setTyping]);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      const url = await generateUploadUrl();
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setImageStorageId(storageId);
    } catch {
      setImagePreview(null);
      setImageStorageId(null);
    } finally {
      setUploading(false);
    }
  }, [generateUploadUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Global drag-and-drop
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes("Files")) {
        setDragging(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setDragging(false);
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setDragging(false);
      const file = e.dataTransfer?.files[0];
      if (file && file.type.startsWith("image/")) {
        uploadFile(file);
      }
    };

    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [uploadFile]);

  // Paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) uploadFile(file);
          return;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [uploadFile]);

  const handleSend = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody && !imageStorageId) return;

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setTyping({ isTyping: false });

    // Reset state immediately for responsiveness
    setBody("");
    setImagePreview(null);
    const storageId = imageStorageId;
    setImageStorageId(null);

    await sendMessage({
      body: trimmedBody || " ",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imageStorageId: storageId ? (storageId as any) : undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative border-t px-4 py-3">
      {/* Drag overlay */}
      {dragging && (
        <div className="bg-primary/10 border-primary absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed">
          <p className="text-primary text-sm font-medium">Drop image here</p>
        </div>
      )}
      {/* Image preview */}
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img
            src={imagePreview}
            alt="Upload preview"
            className="h-20 rounded-lg border object-cover"
          />
          <button
            onClick={() => {
              setImagePreview(null);
              setImageStorageId(null);
            }}
            className="bg-background absolute -top-2 -right-2 rounded-full border p-0.5 text-xs"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus className="h-5 w-5" />
        </Button>

        <Textarea
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-10 max-h-30 resize-none"
          rows={1}
        />

        <Button
          size="icon"
          className="shrink-0"
          onClick={handleSend}
          disabled={(!body.trim() && !imageStorageId) || uploading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
