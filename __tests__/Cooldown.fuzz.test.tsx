import { canCheckIn } from "../src/utils/cooldown";

describe("Fuzz Testing: canCheckIn()", () => {
  test("handles random timestamps without crashing", () => {
    for (let i = 0; i < 500; i++) {
      const now = new Date();

      // Random offset between -24h and +24h
      const offsetMinutes = Math.floor(Math.random() * 2880) - 1440;
      const lastCheckin = new Date(
        now.getTime() + offsetMinutes * 60 * 1000
      );

      expect(() => canCheckIn(lastCheckin, now)).not.toThrow();
    }
  });

  test("always returns a boolean for random inputs", () => {
    for (let i = 0; i < 500; i++) {
      const now = new Date();
      const randomOffset = Math.floor(Math.random() * 1e7);
      const randomDate = new Date(now.getTime() + randomOffset);

      const result = canCheckIn(randomDate, now);

      expect(typeof result).toBe("boolean");
    }
  });
});
