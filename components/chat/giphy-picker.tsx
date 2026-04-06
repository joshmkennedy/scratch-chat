"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface GiphyGif {
  id: string;
  title: string;
  url: string;
  preview: string;
  still: string;
  width: number;
  height: number;
}

export function GiphyPicker({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setGifs([]);
      return;
    }
    // Load trending on open
    fetchGifs("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchGifs(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  async function fetchGifs(q: string) {
    setLoading(true);
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      const res = await fetch(`/api/giphy${params}`);
      if (res.ok) {
        const data = await res.json();
        setGifs(data.gifs);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Search GIFs</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search Giphy..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="h-80 overflow-y-auto">
          {loading && gifs.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">Loading...</p>
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">No GIFs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => {
                    onSelect(gif.url);
                    onOpenChange(false);
                  }}
                  className="group relative overflow-hidden rounded-lg border transition-colors hover:border-primary"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Powered by GIPHY
        </p>
      </DialogContent>
    </Dialog>
  );
}
