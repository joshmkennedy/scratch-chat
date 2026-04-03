"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Plus, XCircle } from "lucide-react";

export function AdminPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const codes = useQuery(api.inviteCodes.list) ?? [];
  const createCode = useMutation(api.inviteCodes.create);
  const deactivateCode = useMutation(api.inviteCodes.deactivate);
  const [maxUses, setMaxUses] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);

  const handleCreate = async () => {
    const code = await createCode({
      maxUses: maxUses ? parseInt(maxUses) : undefined,
    });
    setNewCode(code);
    setMaxUses("");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Panel</DialogTitle>
        </DialogHeader>

        {/* Create invite code */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Create Invite Code</h3>
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="max-uses" className="text-xs">
                Max uses (blank = unlimited)
              </Label>
              <Input
                id="max-uses"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Create
            </Button>
          </div>

          {newCode && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
              <code className="flex-1 font-mono text-sm">{newCode}</code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => copyCode(newCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Existing codes */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Invite Codes</h3>
          {codes.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No invite codes yet
            </p>
          )}
          <div className="space-y-2">
            {codes.map((code) => (
              <div
                key={code._id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm">{code.code}</code>
                  <Badge variant={code.isActive ? "default" : "secondary"}>
                    {code.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {code.useCount}
                    {code.maxUses ? `/${code.maxUses}` : ""} uses
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyCode(code.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  {code.isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deactivateCode({ codeId: code._id })}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
