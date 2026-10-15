import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Unable to load your orders. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="page">
      <Navbar />
      <main className="orders-page-container">
        <header className="orders-header">
          <h2>My Orders</h2>
          <p className="orders-subtitle">Track and review all your purchases on ShopKart</p>
        </header>

        {loading && <p className="status-text loading-text">Loading your orders...</p>}

        {!loading && error && (
          <div className="status-state-box error-box">
            <p className="error-title">Something went wrong.</p>
            <p className="error-subtitle">{error}</p>
            <button type="button" onClick={fetchOrders} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="status-state-box empty-state-box">
            <div className="orders-empty-icon text-5xl mb-3">📦</div>
            <h3>No orders found</h3>
            <p>You haven't placed any orders yet. Start exploring our catalog!</p>
            <Link to="/products" className="browse-products-btn">
              Explore Products
            </Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const formattedAmount = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(order.totalAmount);

              const totalItems = (order.items || []).reduce(
                (sum, item) => sum + item.quantity,
                0
              );

              return (
                <div key={order._id} className="order-history-card">
                  <div className="order-card-header">
                    <div className="order-id-group">
                      <span className="order-card-label">ORDER PLACED</span>
                      <span className="order-date-text">{formattedDate}</span>
                    </div>

                    <div className="order-total-group">
                      <span className="order-card-label">TOTAL</span>
                      <span className="order-total-text">{formattedAmount}</span>
                    </div>

                    <div className="order-ship-group">
                      <span className="order-card-label">SHIP TO</span>
                      <span className="order-ship-name">{order.shippingAddress?.fullName}</span>
                    </div>

                    <div className="order-actions-group">
                      <span className="order-id-display font-mono">#{order._id.slice(-8)}</span>
                      <Link to={`/orders/${order._id}`} className="view-order-link">
                        View Details &rarr;
                      </Link>
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-status-row">
                      <div className="status-indicator-group">
                        <span
                          className={`status-pill status-${order.orderStatus?.toLowerCase()}`}
                        >
                          {order.orderStatus}
                        </span>
                        <span
                          className={`status-pill status-${order.paymentStatus?.toLowerCase()}`}
                        >
                          Payment: {order.paymentStatus}
                        </span>
                      </div>
                      <span className="item-count-text">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    <div className="order-items-preview">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="item-preview-chip">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="item-preview-img"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <span className="item-preview-name">{item.name}</span>
                          <span className="item-preview-qty">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Orders;
