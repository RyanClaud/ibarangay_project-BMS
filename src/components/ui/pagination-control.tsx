'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function PaginationControl({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = 'records',
  className = '',
}: PaginationControlProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-xs text-[#718096] select-none ${className}`}
    >
      {/* Left: Summary and Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <p className="font-medium text-[#718096]">
          Showing <span className="font-semibold text-[#172B4D]">{startItem}</span> to{' '}
          <span className="font-semibold text-[#172B4D]">{endItem}</span> of{' '}
          <span className="font-semibold text-[#172B4D]">{totalItems}</span> {itemLabel}
        </p>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
            <span className="text-xs text-[#718096]">Rows per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="h-8 w-[70px] rounded-lg border-[#E5EAF2] bg-white text-xs font-semibold text-[#172B4D] focus:ring-1 focus:ring-[#246BDE]">
                <SelectValue placeholder={pageSize.toString()} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#E5EAF2]">
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={opt.toString()} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1 self-center sm:self-auto">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg border-[#E5EAF2] text-[#718096] hover:bg-[#F0F4FA] hover:text-[#172B4D] disabled:opacity-40"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg border-[#E5EAF2] text-[#718096] hover:bg-[#F0F4FA] hover:text-[#172B4D] disabled:opacity-40"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-xs text-[#718096] select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <Button
                key={p}
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                className={`size-8 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#246BDE] text-white hover:bg-[#1E5CC0] shadow-xs border-[#246BDE]'
                    : 'border-[#E5EAF2] text-[#172B4D] hover:bg-[#F0F4FA] hover:text-[#246BDE]'
                }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg border-[#E5EAF2] text-[#718096] hover:bg-[#F0F4FA] hover:text-[#172B4D] disabled:opacity-40"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-8 rounded-lg border-[#E5EAF2] text-[#718096] hover:bg-[#F0F4FA] hover:text-[#172B4D] disabled:opacity-40"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || totalPages === 0}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

