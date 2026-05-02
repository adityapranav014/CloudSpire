import { BrandLogo } from '../../constants/brandAssets'

export function CloudProviderIcon({ provider, className = 'h-4 w-4' }) {
  return <BrandLogo brandKey={provider} className={className} size={16} />
}
