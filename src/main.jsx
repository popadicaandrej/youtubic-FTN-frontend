import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './AuthContext'
import { WatchPartyProvider } from './WatchPartyContext'
import './index.css'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <WatchPartyProvider>
                <App />
            </WatchPartyProvider>
        </AuthProvider>
    </React.StrictMode>
)