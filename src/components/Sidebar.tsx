// src/components/Sidebar.tsx - UPDATED VERSION
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
    const [isOpen, setIsOpen] = useState(false);
    const user = useAppSelector(selectUser);
    const isBoss = useAppSelector(selectIsBoss);

    // Dynamic dashboard link based on role
    const dashboardPath = isBoss ? "/dashboard/boss" : "/dashboard/manager";

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    // Navigation items with icons
    const navItems: Array<{ to: string; icon: React.ReactElement; label: string; className?: string }> = [
        { to: dashboardPath, icon: <Home size={20} />, label: 'Dashboard' },
        { to: "/products", icon: <Package size={20} />, label: 'Products' },
        { to: "/orders", icon: <ShoppingCart size={20} />, label: 'Sales' },
        { to: "/expenses", icon: <DollarSign size={20} />, label: 'Accounting' },
        { to: "/suppliers", icon: <Users size={20} />, label: 'Suppliers' },
        { to: "/po", icon: <FileText size={20} />, label: 'Purchase Orders' },
    ];

    // Add boss-only items
    if (isBoss) {
        navItems.push(
            { to: "/users", icon: <UserCircle size={20} />, label: 'Users', className: 'boss-only' },
            { to: "/reports", icon: <TrendingUp size={20} />, label: 'Advanced Reports', className: 'boss-only' }
        );
    }

    return (
        <>
            {/* Mobile Toggle Button */}
            <button className="sidebar-toggle" onClick={toggleSidebar}>
                ☰
            </button>

            {/* Overlay for mobile */}
            <div 
                className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
                onClick={closeSidebar}
            ></div>

            {/* Sidebar */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <h1 className="sidebar-logo">ELITE MOVERS</h1>
                
                <h3 className="sidebar-menu-title">MAIN MENU</h3>
                
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink 
                            key={item.to}
                            to={item.to} 
                            className={({ isActive }) => 
                                `nav-item ${isActive ? 'active' : ''} ${item.className || ''}`
                            }
                            onClick={closeSidebar}
                        >
                            <span className="nav-icon">
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                            {item.className === 'boss-only' && (
                                <span className="nav-badge">BOSS</span>
                            )}
                        </NavLink>
                    ))}
                </nav>
                
                <div className="sidebar-user-info">
                    <div className="user-name">{user?.name || 'User'}</div>
                    <div className="user-role">{user?.role || (isBoss ? 'Boss' : 'Manager')}</div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;