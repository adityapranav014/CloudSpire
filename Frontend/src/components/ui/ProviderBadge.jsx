/**
 * Provider badge — colored pill with provider abbreviation.
 * Props: provider ("aws"|"gcp"|"azure"), size ("sm"|"md"|"lg")
 */
import { BrandLogo, getBrandAsset, getBrandSurfaceStyles } from '../../constants/brandAssets'

export default function ProviderBadge({ provider, size = 'md' }) {
  const sizes = {
    sm: { container: 'text-[10px] px-2 py-1 gap-1.5 rounded-md', icon: 12 },
    md: { container: 'text-xs px-2.5 py-1 gap-2 rounded-md', icon: 14 },
    lg: { container: 'text-sm px-3 py-1.5 gap-2 rounded-lg', icon: 16 },
  }

  const asset = getBrandAsset(provider)
  const surfaceStyles = getBrandSurfaceStyles(provider, 0.1)
  const sizeConfig = sizes[size] || sizes.md

  if (!asset) {
    return (
      <span className={`inline-flex items-center font-semibold ${sizeConfig.container}`} style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
        {provider}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center border font-semibold ${sizeConfig.container}`}
      style={surfaceStyles}
    >
      <BrandLogo brandKey={provider} size={sizeConfig.icon} />
    </span>
  )
}
