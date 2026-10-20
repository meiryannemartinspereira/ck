import { useEffect, useState } from 'react'
import { listChecklists } from '../services/api'
import type {
  Checklist,
  ClassDay,
  ClassTime,
} from '../types'
import '../styles/dashboard.css'

interface DashboardPageProps {
  classDay: ClassDay
  classTime: ClassTime
  room: string
  checklistDate: string
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function DashboardPage({
  classDay,
  classTime,
  room,
  checklistDate,
}: DashboardPageProps) {
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        if (!room.trim()) {
          setChecklist(null)
          return
        }

        const result = await listChecklists({
          classDay,
          classTime,
          room,
          checklistDate,
        })

        if (active) {
          setChecklist(result[0] ?? null)
        }
      } catch (err) {
        if (active) {
          setChecklist(null)
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar o dashboard.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [classDay, classTime, room, checklistDate])

  const entries = checklist?.entries ?? []

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Acompanhe os checklists dos alunos da turma selecionada.
          </p>
        </div>
      </header>

      <section className="dashboard-selection">
        <div>
          <span className="dashboard-selection-label">Sala</span>
          <strong>{room || 'Não selecionada'}</strong>
        </div>

        <div>
          <span className="dashboard-selection-label">Dia da aula</span>
          <strong>{classDay}</strong>
        </div>

        <div>
          <span className="dashboard-selection-label">Horário</span>
          <strong>{classTime}</strong>
        </div>

        <div>
          <span className="dashboard-selection-label">Data</span>
          <strong>{formatDate(checklistDate)}</strong>
        </div>
      </section>

      {error && (
        <div className="dashboard-message dashboard-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-empty">
          Carregando checklists...
        </div>
      ) : error ? null : entries.length === 0 ? (
        <div className="dashboard-empty">
          <strong>Nenhum checklist encontrado</strong>
          <p>
            Não há alunos para o dia, horário e data selecionados.
          </p>
        </div>
      ) : (
        <>
          <div className="dashboard-carousel-heading">
            <div>
              <h2>Alunos da turma</h2>
              <p>
                {entries.length}{' '}
                {entries.length === 1 ? 'aluno' : 'alunos'}
              </p>
            </div>

            <span className="dashboard-carousel-hint">
              Deslize para navegar
            </span>
          </div>

          <section
            className="dashboard-carousel"
            aria-label="Checklists dos alunos"
          >
            <div className="dashboard-carousel-track">
              {[...entries, ...entries].map((entry, index) => (
                <article
                  className="dashboard-card"
                  key={`${entry.id}-${index}`}
                  aria-label={`Checklist de ${entry.student_name}`}
                >
                  <header className="dashboard-card-header">
                    <div className="dashboard-avatar" aria-hidden="true">
                      {entry.student_name.trim().charAt(0).toUpperCase()}
                    </div>

                    <div className="dashboard-student">
                      <h3>{entry.student_name}</h3>
                      <span>
                        {classDay} · {classTime}
                      </span>
                    </div>
                  </header>

                  <div className="dashboard-card-status-row">
                    <span className="dashboard-info-label">Status</span>

                    <span
                      className={`dashboard-status ${
                        entry.status === 'PREENCHIDO'
                          ? 'dashboard-status-complete'
                          : 'dashboard-status-pending'
                      }`}
                    >
                      {entry.status === 'PREENCHIDO'
                        ? 'Preenchido'
                        : 'Pendente'}
                    </span>
                  </div>

                  <div className="dashboard-card-section">
                    <span className="dashboard-info-label">Curso</span>
                    <p>
                      {entry.course_names.length > 0
                        ? entry.course_names.join(', ')
                        : '—'}
                    </p>
                  </div>

                  <div className="dashboard-card-section">
                    <span className="dashboard-info-label">
                      Professores
                    </span>
                    <p>
                      {entry.teachers.length > 0
                        ? entry.teachers.join(', ')
                        : '—'}
                    </p>
                  </div>

                  <div className="dashboard-card-observation">
                    <span className="dashboard-info-label">
                      Observação
                    </span>
                    <p>{entry.observation?.trim() || 'Sem observações'}</p>
                  </div>

                  <footer className="dashboard-card-footer">
                    Checklist · {formatDate(checklistDate)}
                  </footer>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default DashboardPage