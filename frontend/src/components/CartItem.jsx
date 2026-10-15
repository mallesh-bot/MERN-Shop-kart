import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const product = item.product || {};
  const quantity = item.quantity || 1;
  const itemSubtotal = (product.price || 0) * quantity;

  const formattedUnitPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price || 0);

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(itemSubtotal);

  const handleDecrease = async () => {
    if (quantity <= 1 || updating) return;
    setUpdating(true);
    setErrorMsg('');
    const res = await updateQuantity(product._id, quantity - 1);
    if (!res.success) {
      setErrorMsg(res.message);
    }
    setUpdating(false);
  };

  const handleIncrease = async () => {
    if (quantity >= product.stock || updating) return;
    setUpdating(true);
    setErrorMsg('');
    const res = await updateQuantity(product._id, quantity + 1);
    if (!res.success) {
      setErrorMsg(res.message);
    }
    setUpdating(false);
  };

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    await removeFromCart(product._id);
    setRemoving(false);
  };

  return (
    <div className="cart-item-card">
      <div className="cart-item-image-container">
        <img
          src={product.image}
          alt={product.name}
          className="cart-item-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';
          }}
        />
      </div>

      <div className="cart-item-details">
        <span className="product-category">{product.category}</span>
        <Link to={`/products/${product._id}`} className="cart-item-title">
          {product.name}
        </Link>
        <p className="cart-item-price">Unit Price: {formattedUnitPrice}</p>
        <p className="cart-item-stock">Available: {product.stock} units</p>
      </div>

      <div className="cart-item-controls-section">
        <div className="quantity-controls" aria-label="Adjust quantity">
          <button
            type="button"
            onClick={handleDecrease}
            disabled={quantity <= 1 || updating}
            className="qty-btn"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="qty-display">{quantity}</span>
          <button
            type="button"
            onClick={handleIncrease}
            disabled={quantity >= product.stock || updating}
            className="qty-btn"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <div className="item-subtotal-display">
          Total: <strong>{formattedSubtotal}</strong>
        </div>

        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="remove-cart-item-btn"
        >
          {removing ? 'Removing...' : '✕ Remove'}
        </button>

        {errorMsg && <p className="field-error">{errorMsg}</p>}
      </div>
    </div>
  );
}

export default CartItem;
