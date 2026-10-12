
import type { ReactNode } from 'react'
import type { PageName } from '../../App'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  currentPage: PageName
  onNavigate: (page: PageName) => void
  children: ReactNode
}

function AppLayout({
  currentPage,
  onNavigate,
  children,
}: AppLayoutProps) {
  return (
    <div className="app-layout">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default AppLayout
