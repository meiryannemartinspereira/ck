import { useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import StudentsPage from './pages/StudentsPage'
import TeachersPage from './pages/TeachersPage'
import ChecklistPage from './pages/ChecklistPage'
import DashboardPage from './pages/DashboardPage'
import type { ClassDay, ClassTime } from './types'
import StudentReportPage from './pages/StudentReportPage'
import ChatWidget from './components/chat/ChatWidget'
import './styles/global.css'

export type PageName =
  | 'home'
  | 'students'
  | 'teachers'
  | 'checklist'
  | 'dashboard'
  | 'student-report'

function getToday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageName>('home')
  const [classDay, setClassDay] = useState<ClassDay>('SEGUNDA')
  const [classTime, setClassTime] = useState<ClassTime>('08-10')
  const [room, setRoom] = useState('')
  const [checklistDate, setChecklistDate] = useState(getToday)

  function renderPage() {
    switch (currentPage) {
      case 'students':
        return <StudentsPage />

      case 'teachers':
        return <TeachersPage />

      case 'checklist':
        return (
          <ChecklistPage
            classDay={classDay}
            classTime={classTime}
            room={room}
            checklistDate={checklistDate}
            onRoomChange={setRoom}
            onClassDayChange={setClassDay}
            onClassTimeChange={setClassTime}
            onChecklistDateChange={setChecklistDate}
          />
        )

      case 'dashboard':
        return (
          <DashboardPage
            classDay={classDay}
            classTime={classTime}
            room={room}
            checklistDate={checklistDate}
          />
        )

      case 'student-report':
        return <StudentReportPage />

      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
      <ChatWidget />
    </AppLayout>
  )
}

export default App