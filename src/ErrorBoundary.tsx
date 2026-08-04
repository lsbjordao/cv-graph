import { Component, type ReactNode } from "react";

// Boundary temporário de debug: captura crashes de render e mostra o stack
// na própria página (já que o console do IAB está bloqueado para evaluate).
interface State {
  error: Error | null;
}
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("CAUGHT", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#fca5a5", background: "#1a0b0b", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap" }}>
          <h2 style={{ color: "#f87171", marginBottom: 12 }}>Runtime error</h2>
          <div>{this.state.error.message}</div>
          <pre style={{ marginTop: 12, opacity: 0.8 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
