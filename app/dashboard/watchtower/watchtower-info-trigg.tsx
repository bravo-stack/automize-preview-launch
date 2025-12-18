import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Info } from 'lucide-react'

export function WatchtowerInfoTrig() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
        >
          <Info className="h-4 w-4" />
          Available Data Domains
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-500">
            <Info className="h-5 w-5" />
            Available Data Domains for Monitoring
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-5">
          <p className="mb-4 text-sm text-blue-400/80">
            Rules can be configured to monitor data from any of these Hub
            domains:
          </p>

          <ul className="space-y-3 text-sm text-blue-400/80">
            <li>
              <strong>Facebook (Autometric):</strong> Facebook Ads performance
              metrics from Autometric sheets — ad spend, ROAS, CPA, CTR, hook
              rate, and more
            </li>

            <li>
              <strong>Finance (FinancialX):</strong> Rebill and accounting
              metrics from FinancialX sheets — rebill spend, rebill ROAS,
              revenue tracking
            </li>

            <li>
              <strong>API Data Records:</strong> Individual records from
              external APIs like Omnisend, Shopify, and other integrations
            </li>

            <li>
              <strong>Form Submissions:</strong> Day Drop requests and Website
              Revamp submissions — status tracking and SLA monitoring
            </li>

            <li>
              <strong>API Snapshots:</strong> API data sync health — alerts on
              failures or high error rates
            </li>

            <li>
              <strong>Sheet Snapshots:</strong> Google Sheet refresh status —
              alerts on sync failures or stale data
            </li>

            <li>
              <strong>Communications Report:</strong> Communications report data
              — client and IXM team response times, including pod and guild
              information
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
