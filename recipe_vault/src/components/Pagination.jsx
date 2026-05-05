export default function Pagination({
  currentPage,
  pageCount,
  onPageChange
}) {
  if (pageCount <= 1) {
    return null;
  }

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav className="pagination" aria-label="Recipe pages">
      <button
        className="button button-secondary"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        Previous
      </button>

      <div className="pagination-pages">
        {pages.map((page) => (
          <button
            key={page}
            aria-current={page === currentPage ? 'page' : undefined}
            className={
              page === currentPage
                ? 'pagination-page pagination-page-active'
                : 'pagination-page'
            }
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        ))}
      </div>

      <button
        className="button button-secondary"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        Next
      </button>
    </nav>
  );
}
