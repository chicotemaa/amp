import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "@/components/error-boundary";

// Component that will throw an error on demand
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error("Test error");
    }
    return <div>Child rendered successfully</div>;
}

// Suppress console.error for expected errors in tests
const originalConsoleError = console.error;
beforeEach(() => {
    console.error = vi.fn();
});
afterEach(() => {
    console.error = originalConsoleError;
});

describe("ErrorBoundary", () => {
    it("renders children when no error occurs", () => {
        render(
            <ErrorBoundary>
                <div>Hello World</div>
            </ErrorBoundary>
        );

        expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("renders default fallback when an error occurs", () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Algo salió mal")).toBeInTheDocument();
        expect(
            screen.getByText("Ha ocurrido un error al cargar esta sección.")
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /intentar nuevamente/i })
        ).toBeInTheDocument();
    });

    it("renders custom fallback when provided", () => {
        const customFallback = <div>Custom Error UI</div>;

        render(
            <ErrorBoundary fallback={customFallback}>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Custom Error UI")).toBeInTheDocument();
        expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
    });

    it("logs the error to console", () => {
        render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(console.error).toHaveBeenCalled();
    });

    it("retry button resets the error state", async () => {
        const user = userEvent.setup();

        const { rerender } = render(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={true} />
            </ErrorBoundary>
        );

        // Should show error initially
        expect(screen.getByText("Algo salió mal")).toBeInTheDocument();

        // Rerender with shouldThrow=false so that when ErrorBoundary retries, it succeeds
        rerender(
            <ErrorBoundary>
                <ThrowingChild shouldThrow={false} />
            </ErrorBoundary>
        );

        // Click retry
        const retryButton = screen.getByRole("button", {
            name: /intentar nuevamente/i,
        });
        await user.click(retryButton);

        // Should recover
        expect(screen.getByText("Child rendered successfully")).toBeInTheDocument();
        expect(screen.queryByText("Algo salió mal")).not.toBeInTheDocument();
    });
});
