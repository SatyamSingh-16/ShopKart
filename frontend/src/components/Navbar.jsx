import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar({ user, onLogout, loggingOut }) {
  const { totalUnits } = useCart();
  return (
    <header className="site-header">
      <div className="nav-inner">
        <Link className="brand" to="/home"><span className="brand-mark">S</span> ShopKart<span className="brand-dot">.</span></Link>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/home" className={({ isActive }) => isActive ? 'nav-active' : ''}>Home</NavLink>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'nav-active' : ''}>Products</NavLink>
          <NavLink to="/wishlist" className={({ isActive }) => isActive ? 'nav-active' : ''}>Wishlist</NavLink>
          <NavLink to="/cart" className={({ isActive }) => isActive ? 'nav-active' : ''}>Cart ({totalUnits})</NavLink>
          <NavLink to="/orders" className={({ isActive }) => isActive ? 'nav-active' : ''}>Orders</NavLink>
        </nav>
        <div className="nav-actions">
          <span className="nav-user" title={user.email}>Hi, {user.fullName.split(' ')[0]}</span>
          <button className="btn btn-outline btn-small" onClick={onLogout} disabled={loggingOut} type="button">{loggingOut ? 'Signing out…' : 'Log out'}</button>
        </div>
      </div>
    </header>
  );
}
