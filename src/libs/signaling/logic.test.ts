import { describe, it, expect } from "vitest";
import { createEvent, isValidEvent } from "./logic.js";
import type { CreateSignalEventParams, SignalEvent } from "./types.js";

describe("Signaling Logic", () => {
  const validParams: CreateSignalEventParams = {
    eventId: "evt-123",
    nodeId: "personal",
    type: "intent",
    payload: { action: "test" },
    timestamp: "2026-01-02T12:00:00.000Z",
  };

  describe("createEvent", () => {
    it("creates a valid SignalEvent from params", () => {
      const event = createEvent(validParams);

      expect(event.eventId).toBe("evt-123");
      expect(event.nodeId).toBe("personal");
      expect(event.type).toBe("intent");
      expect(event.payload).toEqual({ action: "test" });
      expect(event.timestamp).toBe("2026-01-02T12:00:00.000Z");
    });

    it("creates events for all valid types", () => {
      const types = ["intent", "status", "completion"] as const;

      for (const type of types) {
        const event = createEvent({ ...validParams, type });
        expect(event.type).toBe(type);
      }
    });

    it("preserves arbitrary payload shapes", () => {
      const payloads = [
        null,
        "string payload",
        42,
        { nested: { deep: true } },
        [1, 2, 3],
      ];

      for (const payload of payloads) {
        const event = createEvent({ ...validParams, payload });
        expect(event.payload).toEqual(payload);
      }
    });
  });

  describe("isValidEvent", () => {
    it("returns true for valid events", () => {
      const event: SignalEvent = {
        eventId: "evt-123",
        nodeId: "personal",
        type: "intent",
        payload: { data: "test" },
        timestamp: "2026-01-02T12:00:00.000Z",
      };

      expect(isValidEvent(event)).toBe(true);
    });

    it("returns true for all valid event types", () => {
      const types = ["intent", "status", "completion"] as const;

      for (const type of types) {
        const event = { ...createEvent(validParams), type };
        expect(isValidEvent(event)).toBe(true);
      }
    });

    it("returns false for null", () => {
      expect(isValidEvent(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isValidEvent(undefined)).toBe(false);
    });

    it("returns false for non-object types", () => {
      expect(isValidEvent("string")).toBe(false);
      expect(isValidEvent(123)).toBe(false);
      expect(isValidEvent(true)).toBe(false);
    });

    it("returns false for missing eventId", () => {
      const event = {
        nodeId: "personal",
        type: "intent",
        payload: {},
        timestamp: "2026-01-02T12:00:00.000Z",
      };
      expect(isValidEvent(event)).toBe(false);
    });

    it("returns false for empty eventId", () => {
      const event = {
        eventId: "",
        nodeId: "personal",
        type: "intent",
        payload: {},
        timestamp: "2026-01-02T12:00:00.000Z",
      };
      expect(isValidEvent(event)).toBe(false);
    });

    it("returns false for missing nodeId", () => {
      const event = {
        eventId: "evt-123",
        type: "intent",
        payload: {},
        timestamp: "2026-01-02T12:00:00.000Z",
      };
      expect(isValidEvent(event)).toBe(false);
    });

    it("returns false for missing type", () => {
      const event = {
        eventId: "evt-123",
        nodeId: "personal",
        payload: {},
        timestamp: "2026-01-02T12:00:00.000Z",
      };
      expect(isValidEvent(event)).toBe(false);
    });

    it("returns false for invalid type", () => {
      const event = {
        eventId: "evt-123",
        nodeId: "personal",
        type: "invalid_type",
        payload: {},
        timestamp: "2026-01-02T12:00:00.000Z",
      };
      expect(isValidEvent(event)).toBe(false);
    });

    it("returns false for missing payload", () => {
      const event = {
        eventId: "evt-123",
        nodeId: "personal",
        type: "intent",
        timestamp: "2026-01-02T12:00:00.000Z",
      };
      expect(isValidEvent(event)).toBe(false);
    });

    it("returns false for missing timestamp", () => {
      const event = {
        eventId: "evt-123",
        nodeId: "personal",
        type: "intent",
        payload: {},
      };
      expect(isValidEvent(event)).toBe(false);
    });

    it("accepts null as valid payload", () => {
      const event = {
        eventId: "evt-123",
        nodeId: "personal",
        type: "intent",
        payload: null,
        timestamp: "2026-01-02T12:00:00.000Z",
      };
      expect(isValidEvent(event)).toBe(true);
    });
  });
});
