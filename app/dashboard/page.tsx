import { createClient } from '@/lib/db/server'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  ClipboardList,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  MessageSquare,
  Phone,
  Server,
  Settings,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface Pod {
  id: number
  name: string | null
}

interface SubRoute {
  label: string
  href: string
}

interface QuickLinkSection {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  gradient: string
  subRoutes?: SubRoute[]
  badge?: string
}

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
}

// Exec Dashboard Configuration
const execSections: QuickLinkSection[] = [
  {
    title: 'Hub',
    description:
      'Central command for all client data, accounts, and quick lookups',
    href: '/dashboard/hub',
    icon: <Database className="size-6" />,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    badge: 'Core',
  },
  {
    title: 'Watchtower',
    description: 'Real-time monitoring of ad performance and anomaly detection',
    href: '/dashboard/watchtower',
    icon: <Shield className="size-6" />,
    gradient: 'from-emerald-500/20 to-green-500/20',
    badge: 'Live',
  },
  {
    title: 'Facebook Sheets',
    description: 'Ad metrics, spend tracking, and performance reports',
    href: '/dashboard/autometric',
    icon: <BarChart3 className="size-6" />,
    gradient: 'from-violet-500/20 to-purple-500/20',
    subRoutes: [
      { label: 'View Sheets', href: '/dashboard/autometric' },
      {
        label: 'Manage Accounts',
        href: '/dashboard/autometric/manage-accounts',
      },
    ],
  },
  {
    title: 'KPI Dashboard',
    description: 'Key performance indicators and team metrics at a glance',
    href: '/dashboard/kpi',
    icon: <TrendingUp className="size-6" />,
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    title: 'Pod Sheets',
    description: 'Individual pod performance sheets and data',
    href: '/dashboard/pods',
    icon: <FileSpreadsheet className="size-6" />,
    gradient: 'from-rose-500/20 to-pink-500/20',
  },
  {
    title: 'FinancialX',
    description: 'Revenue analytics, billing, and financial reporting',
    href: '/dashboard/financialx',
    icon: <Activity className="size-6" />,
    gradient: 'from-teal-500/20 to-cyan-500/20',
  },
]

