import DashboardNav from '@/components/nav/dashboard-nav'

export default async function DashboardLayout({ children }) {
  const links = [
    { text: 'Home', url: '/' },
    { text: 'Courses', url: 'courses' },
    { text: 'Live Lectures', url: 'live' },
    { text: 'Quizzes', url: 'quizzes' },
    { text: 'Notes', url: 'notes' },
    { text: 'Academy Store', url: 'academy-store' },
    { text: 'Profile', url: 'profile' },
  ]

  return (
    <div className=" h-screen overflow-hidden ">
      {/* Only show DashboardNav on large screens */}
      <div className="hidden h-full lg:flex">
        <DashboardNav />
        <div className="flex w-full flex-col">
          <div className=" flex h-[60px] items-center justify-end gap-5 border-b border-zinc-800 px-6"></div>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  )
}
