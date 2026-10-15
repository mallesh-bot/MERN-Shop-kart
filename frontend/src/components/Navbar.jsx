import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import api from '../services/api';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalQuantity } = useCart();
  const { wishlist } = useWishlist();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/customers/logout');
    } catch {
      // Navigate to login even if logout request fails
    } finally {
      navigate('/login');
    }
  };

  const isActive = (path) => {
    if (path === '/home' && location.pathname === '/home') return true;
    if (path === '/products' && location.pathname.startsWith('/products')) return true;
    if (path === '/wishlist' && location.pathname === '/wishlist') return true;
    if (path === '/cart' && location.pathname === '/cart') return true;
    if (path === '/orders' && location.pathname.startsWith('/orders')) return true;
    return false;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/home" className="navbar-brand">
          <div className="brand-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <span>ShopKart</span>
          <span className="brand-dot"></span>
        </Link>

        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link
            to="/home"
            className={`nav-link ${isActive('/home') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>

          <Link
            to="/products"
            className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Products
          </Link>

          <Link
            to="/wishlist"
            className={`nav-link ${isActive('/wishlist') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Wishlist
            {wishlist?.length > 0 && (
              <span className="nav-badge">{wishlist.length}</span>
            )}
          </Link>

          <Link
            to="/cart"
            className={`nav-link ${isActive('/cart') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Cart
            {totalQuantity > 0 && (
              <span className="nav-badge">{totalQuantity}</span>
            )}
          </Link>

          <Link
            to="/orders"
            className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Orders
          </Link>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
