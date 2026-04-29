/**
 * mockRoles.js — Single source of truth for RBAC.
 *
 * ROLES          — role id constants
 * PERMISSIONS    — permission key constants
 * ROLE_PERMISSIONS — maps each role to its allowed permissions
 * PAGE_ACCESS    — maps each route to roles that can access it
 * DEMO_PERSONAS  — 6 demo users for the DemoRoleSwitcher
 *
 * When real auth is wired up: replace DEMO_PERSONAS lookup with
 * the JWT claims / API response and keep everything else unchanged.
 */

// ── Role identifiers ──────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN:     'super_admin',
  FINOPS_MANAGER:  'finops_manager',
  CLOUD_ENGINEER:  'cloud_engineer',
  TEAM_LEAD:       'team_lead',
  FINANCE_ANALYST: 'finance_analyst',
  READ_ONLY:       'read_only',
}

// ── Permission keys ───────────────────────────────────────────────────────────
export const PERMISSIONS = {
  // Anomalies
  MANAGE_ANOMALIES:     'manage_anomalies',     // resolve + dismiss
  ACKNOWLEDGE_ANOMALIES:'acknowledge_anomalies', // acknowledge only

  // Optimizer
  APPLY_OPTIMIZATIONS:  'apply_optimizations',  // apply / approve recommendations
  SCHEDULE_SHUTDOWNS:   'schedule_shutdowns',    // enable/disable scheduled shutdowns

  // Teams
  MANAGE_TEAMS:         'manage_teams',         // edit budgets, update team settings

  // Accounts
  VIEW_ACCOUNTS:        'view_accounts',        // view the /accounts page
  CONNECT_ACCOUNTS:     'connect_accounts',     // add new cloud accounts
  SYNC_ACCOUNTS:        'sync_accounts',        // sync / refresh existing accounts

  // Reports
  SCHEDULE_REPORTS:     'schedule_reports',     // create / delete scheduled reports
  EXPORT_DATA:          'export_data',          // export raw billing data

  // Settings tabs
  MANAGE_INTEGRATIONS:  'manage_integrations',  // Integrations tab
  VIEW_BILLING:         'view_billing',         // Billing tab
  MANAGE_TEAM_MEMBERS:  'manage_team_members',  // Team Members tab
  MANAGE_API_KEYS:      'manage_api_keys',      // API Keys tab
}

const P = PERMISSIONS

// ── Role → Permissions map ────────────────────────────────────────────────────
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(P),   // every permission

  [ROLES.FINOPS_MANAGER]: [
    P.MANAGE_ANOMALIES, P.ACKNOWLEDGE_ANOMALIES,
    P.APPLY_OPTIMIZATIONS, P.SCHEDULE_SHUTDOWNS,
    P.MANAGE_TEAMS,
    P.VIEW_ACCOUNTS, P.SYNC_ACCOUNTS,          // sync only, no connect
    P.SCHEDULE_REPORTS, P.EXPORT_DATA,
    P.MANAGE_INTEGRATIONS,
    P.VIEW_BILLING,                            // view but not manage billing
    P.MANAGE_TEAM_MEMBERS,
    P.MANAGE_API_KEYS,
  ],

  [ROLES.CLOUD_ENGINEER]: [
    P.ACKNOWLEDGE_ANOMALIES,                   // acknowledge only, no resolve/dismiss
    P.VIEW_ACCOUNTS,
    P.EXPORT_DATA,
  ],

  [ROLES.TEAM_LEAD]: [
    P.ACKNOWLEDGE_ANOMALIES,
    P.MANAGE_ANOMALIES,                        // within own team scope
    P.APPLY_OPTIMIZATIONS,                     // within own team scope
    P.SCHEDULE_SHUTDOWNS,
    P.MANAGE_TEAMS,                            // own team only (page enforces scope)
    P.SCHEDULE_REPORTS,
    P.EXPORT_DATA,
    P.MANAGE_TEAM_MEMBERS,                     // own team only
    // NOTE: no VIEW_ACCOUNTS — team leads cannot see Accounts page
  ],

  [ROLES.FINANCE_ANALYST]: [
    P.VIEW_ACCOUNTS,
    P.SCHEDULE_REPORTS,
    P.EXPORT_DATA,
    P.VIEW_BILLING,
  ],

  [ROLES.READ_ONLY]: [
    P.VIEW_ACCOUNTS,                           // view-only, no actions
  ],
}

// ── Page access control ───────────────────────────────────────────────────────
// Lists which roles can navigate to each route.
const ALL = Object.values(ROLES)

