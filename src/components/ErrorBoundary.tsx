import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-4 text-red-600 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="mb-6 max-w-md text-muted-foreground">
            We're sorry, but an unexpected error has occurred. Please try refreshing the page.
          </p>
          
          <div className="mb-6 max-w-2xl overflow-auto rounded-lg bg-muted p-4 text-left font-mono text-xs text-muted-foreground">
            <p className="font-bold text-red-500">{this.state.error?.toString()}</p>
            {this.state.errorInfo && (
              <pre className="mt-2">{this.state.errorInfo.componentStack}</pre>
            )}
          </div>

          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
