import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
    it("concatenates class names", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("handles conditional classes", () => {
        expect(cn("base", false && "hidden", "extra")).toBe("base extra");
    });

    it("handles undefined and null values", () => {
        expect(cn("base", undefined, null, "extra")).toBe("base extra");
    });

    it("merges conflicting Tailwind classes (last wins)", () => {
        expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });

    it("handles empty input", () => {
        expect(cn()).toBe("");
    });

    it("handles array input via clsx", () => {
        expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("handles object input via clsx", () => {
        expect(cn({ hidden: true, visible: false })).toBe("hidden");
    });
});
