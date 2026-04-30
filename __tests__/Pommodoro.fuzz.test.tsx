/**
 * Fuzz tests for the timer utility to ensure robust remaining-time
 * calculations across random inputs.
 *
 * @module __tests__/Pommodoro.fuzz.test
 */
import { calculateRemainingTime } from "../src/utils/timer";

describe("Fuzz Testing: calculateRemainingTime()", () => {
  test("never returns negative remaining time", () => {
    for (let i = 0; i < 500; i++) {
      const start = new Date(Date.now() - Math.random() * 1e7);
      const duration = Math.floor(Math.random() * 120); // 0–120 minutes

      const remaining = calculateRemainingTime(start, duration);

      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(remaining)).toBe(false);
    }
  });
});
