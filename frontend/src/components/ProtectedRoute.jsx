import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getMe, logoutCustomer } from '../services/api';
import { CartProvider } from '../context/CartContext';
import Navbar from './Navbar';

export default function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    getMe()
      .then(({ data }) => { if (active) setUser(data); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    if (loggingOut) return;
    setLogoutError('');
    setLoggingOut(true);
    try {
      await logoutCustomer();
      navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError('Unable to log out. Please try again.');
      setLoggingOut(false);
    }
  }

  if (loading) return <div className="center-state" role="status">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <CartProvider>
      <div className="site-shell">
        <Navbar user={user} onLogout={handleLogout} loggingOut={loggingOut} />
        {logoutError && <p role="alert" className="page-alert">{logoutError}</p>}
        <main className="page-wrap"><Outlet context={{ user }} /></main>
        <footer className="footer">ShopKart · Developed with ❤️ by Satyam Singh · React, Express & MongoDB</footer>
      </div>
    </CartProvider>
  );
}
