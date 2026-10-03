import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, LineChart, Line
} from 'recharts';
import {
  BarChart3, Bell, Briefcase, Download, FileText, Filter, FolderKanban, Gauge, LayoutDashboard, ListFilter, MessageSquareText, Plus, RefreshCcw, Search, Settings, Sparkles, Trash2, Users, Waypoints, ArrowRight, Calendar, CheckCircle2, Clock3, Target, Zap
} from 'lucide-react';
import { buildSampleData, computePriorityScore, deriveKeywords, categorizeFeedback, estimateSentiment, formatDate, getKpiMetrics, getReleaseProgress, parseJsonImport } from './utils/logic';

const STORAGE_KEY = 'productsense-state-v1';
const defaultForms = {
  feedback: {
    customer: '',
    segment: '',
    title: '',
    description: '',
    type: 'bug',
    productArea: 'Analytics',
    impact: 5,
    satisfactionScore: 3,
    sentiment: 'neutral',
    status: 'open',
    submittedAt: new Date().toISOString().slice(0, 10),
  },
  feature: {
    name: '',
    description: '',
    customerValue: 7,
    businessImpact: 7,
    confidence: 7,
    strategicAlignment: 7,
    effort: 3,
    targetCustomers: '',
    supportingFeedback: '',
    status: 'planned',
    category: 'Feature Request',
    priority: 1,
  },
  roadmap: {
    title: '',
    status: 'now',
    priority: 'medium',
    featureOwner: '',
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: '',
    milestone: '',
    dependencies: '',
  },
  prd: {
    name: '',
    problemStatement: '',
    personas: '',
    painPoints: '',
    productGoals: '',
    businessGoals: '',
    functionalRequirements: '',
    nonFunctionalRequirements: '',
    userStories: '',
    acceptanceCriteria: '',
    successMetrics: '',
    dependencies: '',
    risks: '',
    constraints: '',
    outOfScope: '',
    targetRelease: '',
  },
};

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'feedback', label: 'Customer Feedback', icon: MessageSquareText },
  { key: 'analysis', label: 'Feedback Analysis', icon: Sparkles },
  { key: 'prioritization', label: 'Feature Prioritization', icon: Target },
  { key: 'roadmap', label: 'Product Roadmap', icon: FolderKanban },
  { key: 'kpi', label: 'KPI Analytics', icon: BarChart3 },
  { key: 'prd', label: 'PRD Generator', icon: FileText },
  { key: 'insights', label: 'Product Insights', icon: Gauge },
  { key: 'settings', label: 'Settings & Data', icon: Settings },
];

const sentimentColors = {
  positive: '#16a34a',
  neutral: '#f59e0b',
  negative: '#ef4444',
};

const formatNumber = (num) => Number.isFinite(num) ? num.toFixed(1) : '0.0';

