import { HanaSheet } from '../components/characters/HanaSheet'
import { TonySheet } from '../components/characters/TonySheet'
import { RiaSheet } from '../components/characters/RiaSheet'

export interface Character {
  id: string
  name: string
  role: string
  description: string
  component: React.ComponentType
}

export const characters: Character[] = [
  {
    id: 'tony',
    name: '토니',
    role: '남자아이',
    description: '호기심이 많고 아이디어가 풍부한 학생 캐릭터',
    component: TonySheet
  },
  {
    id: 'ria',
    name: '리아',
    role: '여자아이',
    description: '생각을 정리하고 핵심을 잘 찾는 학생 캐릭터',
    component: RiaSheet
  },
  {
    id: 'hana',
    name: '하나 선생님',
    role: '교사',
    description: '학습 내용을 친절하게 설명해 주는 선생님 캐릭터',
    component: HanaSheet
  }
]

export const getCharacterById = (id: string): Character | undefined => {
  return characters.find(char => char.id === id)
}
