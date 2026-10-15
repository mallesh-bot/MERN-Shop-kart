import { Link, useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';

function Cart() {
  const navigate = useNavigate();
  const { cart, loading, error, totalQuantity, subtotal, fetchCart } = useCart();

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(subtotal);

  const handleCheckoutClick = () => {
    navigate('/checkout');
  };

  return (
    <div className="page">
      <Navbar />
      <main className="cart-page-container">
        <header className="cart-header">
          <div>
            <h2>Shopping Cart</h2>
            {!loading && !error && (
              <p className="cart-count-subtitle">
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} ready for checkout
              </p>
            )}
          </div>
        </header>

        {loading && <p className="status-text loading-text">Loading your shopping cart...</p>}

        {!loading && error && (
          <div className="status-state-box error-box">
            <h3>Unable to retrieve cart</h3>
            <p>We encountered an issue communicating with the database. Please try again.</p>
            <button type="button" onClick={fetchCart} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && cart.length === 0 && (
          <div className="status-state-box empty-state-box">
            <div className="text-5xl mb-3">🛒</div>
            <h3>Your cart is empty</h3>
            <p>Explore our catalog to find items you want to purchase.</p>
            <Link to="/products" className="browse-products-btn">
              Explore Products
            </Link>
          </div>
        )}

        {!loading && !error && cart.length > 0 && (
          <div className="cart-layout">
            <div className="cart-items-section">
              {cart.map((item) => (
                <CartItem key={item.product?._id || item._id} item={item} />
              ))}
            </div>

            <aside className="order-summary-sidebar">
              <div className="order-summary-box">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Total Items:</span>
                  <strong>{totalQuantity}</strong>
                </div>
                <div className="summary-row">
                  <span>Delivery:</span>
                  <strong className="free-shipping">FREE</strong>
                </div>
                <div className="summary-row subtotal-row">
                  <span>Subtotal:</span>
                  <strong>{formattedSubtotal}</strong>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="checkout-btn"
                >
                  Proceed to Checkout &rarr;
                </button>

                <div className="mt-4 text-center">
                  <Link to="/products" className="text-secondary text-sm font-semibold hover:text-cyan">
                    &larr; Continue Shopping
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;
