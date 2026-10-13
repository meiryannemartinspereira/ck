import { useEffect, useState } from 'react'
import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudent,
  type StudentInput,
} from '../services/api'
import type { ClassDay, ClassTime, Student } from '../types'
import '../styles/students.css'

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

interface ScheduleForm {
  class_day: ClassDay
  class_time: ClassTime
}

type ModalMode = 'create' | 'edit' | 'view'

const EMPTY_SCHEDULE: ScheduleForm = {
  class_day: 'SEGUNDA',
  class_time: '08-10',
}

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [name, setName] = useState('')
  const [schedules, setSchedules] = useState<ScheduleForm[]>([
    { ...EMPTY_SCHEDULE },
  ])
  const [courses, setCourses] = useState('')

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isReadOnly = modalMode === 'view'

  useEffect(() => {
    let active = true

    async function loadStudents() {
      setLoading(true)
      setError('')

      try {
        const result = await listStudents({
          name: search,
          page,
          pageSize,
        })

        if (active) {
          setStudents(result.items)
          setTotal(result.total)
        }
      } catch {
        if (active) {
          setError('Não foi possível carregar os alunos.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void loadStudents()

    return () => {
      active = false
    }
  }, [search, page])

  function openCreateModal() {
    setSelectedStudent(null)
    setName('')
    setSchedules([{ ...EMPTY_SCHEDULE }])
    setCourses('')
    setError('')
    setSuccess('')
    setModalMode('create')
  }

  function openStudentModal(student: Student, mode: ModalMode) {
    setSelectedStudent(student)
    setName(student.name)
    setSchedules(
      student.schedules.map(({ class_day, class_time }) => ({
        class_day,
        class_time,
      })),
    )
    setCourses(student.course_names.join(', '))
    setError('')
    setSuccess('')
    setModalMode(mode)
  }

  function closeModal() {
    if (saving) return
    setModalMode(null)
    setSelectedStudent(null)
  }

  function updateSchedule(
    index: number,
    field: keyof ScheduleForm,
    value: string,
  ) {
    setSchedules((current) =>
      current.map((schedule, i) =>
        i === index ? { ...schedule, [field]: value } : schedule,
      ),
    )
  }

  function addSchedule() {
    setSchedules((current) => [...current, { ...EMPTY_SCHEDULE }])
  }

  function removeSchedule(index: number) {
    setSchedules((current) => current.filter((_, i) => i !== index))
  }

  async function refreshStudents(
    targetPage = page,
    targetSearch = search,
  ) {
    const result = await listStudents({
      name: targetSearch,
      page: targetPage,
      pageSize,
    })

    setStudents(result.items)
    setTotal(result.total)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const normalizedName = name.trim()
    const courseNames = courses
      .split(',')
      .map((course) => course.trim())
      .filter(Boolean)

    if (!normalizedName) {
      setError('Informe o nome do aluno.')
      return
    }

    if (schedules.length === 0) {
      setError('Adicione pelo menos um dia e horário.')
      return
    }

    const scheduleKeys = schedules.map(
      (schedule) => `${schedule.class_day}-${schedule.class_time}`,
    )

    if (new Set(scheduleKeys).size !== scheduleKeys.length) {
      setError('Não repita a mesma combinação de dia e horário.')
      return
    }

    if (courseNames.length === 0) {
      setError('Informe pelo menos um curso.')
      return
    }

    if (
      new Set(courseNames.map((course) => course.toLocaleLowerCase())).size !==
      courseNames.length
    ) {
      setError('Não repita o mesmo curso.')
      return
    }

    const payload: StudentInput = {
      name: normalizedName,
      schedules,
      course_names: courseNames,
    }

    setSaving(true)

    try {
      if (modalMode === 'edit' && selectedStudent) {
        await updateStudent(selectedStudent.id, payload)
        setSuccess('Aluno atualizado com sucesso.')
      } else {
        await createStudent(payload)
        setSuccess('Aluno cadastrado com sucesso.')
      }

      setModalMode(null)
      setSelectedStudent(null)
      setPage(1)

      await refreshStudents(1)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o aluno.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(student: Student) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o aluno "${student.name}"?`,
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    try {
      await deleteStudent(student.id)

      const nextTotal = Math.max(0, total - 1)
      const nextPage =
        students.length === 1 && page > 1 ? page - 1 : page

      setTotal(nextTotal)
      setStudents((current) =>
        current.filter((item) => item.id !== student.id),
      )
      setPage(nextPage)
      setSuccess('Aluno excluído com sucesso.')

      await refreshStudents(nextPage)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível excluir o aluno.',
      )
    }
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
    setSuccess('')
  }

  return (
    <section className="students-page">
      <header className="page-header">
        <span className="eyebrow">CADASTROS</span>
        <h2>Alunos</h2>
        <p>Gerenciamento de alunos cadastrados.</p>
      </header>

      <div className="students-toolbar">
        <input
          className="students-search"
          type="search"
          placeholder="⌕  Buscar aluno pelo nome..."
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          aria-label="Buscar aluno pelo nome"
        />

        <button
          className="students-add-button"
          type="button"
          onClick={openCreateModal}
        >
          + Adicionar aluno
        </button>
      </div>

      {success && (
        <p className="students-success" role="status">
          {success}
        </p>
      )}

      {error && !modalMode && (
        <p className="students-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="students-feedback">Carregando alunos...</p>
      ) : error && students.length === 0 && !modalMode ? (
        <div className="students-empty">
          <h3>Não foi possível carregar os alunos</h3>
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void refreshStudents().catch(() => {
              setError('Não foi possível carregar os alunos.')
            })}
          >
            Tentar novamente
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="students-empty">
          <h3>Nenhum aluno encontrado</h3>
          <p>
            {search
              ? 'Tente buscar por outro nome.'
              : 'Os alunos cadastrados aparecerão aqui.'}
          </p>
        </div>
      ) : (
        <>
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Horários</th>
                  <th>Professores</th>
                  <th>Cursos</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="students-name">{student.name}</td>

                    <td>
                      {student.schedules.map((schedule) => (
                        <div
                          key={`${schedule.class_day}-${schedule.class_time}`}
                        >
                          {schedule.class_day} — {schedule.class_time}
                        </div>
                      ))}
                    </td>

                    <td>
                      {[
                        ...new Set(
                          student.schedules.flatMap(
                            (schedule) => schedule.teachers,
                          ),
                        ),
                      ].join(', ') || '—'}
                    </td>

                    <td>{student.course_names.join(', ') || '—'}</td>

                    <td>
                      <div className="students-actions">
                        <button
                          className="students-action-button"
                          type="button"
                          title="Visualizar aluno"
                          aria-label={`Visualizar ${student.name}`}
                          onClick={() => openStudentModal(student, 'view')}
                        >
                          ⌕
                        </button>

                        <button
                          className="students-action-button edit"
                          type="button"
                          title="Editar aluno"
                          aria-label={`Editar ${student.name}`}
                          onClick={() => openStudentModal(student, 'edit')}
                        >
                          ✎
                        </button>

                        <button
                          className="students-action-button delete"
                          type="button"
                          title="Excluir aluno"
                          aria-label={`Excluir ${student.name}`}
                          onClick={() => void handleDelete(student)}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="students-pagination">
            <span>{total} aluno(s) encontrado(s)</span>

            <div className="students-pagination-controls">
              <button
                type="button"
                onClick={() => setPage((current) => current - 1)}
                disabled={page <= 1 || loading}
              >
                Anterior
              </button>

              <span>
                Página {page} de {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= totalPages || loading}
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}

      {modalMode && (
        <div
          className="students-modal-backdrop"
          onClick={closeModal}
        >
          <section
            className="students-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="students-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="students-modal-header">
              <div>
                <span className="eyebrow">CADASTRO DE ALUNO</span>
                <h3 id="students-modal-title">
                  {modalMode === 'create'
                    ? 'Adicionar aluno'
                    : modalMode === 'edit'
                      ? 'Editar aluno'
                      : 'Dados do aluno'}
                </h3>
              </div>

              <button
                className="students-modal-close"
                type="button"
                onClick={closeModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form onSubmit={(event) => void handleSave(event)}>
              <fieldset disabled={isReadOnly || saving}>
                <label className="students-field">
                  Nome do aluno
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Digite o nome completo"
                    required
                  />
                </label>

                <div className="students-field-heading">
                  <span>Dias e horários</span>

                  {!isReadOnly && (
                    <button type="button" onClick={addSchedule}>
                      + Adicionar horário
                    </button>
                  )}
                </div>

                <div className="students-schedule-list">
                  {schedules.map((schedule, index) => (
                    <div
                      className="students-schedule-row"
                      key={index}
                    >
                      <label className="students-field">
                        Dia
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

                      <label className="students-field">
                        Horário
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

                      {!isReadOnly && schedules.length > 1 && (
                        <button
                          className="students-remove-schedule"
                          type="button"
                          onClick={() => removeSchedule(index)}
                          aria-label="Remover horário"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <label className="students-field">
                  Cursos
                  <input
                    value={courses}
                    onChange={(event) => setCourses(event.target.value)}
                    placeholder="Ex.: Robótica, Programação"
                    required
                  />
                  <small>Separe os cursos por vírgula.</small>
                </label>
              </fieldset>

              {error && (
                <p className="students-error" role="alert">
                  {error}
                </p>
              )}

              {isReadOnly && selectedStudent && (
                <p className="students-feedback">
                  ID: {selectedStudent.id}
                </p>
              )}

              <footer className="students-modal-actions">
                <button
                  className="students-cancel-button"
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  {isReadOnly ? 'Fechar' : 'Cancelar'}
                </button>

                {!isReadOnly && (
                  <button
                    className="students-add-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? 'Salvando...'
                      : modalMode === 'edit'
                        ? 'Salvar alterações'
                        : 'Cadastrar aluno'}
                  </button>
                )}
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default StudentsPage