import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { FilterProvider, useFilters } from "@/contexts/filter-context";

// Helper component that exposes filter context values for testing
function FilterConsumer() {
    const { filters, setFilters } = useFilters();
    return (
        <div>
            <span data-testid="searchTerm">{filters.searchTerm}</span>
            <span data-testid="sortBy">{filters.sortBy}</span>
            <span data-testid="statusCount">{filters.status.length}</span>
            <span data-testid="typeCount">{filters.type.length}</span>
            <span data-testid="dateCount">{filters.date.length}</span>
            <button
                data-testid="updateSearch"
                onClick={() =>
                    setFilters((prev) => ({ ...prev, searchTerm: "test query" }))
                }
            >
                Update Search
            </button>
            <button
                data-testid="updateSortBy"
                onClick={() =>
                    setFilters((prev) => ({ ...prev, sortBy: "oldest" }))
                }
            >
                Update Sort
            </button>
            <button
                data-testid="addStatus"
                onClick={() =>
                    setFilters((prev) => ({
                        ...prev,
                        status: [...prev.status, "in-progress"],
                    }))
                }
            >
                Add Status
            </button>
        </div>
    );
}

describe("FilterContext", () => {
    it("provides initial default values", () => {
        render(
            <FilterProvider>
                <FilterConsumer />
            </FilterProvider>
        );

        expect(screen.getByTestId("searchTerm").textContent).toBe("");
        expect(screen.getByTestId("sortBy").textContent).toBe("newest");
        expect(screen.getByTestId("statusCount").textContent).toBe("0");
        expect(screen.getByTestId("typeCount").textContent).toBe("0");
        expect(screen.getByTestId("dateCount").textContent).toBe("0");
    });

    it("updates searchTerm via setFilters", async () => {
        render(
            <FilterProvider>
                <FilterConsumer />
            </FilterProvider>
        );

        await act(async () => {
            screen.getByTestId("updateSearch").click();
        });

        expect(screen.getByTestId("searchTerm").textContent).toBe("test query");
    });

    it("updates sortBy via setFilters", async () => {
        render(
            <FilterProvider>
                <FilterConsumer />
            </FilterProvider>
        );

        await act(async () => {
            screen.getByTestId("updateSortBy").click();
        });

        expect(screen.getByTestId("sortBy").textContent).toBe("oldest");
    });

    it("can add to status array", async () => {
        render(
            <FilterProvider>
                <FilterConsumer />
            </FilterProvider>
        );

        expect(screen.getByTestId("statusCount").textContent).toBe("0");

        await act(async () => {
            screen.getByTestId("addStatus").click();
        });

        expect(screen.getByTestId("statusCount").textContent).toBe("1");
    });

    it("throws error when useFilters is used outside FilterProvider", () => {
        // Suppress console.error for expected error
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });

        expect(() => render(<FilterConsumer />)).toThrow(
            "useFilters must be used within a FilterProvider"
        );

        spy.mockRestore();
    });
});
