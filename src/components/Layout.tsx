// src/components/Layout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAppDispatch } from '../store/hooks';
import { logoutUser } from '../store/authSlice';
import '../styles/Global.css'; 

interface LayoutProps {
    children: ReactNode;
    pageTitle: string;
}

const Layout: React.FC<LayoutProps> = ({ children, pageTitle }) => {
    const dispatch = useAppDispatch();
    
    const handleLogout = () => {
        dispatch(logoutUser());
    };

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <header className="header">
                    <div className="header-title">{pageTitle}</div>
                    <button className="btn-logout" onClick={handleLogout}>Logout</button>
                </header>
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;