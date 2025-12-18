import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Info } from 'lucide-react'

export function HubInfoTrig() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
        >
          <Info className="h-4 w-4" />
          Data Organization Guide
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-500">
            <Info className="h-5 w-5" />
            Data Organization Guide
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-500/10 p-5">
          <ul className="space-y-3 text-sm text-blue-400/80">
            <li>
              <strong>Facebook:</strong> Autometric sheets data — Facebook Ads
              performance metrics synced from Google Sheets
            </li>

            <li>
              <strong>Finance Sheet:</strong> FinancialX sheets data — Rebill
              and accounting metrics synced from Google Sheets
            </li>

            <li>
              <strong>API Data:</strong> Data fetched from external APIs
              including Omnisend, Shopify, Themes, and other integrations
            </li>

            <li>
              <strong>Forms:</strong> Client submissions for Day Drop requests
              and Website Revamp requests
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
