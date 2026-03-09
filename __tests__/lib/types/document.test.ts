import { describe, it, expect } from "vitest";
import { formatFileSize, mimeToDocType } from "@/lib/types/document";

describe("formatFileSize", () => {
    it("formats bytes", () => {
        expect(formatFileSize(500)).toBe("500 B");
    });

    it("formats 0 bytes", () => {
        expect(formatFileSize(0)).toBe("0 B");
    });

    it("formats kilobytes", () => {
        expect(formatFileSize(2048)).toBe("2.0 KB");
    });

    it("formats kilobytes with decimal", () => {
        expect(formatFileSize(1536)).toBe("1.5 KB");
    });

    it("formats megabytes", () => {
        expect(formatFileSize(1048576)).toBe("1.0 MB");
    });

    it("formats megabytes with decimal", () => {
        expect(formatFileSize(1572864)).toBe("1.5 MB");
    });

    it("formats large files", () => {
        expect(formatFileSize(5242880)).toBe("5.0 MB");
    });

    it("handles boundary at exactly 1024 (shows KB)", () => {
        expect(formatFileSize(1024)).toBe("1.0 KB");
    });

    it("handles boundary at exactly 1MB (shows MB)", () => {
        expect(formatFileSize(1024 * 1024)).toBe("1.0 MB");
    });
});

describe("mimeToDocType", () => {
    it("detects PDF", () => {
        expect(mimeToDocType("application/pdf")).toBe("pdf");
    });

    it("detects JPEG image", () => {
        expect(mimeToDocType("image/jpeg")).toBe("image");
    });

    it("detects PNG image", () => {
        expect(mimeToDocType("image/png")).toBe("image");
    });

    it("detects WebP image", () => {
        expect(mimeToDocType("image/webp")).toBe("image");
    });

    it("detects XLSX spreadsheet", () => {
        expect(
            mimeToDocType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        ).toBe("spreadsheet");
    });

    it("detects XLS spreadsheet", () => {
        expect(mimeToDocType("application/vnd.ms-excel")).toBe("spreadsheet");
    });

    it("detects AutoCAD plan (application/acad)", () => {
        expect(mimeToDocType("application/acad")).toBe("plan");
    });

    it("detects DWG plan (image/vnd.dwg)", () => {
        expect(mimeToDocType("image/vnd.dwg")).toBe("plan");
    });

    it("returns 'other' for unknown mime types", () => {
        expect(mimeToDocType("application/octet-stream")).toBe("other");
    });

    it("returns 'other' for text files", () => {
        expect(mimeToDocType("text/plain")).toBe("other");
    });

    it("returns 'other' for video files", () => {
        expect(mimeToDocType("video/mp4")).toBe("other");
    });
});
