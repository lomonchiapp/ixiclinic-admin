import { useState, useMemo } from 'react'

type SortDirection = 'asc' | 'desc'

interface SortConfig<T> {
  key: keyof T
  direction: SortDirection
}

interface UseTableSortingProps<T> {
  data: T[]
  initialSort?: SortConfig<T>
}

interface UseTableSortingReturn<T> {
  sortedData: T[]
  sortConfig: SortConfig<T> | null
  requestSort: (key: keyof T) => void
  getSortIndicator: (key: keyof T) => 'asc' | 'desc' | null
}

export function useTableSorting<T>({
  data,
  initialSort
}: UseTableSortingProps<T>): UseTableSortingReturn<T> {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(initialSort || null)
  
  const sortedData = useMemo(() => {
    if (!sortConfig) return data
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])
  
  const requestSort = (key: keyof T) => {
    let direction: SortDirection = 'asc'
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    
    setSortConfig({ key, direction })
  }
  
  const getSortIndicator = (key: keyof T): 'asc' | 'desc' | null => {
    if (!sortConfig || sortConfig.key !== key) return null
    return sortConfig.direction
  }
  
  return {
    sortedData,
    sortConfig,
    requestSort,
    getSortIndicator
  }
}

