import React from 'react';

/**
 * Catches render-time errors in its subtree so a single broken page/tool shows
 * a readable message instead of blanking the entire app (React unmounts the
 * whole tree on an uncaught render error). Place one around the routed content
 * (keyed by route so navigating away resets it) and one at the app root.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface to the console for debugging; the UI shows it too.
    console.error('ErrorBoundary caught an error:', error, info?.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div style={{ padding: '2rem', maxWidth: 680, margin: '3rem auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F1C2E', margin: '0 0 8px' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#64748b', margin: '0 0 16px', fontSize: 14 }}>
          This section hit an unexpected error. The rest of the app still works — try again or head back to the dashboard.
        </p>
        <pre style={{
          background: '#fef2f2', color: '#991b1b', padding: 12, borderRadius: 8,
          fontSize: 12, lineHeight: 1.5, overflow: 'auto', whiteSpace: 'pre-wrap',
          border: '1px solid #fecaca', maxHeight: 280,
        }}>
          {String(error?.stack || error?.message || error)}
        </pre>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={this.handleReset}
            style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            Try again
          </button>
          <a
            href="/dashboard/home"
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#0F1C2E', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
          >
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }
}
