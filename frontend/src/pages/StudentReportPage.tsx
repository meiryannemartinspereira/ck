
import { useState } from 'react'
import {
  getStudentChecklistHistory,
} from '../services/api'
import type { StudentChecklistHistory } from '../types'
import '../styles/student-report.css'

function formatDate(value: string): string {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function StudentReportPage() {
  const [name, setName] = useState('')
  const [studentName, setStudentName] = useState('')
  const [history, setHistory] = useState<StudentChecklistHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = name.trim()

    if (!normalizedName) {
      setError('Informe o nome do aluno.')
      return
    }

    setLoading(true)
    setError('')
    setHistory([])
    setStudentName('')
    setSearched(false)

    try {
      const result = await getStudentChecklistHistory(normalizedName)

      setHistory(result)
      setStudentName(result[0]?.student_name ?? normalizedName)
      setSearched(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível consultar o histórico do aluno.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <section className="student-report-page">
      <header className="page-header">
        <span className="eyebrow">CONSULTAS</span>
        <h2>Relatório por aluno</h2>
        <p>Consulte o histórico de checklists de um aluno e gere um PDF.</p>
      </header>

      <form
        className="student-report-search-area"
        onSubmit={(event) => void handleSearch(event)}
      >
        <label className="student-report-field">
          Nome do aluno
          <input
            type="search"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Digite o nome do aluno"
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar histórico'}
        </button>
      </form>

      {error && (
        <p className="student-report-error" role="alert">
          {error}
        </p>
      )}

      {searched && (
        <section className="student-report-results">
          <header className="student-report-heading">
            <div>
              <span className="eyebrow">HISTÓRICO</span>
              <h3>{studentName}</h3>
              <p>
                {history.length} registro(s) encontrado(s)
              </p>
            </div>

            <button
              className="student-report-print-button"
              type="button"
              onClick={handlePrint}
              disabled={history.length === 0}
            >
              Salvar relatório em PDF
            </button>
          </header>

          {history.length === 0 ? (
            <div className="student-report-empty">
              <h3>Nenhum histórico encontrado</h3>
              <p>
                Não foram encontrados registros para o nome informado.
              </p>
            </div>
          ) : (
            <div className="student-report-table-container">
              <table className="student-report-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Dia</th>
                    <th>Horário</th>
                    <th>Checklist</th>
                    <th>Item</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={`${item.checklist_id}-${item.entry_id}`}
                    >
                      <td>{formatDate(item.checklist_date)}</td>
                      <td>{item.class_day}</td>
                      <td>{item.class_time}</td>
                      <td>{item.checklist_status.replaceAll('_', ' ')}</td>
                      <td>{item.status.replaceAll('_', ' ')}</td>
                      <td>{item.observation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  )
}

export default StudentReportPage
