/**
 * mockUsers.js — Single source of truth for all person/user data.
 *
 * Shape mirrors a typical REST API response (e.g. GET /api/users).
 * When the real API is ready, replace the `users` array and `CURRENT_USER`
 * with API responses — the rest of the app consumes these helpers unchanged.
 *
 * Each user has:
 *   id         — stable unique identifier (mirrors API primary key)
 *   name       — full display name
 *   email      — work email
 *   avatar     — absolute URL to profile photo
 *   teamId     — which team they belong to (null = org-level only)
 *   teamRole   — role within their team (Lead / Engineer / Analyst / etc.)
 *   orgRole    — platform access level: 'Admin' | 'FinOps' | 'Viewer' | null
 *   addedAt    — ISO date string (mirrors API createdAt)
 */

const P = 'https://randomuser.me/api/portraits'

export const users = [
  // ── Org-level platform users (appear in Settings > Team Members) ──────────
  { id: 'u-001', name: 'John Martinez',     email: 'john@acme-corp.com',      avatar: `${P}/men/32.jpg`,    teamId: null,       teamRole: null,           orgRole: 'Admin',  addedAt: '2025-01-10' },
  { id: 'u-002', name: 'Sarah Chen',        email: 'sarah@acme-corp.com',     avatar: `${P}/women/1.jpg`,   teamId: 'team-001', teamRole: 'Lead',          orgRole: 'FinOps', addedAt: '2025-01-12' },
  { id: 'u-003', name: 'Marcus Rodriguez',  email: 'marcus@acme-corp.com',    avatar: `${P}/men/1.jpg`,     teamId: 'team-002', teamRole: 'Lead',          orgRole: 'FinOps', addedAt: '2025-02-03' },
  { id: 'u-004', name: 'Priya Patel',       email: 'priya@acme-corp.com',     avatar: `${P}/women/2.jpg`,   teamId: 'team-003', teamRole: 'Lead',          orgRole: 'Viewer', addedAt: '2025-03-15' },
  { id: 'u-005', name: 'Alex Kim',          email: 'alex@acme-corp.com',      avatar: `${P}/men/2.jpg`,     teamId: 'team-004', teamRole: 'Lead',          orgRole: 'Viewer', addedAt: '2025-04-02' },
  { id: 'u-006', name: 'Emma Wilson',       email: 'emma@acme-corp.com',      avatar: `${P}/women/3.jpg`,   teamId: 'team-005', teamRole: 'Lead',          orgRole: 'FinOps', addedAt: '2025-04-10' },

  // ── Frontend Team (team-001) ──────────────────────────────────────────────
  { id: 'u-007', name: 'James Nguyen',      email: 'james@acme-corp.com',     avatar: `${P}/men/5.jpg`,     teamId: 'team-001', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-01-15' },
  { id: 'u-008', name: 'Lisa Park',         email: 'lisa@acme-corp.com',      avatar: `${P}/women/7.jpg`,   teamId: 'team-001', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-01-20' },
  { id: 'u-009', name: 'Robert Chen',       email: 'robert@acme-corp.com',    avatar: `${P}/men/8.jpg`,     teamId: 'team-001', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-01' },
  { id: 'u-010', name: 'Amy Wilson',        email: 'amy@acme-corp.com',       avatar: `${P}/women/9.jpg`,   teamId: 'team-001', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-02-10' },
  { id: 'u-011', name: 'Kevin Torres',      email: 'kevin@acme-corp.com',     avatar: `${P}/men/10.jpg`,    teamId: 'team-001', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-15' },
  { id: 'u-012', name: 'Rachel Kim',        email: 'rachel@acme-corp.com',    avatar: `${P}/women/11.jpg`,  teamId: 'team-001', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-03-01' },
  { id: 'u-013', name: 'Danny Lee',         email: 'danny@acme-corp.com',     avatar: `${P}/men/11.jpg`,    teamId: 'team-001', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-03-05' },

  // ── Backend Team (team-002) ───────────────────────────────────────────────
  { id: 'u-014', name: 'Olivia Nguyen',     email: 'olivia@acme-corp.com',    avatar: `${P}/women/5.jpg`,   teamId: 'team-002', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-05' },
  { id: 'u-015', name: 'Carlos Ramirez',    email: 'carlos@acme-corp.com',    avatar: `${P}/men/6.jpg`,     teamId: 'team-002', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-08' },
  { id: 'u-016', name: 'Priya Sharma',      email: 'priyash@acme-corp.com',   avatar: `${P}/women/6.jpg`,   teamId: 'team-002', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-02-12' },
  { id: 'u-017', name: 'Tyler Johnson',     email: 'tyler@acme-corp.com',     avatar: `${P}/men/7.jpg`,     teamId: 'team-002', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-15' },
  { id: 'u-018', name: 'Aisha Brown',       email: 'aisha@acme-corp.com',     avatar: `${P}/women/13.jpg`,  teamId: 'team-002', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-02-20' },
  { id: 'u-019', name: 'Noah Davis',        email: 'noah@acme-corp.com',      avatar: `${P}/men/9.jpg`,     teamId: 'team-002', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-03-01' },
  { id: 'u-020', name: 'Isabella Martinez', email: 'isabella@acme-corp.com',  avatar: `${P}/women/14.jpg`,  teamId: 'team-002', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-03-05' },
  { id: 'u-021', name: 'Ethan Thompson',    email: 'ethan@acme-corp.com',     avatar: `${P}/men/13.jpg`,    teamId: 'team-002', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-03-10' },
  { id: 'u-022', name: 'Sophia White',      email: 'sophiaw@acme-corp.com',   avatar: `${P}/women/15.jpg`,  teamId: 'team-002', teamRole: 'DevOps',        orgRole: null, addedAt: '2025-03-15' },
  { id: 'u-023', name: 'Liam Harris',       email: 'liam@acme-corp.com',      avatar: `${P}/men/14.jpg`,    teamId: 'team-002', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-03-20' },
  { id: 'u-024', name: 'Mia Clark',         email: 'mia@acme-corp.com',       avatar: `${P}/women/16.jpg`,  teamId: 'team-002', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-03-25' },
  { id: 'u-025', name: 'Mason Lewis',       email: 'mason@acme-corp.com',     avatar: `${P}/men/15.jpg`,    teamId: 'team-002', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-04-01' },
  { id: 'u-026', name: 'Charlotte Lee',     email: 'charlotte@acme-corp.com', avatar: `${P}/women/17.jpg`,  teamId: 'team-002', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-04-05' },

  // ── Data Science (team-003) ───────────────────────────────────────────────
  { id: 'u-027', name: 'David Nguyen',      email: 'david@acme-corp.com',     avatar: `${P}/men/3.jpg`,     teamId: 'team-003', teamRole: 'Data Engineer', orgRole: null, addedAt: '2025-02-01' },
  { id: 'u-028', name: 'Sophia Rodriguez',  email: 'sophiar@acme-corp.com',   avatar: `${P}/women/8.jpg`,   teamId: 'team-003', teamRole: 'ML Engineer',   orgRole: null, addedAt: '2025-02-10' },
  { id: 'u-029', name: 'Michael Chen',      email: 'michael@acme-corp.com',   avatar: `${P}/men/18.jpg`,    teamId: 'team-003', teamRole: 'Data Engineer', orgRole: null, addedAt: '2025-02-20' },
  { id: 'u-030', name: 'Rachel Wilson',     email: 'rachelw@acme-corp.com',   avatar: `${P}/women/19.jpg`,  teamId: 'team-003', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-03-01' },
  { id: 'u-031', name: 'Benjamin Taylor',   email: 'benjamin@acme-corp.com',  avatar: `${P}/men/19.jpg`,    teamId: 'team-003', teamRole: 'Data Engineer', orgRole: null, addedAt: '2025-03-10' },

  // ── DevOps & Infra (team-004) ─────────────────────────────────────────────
  { id: 'u-032', name: 'Chloe Nguyen',      email: 'chloe@acme-corp.com',     avatar: `${P}/women/4.jpg`,   teamId: 'team-004', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-01' },
  { id: 'u-033', name: 'Juan Ramirez',      email: 'juan@acme-corp.com',      avatar: `${P}/men/4.jpg`,     teamId: 'team-004', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-05' },
  { id: 'u-034', name: 'Aisha Rodriguez',   email: 'aishar@acme-corp.com',    avatar: `${P}/women/20.jpg`,  teamId: 'team-004', teamRole: 'Analyst',       orgRole: null, addedAt: '2025-02-10' },
  { id: 'u-035', name: 'Eric Chen',         email: 'eric@acme-corp.com',      avatar: `${P}/men/20.jpg`,    teamId: 'team-004', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-15' },
  { id: 'u-036', name: 'Zoe Thompson',      email: 'zoe@acme-corp.com',       avatar: `${P}/women/21.jpg`,  teamId: 'team-004', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-20' },
  { id: 'u-037', name: 'Lucas Martinez',    email: 'lucas@acme-corp.com',     avatar: `${P}/men/21.jpg`,    teamId: 'team-004', teamRole: 'SRE',           orgRole: null, addedAt: '2025-03-01' },
  { id: 'u-038', name: 'Avery Brown',       email: 'avery@acme-corp.com',     avatar: `${P}/women/22.jpg`,  teamId: 'team-004', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-03-05' },
  { id: 'u-039', name: 'Jackson Davis',     email: 'jackson@acme-corp.com',   avatar: `${P}/men/22.jpg`,    teamId: 'team-004', teamRole: 'DevOps',        orgRole: null, addedAt: '2025-03-10' },

  // ── QA & Testing (team-005) ───────────────────────────────────────────────
  { id: 'u-040', name: 'Noah Nguyen',       email: 'noahn@acme-corp.com',     avatar: `${P}/men/12.jpg`,    teamId: 'team-005', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-01' },
  { id: 'u-041', name: 'Isabella Patel',    email: 'isabellap@acme-corp.com', avatar: `${P}/women/12.jpg`,  teamId: 'team-005', teamRole: 'QA Analyst',    orgRole: null, addedAt: '2025-02-10' },
  { id: 'u-042', name: 'Liam Rodriguez',    email: 'liamr@acme-corp.com',     avatar: `${P}/men/16.jpg`,    teamId: 'team-005', teamRole: 'Engineer',      orgRole: null, addedAt: '2025-02-20' },
  { id: 'u-043', name: 'Mia Chen',          email: 'miac@acme-corp.com',      avatar: `${P}/women/25.jpg`,  teamId: 'team-005', teamRole: 'QA Analyst',    orgRole: null, addedAt: '2025-03-01' },
]

/**
 * The currently authenticated user.
 * Replace with session/auth API response when ready.
 */
export const CURRENT_USER = {
  id: 'u-001',
  name: 'John Martinez',
  email: 'john@acme-corp.com',
  role: 'FinOps Admin',
  company: 'Acme Corp',
  timezone: 'UTC-5 (EST)',
  avatar: `${P}/men/32.jpg`,
}

// ── Lookup helpers ────────────────────────────────────────────────────────────
// These match the pattern of real API calls — swap the body for fetch() later.

/** Get a single user by ID */
export const getUserById = (id) => users.find(u => u.id === id) ?? null

/** Get all members of a given team */
export const getUsersByTeam = (teamId) => users.filter(u => u.teamId === teamId)

/** Get users who have org-level platform access (shown in Settings > Team Members) */
export const getOrgMembers = () => users.filter(u => u.orgRole !== null)
