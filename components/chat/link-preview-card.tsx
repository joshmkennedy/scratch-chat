"use client";

import { useState } from "react";

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 block max-w-sm overflow-hidden rounded-lg border transition-colors hover:bg-muted/50"
    >
      {preview.imageUrl && !imgFailed && (
        <img
          src={preview.imageUrl}
          alt={preview.title ?? "Link preview"}
          className="h-32 w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      )}
      <div className="p-3">
        {preview.title && (
          <p className="text-sm font-medium leading-tight">{preview.title}</p>
        )}
        {preview.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
            {preview.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5">
          <img
            src={`https://www.google.com/s2/favicons?domain=${new URL(preview.url).hostname}&sz=64`}
            alt=""
            className="h-4 w-4 rounded-sm"
          />
          <p className="text-muted-foreground truncate text-xs">
            {new URL(preview.url).hostname}
          </p>
        </div>
      </div>
    </a>
  );
}
