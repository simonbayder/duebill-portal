import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e1e28',
              color: '#f0efe8',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px'
            },
            success: { iconTheme: { primary: '#4ecb71', secondary: '#0f0f13' } },
            error: { iconTheme: { primary: '#e85b5b', secondary: '#0f0f13' } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
