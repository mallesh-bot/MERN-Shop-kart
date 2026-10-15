import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

function Home() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const authRes = await api.get('/customers/me');
        if (authRes.data?.success && authRes.data?.customer) {
          setCustomer(authRes.data.customer);

          // Fetch real products for the storefront showcase
          try {
            const prodRes = await api.get('/products');
            if (prodRes.data?.success) {
              setFeaturedProducts((prodRes.data.products || []).slice(0, 3));
            }
          } catch {
            // Non-blocking for auth
          }
        } else {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/customers/logout');
    } catch {
      // Navigate to login regardless
    } finally {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Navbar />
        <main className="home-container">
          <p className="loading-text">Loading your ShopKart experience...</p>
        </main>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="page">
      <Navbar />
      <main className="home-container">
        {/* Verified User Greeting Banner */}
        <section className="user-greeting-banner">
          <div className="greeting-text">
            <h2>Welcome back, {customer.fullName}!</h2>
            <p>Signed in as <span className="font-mono text-cyan">{customer.email}</span></p>
          </div>
          <div className="greeting-quick-links">
            <Link to="/products" className="quick-link-chip">
              Catalog &rarr;
            </Link>
            <Link to="/wishlist" className="quick-link-chip">
              Wishlist &rarr;
            </Link>
            <Link to="/cart" className="quick-link-chip">
              Cart &rarr;
            </Link>
            <Link to="/orders" className="quick-link-chip">
              My Orders &rarr;
            </Link>
          </div>
        </section>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <span className="hero-tag">✨ Curated Online Retail</span>
            <h1 className="hero-title">
              Shop Smarter with <span className="accent-cyan">Modern Simplicity</span>
            </h1>
            <p className="hero-subtitle">
              Discover verified tech essentials, literature, and accessories with instant stock availability and secure checkout.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn-cyan">
                <span>Explore Products</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link to="/orders" className="btn-neu">
                Track My Orders
              </Link>
            </div>
          </div>

          <div className="hero-art-card">
            <div className="hero-stat-row">
              <div className="stat-icon-circle">🛍️</div>
              <div className="stat-meta">
                <strong>Verified Catalog</strong>
                <span>Real-time database stock</span>
              </div>
            </div>
            <div className="hero-stat-row">
              <div className="stat-icon-circle">⚡</div>
              <div className="stat-meta">
                <strong>Fast Dispatch</strong>
                <span>Direct delivery with free shipping</span>
              </div>
            </div>
            <div className="hero-stat-row">
              <div className="stat-icon-circle">🔒</div>
              <div className="stat-meta">
                <strong>Protected Orders</strong>
                <span>Verified payment security</span>
              </div>
            </div>
          </div>
        </section>

        {/* Category Shortcuts */}
        <section className="categories-section">
          <div className="section-header">
            <div>
              <h3>Shop by Category</h3>
              <p>Explore curated products in our top departments</p>
            </div>
            <Link to="/products" className="view-order-link">
              All categories &rarr;
            </Link>
          </div>

          <div className="categories-grid">
            <Link to="/products?category=Electronics" className="category-chip-card">
              <div className="category-icon-box">💻</div>
              <div className="category-chip-info">
                <strong>Electronics</strong>
                <span>Audio, keyboards & gear</span>
              </div>
            </Link>

            <Link to="/products?category=Books" className="category-chip-card">
              <div className="category-icon-box">📚</div>
              <div className="category-chip-info">
                <strong>Books</strong>
                <span>Software & literature</span>
              </div>
            </Link>

            <Link to="/products?category=Fashion" className="category-chip-card">
              <div className="category-icon-box">👔</div>
              <div className="category-chip-info">
                <strong>Fashion</strong>
                <span>Apparel & daily wear</span>
              </div>
            </Link>

            <Link to="/products?category=Home" className="category-chip-card">
              <div className="category-icon-box">🏡</div>
              <div className="category-chip-info">
                <strong>Home & Living</strong>
                <span>Decor & essentials</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Featured Products Showcase (Live from DB) */}
        {featuredProducts.length > 0 && (
          <section className="featured-section">
            <div className="section-header">
              <div>
                <h3>Featured Products</h3>
                <p>Popular selections currently available in stock</p>
              </div>
              <Link to="/products" className="view-order-link">
                View catalog ({featuredProducts.length}+) &rarr;
              </Link>
            </div>

            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Account Details Overview */}
        <section className="account-summary-card">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3>Account Profile</h3>
              <p className="text-secondary text-sm">Your customer credentials and account information</p>
            </div>
            <button type="button" onClick={handleLogout} className="logout-btn">
              Sign Out
            </button>
          </div>

          <div className="account-details-grid">
            <div className="account-field-box">
              <span className="account-field-label">Customer Name</span>
              <span className="account-field-value">{customer.fullName}</span>
            </div>

            <div className="account-field-box">
              <span className="account-field-label">Registered Email</span>
              <span className="account-field-value">{customer.email}</span>
            </div>

            <div className="account-field-box">
              <span className="account-field-label">Phone Contact</span>
              <span className="account-field-value">{customer.phone}</span>
            </div>

            <div className="account-field-box">
              <span className="account-field-label">Security</span>
              <span className="account-field-value text-success">✓ HttpOnly Cookie</span>
            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon-box">💎</div>
            <h4>Genuine Quality</h4>
            <p>Every product is sourced and verified with exact stock specifications and real descriptions.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon-box">📦</div>
            <h4>Instant Order Processing</h4>
            <p>Orders are recorded immediately upon signature verification with instant inventory reservations.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon-box">🛡️</div>
            <h4>Secure Payments</h4>
            <p>Transactions are authenticated server-side using cryptographic HMAC signatures.</p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon-box">🔄</div>
            <h4>Synchronized Cart & Wishlist</h4>
            <p>Real-time customer state persistence keeps your shopping bag ready across sessions.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="storefront-footer">
        <div className="footer-container">
          <div className="footer-col">
            <h4>ShopKart</h4>
            <p>
              A modern, full-stack e-commerce experience crafted with MERN architecture, light neumorphic design, and secure checkout.
            </p>
          </div>
          <div className="footer-col">
            <h4>Navigation</h4>
            <ul>
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/products">Product Catalog</Link></li>
              <li><Link to="/wishlist">Saved Items</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Departments</h4>
            <ul>
              <li><Link to="/products?category=Electronics">Electronics</Link></li>
              <li><Link to="/products?category=Books">Books</Link></li>
              <li><Link to="/products?category=Fashion">Fashion</Link></li>
              <li><Link to="/products?category=Home">Home & Living</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Customer Care</h4>
            <ul>
              <li><Link to="/orders">Track Orders</Link></li>
              <li><Link to="/cart">Shopping Bag</Link></li>
              <li><Link to="/home">Account Settings</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>&copy; {new Date().getFullYear()} ShopKart. All rights reserved.</span>
          <span>Light Neumorphic Edition &bull; Cyan Accent</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
