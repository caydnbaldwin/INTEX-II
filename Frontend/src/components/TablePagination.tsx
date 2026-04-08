import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination'

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function TablePagination({ currentPage, totalPages, onPageChange }: TablePaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={(e) => { e.preventDefault(); onPageChange(Math.max(1, currentPage - 1)) }}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
        {pages.map((page, idx) => (
          <span key={page}>
            {idx > 0 && pages[idx - 1] !== page - 1 && (
              <PaginationItem><PaginationEllipsis /></PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                isActive={page === currentPage}
                onClick={(e) => { e.preventDefault(); onPageChange(page) }}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          </span>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={(e) => { e.preventDefault(); onPageChange(Math.min(totalPages, currentPage + 1)) }}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
