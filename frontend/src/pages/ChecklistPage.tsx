
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listChecklists,
  listStudents,
  listTeachers,
  updateChecklistEntryObservation,
} from '../services/api'
import type {
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

function getLocalDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

async function loadAllRooms(): Promise<string[]> {
  const pageSize = 100

  const [students, teachers] = await Promise.all([
    (async () => {
      const firstPage = await listStudents({ page: 1, pageSize })
      const items = [...firstPage.items]

      for (
        let page = 2;
        items.length < firstPage.total;
        page++
      ) {
        const result = await listStudents({ page, pageSize })

        if (result.items.length === 0) break

        items.push(...result.items)
      }

      return items.map((student) => student.room)
    })(),
    (async () => {
      const firstPage = await listTeachers({ page: 1, pageSize })
      const items = [...firstPage.items]

      for (
        let page = 2;
        items.length < firstPage.total;
        page++
      ) {
        const result = await listTeachers({ page, pageSize })

        if (result.items.length === 0) break

        items.push(...result.items)
      }

      return items.map((teacher) => teacher.room)
    })(),
  ])

  return [...new Set([...students, ...teachers]
    .filter((room): room is string => Boolean(room?.trim()))
    .map((room) => room.trim()))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { numeric: true }),
    )
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedEntry, setSelectedEntry] =
    useState<ChecklistEntry | null>(null)
  const [observation, setObservation] = useState('')

  const todayDate = getLocalDate()

  const queryClient = useQueryClient()

  const roomsQuery = useQuery({
    queryKey: ['checklist-rooms'],
    queryFn: loadAllRooms,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const rooms = roomsQuery.data ?? []

  const checklistQuery = useQuery({
    queryKey: [
      'checklists',
      classDay,
      classTime,
      room.trim(),
      checklistDate,
    ],
    queryFn: () =>
      listChecklists({
        classDay,
        classTime,
        room: room.trim(),
        checklistDate,
      }),
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: Boolean(room.trim()) && checklistDate === todayDate,
  })

  const checklists = checklistQuery.data ?? []
  const checklist = checklists[0] ?? null
  const entries = checklist?.entries ?? []
  const loading = checklistQuery.isLoading

  const saveObservationMutation = useMutation({
    mutationFn: ({
      entryId,
      observation: value,
    }: {
      entryId: ChecklistEntry['id']
      observation: string
    }) => updateChecklistEntryObservation(entryId, value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['checklists'] })
      setSelectedEntry(null)
      setObservation('')
      setSuccess('Observação salva com sucesso.')
    },
    onError: (err) => {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a observação.',
      )
    },
  })

  const saving = saveObservationMutation.isPending

  function openObservationModal(entry: ChecklistEntry) {
    setSelectedEntry(entry)
    setObservation(entry.observation ?? '')
    setError('')
    setSuccess('')
    saveObservationMutation.reset()
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

    if (checklistDate !== getLocalDate()) {
      setError('Só é permitido alterar o checklist da data atual.')
      return
    }

    setError('')
    setSuccess('')

    await saveObservationMutation.mutateAsync({
      entryId: selectedEntry.id,
      observation,
    }).catch(() => undefined)
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
          <select
            value={room}
            onChange={(event) => onRoomChange(event.target.value)}
            disabled={roomsQuery.isLoading}
          >
            <option value="">
              {roomsQuery.isLoading
                ? 'Carregando salas...'
                : 'Selecione uma sala'}
            </option>
            {rooms.map((roomOption) => (
              <option key={roomOption} value={roomOption}>
                {roomOption}
              </option>
            ))}
          </select>
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
            min={todayDate}
            max={todayDate}
            onChange={(event) => {
              const selectedDate = event.target.value

              if (selectedDate === todayDate) {
                onChecklistDateChange(selectedDate)
              }
            }}
          />
        </label>
      </section>

      {checklistDate !== todayDate && (
        <div className="checklist-feedback checklist-error">
          Só é permitido consultar e preencher o checklist da data atual.
        </div>
      )}

      {roomsQuery.isError && (
        <div className="checklist-feedback checklist-error">
          Não foi possível carregar as salas cadastradas.
          <button
            type="button"
            onClick={() => void roomsQuery.refetch()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!room.trim() && (
        <div className="checklist-feedback checklist-error">
          Informe a sala para consultar o checklist.
        </div>
      )}

      {checklistQuery.isError && room.trim() && (
        <div className="checklist-feedback checklist-error">
          {checklistQuery.error instanceof Error
            ? checklistQuery.error.message
            : 'Não foi possível carregar o checklist.'}
          <button
            type="button"
            onClick={() => void checklistQuery.refetch()}
          >
            Tentar novamente
          </button>
        </div>
      )}

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

        {checklistDate !== todayDate ? (
          <div className="checklist-empty">
            Selecione a data atual para consultar o checklist.
          </div>
        ) : loading ? (
          <div className="checklist-empty">
            Carregando checklist...
          </div>
        ) : !room.trim() ? (
          <div className="checklist-empty">
            Informe a sala para consultar o checklist.
          </div>
        ) : checklistQuery.isError ? (
          <div className="checklist-empty">
            Não foi possível carregar o checklist.
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
                        disabled={checklistDate !== todayDate}
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
                  disabled={saving || checklistDate !== todayDate}
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
