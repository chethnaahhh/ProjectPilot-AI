export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const sentimentFromScore = (score) => {
  const val = safeNumber(score, 0);
  if (val >= 4) return 'positive';
  if (val <= 2) return 'negative';
  return 'neutral';
};

export const estimateSentiment = (text = '') => {
  const lower = String(text).toLowerCase();
  const tokens = lower.match(/[a-z']+/g) || [];
  const positives = ['love', 'great', 'excellent', 'easy', 'fast', 'helps', 'amazing', 'smooth', 'clear', 'useful', 'happy'];
  const negatives = ['bug', 'slow', 'broken', 'confusing', 'hard', 'issue', 'missing', 'frustrating', 'bad', 'error', 'poor'];

  let score = 0;
  tokens.forEach((token) => {
    if (positives.includes(token)) score += 1;
    if (negatives.includes(token)) score -= 1;
  });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
};

export const categorizeFeedback = (title = '', description = '', type = 'general') => {
  const text = `${title} ${description}`.toLowerCase();
  const mappings = [
    { category: 'Bug', keywords: ['bug', 'error', 'crash', 'broken', 'fail', 'issue'] },
    { category: 'Performance', keywords: ['slow', 'loading', 'latency', 'performance', 'speed', 'lag'] },
    { category: 'UX', keywords: ['ui', 'ux', 'design', 'button', 'navigation', 'workflow', 'confusing'] },
    { category: 'Feature Request', keywords: ['feature', 'request', 'need', 'want', 'ability', 'integration'] },
    { category: 'Pricing', keywords: ['price', 'pricing', 'cost', 'value', 'plan', 'billing'] },
  ];

  const match = mappings.find(({ keywords }) => keywords.some((kw) => text.includes(kw)));
  if (match) return match.category;

  return type === 'feature_request' ? 'Feature Request' : 'General Feedback';
};

export const deriveKeywords = (text = '') => {
  const words = String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !['with', 'from', 'that', 'this', 'into', 'have', 'will', 'they', 'them'].includes(word));

  const map = {};
  words.forEach((word) => {
    map[word] = (map[word] || 0) + 1;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
};

export const groupSimilarFeedback = (items = []) => {
  const groups = {};
  items.forEach((item) => {
    const key = (item.productArea || 'General').toLowerCase();
    groups[key] = groups[key] || { productArea: item.productArea || 'General', count: 0 };
    groups[key].count += 1;
  });
  return Object.values(groups).sort((a, b) => b.count - a.count);
};

export const computePriorityScore = ({ customerValue, businessImpact, confidence, strategicAlignment }) => {
  const cv = safeNumber(customerValue, 0);
  const bi = safeNumber(businessImpact, 0);
  const co = safeNumber(confidence, 0);
  const sa = safeNumber(strategicAlignment, 0);

  const score = (cv * 0.3) + (bi * 0.3) + (co * 0.2) + (sa * 0.2);
  return Number(score.toFixed(2));
};

export const validateDate = (value) => {
  if (!value) return 'Date is required';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return '';
};

export const validateInput = ({ title, description, score, satisfaction, impact }) => {
  const errors = {};

  if (!title || !String(title).trim()) errors.title = 'Title is required';
  if (!description || !String(description).trim()) errors.description = 'Description is required';

  const sat = safeNumber(satisfaction, -1);
  if (sat < 1 || sat > 5) errors.satisfaction = 'Satisfaction must be between 1 and 5';

  const imp = safeNumber(impact, -1);
  if (imp < 1 || imp > 10) errors.impact = 'Impact must be between 1 and 10';

  const scoreNum = safeNumber(score, -1);
  if (scoreNum < 1 || scoreNum > 10) errors.score = 'Score must be between 1 and 10';

  return errors;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

export const getReleaseProgress = (roadmap = []) => {
  if (!roadmap.length) return 0;
  const done = roadmap.filter((item) => item.status === 'released' || item.status === 'done').length;
  return Math.round((done / roadmap.length) * 100);
};

export const getKpiMetrics = (feedback = [], features = [], roadmap = []) => {
  const totalFeedback = feedback.length;
  const positive = feedback.filter((item) => ['positive', 'great'].includes(item.sentiment)).length;
  const satisfaction = totalFeedback
    ? (feedback.reduce((sum, item) => sum + safeNumber(item.satisfactionScore || item.score, 0), 0) / totalFeedback).toFixed(2)
    : '0.00';

  const adoption = features.length
    ? (features.filter((item) => item.status === 'in_development' || item.status === 'released').length / features.length * 100).toFixed(1)
    : '0.0';

  const resolution = totalFeedback
    ? ((feedback.filter((item) => item.status === 'resolved').length / totalFeedback) * 100).toFixed(1)
    : '0.0';

  const releaseProgress = getReleaseProgress(roadmap);

  return {
    totalFeedback,
    customerSatisfaction: Number(satisfaction),
    featureAdoption: Number(adoption),
    feedbackResolutionRate: Number(resolution),
    releaseProgress,
    positiveFeedback: positive,
    negativeFeedback: feedback.filter((item) => item.sentiment === 'negative').length,
  };
};

export const parseJsonImport = (data) => {
  if (!data || typeof data !== 'string') return { ok: false, error: 'No data provided' };

  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') throw new Error('JSON must parse to an object');
    return { ok: true, data: parsed };
  } catch (error) {
    return { ok: false, error: 'Invalid JSON import' };
  }
};

export const buildSampleData = () => ({
  feedback: [
    {
      id: 'fb-1',
      customer: 'Alicia M.',
      segment: 'Product Team',
      title: 'Dashboard loading is too slow',
      description: 'The analytics dashboard takes too long to load when filtering by quarter.',
      type: 'bug',
      productArea: 'Analytics',
      impact: 9,
      satisfactionScore: 2,
      sentiment: 'negative',
      status: 'open',
      submittedAt: '2026-09-10',
      category: 'Bug',
      keywords: ['dashboard', 'slow', 'loading'],
    },
    {
      id: 'fb-2',
      customer: 'Carlos P.',
      segment: 'Enterprise',
      title: 'Need roadmap visibility for executive reviews',
      description: 'We need a clearer roadmap view and milestone summary for leadership planning.',
      type: 'feature_request',
      productArea: 'Roadmap',
      impact: 8,
      satisfactionScore: 4,
      sentiment: 'positive',
      status: 'triaged',
      submittedAt: '2026-09-14',
      category: 'Feature Request',
      keywords: ['roadmap', 'visibility', 'review'],
    },
    {
      id: 'fb-3',
      customer: 'Maya R.',
      segment: 'Customer Success',
      title: 'Filtering by customer segment is confusing',
      description: 'The filters are unclear and the sorting logic feels inconsistent for customer cohorts.',
      type: 'bug',
      productArea: 'UX',
      impact: 6,
      satisfactionScore: 3,
      sentiment: 'neutral',
      status: 'in_progress',
      submittedAt: '2026-09-18',
      category: 'UX',
      keywords: ['filtering', 'customer', 'confusing'],
    },
  ],
  features: [
    {
      id: 'feat-1',
      name: 'Executive Roadmap Snapshot',
      description: 'A compact roadmap overview for leadership planning and release visibility.',
      customerValue: 9,
      businessImpact: 8,
      confidence: 7,
      strategicAlignment: 9,
      effort: 4,
      targetCustomers: 'Executives, PMs',
      supportingFeedback: ['fb-2'],
      priority: 1,
      status: 'planned',
      category: 'Feature Request',
    },
    {
      id: 'feat-2',
      name: 'Performance Dashboard Optimization',
      description: 'Reduce analytics load time and improve filter responsiveness.',
      customerValue: 8,
      businessImpact: 9,
      confidence: 8,
      strategicAlignment: 8,
      effort: 5,
      targetCustomers: 'All users',
      supportingFeedback: ['fb-1'],
      priority: 2,
      status: 'in_development',
      category: 'Bug',
    },
  ],
  roadmap: [
    {
      id: 'rw-1',
      title: 'Executive Roadmap Snapshot',
      status: 'now',
      priority: 'high',
      featureOwner: 'PM',
      startDate: '2026-10-01',
      targetDate: '2026-10-15',
      milestone: 'Alpha release',
      dependencies: 'Stakeholder sign-off',
    },
    {
      id: 'rw-2',
      title: 'Dashboard Performance Improvements',
      status: 'next',
      priority: 'medium',
      featureOwner: 'Engineering',
      startDate: '2026-10-16',
      targetDate: '2026-11-01',
      milestone: 'Beta testing',
      dependencies: 'Analytics instrumentation',
    },
  ],
  prds: [
    {
      id: 'prd-1',
      name: 'Executive Roadmap Snapshot',
      content: '# Executive Roadmap Snapshot\n\n## Problem Statement\nLeadership needs a summarized view ...',
      updatedAt: new Date().toISOString(),
    },
  ],
});
