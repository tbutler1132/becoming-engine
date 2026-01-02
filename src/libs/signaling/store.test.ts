import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventLog } from "./store.js";
import { createEvent } from "./logic.js";
import type { SignalEvent } from "./types.js";

// Mock fs-extra
vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(),
    ensureDir: vi.fn(),
    appendFile: vi.fn(),
    readFile: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("node:fs/promises", () => ({
  open: vi.fn(),
}));

import fs from "fs-extra";
import { open as openFile } from "node:fs/promises";

describe("EventLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createTestEvent = (
    eventId: string,
    type: "intent" | "status" | "completion" = "intent",
  ): SignalEvent =>
    createEvent({
      eventId,
      nodeId: "personal",
      type,
      payload: { test: true },
      timestamp: "2026-01-02T12:00:00.000Z",
    });

  describe("emit", () => {
    it("appends new event to log file", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
      vi.mocked(fs.appendFile).mockResolvedValue(undefined as never);
      vi.mocked(fs.remove).mockResolvedValue(undefined as never);
      vi.mocked(openFile).mockResolvedValue({
        writeFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      } as never);

      const log = new EventLog();
      const event = createTestEvent("evt-001");

      const result = await log.emit(event);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true); // Event was appended
      }
      expect(fs.appendFile).toHaveBeenCalledWith(
        expect.stringContaining("events.jsonl"),
        expect.stringContaining('"eventId":"evt-001"'),
        "utf-8",
      );
    });

    it("returns ok(false) for duplicate eventId (idempotency)", async () => {
      // First call: file doesn't exist
      vi.mocked(fs.pathExists).mockResolvedValueOnce(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
      vi.mocked(fs.appendFile).mockResolvedValue(undefined as never);
      vi.mocked(fs.remove).mockResolvedValue(undefined as never);
      vi.mocked(openFile).mockResolvedValue({
        writeFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      } as never);

      const log = new EventLog();
      const event = createTestEvent("evt-duplicate");

      // First emit
      const result1 = await log.emit(event);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe(true); // First time: appended
      }

      // Second emit with same eventId (in-memory check)
      const result2 = await log.emit(event);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value).toBe(false); // Second time: already exists
      }

      // appendFile should only have been called once
      expect(fs.appendFile).toHaveBeenCalledTimes(1);
    });

    it("detects duplicate after reloading index from disk", async () => {
      const existingEvent = createTestEvent("evt-existing");
      const existingLine = JSON.stringify(existingEvent);

      // File exists with one event
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readFile).mockResolvedValue((existingLine + "\n") as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);

      const log = new EventLog();

      // Try to emit the same event that's already on disk
      const result = await log.emit(existingEvent);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false); // Already exists on disk
      }
      expect(fs.appendFile).not.toHaveBeenCalled();
    });
  });

  describe("consume", () => {
    it("returns empty array when no events exist", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);

      const log = new EventLog();
      const events = await log.consume();

      expect(events).toEqual([]);
    });

    it("returns all events from log file", async () => {
      const event1 = createTestEvent("evt-001", "intent");
      const event2 = createTestEvent("evt-002", "status");
      const content = [JSON.stringify(event1), JSON.stringify(event2)].join(
        "\n",
      );

      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readFile).mockResolvedValue((content + "\n") as never);

      const log = new EventLog();
      const events = await log.consume();

      expect(events).toHaveLength(2);
      expect(events[0]?.eventId).toBe("evt-001");
      expect(events[1]?.eventId).toBe("evt-002");
    });

    it("filters events by predicate", async () => {
      const event1 = createTestEvent("evt-001", "intent");
      const event2 = createTestEvent("evt-002", "status");
      const event3 = createTestEvent("evt-003", "intent");
      const content = [
        JSON.stringify(event1),
        JSON.stringify(event2),
        JSON.stringify(event3),
      ].join("\n");

      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readFile).mockResolvedValue((content + "\n") as never);

      const log = new EventLog();
      const intents = await log.consume((e) => e.type === "intent");

      expect(intents).toHaveLength(2);
      expect(intents.every((e) => e.type === "intent")).toBe(true);
    });

    it("skips malformed lines silently", async () => {
      const validEvent = createTestEvent("evt-valid");
      const content = [
        "not valid json",
        JSON.stringify(validEvent),
        '{"partial": "object"}', // Valid JSON but not a valid event
      ].join("\n");

      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readFile).mockResolvedValue((content + "\n") as never);

      const log = new EventLog();
      const events = await log.consume();

      expect(events).toHaveLength(1);
      expect(events[0]?.eventId).toBe("evt-valid");
    });
  });

  describe("emit and consume round-trip", () => {
    it("emitted events can be consumed", async () => {
      let fileContent = "";

      vi.mocked(fs.pathExists).mockImplementation(async (path) => {
        if (typeof path === "string" && path.includes("events.jsonl")) {
          return fileContent.length > 0;
        }
        return false;
      });
      vi.mocked(fs.readFile).mockImplementation(async () => fileContent);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
      vi.mocked(fs.appendFile).mockImplementation(async (_, data) => {
        fileContent += data;
      });
      vi.mocked(fs.remove).mockResolvedValue(undefined as never);
      vi.mocked(openFile).mockResolvedValue({
        writeFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      } as never);

      const log = new EventLog();

      // Emit two events
      const event1 = createTestEvent("evt-round-1");
      const event2 = createTestEvent("evt-round-2");

      await log.emit(event1);
      await log.emit(event2);

      // Create a new log instance to simulate fresh read
      const log2 = new EventLog();
      const events = await log2.consume();

      expect(events).toHaveLength(2);
      expect(events[0]?.eventId).toBe("evt-round-1");
      expect(events[1]?.eventId).toBe("evt-round-2");
    });
  });

  describe("idempotency proof", () => {
    it("emitting same eventId multiple times results in single event stored", async () => {
      let appendCount = 0;

      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
      vi.mocked(fs.appendFile).mockImplementation(async () => {
        appendCount++;
      });
      vi.mocked(fs.remove).mockResolvedValue(undefined as never);
      vi.mocked(openFile).mockResolvedValue({
        writeFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      } as never);

      const log = new EventLog();
      const event = createTestEvent("evt-idempotent");

      // Emit the same event 5 times
      for (let i = 0; i < 5; i++) {
        await log.emit(event);
      }

      // Should only have appended once
      expect(appendCount).toBe(1);
    });

    it("different eventIds are all stored", async () => {
      let appendCount = 0;

      vi.mocked(fs.pathExists).mockResolvedValue(false as never);
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
      vi.mocked(fs.appendFile).mockImplementation(async () => {
        appendCount++;
      });
      vi.mocked(fs.remove).mockResolvedValue(undefined as never);
      vi.mocked(openFile).mockResolvedValue({
        writeFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      } as never);

      const log = new EventLog();

      // Emit 5 different events
      for (let i = 0; i < 5; i++) {
        await log.emit(createTestEvent(`evt-unique-${i}`));
      }

      // Should have appended all 5
      expect(appendCount).toBe(5);
    });
  });
});
