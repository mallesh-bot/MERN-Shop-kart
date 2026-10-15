import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data?.success && res.data?.order) {
          setOrder(res.data.order);
        } else {
          setError('Order details could not be retrieved');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return (
    <div className="page">
      <Navbar />
      <main className="order-success-container">
        {loading && <p className="status-text loading-text">Loading order confirmation...</p>}

        {!loading && error && (
          <div className="status-state-box error-box">
            <h3>Unable to find order</h3>
            <p>{error}</p>
            <Link to="/products" className="browse-products-btn">
              Back to Catalog
            </Link>
          </div>
        )}

        {!loading && !error && order && (
          <div className="order-success-card">
            <div className="success-icon-badge">✓</div>
            <h2>Order Placed Successfully!</h2>
            <p className="success-subtitle">
              Thank you for shopping with ShopKart. Your payment was verified and your order has been received.
            </p>

            <div className="order-meta-grid">
              <div className="meta-box">
                <span className="meta-label">Order ID:</span>
                <span className="meta-value font-mono">{order._id}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Payment Status:</span>
                <span className="status-pill status-paid">{order.paymentStatus}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Order Status:</span>
                <span className="status-pill status-placed">{order.orderStatus}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Payment ID:</span>
                <span className="meta-value font-mono">
                  {order.razorpayPaymentId || 'N/A'}
                </span>
              </div>
            </div>

            <div className="order-details-section">
              <h3>Items Purchased</h3>
              <div className="success-items-list">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="success-item-row">
                    <div className="item-info-col">
                      <span className="item-title">{item.name}</span>
                      <span className="item-qty-tag">Quantity: {item.quantity}</span>
                    </div>
                    <span className="item-price-col">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="order-total-recap">
                <span>Total Amount Paid:</span>
                <strong>
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(order.totalAmount)}
                </strong>
              </div>
            </div>

            <div className="shipping-recap-box">
              <h3>Shipping to:</h3>
              <p>
                <strong>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.phone})
              </p>
              <p>{order.shippingAddress?.addressLine}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
            </div>

            <div className="order-success-actions">
              <Link to="/orders" className="view-orders-btn">
                View My Orders
              </Link>
              <Link to="/products" className="continue-shopping-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrderSuccess;
