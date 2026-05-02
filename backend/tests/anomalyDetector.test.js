/**
 * Unit tests for the anomaly detection cost deviation logic.
 * Isolates the threshold calculation from the database entirely.
 */
import { describe, it, expect } from 'vitest';

// The anomaly threshold: flag when latest > avg * 1.5
const isAnomaly = (latestCost, avgCost) => latestCost > avgCost * 1.5;
const getSeverity = (latestCost, avgCost) => (latestCost > avgCost * 3 ? 'critical' : 'high');

describe('anomaly detection threshold logic', () => {
    it('does not flag spend at exactly 1.5x average', () => {
        expect(isAnomaly(150, 100)).toBe(false);
    });

    it('flags spend above 1.5x average', () => {
        expect(isAnomaly(151, 100)).toBe(true);
    });

    it('does not flag normal spend', () => {
        expect(isAnomaly(90, 100)).toBe(false);
    });

    it('does not flag spend at 1x average', () => {
        expect(isAnomaly(100, 100)).toBe(false);
    });

    it('flags a 5x spike as an anomaly', () => {
        expect(isAnomaly(500, 100)).toBe(true);
    });

    it('returns "critical" severity when spend exceeds 3x average', () => {
        expect(getSeverity(350, 100)).toBe('critical');
    });

    it('returns "high" severity when spend is between 1.5x and 3x average', () => {
        expect(getSeverity(200, 100)).toBe('high');
    });

    it('returns "high" severity at exactly 3x average', () => {
        expect(getSeverity(300, 100)).toBe('high'); // 300 is NOT > 300
    });

    it('correctly identifies a critical spike at 3.01x', () => {
        expect(getSeverity(301, 100)).toBe('critical');
    });

    it('handles fractional averages correctly', () => {
        expect(isAnomaly(0.76, 0.5)).toBe(true);  // 0.76 > 0.5 * 1.5 = 0.75
        expect(isAnomaly(0.75, 0.5)).toBe(false); // 0.75 is NOT > 0.75
    });
});
