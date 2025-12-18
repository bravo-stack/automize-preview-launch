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
        <Button variant="outline" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          Hub Data Guide
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Data Organization Guide
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 rounded-lg border p-5">
          <ul className="space-y-3 text-sm">
            <li>
              <strong>1. Facebook:</strong> Autometric sheets data — Facebook
              Ads performance metrics synced from Google Sheets
            </li>

            <li>
              <strong>2. Finance Sheet:</strong> FinancialX sheets data — Rebill
              and accounting metrics synced from Google Sheets
            </li>

            <li>
              <strong>3. API Data:</strong> Data fetched from external APIs
              including Omnisend, Shopify, Themes, and other integrations
            </li>

            <li>
              <strong>4. Forms:</strong> Client submissions for Day Drop
              requests and Website Revamp requests
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
