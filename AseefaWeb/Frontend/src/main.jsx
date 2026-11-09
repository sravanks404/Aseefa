import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { PermissionProvider } from './context/permissionContex'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App render error caught by ErrorBoundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#d9534f' }}>Something went wrong</h2>
          <p style={{ color: '#666' }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => { sessionStorage.clear(); window.location.href = '/'; }}
            style={{ padding: '10px 20px', background: '#10299b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PermissionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PermissionProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
