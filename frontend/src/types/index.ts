
export type ClassDay =
  | 'SEGUNDA'
  | 'TERÇA'
  | 'QUARTA'
  | 'QUINTA'
  | 'SEXTA'
  | 'SÁBADO'

export type ClassTime =
  | '08-10'
  | '10-12'
  | '13:30-15:30'
  | '15:30-17:30'

export interface StudentSchedule {
  class_day: ClassDay
  class_time: ClassTime
  teachers: string[]
}

export interface Student {
  id: number
  name: string
  schedules: StudentSchedule[]
  course_names: string[]
}

export interface PaginatedStudents {
  items: Student[]
  total: number
  page: number
  page_size: number
}

export interface TeacherSchedule {
  class_day: ClassDay
  class_time: ClassTime
}

export interface Teacher {
  id: number
  name: string
  schedules: TeacherSchedule[]
}

export interface PaginatedTeachers {
  items: Teacher[]
  total: number
  page: number
  page_size: number
}

export interface TeacherInput {
  name: string
  schedules: TeacherSchedule[]
}

export type ChecklistEntryStatus = 'PENDENTE' | 'PREENCHIDO'

export type ChecklistStatus = 'EM_ANDAMENTO' | 'CONCLUIDO'

export interface ChecklistEntry {
  id: number
  student_id: number
  student_name: string
  teachers: string[]
  course_names: string[]
  status: ChecklistEntryStatus
  observation: string
}

export interface Checklist {
  id: number
  class_day: ClassDay
  class_time: ClassTime
  status: ChecklistStatus
  date: string
  entries: ChecklistEntry[]
}