function App() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildSampleData();
      const parsed = JSON.parse(raw);
      return {
        feedback: Array.isArray(parsed.feedback) ? parsed.feedback : buildSampleData().feedback,
        features: Array.isArray(parsed.features) ? parsed.features : buildSampleData().features,
        roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap : buildSampleData().roadmap,
        prds: Array.isArray(parsed.prds) ? parsed.prds : buildSampleData().prds,
      };
    } catch {
      return buildSampleData();
    }
  });
  const [activeView, setActiveView] = useState('dashboard');
  const [feedbackForm, setFeedbackForm] = useState(defaultForms.feedback);
  const [featureForm, setFeatureForm] = useState(defaultForms.feature);
  const [roadmapForm, setRoadmapForm] = useState(defaultForms.roadmap);
  const [prdForm, setPrdForm] = useState(defaultForms.prd);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [roadmapFilter, setRoadmapFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [sortKey, setSortKey] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editingFeatureId, setEditingFeatureId] = useState(null);
  const [editingRoadmapId, setEditingRoadmapId] = useState(null);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const [importText, setImportText] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(''), 2500);
    return () => clearTimeout(timer);
  }, [notification]);

  const dashboardStats = useMemo(() => {
    const totalFeedback = state.feedback.length;
    const totalFeatures = state.features.length;
    const prioritizedFeatures = state.features.filter((f) => f.priority && f.priority > 0).length;
    const inDevelopment = state.features.filter((f) => f.status === 'in_development' || f.status === 'released').length;
    const avgSatisfaction = totalFeedback
      ? (state.feedback.reduce((sum, item) => sum + Number(item.satisfactionScore || 0), 0) / totalFeedback).toFixed(1)
      : '0.0';
    const avgAdoption = totalFeatures
      ? (state.features.reduce((sum, item) => sum + (Number(item.customerValue || 0) / 10), 0) / totalFeatures * 100).toFixed(1)
      : '0.0';

    const sentimentCounts = [{ name: 'Positive', value: state.feedback.filter((f) => f.sentiment === 'positive').length }, { name: 'Neutral', value: state.feedback.filter((f) => f.sentiment === 'neutral').length }, { name: 'Negative', value: state.feedback.filter((f) => f.sentiment === 'negative').length }];

    const problemData = Object.entries(state.feedback.reduce((acc, item) => {
      const key = item.productArea || 'General';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

    const prioritizedSummary = state.features.map((f) => ({
      name: f.name,
      score: computePriorityScore({
        customerValue: f.customerValue,
        businessImpact: f.businessImpact,
        confidence: f.confidence,
        strategicAlignment: f.strategicAlignment,
      }),
      effort: f.effort,
    })).sort((a, b) => b.score - a.score);

    return {
      totalFeedback,
      featuresRequested: totalFeatures,
      prioritizedFeatures,
      inDevelopment,
      customerSatisfaction: Number(avgSatisfaction),
      featureAdoption: Number(avgAdoption),
      sentimentCounts,
      problemData,
      prioritizedSummary,
      releaseMilestones: state.roadmap.slice(0, 5).map((item) => ({
        name: item.title,
        date: item.targetDate || item.startDate,
        status: item.status,
      })),
    };
  }, [state]);

  const filteredFeedback = useMemo(() => {
    const list = state.feedback.filter((item) => {
      const matchSearch = `${item.customer} ${item.title} ${item.description}`.toLowerCase().includes(search.toLowerCase());
      const matchFilter = feedbackFilter === 'all' || item.status === feedbackFilter || item.sentiment === feedbackFilter;
      return matchSearch && matchFilter;
    });

    return [...list].sort((a, b) => {
      const left = sortKey === 'submittedAt' ? new Date(a[sortKey] || 0).getTime() : Number(a[sortKey] || 0);
      const right = sortKey === 'submittedAt' ? new Date(b[sortKey] || 0).getTime() : Number(b[sortKey] || 0);
      return sortDirection === 'asc' ? left - right : right - left;
    });
  }, [state.feedback, search, feedbackFilter, sortKey, sortDirection]);

  const filteredFeatures = useMemo(() => {
    return state.features.filter((feature) => {
      const score = computePriorityScore(feature);
      if (featureFilter === 'all') return true;
      if (featureFilter === 'high') return score >= 7;
      if (featureFilter === 'medium') return score >= 4 && score < 7;
      return score < 4;
    });
  }, [state.features, featureFilter]);

  const roadmapFiltered = useMemo(() => {
    if (roadmapFilter === 'all') return state.roadmap;
    return state.roadmap.filter((item) => item.status === roadmapFilter || item.priority === roadmapFilter);
  }, [state.roadmap, roadmapFilter]);

  const analysisSummary = useMemo(() => {
    const feedback = state.feedback;
    const keywords = Object.entries(
      feedback.reduce((acc, item) => {
        const words = deriveKeywords(`${item.title} ${item.description}`);
        words.forEach(({ word, count }) => {
          acc[word] = (acc[word] || 0) + count;
        });
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([word, count]) => ({ word, count }));

    const categories = Object.entries(
      feedback.reduce((acc, item) => {
        const category = categorizeFeedback(item.title, item.description, item.type);
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    const sentimentSplit = [
      { name: 'Positive', value: feedback.filter((item) => item.sentiment === 'positive').length },
      { name: 'Neutral', value: feedback.filter((item) => item.sentiment === 'neutral').length },
      { name: 'Negative', value: feedback.filter((item) => item.sentiment === 'negative').length },
    ];

    return { keywords, categories, sentimentSplit };
  }, [state.feedback]);

  const insightSummary = useMemo(() => {
    const feedback = state.feedback;
    if (!feedback.length) {
      return 'No customer feedback available yet. Add feedback to generate evidence-based product recommendations.';
    }
    const negative = feedback.filter((item) => item.sentiment === 'negative');
    const productHotspots = Object.entries(
      feedback.reduce((acc, item) => {
        acc[item.productArea || 'General'] = (acc[item.productArea || 'General'] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    const observation = productHotspots ? `${productHotspots[0]} is the most active area with ${productHotspots[1]} feedback items.` : 'Customer feedback is spread evenly across product areas.';
    const recommendation = negative.length
      ? `Prioritize fixes related to ${productHotspots ? productHotspots[0] : 'customer pain points'} because ${negative.length} items are negative and indicate a need for immediate attention.`
      : 'Customer sentiment is healthy; focus on roadmap expansion and adoption metrics.';

    return `${observation} ${recommendation}`;
  }, [state.feedback]);

  const kpis = useMemo(() => getKpiMetrics(state.feedback, state.features, state.roadmap), [state]);

  const handleFeedbackSubmit = (event) => {
    event.preventDefault();
    const validationErrors = {};
    if (!feedbackForm.customer.trim()) validationErrors.customer = 'Customer name is required';
    if (!feedbackForm.title.trim()) validationErrors.title = 'Title is required';
    if (!feedbackForm.description.trim()) validationErrors.description = 'Description is required';
    if (feedbackForm.satisfactionScore < 1 || feedbackForm.satisfactionScore > 5) validationErrors.satisfactionScore = 'Score must be 1-5';
    if (feedbackForm.impact < 1 || feedbackForm.impact > 10) validationErrors.impact = 'Impact must be 1-10';

    if (Object.keys(validationErrors).length) {
      setErrors({ ...errors, feedback: validationErrors });
      setNotification('Please correct the feedback form errors.');
      return;
    }

    const payload = {
      ...feedbackForm,
      id: editingFeedbackId || `fb-${Date.now()}`,
      sentiment: feedbackForm.sentiment || estimateSentiment(`${feedbackForm.title} ${feedbackForm.description}`),
      category: categorizeFeedback(feedbackForm.title, feedbackForm.description, feedbackForm.type),
      keywords: deriveKeywords(`${feedbackForm.title} ${feedbackForm.description}`).map((k) => k.word),
    };

    setState((prev) => ({
      ...prev,
      feedback: editingFeedbackId
        ? prev.feedback.map((entry) => (entry.id === editingFeedbackId ? payload : entry))
        : [payload, ...prev.feedback],
    }));
    setFeedbackForm(defaultForms.feedback);
    setEditingFeedbackId(null);
    setErrors((prev) => ({ ...prev, feedback: {} }));
    setNotification(editingFeedbackId ? 'Feedback updated successfully.' : 'Feedback added successfully.');
  };

  const handleFeatureSubmit = (event) => {
    event.preventDefault();
    const normalized = {
      ...featureForm,
      supportingFeedback: featureForm.supportingFeedback ? featureForm.supportingFeedback.split(',').map((str) => str.trim()).filter(Boolean) : [],
    };
    const priorityScore = computePriorityScore(normalized);
    const payload = {
      ...normalized,
      id: editingFeatureId || `feat-${Date.now()}`,
      priority: Number(priorityScore.toFixed(2)),
    };

    setState((prev) => ({
      ...prev,
      features: editingFeatureId
        ? prev.features.map((entry) => (entry.id === editingFeatureId ? payload : entry))
        : [payload, ...prev.features],
    }));
    setFeatureForm(defaultForms.feature);
    setEditingFeatureId(null);
    setNotification(editingFeatureId ? 'Feature updated successfully.' : 'Feature created successfully.');
  };

  const handleRoadmapSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...roadmapForm,
      id: editingRoadmapId || `roadmap-${Date.now()}`,
      targetDate: roadmapForm.targetDate || roadmapForm.startDate,
    };

    setState((prev) => ({
      ...prev,
      roadmap: editingRoadmapId
        ? prev.roadmap.map((entry) => (entry.id === editingRoadmapId ? payload : entry))
        : [payload, ...prev.roadmap],
    }));
    setRoadmapForm(defaultForms.roadmap);
    setEditingRoadmapId(null);
    setNotification(editingRoadmapId ? 'Roadmap item updated.' : 'Roadmap item added.');
  };

  const handleDeleteFeedback = (id) => {
    const confirmed = window.confirm('Delete this feedback record?');
    if (!confirmed) return;
    setState((prev) => ({ ...prev, feedback: prev.feedback.filter((entry) => entry.id !== id) }));
    setNotification('Feedback deleted.');
  };

  const handleDeleteFeature = (id) => {
    const confirmed = window.confirm('Delete this feature?');
    if (!confirmed) return;
    setState((prev) => ({ ...prev, features: prev.features.filter((entry) => entry.id !== id) }));
    setNotification('Feature deleted.');
  };

  const handleDeleteRoadmap = (id) => {
    const confirmed = window.confirm('Delete this roadmap item?');
    if (!confirmed) return;
    setState((prev) => ({ ...prev, roadmap: prev.roadmap.filter((entry) => entry.id !== id) }));
    setNotification('Roadmap item deleted.');
  };

  const restoreDemoData = () => {
    const confirmed = window.confirm('Restore demo data and overwrite current data?');
    if (!confirmed) return;
    setState(buildSampleData());
    setNotification('Demo data restored.');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'productsense-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setNotification('JSON export created.');
  };

  const importJson = () => {
    const result = parseJsonImport(importText);
    if (!result.ok) {
      setNotification(result.error);
      return;
    }
    const imported = result.data;
    const nextState = {
      feedback: Array.isArray(imported.feedback) ? imported.feedback : state.feedback,
      features: Array.isArray(imported.features) ? imported.features : state.features,
      roadmap: Array.isArray(imported.roadmap) ? imported.roadmap : state.roadmap,
      prds: Array.isArray(imported.prds) ? imported.prds : state.prds,
    };
    setState(nextState);
    setImportText('');
    setNotification('Data import complete.');
  };

  const generatePrd = (event) => {
    event.preventDefault();
    const payload = {
      id: `prd-${Date.now()}`,
      name: prdForm.name || 'Untitled PRD',
      content: [
        '# ' + (prdForm.name || 'Untitled PRD'),
        '',
        '## Problem Statement',
        prdForm.problemStatement || 'No statement entered.',
        '',
        '## Customer Personas',
        prdForm.personas || 'N/A',
        '',
        '## Pain Points',
        prdForm.painPoints || 'N/A',
        '',
        '## Product Goals',
        prdForm.productGoals || 'N/A',
        '',
        '## Business Goals',
        prdForm.businessGoals || 'N/A',
        '',
        '## Functional Requirements',
        prdForm.functionalRequirements || 'N/A',
        '',
        '## Non-functional Requirements',
        prdForm.nonFunctionalRequirements || 'N/A',
        '',
        '## User Stories',
        prdForm.userStories || 'N/A',
        '',
        '## Acceptance Criteria',
        prdForm.acceptanceCriteria || 'N/A',
        '',
        '## Success Metrics',
        prdForm.successMetrics || 'N/A',
        '',
        '## Dependencies',
        prdForm.dependencies || 'N/A',
        '',
        '## Risks',
        prdForm.risks || 'N/A',
        '',
        '## Constraints',
        prdForm.constraints || 'N/A',
        '',
        '## Out of Scope',
        prdForm.outOfScope || 'N/A',
        '',
        '## Target Release',
        prdForm.targetRelease || 'TBD',
      ].join('\n'),
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => ({ ...prev, prds: [payload, ...prev.prds] }));
    setNotification('PRD generated and saved.');
  };

  const downloadPrd = (format = 'txt') => {
    const prd = state.prds[0];
    if (!prd) {
      setNotification('Generate a PRD first.');
      return;
    }
    const blob = new Blob([prd.content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(prd.name || 'ProductSense-PRD').replace(/\s+/g, '-')}.${format === 'md' ? 'md' : 'txt'}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotification(`PRD downloaded as ${format.toUpperCase()}.`);
  };

  const copyPrd = async () => {
    const prd = state.prds[0];
    if (!prd) {
      setNotification('Generate a PRD first.');
      return;
    }
    try {
      await navigator.clipboard.writeText(prd.content);
      setNotification('PRD copied to clipboard.');
    } catch {
      setNotification('Clipboard access unavailable.');
    }
  };

  const printPrd = () => {
    const prd = state.prds[0];
    if (!prd) {
      setNotification('Generate a PRD first.');
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre>${prd.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const currentPrd = state.prds[0];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="w-72 bg-slate-950 text-slate-100 p-6 hidden lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-xl bg-brand-500 p-2 text-slate-950"><BarChart3 size={22} /></div>
            <div>
              <div className="text-xl font-bold">ProductSense</div>
              <div className="text-xs text-slate-400">AI PM Copilot</div>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${activeView === key ? 'bg-brand-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
            <div className="font-semibold text-white mb-2">Portfolio-ready summary</div>
            <div>Built to turn customer feedback into strategy, roadmap, and PRD decisions.</div>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <header className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur-sm md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
                  onClick={() => setMobileNavOpen((prev) => !prev)}
                  aria-label="Toggle navigation"
                >
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
                  </svg>
                </button>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Portfolio Product Intelligence</div>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">ProductSense</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={restoreDemoData} className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:inline-flex">Restore demo data</button>
                <button onClick={exportJson} className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">Export JSON</button>
              </div>
            </div>
          </header>

          {mobileNavOpen && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-950 p-3 lg:hidden">
              <nav className="grid gap-2">
                {navItems.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveView(key);
                      setMobileNavOpen(false);
                    }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left ${activeView === key ? 'bg-brand-500 text-slate-950' : 'text-slate-200 hover:bg-slate-800'}`}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}

          {notification && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notification}</div>}

          {activeView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {[
                  { label: 'Total customer feedback', value: dashboardStats.totalFeedback, icon: MessageSquareText },
                  { label: 'Feature requests', value: dashboardStats.featuresRequested, icon: Plus },
                  { label: 'Prioritized features', value: dashboardStats.prioritizedFeatures, icon: Target },
                  { label: 'Features in development', value: dashboardStats.inDevelopment, icon: Clock3 },
                  { label: 'Customer satisfaction', value: `${dashboardStats.customerSatisfaction}/5`, icon: Users },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="mb-3 flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><Icon className="text-brand-600" size={18} /></div>
                    <div className="text-3xl font-bold text-slate-900">{value}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft xl:col-span-2">
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Feedback sentiment distribution</h2><span className="text-sm text-slate-500">Live from stored data</span></div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={dashboardStats.sentimentCounts} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                        {dashboardStats.sentimentCounts.map((entry, index) => (
                          <Cell key={entry.name} fill={['#16a34a', '#f59e0b', '#ef4444'][index]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Feature adoption</h2><span className="text-sm text-slate-500">{dashboardStats.featureAdoption}%</span></div>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>Adoption rate</span><span>{dashboardStats.featureAdoption}%</span></div>
                      <div className="h-2.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-500" style={{ width: `${dashboardStats.featureAdoption}%` }} /></div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>Release progress</span><span>{getReleaseProgress(state.roadmap)}%</span></div>
                      <div className="h-2.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-violet-500" style={{ width: `${getReleaseProgress(state.roadmap)}%` }} /></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-lg font-semibold">Most common customer problems</h2>
                  <div className="space-y-3">
                    {dashboardStats.problemData.map((entry, index) => (
                      <div key={entry.name}>
                        <div className="mb-1 flex justify-between text-sm"><span>{index + 1}. {entry.name}</span><span>{entry.value}</span></div>
                        <div className="h-2.5 rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-500" style={{ width: `${(entry.value / Math.max(...dashboardStats.problemData.map((item) => item.value), 1)) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-lg font-semibold">Feature prioritization summary</h2>
                  <div className="space-y-3">
                    {dashboardStats.prioritizedSummary.map((feature) => (
                      <div key={feature.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <div>
                          <div className="font-medium">{feature.name}</div>
                          <div className="text-xs text-slate-500">Effort {feature.effort}/10</div>
                        </div>
                        <span className="rounded-full bg-brand-100 px-2 py-1 text-sm font-semibold text-brand-700">{feature.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <h2 className="mb-4 text-lg font-semibold">Upcoming release milestones</h2>
                <div className="space-y-3">
                  {dashboardStats.releaseMilestones.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-slate-500">{item.date}</div>
                      </div>
                      <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'feedback' && (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl font-semibold">Customer feedback</h2>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={16} />
                        <input aria-label="Search feedback" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3" placeholder="Search feedback" />
                      </div>
                      <select value={feedbackFilter} onChange={(e) => setFeedbackFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <option value="all">All status</option>
                        <option value="open">Open</option>
                        <option value="triaged">Triaged</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredFeedback.length ? filteredFeedback.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-slate-500"><span>{item.customer}</span><span>•</span><span>{item.segment || 'General'}</span></div>
                            <h3 className="text-lg font-semibold">{item.title}</h3>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingFeedbackId(item.id); setFeedbackForm(item); setActiveView('feedback'); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Edit</button>
                            <button onClick={() => handleDeleteFeedback(item.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-1">{item.type}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{item.productArea}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{item.status}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{item.sentiment}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">Impact {item.impact}</span>
                        </div>
                      </div>
                    )) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">No feedback found.</div>}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">{editingFeedbackId ? 'Edit feedback' : 'Add feedback'}</h2>
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="feedback-customer" className="mb-1 block text-sm font-medium">Customer</label>
                        <input id="feedback-customer" value={feedbackForm.customer} onChange={(e) => setFeedbackForm({ ...feedbackForm, customer: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label htmlFor="feedback-segment" className="mb-1 block text-sm font-medium">Segment</label>
                        <input id="feedback-segment" value={feedbackForm.segment} onChange={(e) => setFeedbackForm({ ...feedbackForm, segment: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="feedback-title" className="mb-1 block text-sm font-medium">Title</label>
                      <input id="feedback-title" value={feedbackForm.title} onChange={(e) => setFeedbackForm({ ...feedbackForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div>
                      <label htmlFor="feedback-description" className="mb-1 block text-sm font-medium">Description</label>
                      <textarea id="feedback-description" value={feedbackForm.description} onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })} className="min-h-28 w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="feedback-type" className="mb-1 block text-sm font-medium">Type</label>
                        <select id="feedback-type" value={feedbackForm.type} onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2">
                          <option value="bug">Bug</option>
                          <option value="feature_request">Feature request</option>
                          <option value="praise">Praise</option>
                          <option value="question">Question</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="feedback-area" className="mb-1 block text-sm font-medium">Product area</label>
                        <select id="feedback-area" value={feedbackForm.productArea} onChange={(e) => setFeedbackForm({ ...feedbackForm, productArea: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2">
                          <option>Analytics</option>
                          <option>Roadmap</option>
                          <option>UX</option>
                          <option>Pricing</option>
                          <option>Integrations</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="feedback-impact" className="mb-1 block text-sm font-medium">Impact</label>
                        <input id="feedback-impact" type="number" min={1} max={10} value={feedbackForm.impact} onChange={(e) => setFeedbackForm({ ...feedbackForm, impact: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label htmlFor="feedback-satisfaction" className="mb-1 block text-sm font-medium">Satisfaction</label>
                        <input id="feedback-satisfaction" type="number" min={1} max={5} value={feedbackForm.satisfactionScore} onChange={(e) => setFeedbackForm({ ...feedbackForm, satisfactionScore: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label htmlFor="feedback-sentiment" className="mb-1 block text-sm font-medium">Sentiment</label>
                        <select id="feedback-sentiment" value={feedbackForm.sentiment} onChange={(e) => setFeedbackForm({ ...feedbackForm, sentiment: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2">
                          <option value="positive">Positive</option>
                          <option value="neutral">Neutral</option>
                          <option value="negative">Negative</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="feedback-status" className="mb-1 block text-sm font-medium">Status</label>
                        <select id="feedback-status" value={feedbackForm.status} onChange={(e) => setFeedbackForm({ ...feedbackForm, status: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2">
                          <option value="open">Open</option>
                          <option value="triaged">Triaged</option>
                          <option value="in_progress">In progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="feedback-date" className="mb-1 block text-sm font-medium">Date</label>
                        <input id="feedback-date" type="date" value={feedbackForm.submittedAt} onChange={(e) => setFeedbackForm({ ...feedbackForm, submittedAt: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 font-medium text-white">{editingFeedbackId ? 'Save changes' : 'Add feedback'}</button>
                      {editingFeedbackId && <button type="button" onClick={() => { setEditingFeedbackId(null); setFeedbackForm(defaultForms.feedback); }} className="rounded-xl border border-slate-200 px-4 py-2">Cancel</button>}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeView === 'analysis' && (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">Categorized feedback</h2>
                  <div className="space-y-3">
                    {analysisSummary.categories.map((category) => (
                      <div key={category.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <span>{category.name}</span>
                        <span className="font-semibold">{category.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">Sentiment estimate</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analysisSummary.sentimentSplit}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {analysisSummary.sentimentSplit.map((entry, index) => <Cell key={entry.name} fill={['#16a34a', '#f59e0b', '#ef4444'][index]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <h2 className="mb-4 text-xl font-semibold">Recurring keywords and problems</h2>
                <div className="flex flex-wrap gap-2">
                  {analysisSummary.keywords.map((keyword) => (
                    <span key={keyword.word} className="rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-700">{keyword.word} ({keyword.count})</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 'prioritization' && (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Feature prioritization</h2>
                    <select value={featureFilter} onChange={(e) => setFeatureFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <option value="all">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    {filteredFeatures.map((feature) => {
                      const score = computePriorityScore(feature);
                      return (
                        <div key={feature.id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold">{feature.name}</h3>
                              <p className="text-sm text-slate-600">{feature.description}</p>
                            </div>
                            <div className="rounded-xl bg-brand-100 px-2 py-1 font-semibold text-brand-700">{score.toFixed(2)}/10</div>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                            <span>Customer Value {feature.customerValue}</span>
                            <span>Business Impact {feature.businessImpact}</span>
                            <span>Confidence {feature.confidence}</span>
                            <span>Alignment {feature.strategicAlignment}</span>
                            <span>Effort {feature.effort}/10</span>
                            <span>Target {feature.targetCustomers}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button onClick={() => { setEditingFeatureId(feature.id); setFeatureForm(feature); setActiveView('prioritization'); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Edit</button>
                            <button onClick={() => handleDeleteFeature(feature.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">Create/update feature</h2>
                  <form onSubmit={handleFeatureSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Name</label>
                      <input value={featureForm.name} onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Description</label>
                      <textarea value={featureForm.description} onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[['customerValue', 'Customer value'], ['businessImpact', 'Business impact'], ['confidence', 'Confidence'], ['strategicAlignment', 'Strategy'], ['effort', 'Effort'], ['targetCustomers', 'Target customers']].map(([key, label]) => (
                        <div key={key}>
                          <label className="mb-1 block text-sm font-medium">{label}</label>
                          {key === 'targetCustomers' ? (
                            <input value={featureForm[key]} onChange={(e) => setFeatureForm({ ...featureForm, [key]: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                          ) : (
                            <input type="number" min={1} max={10} value={featureForm[key]} onChange={(e) => setFeatureForm({ ...featureForm, [key]: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 p-2" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Supporting feedback IDs</label>
                      <input value={featureForm.supportingFeedback} onChange={(e) => setFeatureForm({ ...featureForm, supportingFeedback: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-white">{editingFeatureId ? 'Save feature' : 'Add feature'}</button>
                      {editingFeatureId && <button type="button" onClick={() => { setEditingFeatureId(null); setFeatureForm(defaultForms.feature); }} className="rounded-xl border border-slate-200 px-4 py-2">Cancel</button>}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeView === 'roadmap' && (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Roadmap</h2>
                    <select value={roadmapFilter} onChange={(e) => setRoadmapFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <option value="all">All</option>
                      <option value="now">Now</option>
                      <option value="next">Next</option>
                      <option value="later">Later</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    {roadmapFiltered.map((item) => (
                      <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold">{item.title}</div>
                            <div className="text-sm text-slate-500">Owner: {item.featureOwner || 'Unassigned'} / Priority: {item.priority}</div>
                          </div>
                          <div className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold uppercase text-violet-700">{item.status}</div>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          {formatDate(item.startDate)} → {formatDate(item.targetDate)}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { setEditingRoadmapId(item.id); setRoadmapForm(item); setActiveView('roadmap'); }} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">Edit</button>
                          <button onClick={() => handleDeleteRoadmap(item.id)} className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">{editingRoadmapId ? 'Edit roadmap item' : 'Add roadmap item'}</h2>
                  <form onSubmit={handleRoadmapSubmit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Title</label>
                      <input value={roadmapForm.title} onChange={(e) => setRoadmapForm({ ...roadmapForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Status</label>
                        <select value={roadmapForm.status} onChange={(e) => setRoadmapForm({ ...roadmapForm, status: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2">
                          <option value="now">Now</option>
                          <option value="next">Next</option>
                          <option value="later">Later</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Priority</label>
                        <select value={roadmapForm.priority} onChange={(e) => setRoadmapForm({ ...roadmapForm, priority: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2">
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Start date</label>
                        <input type="date" value={roadmapForm.startDate} onChange={(e) => setRoadmapForm({ ...roadmapForm, startDate: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">Target date</label>
                        <input type="date" value={roadmapForm.targetDate} onChange={(e) => setRoadmapForm({ ...roadmapForm, targetDate: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Feature owner</label>
                      <input value={roadmapForm.featureOwner} onChange={(e) => setRoadmapForm({ ...roadmapForm, featureOwner: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Milestone</label>
                      <input value={roadmapForm.milestone} onChange={(e) => setRoadmapForm({ ...roadmapForm, milestone: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Dependencies</label>
                      <input value={roadmapForm.dependencies} onChange={(e) => setRoadmapForm({ ...roadmapForm, dependencies: e.target.value })} className="w-full rounded-xl border border-slate-200 p-2" />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-white">{editingRoadmapId ? 'Save item' : 'Add item'}</button>
                      {editingRoadmapId && <button type="button" onClick={() => { setEditingRoadmapId(null); setRoadmapForm(defaultForms.roadmap); }} className="rounded-xl border border-slate-200 px-4 py-2">Cancel</button>}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeView === 'kpi' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Customer satisfaction', value: `${kpis.customerSatisfaction}/5` },
                  { label: 'Feedback volume', value: kpis.totalFeedback },
                  { label: 'Feature adoption', value: `${kpis.featureAdoption}%` },
                  { label: 'Release progress', value: `${kpis.releaseProgress}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                    <div className="text-sm text-slate-500">{item.label}</div>
                    <div className="mt-2 text-2xl font-bold">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <h2 className="mb-4 text-xl font-semibold">KPI definitions</h2>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><strong>Customer satisfaction:</strong> Average satisfaction score across all feedback records.</li>
                  <li><strong>Feedback volume:</strong> Number of feedback submissions in the active dataset.</li>
                  <li><strong>Feature adoption:</strong> Estimated adoption from active and released features.</li>
                  <li><strong>Feedback resolution rate:</strong> Share of feedback marked as resolved.</li>
                  <li><strong>Release progress:</strong> Share of roadmap items completed or released.</li>
                </ul>
              </div>
            </div>
          )}

          {activeView === 'prd' && (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">PRD generator</h2>
                  <form onSubmit={generatePrd} className="space-y-4">
                    <input value={prdForm.name} onChange={(e) => setPrdForm({ ...prdForm, name: e.target.value })} placeholder="PRD name" className="w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.problemStatement} onChange={(e) => setPrdForm({ ...prdForm, problemStatement: e.target.value })} placeholder="Problem statement" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.personas} onChange={(e) => setPrdForm({ ...prdForm, personas: e.target.value })} placeholder="Customer personas" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.painPoints} onChange={(e) => setPrdForm({ ...prdForm, painPoints: e.target.value })} placeholder="Pain points" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.productGoals} onChange={(e) => setPrdForm({ ...prdForm, productGoals: e.target.value })} placeholder="Product goals" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.businessGoals} onChange={(e) => setPrdForm({ ...prdForm, businessGoals: e.target.value })} placeholder="Business goals" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.functionalRequirements} onChange={(e) => setPrdForm({ ...prdForm, functionalRequirements: e.target.value })} placeholder="Functional requirements" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.nonFunctionalRequirements} onChange={(e) => setPrdForm({ ...prdForm, nonFunctionalRequirements: e.target.value })} placeholder="Non-functional requirements" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.userStories} onChange={(e) => setPrdForm({ ...prdForm, userStories: e.target.value })} placeholder="User stories" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.acceptanceCriteria} onChange={(e) => setPrdForm({ ...prdForm, acceptanceCriteria: e.target.value })} placeholder="Acceptance criteria" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.successMetrics} onChange={(e) => setPrdForm({ ...prdForm, successMetrics: e.target.value })} placeholder="Success metrics" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.dependencies} onChange={(e) => setPrdForm({ ...prdForm, dependencies: e.target.value })} placeholder="Dependencies" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.risks} onChange={(e) => setPrdForm({ ...prdForm, risks: e.target.value })} placeholder="Risks" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.constraints} onChange={(e) => setPrdForm({ ...prdForm, constraints: e.target.value })} placeholder="Constraints" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <textarea value={prdForm.outOfScope} onChange={(e) => setPrdForm({ ...prdForm, outOfScope: e.target.value })} placeholder="Out of scope" className="min-h-20 w-full rounded-xl border border-slate-200 p-2" />
                    <input value={prdForm.targetRelease} onChange={(e) => setPrdForm({ ...prdForm, targetRelease: e.target.value })} placeholder="Target release" className="w-full rounded-xl border border-slate-200 p-2" />
                    <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-white">Generate PRD</button>
                  </form>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                  <h2 className="mb-4 text-xl font-semibold">Generated PRD preview</h2>
                  {currentPrd ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <button onClick={copyPrd} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Copy</button>
                        <button onClick={() => downloadPrd('md')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Markdown</button>
                        <button onClick={() => downloadPrd('txt')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">TXT</button>
                        <button onClick={printPrd} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Print</button>
                      </div>
                      <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{currentPrd.content}</pre>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-500">No PRD generated yet.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeView === 'insights' && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="mb-4 text-xl font-semibold">Data-backed product insights</h2>
              <div className="rounded-xl bg-slate-50 p-4 text-slate-700">{insightSummary}</div>
            </div>
          )}

          {activeView === 'settings' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
                <h2 className="mb-4 text-xl font-semibold">Data and settings</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <button onClick={restoreDemoData} className="rounded-xl bg-slate-900 px-4 py-3 text-white">Restore demo data</button>
                  <button onClick={exportJson} className="rounded-xl bg-brand-600 px-4 py-3 text-white">Export JSON</button>
                </div>
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium">JSON import</label>
                  <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste JSON to import" className="min-h-32 w-full rounded-xl border border-slate-200 p-2" />
                  <button onClick={importJson} className="mt-3 rounded-xl border border-slate-200 px-4 py-2">Validate and import</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
