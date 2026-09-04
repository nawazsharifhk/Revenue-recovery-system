import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Summary & Failures
  getSummary: (merchant_id) => client.get('/failures/analytics/summary', { params: { merchant_id } }).then(res => res.data),
  getFailures: (params) => client.get('/failures/', { params }).then(res => res.data),
  triggerAction: (id, actionType) => client.post(`/failures/${id}/trigger-action?action_type=${actionType}`).then(res => res.data),
  markResolved: (id) => client.post(`/failures/${id}/mark-resolved`).then(res => res.data),

  // ML & Decision Engine
  getMlMetrics: (merchant_id) => client.get('/engine/metrics', { params: { merchant_id } }).then(res => res.data),
  trainMlModel: (sampleSize = 700, merchant_id) => client.post(`/engine/train?sample_size=${sampleSize}&merchant_id=${merchant_id || ''}`).then(res => res.data),
  generateSyntheticData: (count = 25, merchant_id) => client.post(`/engine/generate-synthetic-data?count=${count}&merchant_id=${merchant_id || ''}`).then(res => res.data),
  getDecisionRules: (merchant_id) => client.get('/engine/rules', { params: { merchant_id } }).then(res => res.data),
  updateDecisionRules: (rules, merchant_id) => client.put('/engine/rules', { ...rules, merchant_id }).then(res => res.data),

  // API Credentials & Webhooks Management
  getApiKeys: (merchant_id) => client.get('/settings/keys', { params: { merchant_id } }).then(res => res.data),
  updateApiKeys: (payload, merchant_id) => client.put('/settings/keys', { ...payload, merchant_id }).then(res => res.data),
  testConnection: (merchant_id) => client.post('/settings/test-connection', { merchant_id }).then(res => res.data),
  rotateWebhookSecret: (merchant_id) => client.post('/settings/rotate-webhook-secret', { merchant_id }).then(res => res.data),
  getApiLogs: (limit = 30, merchant_id) => client.get(`/settings/logs?limit=${limit}&merchant_id=${merchant_id || ''}`).then(res => res.data),

  // Webhook Simulator
  getSimulatorPresets: () => client.get('/simulator/presets').then(res => res.data),
  fireSimulatedWebhook: (scenarioKey, customPayload, merchant_id) => client.post('/simulator/fire', { scenario_key: scenarioKey, custom_payload: customPayload, merchant_id }).then(res => res.data),
};

export default api;
