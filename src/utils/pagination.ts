export interface PaginationResult<T> {
    previousPage: number | null
    currentPage: number
    nextPage: number | null
    total: number
    totalPages: number
    limit: number
    data: T[]
}

export const paginate = <T>(data: T[], page: number, limit: number, total: number): PaginationResult<T> => {
    const totalPages = Math.ceil(total / limit)
    return { previousPage: page > 1 ? page - 1 : null, currentPage: page, nextPage: page < totalPages ? page + 1 : null, total, totalPages, limit, data }
}