export const PAGE_ACCESS = {
  '/dashboard':     ALL,
  '/cost-explorer': ALL,
  '/anomalies':     ALL,
  '/optimizer':     ALL,
  '/teams':         ALL,
  '/accounts':      ALL.filter(r => r !== ROLES.TEAM_LEAD),
  '/reports':       ALL,
  '/settings':      ALL,
}

// ── Demo personas (one per role) ──────────────────────────────────────────────
// Used by DemoRoleSwitcher. Replace with real session user when auth is wired.
const PORTRAITS = 'https://randomuser.me/api/portraits'
export const DEMO_PERSONAS = [
  {
    role:        ROLES.SUPER_ADMIN,
    name:        'Sarah Chen',
    title:       'Founder & CEO',
    email:       'sarah@acme-corp.com',
    initials:    'SC',
    avatar:      `${PORTRAITS}/women/1.jpg`,
    color:       '#7C3AED',
    tagline:     'Full platform control',
    teamId:      null,
    highlights: [
      'Access to every feature',
      'Manage billing & org settings',
      'Connect & manage cloud accounts',
      'Create and delete API keys',
    ],
  },
  {
    role:        ROLES.FINOPS_MANAGER,
    name:        'Marcus Rivera',
    title:       'FinOps Lead',
    email:       'marcus@acme-corp.com',
    initials:    'MR',
    avatar:      `${PORTRAITS}/men/1.jpg`,
    color:       '#0EA5E9',
    tagline:     'Full FinOps operations',
    teamId:      null,
    highlights: [
      'Resolve & dismiss anomalies',
      'Apply optimization recommendations',
      'Manage all teams & budgets',
      'Sync accounts (no new connections)',
    ],
  },
  {
    role:        ROLES.CLOUD_ENGINEER,
    name:        'Priya Patel',
    title:       'Senior SRE',
    email:       'priya@acme-corp.com',
    initials:    'PP',
    avatar:      `${PORTRAITS}/women/2.jpg`,
    color:       '#10B981',
    tagline:     'Observe & acknowledge',
    teamId:      'team-003',
    highlights: [
      'View all spend data',
      'Acknowledge anomalies only',
      'Cannot apply optimizations',
      'No account management',
    ],
  },
  {
    role:        ROLES.TEAM_LEAD,
    name:        'James Kim',
    title:       'Engineering Manager',
    email:       'james@acme-corp.com',
    initials:    'JK',
    avatar:      `${PORTRAITS}/men/5.jpg`,
    color:       '#F59E0B',
    tagline:     'Own-team scope only',
    teamId:      'team-001',
    highlights: [
      'Scoped to Frontend Team data',
      'Manage own team budget',
      'No access to Accounts page',
      'Schedule & export own-team reports',
    ],
  },
  {
    role:        ROLES.FINANCE_ANALYST,
    name:        'Amanda Walsh',
    title:       'CFO',
    email:       'amanda@acme-corp.com',
    initials:    'AW',
    avatar:      `${PORTRAITS}/women/44.jpg`,
    color:       '#EC4899',
    tagline:     'Visibility & reporting only',
    teamId:      null,
    highlights: [
      'Full spend visibility across all teams',
      'View billing information',
      'Schedule & export reports',
      'Zero write actions on anomalies/optimizer',
    ],
  },
  {
    role:        ROLES.READ_ONLY,
    name:        'External Auditor',
    title:       'Compliance Auditor',
    email:       'auditor@external.com',
    initials:    'EA',
    avatar:      `${PORTRAITS}/men/44.jpg`,
    color:       '#6B7280',
    tagline:     'View only — zero actions',
    teamId:      null,
    highlights: [
      'Read-only access to all pages',
      'No anomaly actions',
      'No optimizer actions',
      'No report scheduling or export',
    ],
  },
]

// ── Role display metadata ─────────────────────────────────────────────────────
export const ROLE_META = {
  [ROLES.SUPER_ADMIN]:     { label: 'Super Admin',      color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  [ROLES.FINOPS_MANAGER]:  { label: 'FinOps Manager',   color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' },
  [ROLES.CLOUD_ENGINEER]:  { label: 'Cloud Engineer',   color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  [ROLES.TEAM_LEAD]:       { label: 'Team Lead',        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  [ROLES.FINANCE_ANALYST]: { label: 'Finance Analyst',  color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  [ROLES.READ_ONLY]:       { label: 'Read Only',        color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}
