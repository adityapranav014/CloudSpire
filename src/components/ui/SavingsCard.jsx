import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SavingsCard({ recommendation, savings, service, metadata, onAction }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium text-primary">
            {recommendation}
          </CardTitle>
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-emerald-500">
              ${savings.toLocaleString()}/mo
            </div>
            <div className="text-xs text-muted-foreground uppercase mt-1">Est. Savings</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium mb-1">{service}</p>
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
          {metadata}
        </p>
        <Button 
          variant="outline" 
          className="w-full mt-4" 
          onClick={onAction}
        >
          Review Action
        </Button>
      </CardContent>
    </Card>
  )
}