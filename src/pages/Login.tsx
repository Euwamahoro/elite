// src/pages/Login.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, selectIsAuthenticated, selectIsBoss } from '../store/authSlice';
import '../styles/Global.css'; 

// Import the image from the imgs folder
import companyLogo from '/imgs/elite.png'; // Adjust path as needed

const Login: React.FC = () => {
    const [email, setEmail] = useState('elitemovers@boss.com');
    const [password, setPassword] = useState('boss123');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isBoss = useAppSelector(selectIsBoss);
    const error = useAppSelector(state => state.auth.error);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            const redirectPath = isBoss ? '/dashboard/boss' : '/dashboard/manager';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, isBoss, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            await dispatch(loginUser({ email, password }));
        } catch (err) {
            // Error handled by Redux
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                {/* Company Logo */}
                <div className="login-logo-container">
                    <img 
                        src={companyLogo} 
                        alt="Elite Movers Logo" 
                        className="login-logo"
                    />
                </div>
                    {error && <p className="error-message">{error}</p>}
                
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="elitemovers@manager.com"
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Logging In...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;