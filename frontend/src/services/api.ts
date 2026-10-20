import type {
  Checklist,
  PaginatedStudents,
  PaginatedTeachers,
  Student,
  Teacher,
  TeacherInput,
  StudentChecklistHistory,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL

export interface StudentScheduleInput {
  class_day: Student['schedules'][number]['class_day']
  class_time: Student['schedules'][number]['class_time']
}

export interface StudentInput {
  name: string
  room: string
  schedules: StudentScheduleInput[]
  course_names: string[]
}

interface ListStudentsParams {
  name?: string
  page: number
  pageSize: number
}

interface ListTeachersParams {
  name?: string
  page: number
  pageSize: number
}

interface ListChecklistsParams {
  room: string
  classDay: Checklist['class_day']
  classTime: Checklist['class_time']
  checklistDate?: string
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body?.detail

    throw new Error(
      typeof detail === 'string'
        ? detail
        : 'Não foi possível concluir a operação.',
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function listStudents({
  name,
  page,
  pageSize,
}: ListStudentsParams): Promise<PaginatedStudents> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })

  if (name?.trim()) {
    params.set('name', name.trim())
  }

  return request<PaginatedStudents>(`/students/?${params.toString()}`)
}

export function createStudent(data: StudentInput): Promise<Student> {
  return request<Student>('/students/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateStudent(
  studentId: number,
  data: StudentInput,
): Promise<Student> {
  return request<Student>(`/students/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteStudent(studentId: number): Promise<void> {
  return request<void>(`/students/${studentId}`, {
    method: 'DELETE',
  })
}

export async function listTeachers({
  name,
  page,
  pageSize,
}: ListTeachersParams): Promise<PaginatedTeachers> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })

  if (name?.trim()) {
    params.set('name', name.trim())
  }

  return request<PaginatedTeachers>(`/teachers/?${params.toString()}`)
}

export function createTeacher(data: TeacherInput): Promise<Teacher> {
  return request<Teacher>('/teachers/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTeacher(
  teacherId: number,
  data: TeacherInput,
): Promise<Teacher> {
  return request<Teacher>(`/teachers/${teacherId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteTeacher(teacherId: number): Promise<void> {
  return request<void>(`/teachers/${teacherId}`, {
    method: 'DELETE',
  })
}

export async function listChecklists({
  room,
  classDay,
  classTime,
  checklistDate,
}: ListChecklistsParams): Promise<Checklist[]> {
  const params = new URLSearchParams({
    class_day: classDay,
    class_time: classTime,
    room: room.trim(),
  })

  if (checklistDate) {
    params.set('checklist_date', checklistDate)
  }

  return request<Checklist[]>(`/checklists/?${params.toString()}`)
}

export function updateChecklistEntryObservation(
  entryId: number,
  observation: string,
): Promise<Checklist['entries'][number]> {
  return request<Checklist['entries'][number]>(
    `/checklists/entries/${entryId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ observation }),
    },
  )
}

export function getStudentChecklistHistory(
  name: string,
): Promise<StudentChecklistHistory[]> {
  const params = new URLSearchParams({ name: name.trim() })

  return request<StudentChecklistHistory[]>(
    `/checklists/student-history?${params.toString()}`,
  )
}
