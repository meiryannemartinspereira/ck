import { useEffect, useState } from 'react'
import {
  listChecklists,
  updateChecklistEntryObservation,
} from '../services/api'
import type {
  Checklist,
  ChecklistEntry,
  ClassDay,
  ClassTime,
} from '../types'
import '../styles/checklist.css'

const DAYS: ClassDay[] = [
  'SEGUNDA',
  'TERÇA',
  'QUARTA',
  'QUINTA',
  'SEXTA',
  'SÁBADO',
]

const TIMES: ClassTime[] = [
  '08-10',
  '10-12',
  '13:30-15:30',
  '15:30-17:30',
]

interface ChecklistPageProps {
  classDay: ClassDay
  classTime: ClassTime
  room: string
  checklistDate: string
  onRoomChange: (room: string) => void
  onClassDayChange: (day: ClassDay) => void
  onClassTimeChange: (time: ClassTime) => void
  onChecklistDateChange: (date: string) => void
}

function formatDate(date: string): string {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function ChecklistPage({
  classDay,
  classTime,
  room,
  checklistDate,
  onRoomChange,
  onClassDayChange,
  onClassTimeChange,
  onChecklistDateChange,
}: ChecklistPageProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedEntry, setSelectedEntry] =
    useState<ChecklistEntry | null>(null)
  const [observation, setObservation] = useState('')

  const checklist = checklists[0] ?? null
  const entries = checklist?.entries ?? []

  async function loadChecklist() {
    if (!room.trim()) {
      setChecklists([])
      setError('Informe a sala para consultar o checklist.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await listChecklists({
        classDay,
        classTime,
        room,
        checklistDate,
      })

      setChecklists(result)
    } catch (err) {
      setChecklists([])
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar o checklist.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadChecklist()
  }, [classDay, classTime, room, checklistDate])

  function openObservationModal(entry: ChecklistEntry) {
    setSelectedEntry(entry)
    setObservation(entry.observation ?? '')
    setError('')
    setSuccess('')
  }

  function closeObservationModal() {
    if (saving) return

    setSelectedEntry(null)
    setObservation('')
  }

  async function handleSaveObservation(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!selectedEntry) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateChecklistEntryObservation(
        selectedEntry.id,
        observation,
      )

      setSelectedEntry(null)
      setObservation('')
      setSuccess('Observação salva com sucesso.')

      await loadChecklist()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a observação.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="checklist-page">
      <header className="checklist-header">
        <div>
          <h1>Checklist</h1>
          <p>
            Acompanhe os registros dos alunos por dia e horário.
          </p>
        </div>
      </header>

      <section className="checklist-filters">
        <label className="checklist-field">
          <span>Sala</span>
          <input
            type="text"
            value={room}
            onChange={(event) => onRoomChange(event.target.value)}
            placeholder="Ex.: Sala 1"
            maxLength={100}
          />
        </label>

        <label className="checklist-field">
          <span>Dia da aula</span>
          <select
            value={classDay}
            onChange={(event) =>
              onClassDayChange(event.target.value as ClassDay)
            }
          >
            {DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </label>

        <label className="checklist-field">
          <span>Horário</span>
          <select
            value={classTime}
            onChange={(event) =>
              onClassTimeChange(event.target.value as ClassTime)
            }
          >
            {TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>

        <label className="checklist-field">
          <span>Data</span>
          <input
            type="date"
            value={checklistDate}
            onChange={(event) =>
              onChecklistDateChange(event.target.value)
            }
          />
        </label>
      </section>

      {error && (
        <div className="checklist-feedback checklist-error">
          {error}
        </div>
      )}

      {success && (
        <div className="checklist-feedback checklist-success">
          {success}
        </div>
      )}

      <section className="checklist-content">
        <div className="checklist-content-header">
          <div>
            <h2>
              {classDay} · {classTime} · {room || 'Selecione a sala'}
            </h2>
            <p>{formatDate(checklistDate)}</p>
          </div>

          {checklist && (
            <span
              className={`checklist-status ${
                checklist.status === 'CONCLUIDO'
                  ? 'checklist-status-complete'
                  : 'checklist-status-progress'
              }`}
            >
              {checklist.status === 'CONCLUIDO'
                ? 'Concluído'
                : 'Em andamento'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="checklist-empty">
            Carregando checklist...
          </div>
        ) : !checklist || entries.length === 0 ? (
          <div className="checklist-empty">
            <strong>Nenhum aluno encontrado</strong>
            <p>
              Não há alunos cadastrados para este dia e horário na
              data selecionada.
            </p>
          </div>
        ) : (
          <div className="checklist-table-container">
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Professores</th>
                  <th>Curso</th>
                  <th>Status</th>
                  <th>Observação</th>
                  <th>Data</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong>{entry.student_name}</strong>
                    </td>

                    <td>
                      {entry.teachers.length > 0
                        ? entry.teachers.join(', ')
                        : '—'}
                    </td>

                    <td>
                      {entry.course_names.length > 0
                        ? entry.course_names.join(', ')
                        : '—'}
                    </td>

                    <td>
                      <span
                        className={`checklist-entry-status ${
                          entry.status === 'PREENCHIDO'
                            ? 'checklist-entry-complete'
                            : 'checklist-entry-pending'
                        }`}
                      >
                        {entry.status === 'PREENCHIDO'
                          ? 'Preenchido'
                          : 'Pendente'}
                      </span>
                    </td>

                    <td className="checklist-observation-cell">
                      {entry.observation?.trim() || '—'}
                    </td>

                    <td>{formatDate(checklist.date)}</td>

                    <td>
                      <button
                        type="button"
                        className="checklist-fill-button"
                        onClick={() => openObservationModal(entry)}
                      >
                        Preencher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedEntry && (
        <div
          className="checklist-modal-backdrop"
          onClick={closeObservationModal}
        >
          <section
            className="checklist-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="checklist-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="checklist-modal-header">
              <div>
                <h2 id="checklist-modal-title">
                  Preencher checklist
                </h2>
                <p>{selectedEntry.student_name}</p>
              </div>

              <button
                type="button"
                className="checklist-modal-close"
                onClick={closeObservationModal}
                disabled={saving}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSaveObservation}>
              <div className="checklist-modal-body">
                {error && (
                  <div className="checklist-feedback checklist-error">
                    {error}
                  </div>
                )}

                <label className="checklist-field">
                  <span>Observação</span>
                  <textarea
                    value={observation}
                    onChange={(event) =>
                      setObservation(event.target.value)
                    }
                    placeholder="Digite a observação do aluno..."
                    rows={5}
                    autoFocus
                  />
                </label>
              </div>

              <footer className="checklist-modal-footer">
                <button
                  type="button"
                  className="checklist-cancel-button"
                  onClick={closeObservationModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="checklist-save-button"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar observação'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default ChecklistPage