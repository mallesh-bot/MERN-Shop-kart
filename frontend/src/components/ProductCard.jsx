import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

function ProductCard({ product }) {
  const { cart, addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [savingWishlist, setSavingWishlist] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [cartError, setCartError] = useState('');
  const [wishlistError, setWishlistError] = useState('');

  const isSaved = isWishlisted(product._id);

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const cartItem = cart.find(
    (item) => item.product?._id === product._id || item.product === product._id
  );

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    if (savingWishlist) return;

    setSavingWishlist(true);
    setWishlistError('');

    const res = await toggleWishlist(product._id);
    if (!res.success) {
      setWishlistError(res.message);
    }
    setSavingWishlist(false);
  };

  const handleAddToCart = async () => {
    if (addingCart || product.stock <= 0) return;
    setAddingCart(true);
    setCartError('');

    const res = await addToCart(product._id);
    if (!res.success) {
      setCartError(res.message);
    }
    setAddingCart(false);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
          }}
        />

        <button
          type="button"
          onClick={handleToggleWishlist}
          disabled={savingWishlist}
          className={`card-wishlist-overlay-btn ${isSaved ? 'is-saved' : ''}`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isSaved ? 'In your wishlist' : 'Add to wishlist'}
        >
          {savingWishlist ? '⏳' : isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name" title={product.name}>
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>
        <p className="product-price">{formattedPrice}</p>
        <p className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.stock > 0 ? `✓ ${product.stock} in stock` : '✕ Out of stock'}
        </p>

        <div className="product-card-actions">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addingCart || product.stock <= 0}
            className="add-cart-action-btn"
          >
            {addingCart
              ? 'Adding...'
              : product.stock <= 0
              ? 'Out of Stock'
              : cartItem
              ? `+ Add Another (${cartItem.quantity} in cart)`
              : 'Add to Cart'}
          </button>

          <Link to={`/products/${product._id}`} className="view-details-btn">
            View Details
          </Link>
        </div>

        {cartError && <p className="card-error-text">{cartError}</p>}
        {wishlistError && <p className="card-error-text">{wishlistError}</p>}
      </div>
    </div>
  );
}

export default ProductCard;
