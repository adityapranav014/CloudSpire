import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export function AlertBanner({ type = "info", title, description, className = "" }) {
  const config = {
    info: { icon: Info, wrapperClass: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
    warning: { icon: AlertTriangle, wrapperClass: "border-amber-500/50 bg-amber-500/10 text-amber-400" },
    error: { icon: XCircle, wrapperClass: "border-red-500/50 bg-red-500/10 text-red-500" },
    success: { icon: CheckCircle2, wrapperClass: "border-emerald-500/50 bg-emerald-500/10 text-emerald-500" },
  }

  const { icon: Icon, wrapperClass } = config[type] || config.info

  return (
    <Alert className={`${wrapperClass} ${className}`}>
      <Icon className="h-4 w-4 shrink-0" color="currentColor" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      {description && <AlertDescription className="text-sm mt-1 opacity-90">{description}</AlertDescription>}
    </Alert>
  )
}