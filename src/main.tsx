// src/main.tsx (or index.js/index.tsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // Import Provider
import { store } from './store/store'; // Import the store
import App from './App';
// @ts-ignore: allow side-effect CSS import without type declarations
import '../src/styles/Global.css'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Provider store={store}> {/* Wrap App in Redux Provider */}
            <App />
        </Provider>
    </React.StrictMode>,
);