const execManagementSections: QuickLinkSection[] = [
  {
    title: 'IXM-Bot',
    description: 'Automated messaging, responses, and bot configurations',
    href: '/dashboard/ixm-bot',
    icon: <Bot className="size-6" />,
    gradient: 'from-indigo-500/20 to-blue-500/20',
  },
  {
    title: 'Communications Audit',
    description: 'Review client communications, response times, and quality',
    href: '/dashboard/communications-audit',
    icon: <MessageSquare className="size-6" />,
    gradient: 'from-sky-500/20 to-blue-500/20',
  },
  {
    title: 'WhatsApp Center',
    description: 'Media buyer communications and message management',
    href: '/dashboard/media-buyer',
    icon: <Phone className="size-6" />,
    gradient: 'from-green-500/20 to-emerald-500/20',
  },
  {
    title: 'Manage Pods',
    description: 'Team assignments, pod configurations, and member management',
    href: '/dashboard/manage-pods',
    icon: <Users className="size-6" />,
    gradient: 'from-purple-500/20 to-violet-500/20',
  },
  {
    title: 'Onboarding',
    description: 'New client setup, workflows, and onboarding progress',
    href: '/dashboard/onboarding',
    icon: <UserPlus className="size-6" />,
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  {
    title: 'Client Forms',
    description: 'Form submissions, day drops, and client requests',
    href: '/dashboard/forms',
    icon: <ClipboardList className="size-6" />,
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    title: 'Services',
    description: 'API integrations, service status, and configurations',
    href: '/dashboard/services',
    icon: <Server className="size-6" />,
    gradient: 'from-slate-500/20 to-zinc-500/20',
  },
]

const execQuickActions: QuickAction[] = [
  {
    label: 'Open Calendar',
    href: '/dashboard/calendar',
    icon: <Calendar className="size-4" />,
  },
  {
    label: 'View KPIs',
    href: '/dashboard/kpi',
    icon: <TrendingUp className="size-4" />,
  },
  {
    label: 'Check Watchtower',
    href: '/dashboard/watchtower',
    icon: <Shield className="size-4" />,
  },
  {
    label: 'Manage Accounts',
    href: '/dashboard/autometric/manage-accounts',
    icon: <Settings className="size-4" />,
  },
]

// Pod Dashboard Configuration
function getPodSections(userId: string, podId: number): QuickLinkSection[] {
  return [
    {
      title: 'Facebook Sheets',
      description: 'Your ad metrics, spend tracking, and performance data',
      href: '/dashboard/autometric',
      icon: <BarChart3 className="size-6" />,
      gradient: 'from-violet-500/20 to-purple-500/20',
    },
    {
      title: 'FinancialX',
      description: 'Revenue analytics and financial reports for your accounts',
      href: '/dashboard/financialx',
      icon: <Activity className="size-6" />,
      gradient: 'from-teal-500/20 to-cyan-500/20',
    },
    {
      title: 'Communications Audit',
      description: 'Review your client communications and response quality',
      href: '/dashboard/communications-audit',
      icon: <MessageSquare className="size-6" />,
      gradient: 'from-sky-500/20 to-blue-500/20',
    },
    {
      title: 'My Accounts',
      description: 'Manage your assigned client accounts and settings',
      href: `/dashboard/media-buyer/${userId}/accounts`,
      icon: <Users className="size-6" />,
      gradient: 'from-emerald-500/20 to-green-500/20',
      subRoutes: [
        {
          label: 'Accounts',
          href: `/dashboard/media-buyer/${userId}/accounts`,
        },
        { label: 'Backend', href: `/dashboard/media-buyer/${userId}/backend` },
        {
          label: 'Notifications',
          href: `/dashboard/media-buyer/${userId}/notifications`,
        },
        {
          label: 'WhatsApp',
          href: `/dashboard/media-buyer/${podId}/whatsapp`,
        },
      ],
    },
  ]
}

function getPodQuickActions(userId: string, podId: number): QuickAction[] {
  return [
    {
      label: 'View Accounts',
      href: `/dashboard/media-buyer/${userId}/accounts`,
      icon: <Users className="size-4" />,
    },
    {
      label: 'Check Notifications',
      href: `/dashboard/media-buyer/${userId}/notifications`,
      icon: <Bell className="size-4" />,
    },
    {
      label: 'Open WhatsApp',
      href: `/dashboard/media-buyer/${podId}/whatsapp`,
      icon: <Phone className="size-4" />,
    },
    {
      label: 'Backend Data',
      href: `/dashboard/media-buyer/${userId}/backend`,
      icon: <Layers className="size-4" />,
    },
  ]
}

// Onboarder Dashboard Configuration
const onboarderSections: QuickLinkSection[] = [
  {
    title: 'Onboarding',
    description: 'Manage new client onboarding workflows and progress tracking',
    href: '/dashboard/onboarding',
    icon: <UserPlus className="size-6" />,
    gradient: 'from-pink-500/20 to-rose-500/20',
    badge: 'Primary',
  },
  {
    title: 'Manage Accounts',
    description: 'Setup and configure new client accounts in the system',
    href: '/dashboard/autometric/manage-accounts',
    icon: <Users className="size-6" />,
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
]

const onboarderQuickActions: QuickAction[] = [
  {
    label: 'New Onboarding',
    href: '/dashboard/onboarding',
    icon: <UserPlus className="size-4" />,
  },
  {
    label: 'Add Account',
    href: '/dashboard/autometric/manage-accounts',
    icon: <Users className="size-4" />,
  },
]

// Components
function SectionCard({ section }: { section: QuickLinkSection }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900">
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-800/80 text-zinc-400 transition-all duration-300 group-hover:scale-110 group-hover:bg-zinc-700 group-hover:text-white">
            {section.icon}
          </div>
          {section.badge && (
            <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400">
              {section.badge}
            </span>
          )}
        </div>

        {/* Content */}
        <Link href={section.href} className="block">
          <h3 className="mb-1.5 text-lg font-semibold text-zinc-200 transition-colors group-hover:text-white">
            {section.title}
          </h3>
          <p className="text-sm leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-400">
            {section.description}
          </p>
        </Link>

        {/* Sub Routes */}
        {section.subRoutes && section.subRoutes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
            {section.subRoutes.map((sub) => (
              <Link
                key={sub.href}
                href={sub.href}
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white"
              >
                {sub.label}
                <ChevronRight className="size-3" />
              </Link>
            ))}
          </div>
        )}

        {/* Hover Arrow */}
        <div className="absolute bottom-5 right-5 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <ArrowRight className="size-5 text-zinc-500" />
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ action }: { action: QuickAction }) {
  return (
    <Link
      href={action.href}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
    >
      {action.icon}
      {action.label}
    </Link>
  )
}

