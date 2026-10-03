import { describe, expect, it } from 'vitest';
import { computePriorityScore, estimateSentiment, categorizeFeedback, validateDate, validateInput, parseJsonImport, getKpiMetrics, buildSampleData } from './logic';

describe('priority scoring', () => {
  it('returns the expected score for known inputs', () => {
    const score = computePriorityScore({
      customerValue: 9,
      businessImpact: 8,
      confidence: 7,
      strategicAlignment: 9,
    });
    expect(score).toBe(8.3);
  });

  it('handles empty or invalid values gracefully', () => {
    expect(computePriorityScore({ customerValue: '', businessImpact: null, confidence: undefined, strategicAlignment: 'X' })).toBe(0);
  });
});

describe('sentiment and classification', () => {
  it('estimates positive sentiment for happy customer feedback', () => {
    expect(estimateSentiment('love the new feature and it works great')).toBe('positive');
  });

  it('detects negative sentiment from issue language', () => {
    expect(estimateSentiment('the dashboard is slow and the crash is frustrating')).toBe('negative');
  });

  it('categorizes feedback based on keywords', () => {
    expect(categorizeFeedback('Dashboard crashes on load', 'The analytics screen fails to load when filters change.', 'bug')).toBe('Bug');
  });
});

describe('validation', () => {
  it('accepts valid dates', () => {
    expect(validateDate('2026-10-03')).toBe('');
  });

  it('rejects invalid dates', () => {
    expect(validateDate('not-a-date')).toBe('Invalid date');
  });

  it('returns validation errors for invalid inputs', () => {
    expect(validateInput({ title: '', description: '', score: 11, satisfaction: 0, impact: 0 })).toMatchObject({
      title: 'Title is required',
      description: 'Description is required',
      satisfaction: 'Satisfaction must be between 1 and 5',
      impact: 'Impact must be between 1 and 10',
      score: 'Score must be between 1 and 10',
    });
  });
});

describe('json import and KPI utilities', () => {
  it('clearly rejects invalid JSON', () => {
    expect(parseJsonImport('{bad json')).toMatchObject({ ok: false });
  });

  it('computes KPI metrics from sample data', () => {
    const sample = buildSampleData();
    const metrics = getKpiMetrics(sample.feedback, sample.features, sample.roadmap);
    expect(metrics.totalFeedback).toBe(3);
    expect(metrics.customerSatisfaction).toBeGreaterThan(0);
  });
});
