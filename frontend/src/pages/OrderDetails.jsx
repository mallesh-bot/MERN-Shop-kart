import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data?.success && res.data?.order) {
          setOrder(res.data.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else if (err.response?.status === 404) {
          setError('Order not found or you do not have permission to view it.');
        } else {
          setError('Unable to load order details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, navigate]);

  return (
    <div className="page">
      <Navbar />
      <main className="order-details-container">
        <Link to="/orders" className="back-link">
          &larr; Back to My Orders
        </Link>

        {loading && <p className="status-text loading-text">Loading order details...</p>}

        {!loading && error && (
          <div className="status-state-box error-box">
            <h3>Unable to display order</h3>
            <p>{error}</p>
            <Link to="/orders" className="browse-products-btn">
              Return to Orders
            </Link>
          </div>
        )}

        {!loading && !error && order && (
          <div className="order-details-card">
            <header className="details-header-row">
              <div>
                <h2>Order #{order._id}</h2>
                <p className="order-timestamp">
                  Placed on{' '}
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="details-status-badges">
                <span className={`status-pill status-${order.orderStatus?.toLowerCase()}`}>
                  Order: {order.orderStatus}
                </span>
                <span className={`status-pill status-${order.paymentStatus?.toLowerCase()}`}>
                  Payment: {order.paymentStatus}
                </span>
              </div>
            </header>

            <div className="order-sections-grid">
              <section className="order-info-block">
                <h3>Shipping Address</h3>
                <p className="recipient-name">
                  <strong>{order.shippingAddress?.fullName}</strong>
                </p>
                <p>Phone: {order.shippingAddress?.phone}</p>
                <p>{order.shippingAddress?.addressLine}</p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </p>
              </section>

              <section className="order-info-block">
                <h3>Payment Information</h3>
                <p>
                  <strong>Gateway:</strong> Razorpay (Test Mode)
                </p>
                <p>
                  <strong>Razorpay Order ID:</strong>{' '}
                  <span className="font-mono text-sm">{order.razorpayOrderId || 'N/A'}</span>
                </p>
                <p>
                  <strong>Payment ID:</strong>{' '}
                  <span className="font-mono text-sm">{order.razorpayPaymentId || 'N/A'}</span>
                </p>
                <p>
                  <strong>Status:</strong> {order.paymentStatus}
                </p>
              </section>
            </div>

            <section className="order-line-items-section">
              <h3>Items in this Order</h3>
              <div className="line-items-table">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="line-item-row">
                    <div className="line-item-img-col">
                      <img
                        src={item.image || 'https://via.placeholder.com/80?text=Product'}
                        alt={item.name}
                        className="line-item-thumb"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/80?text=Product';
                        }}
                      />
                    </div>
                    <div className="line-item-info-col">
                      <h4>{item.name}</h4>
                      <p className="line-item-unit-price">
                        Unit Price:{' '}
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(item.price)}
                      </p>
                      <p className="line-item-qty">Quantity: {item.quantity}</p>
                    </div>
                    <div className="line-item-total-col">
                      <span>Total:</span>
                      <strong>
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(item.price * item.quantity)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-grand-total-box">
                <div className="total-breakdown-row">
                  <span>Subtotal:</span>
                  <span>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(order.totalAmount)}
                  </span>
                </div>
                <div className="total-breakdown-row">
                  <span>Shipping:</span>
                  <span className="free-shipping">FREE</span>
                </div>
                <div className="total-breakdown-row grand-total-line">
                  <span>Grand Total:</span>
                  <strong>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(order.totalAmount)}
                  </strong>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default OrderDetails;
