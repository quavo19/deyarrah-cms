import Button from '@/components/ui/Button'

const Pagination = ({
  meta = {},
  page = 1,
  currentPage: currentPageProp,
  totalPages: totalPagesProp,
  onPageChange,
  isLoading = false,
  className = '',
}) => {
  const currentPage = Number(currentPageProp || meta.current_page || page || 1)
  const totalPages = Number(totalPagesProp || meta.total_pages || 1)
  const totalCount = Number(meta.total_count || 0)
  const perPage = Number(meta.per_page || 0)

  if (totalPages <= 1) return null

  const start = perPage > 0 ? (currentPage - 1) * perPage + 1 : null
  const end = perPage > 0 ? Math.min(currentPage * perPage, totalCount) : null

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-700 ${className}`}>
      <span>
        {start && end
          ? `Showing ${start}-${end} of ${totalCount}`
          : `Page ${currentPage} of ${totalPages}`}
      </span>
      <div className="flex gap-2">
        <Button
          auto
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={isLoading || currentPage <= 1}
          className="px-4 py-2 text-sm"
        >
          Previous
        </Button>
        <Button
          auto
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={isLoading || currentPage >= totalPages}
          className="px-4 py-2 text-sm"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export { Pagination }
export default Pagination
