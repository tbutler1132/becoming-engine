import { describe, it, expect } from "vitest";
import { inferStatus, inferStatusForVariable } from "./inference.js";
import type { Proxy, ProxyReading } from "../../memory/index.js";

describe("Status Inference", () => {
  describe("inferStatus", () => {
    it("returns null for non-numeric proxies", () => {
      const proxy: Proxy = {
        id: "proxy-1",
        variableId: "var-1",
        name: "Sleep Quality",
        valueType: "categorical",
      };

      const result = inferStatus(proxy, []);
      expect(result).toBeNull();
    });

    it("returns null for numeric proxy without thresholds", () => {
      const proxy: Proxy = {
        id: "proxy-1",
        variableId: "var-1",
        name: "Sleep Hours",
        valueType: "numeric",
      };

      const result = inferStatus(proxy, []);
      expect(result).toBeNull();
    });

    it("returns null when no readings provided", () => {
      const proxy: Proxy = {
        id: "proxy-1",
        variableId: "var-1",
        name: "Sleep Hours",
        valueType: "numeric",
        thresholds: {
          lowBelow: 6,
          highAbove: 9,
        },
      };

      const result = inferStatus(proxy, []);
      expect(result).toBeNull();
    });

    it("suggests Low when average is below lowBelow threshold", () => {
      const proxy: Proxy = {
        id: "proxy-1",
        variableId: "var-1",
        name: "Sleep Hours",
        valueType: "numeric",
        thresholds: {
          lowBelow: 6,
          highAbove: 9,
        },
      };

      const readings: ProxyReading[] = [
        {
          id: "r1",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 5 },
          recordedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "r2",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 4 },
          recordedAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      const result = inferStatus(proxy, readings);
      expect(result).not.toBeNull();
      expect(result?.suggestedStatus).toBe("Low");
      expect(result?.variableId).toBe("var-1");
      expect(result?.basedOn).toEqual(["r1", "r2"]);
    });

    it("suggests High when average is above highAbove threshold", () => {
      const proxy: Proxy = {
        id: "proxy-1",
        variableId: "var-1",
        name: "Sleep Hours",
        valueType: "numeric",
        thresholds: {
          lowBelow: 6,
          highAbove: 9,
        },
      };

      const readings: ProxyReading[] = [
        {
          id: "r1",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 10 },
          recordedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "r2",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 11 },
          recordedAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      const result = inferStatus(proxy, readings);
      expect(result).not.toBeNull();
      expect(result?.suggestedStatus).toBe("High");
    });

    it("suggests InRange when average is within thresholds", () => {
      const proxy: Proxy = {
        id: "proxy-1",
        variableId: "var-1",
        name: "Sleep Hours",
        valueType: "numeric",
        thresholds: {
          lowBelow: 6,
          highAbove: 9,
        },
      };

      const readings: ProxyReading[] = [
        {
          id: "r1",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 7 },
          recordedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "r2",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 8 },
          recordedAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      const result = inferStatus(proxy, readings);
      expect(result).not.toBeNull();
      expect(result?.suggestedStatus).toBe("InRange");
    });

    it("has higher confidence with consistent readings", () => {
      const proxy: Proxy = {
        id: "proxy-1",
        variableId: "var-1",
        name: "Sleep Hours",
        valueType: "numeric",
        thresholds: {
          lowBelow: 6,
          highAbove: 9,
        },
      };

      const consistentReadings: ProxyReading[] = [
        {
          id: "r1",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 7 },
          recordedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "r2",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 7 },
          recordedAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      const variableReadings: ProxyReading[] = [
        {
          id: "r3",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 5 },
          recordedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "r4",
          proxyId: "proxy-1",
          value: { type: "numeric", value: 9 },
          recordedAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      const consistentResult = inferStatus(proxy, consistentReadings);
      const variableResult = inferStatus(proxy, variableReadings);

      expect(consistentResult?.confidence).toBeGreaterThan(
        variableResult?.confidence ?? 0,
      );
    });
  });

  describe("inferStatusForVariable", () => {
    it("returns null when no proxies can infer", () => {
      const proxies: Proxy[] = [
        {
          id: "proxy-1",
          variableId: "var-1",
          name: "Quality Rating",
          valueType: "categorical",
        },
      ];

      const result = inferStatusForVariable(proxies, new Map());
      expect(result).toBeNull();
    });

    it("returns suggestion from proxy with highest confidence", () => {
      const proxies: Proxy[] = [
        {
          id: "proxy-1",
          variableId: "var-1",
          name: "Sleep Hours",
          valueType: "numeric",
          thresholds: {
            lowBelow: 6,
            highAbove: 9,
          },
        },
        {
          id: "proxy-2",
          variableId: "var-1",
          name: "Sleep Score",
          valueType: "numeric",
          thresholds: {
            lowBelow: 50,
            highAbove: 90,
          },
        },
      ];

      // Proxy 1 has variable readings (lower confidence)
      // Proxy 2 has consistent readings (higher confidence)
      const readingsByProxyId = new Map<string, ProxyReading[]>([
        [
          "proxy-1",
          [
            {
              id: "r1",
              proxyId: "proxy-1",
              value: { type: "numeric", value: 5 },
              recordedAt: "2025-01-01T00:00:00.000Z",
            },
            {
              id: "r2",
              proxyId: "proxy-1",
              value: { type: "numeric", value: 9 },
              recordedAt: "2025-01-02T00:00:00.000Z",
            },
          ],
        ],
        [
          "proxy-2",
          [
            {
              id: "r3",
              proxyId: "proxy-2",
              value: { type: "numeric", value: 75 },
              recordedAt: "2025-01-01T00:00:00.000Z",
            },
            {
              id: "r4",
              proxyId: "proxy-2",
              value: { type: "numeric", value: 75 },
              recordedAt: "2025-01-02T00:00:00.000Z",
            },
          ],
        ],
      ]);

      const result = inferStatusForVariable(proxies, readingsByProxyId);
      expect(result).not.toBeNull();
      expect(result?.basedOn).toEqual(["r3", "r4"]); // Higher confidence proxy
    });
  });
});