function ExternalSheetLink({ pod, sheetId }: { pod: string; sheetId: string }) {
  return (
    <a
      href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-xl border border-zinc-800 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-4 transition-all hover:border-green-500/30 hover:from-green-500/20 hover:to-emerald-500/20"
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
        <FileSpreadsheet className="size-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-zinc-200">
          {pod.charAt(0).toUpperCase() + pod.slice(1)} Pod Sheet
        </p>
        <p className="text-sm text-zinc-500">Open in Google Sheets</p>
      </div>
      <ExternalLink className="size-4 text-zinc-500 transition-colors group-hover:text-green-400" />
    </a>
  )
}

export default async function DashboardPage() {
  const db = createClient()

  const {
    data: { user },
  } = await db.auth.getUser()

  if (!user || !user.email) {
    redirect('/login')
  }

  const role = user.user_metadata.role ?? 'exec'
  let podData: Pod | null = null
  let sheetId: string | undefined

  if (role === 'pod') {
    // Fetch pod data using user_id
    const { data: fetchedPod } = await db
      .from('pod')
      .select('id, name')
      .eq('user_id', user.id)
      .single()
    podData = fetchedPod

    // Fetch sheet using pod name
    if (podData?.name) {
      const { data } = await db
        .from('sheets')
        .select('sheet_id')
        .eq('pod', podData.name)
        .single()
      sheetId = data?.sheet_id
    }
  }
  const userName = podData?.name ?? 'User'

  // Time-based greeting
  const hour = new Date().getHours()
  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold capitalize text-white">
                {timeGreeting}, {userName}
              </h1>
              <p className="mt-1 text-zinc-500">
                {role === 'exec' &&
                  'Executive Dashboard — Full access to all tools and analytics'}
                {role === 'pod' &&
                  podData?.name &&
                  `${podData.name.charAt(0).toUpperCase() + podData.name.slice(1)} Pod — Your accounts and performance tools`}
                {role === 'onboarding' &&
                  'Onboarding Dashboard — Client setup and account management'}
              </p>
            </div>
          </div>
        </header>

        {/* Quick Actions Bar */}
        <section className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-zinc-500">
              <Zap className="size-4" />
              Quick Actions
            </span>
            <div className="mx-2 h-4 w-px bg-zinc-800" />
            {role === 'exec' &&
              execQuickActions.map((action) => (
                <QuickActionButton key={action.href} action={action} />
              ))}
            {role === 'pod' &&
              podData &&
              getPodQuickActions(user.id, podData.id).map((action) => (
                <QuickActionButton key={action.href} action={action} />
              ))}
            {role === 'onboarding' &&
              onboarderQuickActions.map((action) => (
                <QuickActionButton key={action.href} action={action} />
              ))}
          </div>
        </section>

        {/* Pod External Sheet */}
        {role === 'pod' && sheetId && podData?.name && (
          <section className="mb-8">
            <ExternalSheetLink pod={podData.name} sheetId={sheetId} />
          </section>
        )}

        {/* Main Sections - Exec */}
        {role === 'exec' && (
          <>
            <section className="mb-10">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <Activity className="size-4" />
                Analytics & Monitoring
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {execSections.map((section) => (
                  <SectionCard key={section.href} section={section} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                <Settings className="size-4" />
                Management & Operations
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {execManagementSections.map((section) => (
                  <SectionCard key={section.href} section={section} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* Main Sections - Pod */}
        {role === 'pod' && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <Activity className="size-4" />
              Your Tools
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {podData &&
                getPodSections(user.id, podData.id).map((section) => (
                  <SectionCard key={section.href} section={section} />
                ))}
            </div>
          </section>
        )}

        {/* Main Sections - Onboarder */}
        {role === 'onboarding' && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              <UserPlus className="size-4" />
              Onboarding Tools
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {onboarderSections.map((section) => (
                <SectionCard key={section.href} section={section} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
