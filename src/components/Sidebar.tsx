// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectIsBoss } from '../store/authSlice';
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
                <h1 className="sidebar-logo">ts</h1>
                <h3 className="sidebar-menu-title">MENU</h3>
                <nav className="sidebar-nav">
                    <NavLink 
                        to={dashboardPath} 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                        onClick={closeSidebar}
                    >
                        Dashboard
                    </NavLink>
                    
                    <NavLink 
                        to="/products" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                        onClick={closeSidebar}
                    >
                        Products
                    </NavLink>

                    <NavLink 
                        to="/orders" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                        onClick={closeSidebar}
                    >
                        Orders
                    </NavLink>

                    <NavLink 
                        to="/expenses" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                        onClick={closeSidebar}
                    >
                        Accounting
                    </NavLink>

                    <NavLink 
                        to="/po" 
                        className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
                        onClick={closeSidebar}
                    >
                        Purchase Orders
                    </NavLink>
                </nav>
                <div className="sidebar-user-info">
                    <span className="user-role">{user?.name} ({user?.role})</span>
                </div>
            </div>
        </>
    );
};

export default Sidebar;