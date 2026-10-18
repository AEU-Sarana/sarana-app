'use client';

import React from 'react';
import TablePagination, { TablePaginationProps } from '../ui/table-pagination';

export interface PaginationProps extends Partial<TablePaginationProps> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalEntries,
  pageSize = 10,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  entryLabel,
  className = 'mt-6',
}: PaginationProps) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <TablePagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalEntries={totalEntries}
      pageSize={pageSize}
      pageSizeOptions={pageSizeOptions}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      entryLabel={entryLabel}
      className={className}
      variant="card"
    />
  );
}
