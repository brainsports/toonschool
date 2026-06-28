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

export const getSubjectsByGradeAndSemester = async (gradeValue: number, semesterValue: number): Promise<StudentSubjectOption[]> => {
  try {
    // 1. 해당 학년의 모든 단원 조회 (영어는 학기 구분이 없을 수 있으므로 학년으로만 우선 조회)
    const { data: units, error: unitError } = await supabase
      .from('curriculum_units')
      .select('subject_id, semester')
      .eq('grade', gradeValue)
      
    if (unitError) throw unitError
    
    // 해당 학기에 속한 단원이 있는 과목 ID 추출
    const semesterSubjectIds = new Set(
      units.filter(u => u.semester === semesterValue).map(u => u.subject_id)
    );
    
    const allSubjectIds = Array.from(new Set(units.map(item => item.subject_id)))
    
    if (allSubjectIds.length === 0) return []

    // 2. subject_id로 과목 상세 조회
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, code')
      .in('id', allSubjectIds)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (subjectError) throw subjectError

    // 3. 영어(ENG)는 학기에 무관하게 항상 포함, 나머지는 선택한 학기의 단원이 있는 과목만 포함
    const filteredSubjects = subjects.filter(s => 
      s.code === 'ENG' || semesterSubjectIds.has(s.id)
    );

    return filteredSubjects.map(s => ({
      id: s.id,
      name: s.name,
      code: s.code
    }))
  } catch (error) {
    console.error(`Error fetching subjects for grade ${gradeValue}:`, error)
    return [] // Mock fallback 제거
  }
}

export const getMajorUnitsByGradeSemesterAndSubject = async (
  gradeValue: number,
  semesterValue: number,
  subjectId: string,
  subjectCode?: string
): Promise<StudentMajorUnitOption[]> => {
  try {
    let query = supabase
      .from('curriculum_units')
      .select('id, unit_number, unit_name')
      .eq('grade', gradeValue)
      .eq('subject_id', subjectId);
      
    // 영어(ENG)는 학기 구분 없이 모두 가져오고, 나머지는 선택한 학기 데이터만 가져오도록 필터링
    if (subjectCode !== 'ENG') {
      query = query.eq('semester', semesterValue);
    }

    const { data, error } = await query.order('unit_number', { ascending: true })

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

    const HIDDEN_STUDENT_SUBUNITS = new Set([
      '단원 도입',
      '단원 정리',
    ]);

    const visibleSubunits = data.filter((subunit) => {
      const name = (subunit.subunit_name ?? '').trim();
      return !HIDDEN_STUDENT_SUBUNITS.has(name);
    });

    return visibleSubunits.map(item => ({
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
