"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
          <p className="text-muted-foreground mb-4">
            Ha ocurrido un error al cargar esta sección.
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
          >
            Intentar nuevamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}