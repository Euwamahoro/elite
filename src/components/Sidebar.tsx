import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsBoss } from '../store/authSlice';
import { 
  Home, Package, ShoppingCart, DollarSign, 
  Users, FileText, UserCircle, TrendingUp
} from 'lucide-react';
import '../styles/Sidebar.css';

const Sidebar: React.FC = () => {
    const [isHovering, setIsHovering] = useState(false);
    const user = useAppSelector(selectUser);
    const isBoss = useAppSelector(selectIsBoss);

    const dashboardPath = isBoss ? "/dashboard/boss" : "/dashboard/manager";

    const navItems: Array<{ to: string; icon: React.ReactElement; label: string; className?: string }> = [
        { to: dashboardPath,  icon: <Home size={18} />,         label: 'Dashboard' },
        { to: "/products",    icon: <Package size={18} />,      label: 'Products' },
        { to: "/orders",      icon: <ShoppingCart size={18} />, label: 'Sales' },
        { to: "/expenses",    icon: <DollarSign size={18} />,   label: 'Accounting' },
        { to: "/suppliers",   icon: <Users size={18} />,        label: 'Suppliers' },
        { to: "/po",          icon: <FileText size={18} />,     label: 'Purchase Orders' },
    ];

    if (isBoss) {
        navItems.push(
            { to: "/users",   icon: <UserCircle size={18} />, label: 'Users',            className: 'boss-only' },
            { to: "/reports", icon: <TrendingUp size={18} />, label: 'Advanced Reports', className: 'boss-only' }
        );
    }

    return (
        <>
            {/* Invisible hover trigger on left edge */}
            <div
                className="sidebar-trigger"
                onMouseEnter={() => setIsHovering(true)}
            />

            {/* Full-page blur overlay — sits behind sidebar, blurs the page */}
            <div
                className={`sidebar-overlay ${isHovering ? 'visible' : ''}`}
                onMouseEnter={() => setIsHovering(false)}
            />

            <div
                className={`sidebar-popup ${isHovering ? 'visible' : ''}`}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Logo */}
                <div className="sidebar-logo-container">
                    <div className="sidebar-logo">EM</div>
                </div>

                {/* Navigation */}
                <div className="sidebar-nav">
                    {navItems.map((item, index) => (
                        <React.Fragment key={item.to}>
                            {index > 0 && (
                                <div className={`nav-connector ${item.className === 'boss-only' && index === navItems.findIndex(i => i.className === 'boss-only') ? 'nav-connector--boss' : ''}`} />
                            )}
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''} ${item.className || ''}`
                                }
                            >
                                <div className="nav-circle">
                                    <span className="nav-icon">{item.icon}</span>
                                </div>
                                <span className="nav-label">
                                    {item.label}
                                    {item.className === 'boss-only' && (
                                        <span className="nav-badge">BOSS</span>
                                    )}
                                </span>
                            </NavLink>
                        </React.Fragment>
                    ))}
                </div>

                {/* User Info */}
                <div className="sidebar-user-info">
                    <div className="user-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-details">
                        <div className="user-name">{user?.name || 'User'}</div>
                        <div className="user-role">{user?.role || (isBoss ? 'Boss' : 'Manager')}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;