import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import api from '../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Checkout() {
  const navigate = useNavigate();
  const { cart, loading: cartLoading, totalQuantity, subtotal, fetchCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await api.get('/customers/me');
        if (!res.data?.success) {
          navigate('/login');
        } else if (res.data?.customer) {
          setFormData((prev) => ({
            ...prev,
            fullName: prev.fullName || res.data.customer.fullName || '',
            phone: prev.phone || res.data.customer.phone || '',
          }));
        }
      } catch {
        navigate('/login');
      } finally {
        setAuthChecked(true);
      }
    };

    verifyAuth();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required';
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      nextErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (!formData.addressLine.trim()) {
      nextErrors.addressLine = 'Street address is required';
    }

    if (!formData.city.trim()) {
      nextErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      nextErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      nextErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      nextErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (!validate()) {
      return;
    }

    if (cart.length === 0) {
      setPaymentError('Your cart is empty. Please add items before placing an order.');
      return;
    }

    setSubmitting(true);

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setPaymentError('Could not load payment gateway. Please check your internet connection.');
        setSubmitting(false);
        return;
      }

      const response = await api.post('/orders/create-payment-order', {
        shippingAddress: {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          addressLine: formData.addressLine.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
      });

      if (!response.data?.success) {
        setPaymentError(response.data?.message || 'Failed to create payment order');
        setSubmitting(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = response.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'ShopKart',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: formData.fullName.trim(),
          contact: formData.phone.trim(),
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (paymentResponse) {
          try {
            setVerifying(true);
            const verifyRes = await api.post('/orders/verify-payment', {
              orderId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              await fetchCart();
              navigate(`/order-success/${orderId}`);
            } else {
              setPaymentError(verifyRes.data?.message || 'Payment verification failed');
            }
          } catch (verErr) {
            setPaymentError(
              verErr.response?.data?.message ||
                'Payment verification failed on the server. Your cart is preserved.'
            );
          } finally {
            setVerifying(false);
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setPaymentError(
              'Payment window was closed before completion. Your cart items are safe.'
            );
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (failRes) {
        setSubmitting(false);
        setPaymentError(
          `Payment failed: ${failRes.error?.description || 'Transaction declined by bank'}`
        );
      });
      razorpay.open();
    } catch (err) {
      setPaymentError(
        err.response?.data?.message ||
          'Server error while initiating payment. Please try again.'
      );
      setSubmitting(false);
    }
  };

  const formattedSubtotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(subtotal);

  if (!authChecked || cartLoading) {
    return (
      <div className="page">
        <Navbar />
        <p className="status-text loading-text">Loading checkout details...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="page">
        <Navbar />
        <main className="checkout-page-container">
          <div className="status-state-box empty-state-box">
            <div className="cart-icon text-5xl mb-3">🛒</div>
            <h3>Your cart is empty</h3>
            <p>You need items in your cart before checking out.</p>
            <Link to="/products" className="browse-products-btn">
              Browse Products
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Navbar />
      <main className="checkout-page-container">
        <header className="checkout-header">
          <h2>Secure Checkout</h2>
          <p className="checkout-subtitle">Enter your shipping details and proceed to payment</p>
        </header>

        {paymentError && <div className="checkout-error-banner">{paymentError}</div>}
        {verifying && (
          <div className="checkout-verifying-banner">
            Verifying your payment with the server... Please do not refresh.
          </div>
        )}

        <div className="checkout-layout">
          <section className="checkout-form-section">
            <form onSubmit={handlePlaceOrder} noValidate className="shipping-form">
              <h3>1. Shipping Address</h3>

              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full recipient name"
                  disabled={submitting || verifying}
                />
                {errors.fullName && <p className="field-error">{errors.fullName}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number (10 digits)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength="10"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  disabled={submitting || verifying}
                />
                {errors.phone && <p className="field-error">{errors.phone}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="addressLine">Street Address</label>
                <textarea
                  id="addressLine"
                  name="addressLine"
                  rows="3"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="House/Flat number, building, street, area"
                  disabled={submitting || verifying}
                />
                {errors.addressLine && <p className="field-error">{errors.addressLine}</p>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    disabled={submitting || verifying}
                  />
                  {errors.city && <p className="field-error">{errors.city}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    disabled={submitting || verifying}
                  />
                  {errors.state && <p className="field-error">{errors.state}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">Pincode (6 digits)</label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    maxLength="6"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode"
                    disabled={submitting || verifying}
                  />
                  {errors.pincode && <p className="field-error">{errors.pincode}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || verifying}
                className="place-order-submit-btn"
              >
                {verifying
                  ? 'Verifying Payment...'
                  : submitting
                  ? 'Opening Razorpay Gateway...'
                  : `Pay ${formattedSubtotal} with Razorpay`}
              </button>
            </form>
          </section>

          <aside className="checkout-summary-section">
            <div className="checkout-summary-card">
              <h3>2. Order Summary</h3>
              <div className="checkout-items-list">
                {cart.map((item) => {
                  const product = item.product || {};
                  const lineTotal = (product.price || 0) * (item.quantity || 1);
                  return (
                    <div key={product._id || item._id} className="checkout-item-row">
                      <div className="checkout-item-meta">
                        <span className="checkout-item-name">{product.name}</span>
                        <span className="checkout-item-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="checkout-item-total">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="summary-divider" />

              <div className="checkout-calc-row">
                <span>Total Items:</span>
                <strong>{totalQuantity}</strong>
              </div>
              <div className="checkout-calc-row">
                <span>Delivery:</span>
                <strong className="free-shipping">FREE</strong>
              </div>
              <div className="checkout-calc-row checkout-total-row">
                <span>Total Payable:</span>
                <strong>{formattedSubtotal}</strong>
              </div>

              <div className="security-badge">
                <span>🔒 Powered by Razorpay Standard Checkout (Test Mode)</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
