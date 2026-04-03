import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error("Rendering error:", error);
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
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
            We hit an unexpected problem while rendering this page. Refresh to
            try again, and if it keeps happening please contact support.
          </p>

          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
