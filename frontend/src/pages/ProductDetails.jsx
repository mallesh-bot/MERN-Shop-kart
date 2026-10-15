import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';

function ProductDetails() {
  const { id } = useParams();
  const { cart, addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingCart, setAddingCart] = useState(false);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [cartMessage, setCartMessage] = useState('');

  const isSaved = isWishlisted(id);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data?.success) {
          setProduct(response.data.product);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Product not found in our catalog.');
        } else if (err.response?.status === 400) {
          setError('Invalid product ID format.');
        } else {
          setError('Something went wrong while loading product details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const cartItem = cart.find(
    (item) => item.product?._id === id || item.product === id
  );

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0 || addingCart) return;
    setAddingCart(true);
    setCartMessage('');

    const res = await addToCart(product._id);
    if (res.success) {
      setCartMessage('✓ Item added to your shopping cart');
      setTimeout(() => setCartMessage(''), 3000);
    } else {
      setCartMessage(`✗ ${res.message}`);
    }
    setAddingCart(false);
  };

  const handleToggleWishlist = async () => {
    if (!product || savingWishlist) return;
    setSavingWishlist(true);
    await toggleWishlist(product._id);
    setSavingWishlist(false);
  };

  const formattedPrice = product
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(product.price)
    : '';

  return (
    <div className="page">
      <Navbar />
      <main className="product-details-container">
        <Link to="/products" className="back-link">
          &larr; Back to Catalog
        </Link>

        {loading && <p className="status-text loading-text">Loading product details...</p>}

        {!loading && error && (
          <div className="status-state-box error-box">
            <h3>Unable to display product</h3>
            <p>{error}</p>
            <Link to="/products" className="browse-products-btn">
              Explore Available Products
            </Link>
          </div>
        )}

        {!loading && !error && product && (
          <div className="product-details-card">
            <div className="details-image-section">
              <img
                src={product.image}
                alt={product.name}
                className="details-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            <div className="details-info-section">
              <span className="details-category">{product.category}</span>
              <h1 className="details-title">{product.name}</h1>
              <p className="details-price">{formattedPrice}</p>

              <p className={`details-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock > 0 ? `✓ Available in stock (${product.stock} units left)` : '✕ Currently Out of Stock'}
              </p>

              <div className="details-description-box">
                <h3>Product Overview</h3>
                <p>{product.description}</p>
              </div>

              <div className="details-actions-area">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingCart || product.stock <= 0}
                  className="details-add-cart-btn"
                >
                  {addingCart
                    ? 'Adding to Cart...'
                    : product.stock <= 0
                    ? 'Out of Stock'
                    : cartItem
                    ? `+ Add Another (${cartItem.quantity} in Cart)`
                    : 'Add to Cart'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={savingWishlist}
                  className={`details-wishlist-btn ${isSaved ? 'is-saved' : ''}`}
                >
                  {savingWishlist
                    ? '⏳ Updating...'
                    : isSaved
                    ? '❤️ Saved in Wishlist (Click to remove)'
                    : '🤍 Add to Wishlist'}
                </button>

                {cartMessage && <p className="added-toast">{cartMessage}</p>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProductDetails;
