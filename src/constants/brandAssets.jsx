import {
  SiGithubactions,
  SiGooglecloud,
  SiJira,
  SiPagerduty,
  SiSlack,
  SiTerraform,
} from 'react-icons/si'

function AwsIcon({ size = 18, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <text x="3.2" y="11.2" fontSize="8.4" fontWeight="700" fill="#111827" fontFamily="Arial, sans-serif">
        aws
      </text>
      <path
        d="M5 14.4c2.1 1.5 4.8 2.3 7.7 2.3 2.2 0 4.2-.4 6.1-1.3"
        fill="none"
        stroke="#FF9900"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="m17 14.5 2.1.1-1 1.8" fill="none" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AzureIcon({ size = 18, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <path d="M13.8 2.5 6.1 16.1l5.3-.1L20 2.5Z" fill="#0078D4" />
      <path d="M12.2 18.1 6.8 12.2 4 17.3l8.2 4.2 7.8-1.2-7.8-2.2Z" fill="#50E6FF" />
    </svg>
  )
}

function TeamsIcon({ size = 18, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <circle cx="18.3" cy="8.1" r="2.3" fill="#7B83EB" />
      <circle cx="18.8" cy="15.7" r="2.1" fill="#6264A7" opacity="0.9" />
      <rect x="8.6" y="5" width="9.5" height="14" rx="2.4" fill="#6264A7" />
      <rect x="3" y="7.2" width="9.8" height="9.6" rx="2.1" fill="#4F52B2" />
      <path d="M6 9.3h3.8v1.5H8.7v4.2H7.1v-4.2H6Z" fill="#fff" />
    </svg>
  )
}

const brandAssets = {
  aws: {
    label: 'AWS',
    name: 'Amazon Web Services',
    icon: AwsIcon,
    color: '#FF9900',
  },
  gcp: {
    label: 'GCP',
    name: 'Google Cloud',
    icon: SiGooglecloud,
    color: '#4285F4',
  },
  azure: {
    label: 'Azure',
    name: 'Microsoft Azure',
    icon: AzureIcon,
    color: '#0078D4',
  },
  slack: {
    label: 'Slack',
    name: 'Slack',
    icon: SiSlack,
    color: '#4A154B',
  },
  teams: {
    label: 'Microsoft Teams',
    name: 'Microsoft Teams',
    icon: TeamsIcon,
    color: '#6264A7',
  },
  jira: {
    label: 'Jira',
    name: 'Jira',
    icon: SiJira,
    color: '#0052CC',
  },
  pagerduty: {
    label: 'PagerDuty',
    name: 'PagerDuty',
    icon: SiPagerduty,
    color: '#06AC38',
  },
  terraform: {
    label: 'Terraform',
    name: 'Terraform',
    icon: SiTerraform,
    color: '#7B42BC',
  },
  githubActions: {
    label: 'GitHub Actions',
    name: 'GitHub Actions',
    icon: SiGithubactions,
    color: '#2088FF',
  },
}

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '')
  const normalized = value.length === 3 ? value.split('').map((char) => char + char).join('') : value
  const bigint = Number.parseInt(normalized, 16)
  const red = (bigint >> 16) & 255
  const green = (bigint >> 8) & 255
  const blue = bigint & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function getBrandAsset(key) {
  return brandAssets[key]
}

export function BrandLogo({ brandKey, size = 18, className = '' }) {
  const asset = getBrandAsset(brandKey)

  if (!asset) return null

  const Icon = asset.icon

  return <Icon size={size} className={className} style={{ color: asset.color }} aria-hidden="true" />
}

export function getBrandSurfaceStyles(key, alpha = 0.1) {
  const asset = getBrandAsset(key)

  if (!asset) {
    return {
      background: 'var(--bg-elevated)',
      borderColor: 'var(--border-default)',
      color: 'var(--text-secondary)',
    }
  }

  return {
    background: hexToRgba(asset.color, alpha),
    borderColor: hexToRgba(asset.color, alpha + 0.12),
    color: asset.color,
  }
}

export const integrationBrands = [
  'slack',
  'teams',
  'jira',
  'pagerduty',
  'terraform',
  'githubActions',
]
