
import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import StudentsPage from './pages/StudentsPage'
import TeachersPage from './pages/TeachersPage'
import ChecklistPage from './pages/ChecklistPage'
import DashboardPage from './pages/DashboardPage'
import './styles/global.css'

export type PageName =
  | 'home'
  | 'students'
  | 'teachers'
  | 'checklist'
  | 'dashboard'

function App() {
  const [currentPage, setCurrentPage] = useState<PageName>('home')

  function renderPage() {
    switch (currentPage) {
      case 'students':
        return <StudentsPage />
      case 'teachers':
        return <TeachersPage />
      case 'checklist':
        return <ChecklistPage />
      case 'dashboard':
        return <DashboardPage />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AppLayout>
  )
}

export default App
