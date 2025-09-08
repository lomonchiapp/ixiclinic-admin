import { useState, useMemo } from 'react'

interface UseTablePaginationProps<T> {
  data: T[]
  initialPageSize?: number
}

interface UseTablePaginationReturn<T> {
  currentPage: number
  pageSize: number
  totalPages: number
  paginatedData: T[]
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  goToFirstPage: () => void
  goToLastPage: () => void
  goToNextPage: () => void
  goToPreviousPage: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

export function useTablePagination<T>({
  data,
  initialPageSize = 10
}: UseTablePaginationProps<T>): UseTablePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  
  const totalPages = Math.ceil(data.length / pageSize)
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, pageSize])
  
  const setPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    // Ajustar página actual para mantener datos visibles
    const newTotalPages = Math.ceil(data.length / size)
    if (currentPage > newTotalPages) {
      setCurrentPage(Math.max(1, newTotalPages))
    }
  }
  
  const goToFirstPage = () => setPage(1)
  const goToLastPage = () => setPage(totalPages)
  const goToNextPage = () => setPage(currentPage + 1)
  const goToPreviousPage = () => setPage(currentPage - 1)
  
  const canGoNext = currentPage < totalPages
  const canGoPrevious = currentPage > 1
  
  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    setPage,
    setPageSize: handlePageSizeChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious
  }
}

