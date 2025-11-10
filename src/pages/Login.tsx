// src/pages/Login.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, selectIsAuthenticated, selectIsBoss } from '../store/authSlice';
import '../styles/Global.css'; 

const Login: React.FC = () => {
    const [email, setEmail] = useState('elitemovers@boss.com'); // Default for faster testing
    const [password, setPassword] = useState('boss123'); // Default for faster testing
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const isBoss = useAppSelector(selectIsBoss);
    const error = useAppSelector(state => state.auth.error);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // --- Redirection Logic (Runs on component load and state change) ---
    useEffect(() => {
        if (isAuthenticated) {
            // Redirect based on role
            const redirectPath = isBoss ? '/dashboard/boss' : '/dashboard/manager';
            navigate(redirectPath, { replace: true });
        }
    }, [isAuthenticated, isBoss, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            await dispatch(loginUser({ email, password }));
            // Redirection happens in the useEffect hook after Redux state updates
        } catch (err) {
            // The error is already handled and stored in Redux state by the thunk
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthenticated) {
        return null; // Don't show login form if already authenticated, wait for redirect
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Elite Movers Login</h2>
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