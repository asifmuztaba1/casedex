"use client";

import * as React from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFiles: (files: File[]) => void;
  className?: string;
  label?: string;
  hint?: string;
}

export default function FileUpload({
  accept,
  multiple = false,
  maxSizeMB = 10,
  onFiles,
  className,
  label = "Drop files here or click to browse",
  hint,
}: FileUploadProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const [selected, setSelected] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter(
      (f) => f.size <= maxSizeMB * 1024 * 1024
    );
    setSelected(files);
    onFiles(files);
  }

  function removeFile(index: number) {
    const next = selected.filter((_, i) => i !== index);
    setSelected(next);
    onFiles(next);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition",
          dragOver
            ? "border-[var(--muted-soft)] bg-[var(--wash)]"
            : "border-[var(--border)] bg-[var(--paper)] hover:border-[var(--border)]"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mb-2 h-8 w-8 text-[var(--muted-soft)]" />
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
        {hint && <p className="mt-1 text-xs text-[var(--muted-soft)]">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {selected.length > 0 && (
        <ul className="space-y-1">
          {selected.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-[var(--muted)]">
                <FileText className="h-4 w-4 text-[var(--muted-soft)]" />
                {file.name}
                <span className="text-xs text-[var(--muted-soft)]">
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
