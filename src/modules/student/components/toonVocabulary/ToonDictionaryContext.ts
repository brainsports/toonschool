import { createContext } from 'react'
import type { ToonDictionaryFloatingWidgetProps } from './ToonDictionaryFloatingWidget'

export type DictionaryPageContext = Omit<ToonDictionaryFloatingWidgetProps, 'placement'>
export type DictionaryContextSetter = (value: DictionaryPageContext | null) => void

export const ToonDictionaryContext = createContext<DictionaryContextSetter | null>(null)
