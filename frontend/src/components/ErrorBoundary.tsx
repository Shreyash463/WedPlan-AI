import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for diagnostics
    console.error("WedPlan AI captured UI error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            maxWidth: "600px",
            margin: "4rem auto",
            padding: "2rem",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            textAlign: "center",
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2 style={{ fontSize: "1.5rem", color: "#1f2937", marginBottom: "0.5rem" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
            WedPlan AI encountered an unexpected rendering error. Your data in local storage remains safe.
          </p>
          {this.state.error && (
            <pre
              style={{
                textAlign: "left",
                backgroundColor: "#f9fafb",
                padding: "0.75rem",
                borderRadius: "6px",
                fontSize: "0.8rem",
                color: "#dc2626",
                overflowX: "auto",
                marginBottom: "1.5rem",
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                backgroundColor: "#d97706",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.6rem 1.25rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                backgroundColor: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "0.6rem 1.25rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
