import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
}

function Pagination({ hasNextPage, hasPrevPage, onNext, onPrev, className }: PaginationProps) {
  if (!hasNextPage && !hasPrevPage) return null;

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrevPage}>
        <ChevronLeft className="mr-1 h-4 w-4" />
        Previous
      </Button>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNextPage}>
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

export { Pagination };
