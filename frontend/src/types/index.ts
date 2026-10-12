
export type ClassDay =
  | 'SEGUNDA'
  | 'TERÇA'
  | 'QUARTA'
  | 'QUINTA'
  | 'SEXTA'
  | 'SÁBADO'

export type ClassTime = '08-10' | '10-12' | '13:30' | '17:30'

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
