/**
 * mockTeams.js — Team metadata only (budgets, providers, spend history).
 *
 * Person data (names, avatars) is intentionally NOT duplicated here.
 * It is derived from mockUsers.js via getUserById / getUsersByTeam —
 * the same pattern you'd use when real API endpoints are available.
 *
 * To migrate to a real API:
 *   1. Replace `TEAM_CONFIGS` with GET /api/teams response
 *   2. Replace mockUsers helpers with GET /api/users calls
 *   3. The exported `teams` shape stays the same — nothing else changes.
 */

import { getUserById, getUsersByTeam } from './mockUsers.js'

// Raw team config — shape mirrors GET /api/teams API response
const TEAM_CONFIGS = [
  {
    id: 'team-001', name: 'Frontend Team',  leadId: 'u-002', color: '#3B82F6',
    monthlyBudget: 18000, monthlySpend: 14200, budgetPercent: 78.9,
    providers: ['aws', 'gcp'],
    topService: 'Amazon CloudFront', topServiceCost: 3200,
    resources: 24,
    spend30d: 14200, spend60d: 13100, spend90d: 12800,
    tags: { Team: 'frontend', 'cost-center': 'FE-001' },
    projects: ['web-platform', 'landing-page', 'cdn-assets'],
    overBudget: false,
  },
  {
    id: 'team-002', name: 'Backend Team',   leadId: 'u-003', color: '#10B981',
    monthlyBudget: 45000, monthlySpend: 38600, budgetPercent: 85.8,
    providers: ['aws', 'gcp', 'azure'],
    topService: 'Amazon EC2', topServiceCost: 18400,
    resources: 87,
    spend30d: 38600, spend60d: 36200, spend90d: 34800,
    tags: { Team: 'backend', 'cost-center': 'BE-002' },
    projects: ['api', 'microservices', 'auth-service'],
    overBudget: false,
  },
  {
    id: 'team-003', name: 'Data Science',   leadId: 'u-004', color: '#8B5CF6',
    monthlyBudget: 30000, monthlySpend: 32100, budgetPercent: 107,
    providers: ['gcp', 'aws'],
    topService: 'BigQuery', topServiceCost: 7200,
    resources: 31,
    spend30d: 32100, spend60d: 28400, spend90d: 24100,
    tags: { Team: 'data-science', 'cost-center': 'DS-003' },
    projects: ['ml-pipeline', 'data-warehouse', 'model-training'],
    overBudget: true,
  },
  {
    id: 'team-004', name: 'DevOps & Infra', leadId: 'u-005', color: '#F59E0B',
    monthlyBudget: 60000, monthlySpend: 48200, budgetPercent: 80.3,
    providers: ['aws', 'gcp', 'azure'],
    topService: 'Amazon EKS', topServiceCost: 9200,
    resources: 142,
    spend30d: 48200, spend60d: 46800, spend90d: 44100,
    tags: { Team: 'devops', 'cost-center': 'DO-004' },
    projects: ['k8s-cluster', 'ci-cd', 'monitoring', 'networking'],
    overBudget: false,
  },
  {
    id: 'team-005', name: 'QA & Testing',   leadId: 'u-006', color: '#F43F5E',
    monthlyBudget: 8000, monthlySpend: 5300, budgetPercent: 66.3,
    providers: ['aws'],
    topService: 'Amazon EC2', topServiceCost: 3200,
    resources: 18,
    spend30d: 5300, spend60d: 5100, spend90d: 4900,
    tags: { Team: 'qa', 'cost-center': 'QA-005' },
    projects: ['test-automation', 'load-testing'],
    overBudget: false,
  },
]

/**
 * Derived `teams` — joins TEAM_CONFIGS with user data.
 * Consumer shape is identical to what a real joined API endpoint would return.
 */
export const teams = TEAM_CONFIGS.map(config => {
  const leadUser   = getUserById(config.leadId)
  const memberList = getUsersByTeam(config.id)

  return {
    ...config,
    lead:       leadUser?.name ?? '',
    avatar:     leadUser?.avatar ?? '',
    members:    memberList.length + 1, // +1 for the lead
    memberList: leadUser
      ? [{ ...leadUser, teamRole: 'Lead' }, ...memberList]
      : memberList,
  }
})
