import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import WishlistCard from '../components/WishlistCard';
import { useWishlist } from '../context/WishlistContext';

function Wishlist() {
  const { wishlist, loading, error, removeFromWishlist, fetchWishlist } = useWishlist();

  const handleRemoveProduct = async (productId) => {
    await removeFromWishlist(productId);
  };

  return (
    <div className="page">
      <Navbar />
      <main className="wishlist-container">
        <header className="wishlist-header">
          <div>
            <h2>Saved Wishlist</h2>
            <p className="text-secondary text-sm">
              Keep track of items you love and move them to cart anytime
            </p>
          </div>
          {!loading && !error && (
            <span className="status-pill status-paid">
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'} Saved
            </span>
          )}
        </header>

        {loading && <p className="status-text loading-text">Retrieving your saved items...</p>}

        {!loading && error && (
          <div className="status-state-box error-box">
            <h3>Unable to load wishlist</h3>
            <p>We encountered an error retrieving your saved wishlist from the server.</p>
            <button type="button" onClick={fetchWishlist} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && wishlist.length === 0 && (
          <div className="status-state-box empty-state-box">
            <div className="text-5xl mb-3">🤍</div>
            <h3>Your wishlist is empty</h3>
            <p>Browse our catalog and save favorite items to review or purchase later.</p>
            <Link to="/products" className="browse-products-btn">
              Explore Catalog
            </Link>
          </div>
        )}

        {!loading && !error && wishlist.length > 0 && (
          <div className="wishlist-grid">
            {wishlist.map((product) => (
              <WishlistCard
                key={product._id}
                product={product}
                onRemove={handleRemoveProduct}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
