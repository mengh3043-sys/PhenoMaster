import { useEffect, useState } from "react";

/** Paginate filtered rows; always constrain the current page after deletions. */
export function useListPagination<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const currentPage = Math.max(1, Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize))));
  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);
  return {
    page: currentPage,
    pageSize,
    setPage,
    setPageSize: (size: number) => { setPageSize(size); setPage(1); },
    pageRows: rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  };
}