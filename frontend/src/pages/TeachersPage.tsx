import { useEffect, useState } from 'react'
import {
  createTeacher,
  deleteTeacher,
  listTeachers,
  updateTeacher,
} from '../services/api'
import type {
  ClassDay,
  ClassTime,
  Teacher,
  TeacherInput,
  TeacherSchedule,
} from '../types'
import '../styles/teachers.css'

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

const PAGE_SIZE = 10

type ModalMode = 'create' | 'edit' | null

interface TeacherFormData {
  name: string
  schedules: TeacherSchedule[]
}

const EMPTY_FORM: TeacherFormData = {
  name: '',
  schedules: [{ class_day: 'SEGUNDA', class_time: '08-10' }],
}

function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [form, setForm] = useState<TeacherFormData>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  async function refreshTeachers(
    targetPage = page,
    targetSearch = search,
  ) {
    setLoading(true)

    try {
      const result = await listTeachers({
        name: targetSearch,
        page: targetPage,
        pageSize: PAGE_SIZE,
      })

      setTeachers(result.items)
      setTotal(result.total)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os professores.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshTeachers(page, search)
  }, [page, search])

  function openCreateModal() {
    setForm({
      name: '',
      schedules: [{ class_day: 'SEGUNDA', class_time: '08-10' }],
    })
    setEditingTeacher(null)
    setError('')
    setSuccess('')
    setModalMode('create')
  }

  function openEditModal(teacher: Teacher) {
    setForm({
      name: teacher.name,
      schedules: teacher.schedules.map((schedule) => ({
        class_day: schedule.class_day,
        class_time: schedule.class_time,
      })),
    })
    setEditingTeacher(teacher)
    setError('')
    setSuccess('')
    setModalMode('edit')
  }

  function closeModal() {
    if (saving) return

    setModalMode(null)
    setEditingTeacher(null)
    setError('')
  }

  function updateSchedule(
    index: number,
    field: keyof TeacherSchedule,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index
          ? { ...schedule, [field]: value }
          : schedule,
      ),
    }))
  }

  function addSchedule() {
    setForm((current) => ({
      ...current,
      schedules: [
        ...current.schedules,
        { class_day: 'SEGUNDA', class_time: '08-10' },
      ],
    }))
  }

  function removeSchedule(index: number) {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.filter(
        (_, scheduleIndex) => scheduleIndex !== index,
      ),
    }))
  }

  function validateForm(): string | null {
    if (!form.name.trim()) {
      return 'Informe o nome do professor.'
    }

    if (form.schedules.length === 0) {
      return 'Adicione pelo menos um dia e horário.'
    }

    const uniqueSchedules = new Set(
      form.schedules.map(
        (schedule) => `${schedule.class_day}-${schedule.class_time}`,
      ),
    )

    if (uniqueSchedules.size !== form.schedules.length) {
      return 'Não repita a mesma combinação de dia e horário.'
    }

    return null
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    const data: TeacherInput = {
      name: form.name.trim(),
      schedules: form.schedules,
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (modalMode === 'edit' && editingTeacher) {
        await updateTeacher(editingTeacher.id, data)
        setSuccess('Professor atualizado com sucesso.')
      } else {
        await createTeacher(data)
        setSuccess('Professor cadastrado com sucesso.')
      }

      setModalMode(null)
      setEditingTeacher(null)
      setPage(1)
      await refreshTeachers(1, search)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o professor.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(teacher: Teacher) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o professor "${teacher.name}"?`,
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await deleteTeacher(teacher.id)

      const nextPage =
        teachers.length === 1 && page > 1 ? page - 1 : page

      setTeachers((current) =>
        current.filter((item) => item.id !== teacher.id),
      )
      setTotal((current) => Math.max(0, current - 1))
      setSuccess('Professor excluído com sucesso.')

      if (nextPage !== page) {
        setPage(nextPage)
      }

      await refreshTeachers(nextPage, search)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível excluir o professor.',
      )
    }
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
    setError('')
    setSuccess('')
  }

  return (
    <main className="teachers-page">
      <header className="teachers-header">
        <div>
          <h1>Professores</h1>
          <p>Gerencie os professores, seus dias e horários de aula.</p>
        </div>

        <button
          className="teachers-add-button"
          onClick={openCreateModal}
          type="button"
        >
          + Novo professor
        </button>
      </header>

      {success && (
        <div className="teachers-feedback teachers-success">
          {success}
        </div>
      )}

      {error && !modalMode && (
        <div className="teachers-feedback teachers-error">
          {error}
        </div>
      )}

      <section className="teachers-toolbar">
        <label className="teachers-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar professor pelo nome..."
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            aria-label="Buscar professor pelo nome"
          />
        </label>

        <span className="teachers-count">
          {total} {total === 1 ? 'professor' : 'professores'}
        </span>
      </section>

      <section className="teachers-table-container">
        <table className="teachers-table">
          <thead>
            <tr>
              <th>Professor</th>
              <th>Dias e horários</th>
              <th className="teachers-actions-heading">Ações</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="teachers-message">
                  Carregando professores...
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={3} className="teachers-message">
                  <div className="teachers-empty">
                    <span aria-hidden="true">♧</span>
                    <strong>
                      {search
                        ? 'Nenhum professor encontrado'
                        : 'Nenhum professor cadastrado'}
                    </strong>
                    <p>
                      {search
                        ? 'Tente buscar por outro nome.'
                        : 'Cadastre um professor para começar.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td>
                    <div className="teachers-name">
                      <span className="teachers-avatar" aria-hidden="true">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                      <strong>{teacher.name}</strong>
                    </div>
                  </td>

                  <td>
                    <div className="teachers-schedule-list">
                      {teacher.schedules.map((schedule, index) => (
                        <span
                          className="teachers-schedule"
                          key={`${schedule.class_day}-${schedule.class_time}-${index}`}
                        >
                          <strong>{schedule.class_day}</strong>
                          <span>{schedule.class_time}</span>
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <div className="teachers-actions">
                      <button
                        type="button"
                        className="teachers-action teachers-edit"
                        onClick={() => openEditModal(teacher)}
                        aria-label={`Editar ${teacher.name}`}
                        title="Editar professor"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="teachers-action teachers-delete"
                        onClick={() => void handleDelete(teacher)}
                        aria-label={`Excluir ${teacher.name}`}
                        title="Excluir professor"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {!loading && total > 0 && (
        <footer className="teachers-pagination">
          <span>
            Página {page} de {totalPages}
          </span>

          <div>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima
            </button>
          </div>
        </footer>
      )}

      {modalMode && (
        <div
          className="teachers-modal-backdrop"
          onClick={closeModal}
        >
          <section
            className="teachers-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teachers-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="teachers-modal-header">
              <div>
                <h2 id="teachers-modal-title">
                  {modalMode === 'create'
                    ? 'Novo professor'
                    : 'Editar professor'}
                </h2>
                <p>Preencha os dados e os horários disponíveis.</p>
              </div>

              <button
                type="button"
                className="teachers-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form onSubmit={handleSave}>
              <div className="teachers-form-body">
                {error && (
                  <div className="teachers-feedback teachers-error">
                    {error}
                  </div>
                )}

                <label className="teachers-field">
                  <span>Nome do professor</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Digite o nome completo"
                    required
                    autoFocus
                  />
                </label>

                <div className="teachers-schedules-heading">
                  <div>
                    <h3>Dias e horários</h3>
                    <p>Adicione todas as combinações disponíveis.</p>
                  </div>

                  <button
                    type="button"
                    className="teachers-add-schedule"
                    onClick={addSchedule}
                  >
                    + Adicionar
                  </button>
                </div>

                <div className="teachers-form-schedules">
                  {form.schedules.map((schedule, index) => (
                    <div
                      className="teachers-form-schedule"
                      key={index}
                    >
                      <label className="teachers-field">
                        <span>Dia</span>
                        <select
                          value={schedule.class_day}
                          onChange={(event) =>
                            updateSchedule(
                              index,
                              'class_day',
                              event.target.value,
                            )
                          }
                        >
                          {DAYS.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="teachers-field">
                        <span>Horário</span>
                        <select
                          value={schedule.class_time}
                          onChange={(event) =>
                            updateSchedule(
                              index,
                              'class_time',
                              event.target.value,
                            )
                          }
                        >
                          {TIMES.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        className="teachers-remove-schedule"
                        onClick={() => removeSchedule(index)}
                        disabled={form.schedules.length === 1}
                        aria-label={`Remover horário ${index + 1}`}
                        title="Remover horário"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <footer className="teachers-modal-footer">
                <button
                  type="button"
                  className="teachers-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="teachers-save-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Salvando...'
                    : modalMode === 'create'
                      ? 'Cadastrar professor'
                      : 'Salvar alterações'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default TeachersPage
