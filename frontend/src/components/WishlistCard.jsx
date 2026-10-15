import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function WishlistCard({ product, onRemove }) {
  const { cart, addToCart } = useCart();
  const [removing, setRemoving] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [cartMsg, setCartMsg] = useState('');

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const cartItem = cart.find(
    (item) => item.product?._id === product._id || item.product === product._id
  );

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await onRemove(product._id);
    } finally {
      setRemoving(false);
    }
  };

  const handleAddToCart = async () => {
    if (addingCart || product.stock <= 0) return;
    setAddingCart(true);
    setCartMsg('');

    const res = await addToCart(product._id);
    if (res.success) {
      setCartMsg('✓ In Cart');
      setTimeout(() => setCartMsg(''), 2500);
    }
    setAddingCart(false);
  };

  return (
    <div className="wishlist-card">
      <div className="wishlist-card-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="wishlist-card-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
          }}
        />
      </div>

      <div className="wishlist-card-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>
        <p className="product-price">{formattedPrice}</p>
        <p className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
          {product.stock > 0 ? `✓ ${product.stock} units available` : '✕ Out of stock'}
        </p>

        <div className="wishlist-card-actions">
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
              : cartMsg || (cartItem ? `+ Add Another (${cartItem.quantity} in cart)` : 'Add to Cart')}
          </button>

          <Link to={`/products/${product._id}`} className="view-details-btn">
            View Details
          </Link>

          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="remove-wishlist-btn"
          >
            {removing ? 'Removing...' : '✕ Remove from Wishlist'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WishlistCard;
