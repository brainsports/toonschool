import { supabase } from '../../../shared/lib/supabase'
import type {
  StudentGradeOption,
  StudentSubjectOption,
  StudentMajorUnitOption,
  StudentMiddleUnitOption
} from '../types/studentCurriculum'

export const getStudentGrades = async (): Promise<StudentGradeOption[]> => {
  try {
    const { data, error } = await supabase
      .from('curriculum_units')
      .select('grade')
      
    if (error) throw error

    // 고유 학년 추출 후 정렬
    const uniqueGrades = Array.from(new Set(data.map(item => item.grade))).sort()
    
    return uniqueGrades.map(g => ({
      id: `grade-${g}`,
      value: g,
      label: `초${g}`
    }))
  } catch (error) {
    console.error('Error fetching grades:', error)
    return [] // Mock fallback 제거, 실제 DB 실패 시 빈 배열 반환
  }
}

export const getSubjectsByGrade = async (gradeValue: number): Promise<StudentSubjectOption[]> => {
  try {
    // 1. 해당 학년이 있는 subject_id 고유값 조회
    const { data: units, error: unitError } = await supabase
      .from('curriculum_units')
      .select('subject_id')
      .eq('grade', gradeValue)
      
    if (unitError) throw unitError
    
    const subjectIds = Array.from(new Set(units.map(item => item.subject_id)))
    
    if (subjectIds.length === 0) return []

    // 2. subject_id로 과목 상세 조회
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, code')
      .in('id', subjectIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (subjectError) throw subjectError

    return subjects.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code
    }))
  } catch (error) {
    console.error(`Error fetching subjects for grade ${gradeValue}:`, error)
    return [] // Mock fallback 제거
  }
}

export const getMajorUnitsByGradeAndSubject = async (
  gradeValue: number,
  subjectId: string
): Promise<StudentMajorUnitOption[]> => {
  try {
    const { data, error } = await supabase
      .from('curriculum_units')
      .select('id, unit_number, unit_name')
      .eq('grade', gradeValue)
      .eq('subject_id', subjectId)
      .order('unit_number', { ascending: true })

    if (error) throw error

    return data.map(item => ({
      id: item.id,
      unitNumber: item.unit_number,
      unitName: item.unit_name
    }))
  } catch (error) {
    console.error('Error fetching major units:', error)
    return []
  }
}

export const getMiddleUnitsByMajorUnit = async (
  majorUnitId: string
): Promise<StudentMiddleUnitOption[]> => {
  try {
    const { data, error } = await supabase
      .from('curriculum_subunits')
      .select('id, subunit_number, subunit_name, subunit_summary')
      .eq('unit_id', majorUnitId)
      .order('subunit_number', { ascending: true })

    if (error) throw error

    return data.map(item => ({
      id: item.id,
      subunitNumber: item.subunit_number,
      subunitName: item.subunit_name,
      subunitSummary: item.subunit_summary || ''
    }))
  } catch (error) {
    console.error('Error fetching middle units:', error)
    return []
  }
}
