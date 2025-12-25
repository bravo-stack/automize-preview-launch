interface DiagnosticResult {
  status: 'HEALTHY' | 'ERROR'
  blocking_layer?: 'business' | 'ad_account' | 'billing' | 'delivery'
  error_reason?: string
  raw_signals?: any
}

interface DiagnosticInput {
  adAccountId: string
  accessToken: string
  businessId?: string
}

const API_VERSION = 'v19.0'
const BASE_URL = 'https://graph.facebook.com'

async function fetchFacebookAPI(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {},
) {
  const query = new URLSearchParams({
    access_token: accessToken,
    ...params,
  }).toString()
  const url = `${BASE_URL}/${API_VERSION}/${endpoint}?${query}`

  const response = await fetch(url)
  if (!response.ok) {
    // If 403/400, returns error structure
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData?.error?.message || `API Error: ${response.status}`,
    )
  }
  return response.json()
}

export async function diagnoseAdAccount({
  adAccountId,
  accessToken,
  businessId: providedBusinessId,
}: DiagnosticInput): Promise<DiagnosticResult> {
  const rawSignals: any = {}

  // Ensure adAccountId has act_ prefix if strictly required by endpoints,
  // but usually generic {id} works. The YAML specifies /act_{AD_ACCOUNT_ID}.
  // We'll assume input might or might not have it. Best to normalize?
  // Facebook API usually accepts just the ID or act_ID for some endpoints.
  // However, for /act_ID/funding_sources, it strictly expects the account ID.
  // Let's assume the passed ID is correct for now, or ensure 'act_' prefix if missing?
  // Most internal logic seems to use the raw ID.
  // Let's rely on the input being correct or standardizing it if we see failures.
  // Actually, standard practice: Ad Account ID usually starts with 'act_' in API paths unless it's just the number.
  // Let's try to normalize.
  const numericId = adAccountId.replace(/^act_/, '')
  const actId = `act_${numericId}`

  try {
    // Parallelize independent checks: Account Status, Funding Sources, Ad Sets (Delivery)
    const [accountData, fundingSources, adsets] = await Promise.all([
      // Step 1: Check Ad Account Status
      fetchFacebookAPI(actId, accessToken, {
        fields: 'account_status,disable_reason,balance,spend_cap,business',
      }),
      // Step 2: Check Billing Sources
      fetchFacebookAPI(`${actId}/funding_sources`, accessToken, {
        fields: 'status,type',
      }),
      // Step 3: Check Delivery Level Issues
      fetchFacebookAPI(`${actId}/adsets`, accessToken, {
        fields: 'effective_status,issues_info,status,name',
        limit: '50',
      }),
    ])

    rawSignals.account_status = accountData
    rawSignals.funding_sources = fundingSources.data
    rawSignals.adsets_issues = adsets.data

    const businessId = providedBusinessId || accountData.business?.id

    // Interpretation
    // 1: active, 2: disabled, 3: unsettled_payment, 7: pending_risk_review, 8: in_grace_period (deprecated?), 9: in_grace_period, 100: closed, 101: closed_by_user

    const status = accountData.account_status

    if (status === 2) {
      return {
        status: 'ERROR',
        blocking_layer: 'ad_account',
        error_reason: `Account Disabled (Reason: ${accountData.disable_reason})`,
        raw_signals: rawSignals,
      }
    }

    if (status === 100 || status === 101) {
      return {
        status: 'ERROR',
        blocking_layer: 'ad_account',
        error_reason: 'Account Permanently Closed',
        raw_signals: rawSignals,
      }
    }

    if (status === 3) {
      return {
        status: 'ERROR',
        blocking_layer: 'billing',
        error_reason: 'Unsettled Payment (Account Status: 3)',
        raw_signals: rawSignals,
      }
    }

    if (status === 9) {
      return {
        status: 'ERROR',
        blocking_layer: 'billing',
        error_reason: 'Account in Grace Period (Status: 9)',
        raw_signals: rawSignals,
      }
    }

    if (status === 7) {
      return {
        status: 'ERROR',
        blocking_layer: 'ad_account',
        error_reason: 'Pending Risk Review',
        raw_signals: rawSignals,
      }
    }

    // Step 2 Logic
    if (fundingSources.data && Array.isArray(fundingSources.data)) {
      const failedSource = fundingSources.data.find((fs: any) =>
        ['FAILED', 'EXPIRED', 'DISABLED'].includes(fs.status),
      )

      if (failedSource) {
        return {
          status: 'ERROR',
          blocking_layer: 'billing',
          error_reason: `Funding Source Issue: ${failedSource.status} (${failedSource.type} - ${failedSource.display_string || 'N/A'})`,
          raw_signals: rawSignals,
        }
      }
    }

    // Step 4: Check Business Manager Status (Prioritize if we found a business ID)
    if (businessId) {
      try {
        const businessData = await fetchFacebookAPI(businessId, accessToken, {
          fields: 'is_disabled,business_status,verification_status',
        })
        rawSignals.business_status = businessData

        if (businessData.is_disabled) {
          return {
            status: 'ERROR',
            blocking_layer: 'business',
            error_reason: 'Business Manager Disabled',
            raw_signals: rawSignals,
          }
        }
      } catch (e) {
        console.warn('Failed to check business status', e)
      }
    }

    // Step 3 Logic
    if (adsets.data && Array.isArray(adsets.data)) {
      const problemAdset = adsets.data.find((adset: any) => {
        const hasIssues = adset.issues_info && adset.issues_info.length > 0
        const isDisapproved = adset.effective_status === 'DISAPPROVED'
        return hasIssues || isDisapproved
      })

      if (problemAdset) {
        let reason = 'Delivery Issue'

        if (problemAdset.effective_status === 'DISAPPROVED') {
          reason = 'Ad Set Disapproved'
        }

        if (problemAdset.issues_info && problemAdset.issues_info.length > 0) {
          const issue = problemAdset.issues_info[0]
          reason = `${reason}: ${issue.error_message || issue.error_type}`
        }

        return {
          status: 'ERROR',
          blocking_layer: 'delivery',
          error_reason: `${reason} (Adset: "${problemAdset.name}")`,
          raw_signals: rawSignals,
        }
      }
    }

    return {
      status: 'HEALTHY',
      raw_signals: rawSignals,
    }
  } catch (error: any) {
    return {
      status: 'ERROR',
      blocking_layer: 'ad_account', // Fallback
      error_reason: error.message || 'Unknown API Error during diagnosis',
      raw_signals: { error: error.message, ...rawSignals },
    }
  }
}
