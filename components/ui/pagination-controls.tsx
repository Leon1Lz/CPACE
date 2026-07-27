"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  total?: number
  limit?: number
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  total,
  limit,
}: PaginationControlsProps) {
  if (totalPages <= 1) return null

  // Generate page numbers to display
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = []
    const range = 1 // number of pages to show on either side of current page

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - range && i <= currentPage + range)
      ) {
        pages.push(i)
      } else if (
        i === currentPage - range - 1 ||
        i === currentPage + range + 1
      ) {
        pages.push("ellipsis")
      }
    }

    // Deduplicate ellipsis
    const uniquePages: (number | "ellipsis")[] = []
    let lastWasEllipsis = false

    pages.forEach((p) => {
      if (p === "ellipsis") {
        if (!lastWasEllipsis) {
          uniquePages.push("ellipsis")
          lastWasEllipsis = true
        }
      } else {
        uniquePages.push(p)
        lastWasEllipsis = false
      }
    })

    return uniquePages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
      {total !== undefined && limit !== undefined && (
        <p className="text-xs text-gray-500 font-medium">
          Showing <span className="font-bold text-gray-800">{Math.min(total, (currentPage - 1) * limit + 1)}</span> to{" "}
          <span className="font-bold text-gray-800">{Math.min(total, currentPage * limit)}</span> of{" "}
          <span className="font-bold text-gray-800">{total}</span> results
        </p>
      )}
      
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault()
                if (currentPage > 1) onPageChange(currentPage - 1)
              }}
              href="#"
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {pageNumbers.map((p, idx) => (
            <PaginationItem key={idx}>
              {p === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault()
                    onPageChange(p)
                  }}
                  href="#"
                  isActive={p === currentPage}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault()
                if (currentPage < totalPages) onPageChange(currentPage + 1)
              }}
              href="#"
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
