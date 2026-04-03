"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "radix-ui";

export function ImageLightbox({
  imageUrl,
  open,
  onOpenChange,
}: {
  imageUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
        <VisuallyHidden.Root>
          <DialogTitle>Image preview</DialogTitle>
        </VisuallyHidden.Root>
        <img
          src={imageUrl}
          alt="Full size"
          className="max-h-[80vh] w-full rounded-lg object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}
