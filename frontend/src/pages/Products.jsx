import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const params = {};
        if (search.trim()) params.search = search.trim();
        if (category && category !== 'All') params.category = category;
        if (sort) params.sort = sort;

        const response = await api.get('/products', { params });
        if (response.data?.success) {
          setProducts(response.data.products || []);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, category, sort]);

  const handleClearFilters = () => {
    setSearch('');
    setSort('');
    setSearchParams({});
  };

  const hasActiveFilters = search.trim() !== '' || category !== '' || sort !== '';

  return (
    <div className="page">
      <Navbar />
      <main className="products-container">
        <header className="products-header">
          <h2>Product Catalog</h2>
          <p className="products-subtitle">
            Explore authentic tech, accessories, and books directly from verified inventory
          </p>
        </header>

        {/* Neumorphic Filter Controls */}
        <section className="filter-bar">
          <div className="search-input-group">
            <svg
              className="search-icon-svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-select-group">
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value) {
                  setSearchParams({ category: e.target.value });
                } else {
                  setSearchParams({});
                }
              }}
              className="category-select"
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Books">Books</option>
              <option value="Home">Home & Living</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="sort-select"
            >
              <option value="">Sort by Price</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="clear-filter-btn"
                title="Reset all filters"
              >
                ✕ Clear Filters
              </button>
            )}
          </div>
        </section>

        {loading && <p className="status-text loading-text">Loading catalog items...</p>}

        {!loading && error && (
          <div className="status-state-box error-box">
            <h3>Something went wrong</h3>
            <p>We could not load the product catalog right now. Please try again.</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                api.get('/products').then((res) => {
                  setProducts(res.data?.products || []);
                  setLoading(false);
                });
              }}
              className="retry-btn"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="status-state-box empty-state-box">
            <div className="text-4xl mb-2">🔍</div>
            <h3>No products found</h3>
            <p>No catalog items matched your search criteria or category filter.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="browse-products-btn"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Products;
