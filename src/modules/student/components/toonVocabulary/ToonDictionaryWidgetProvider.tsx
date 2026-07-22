import { useMemo, useState, type ReactNode } from 'react'
import ToonDictionaryFloatingWidget, { type ToonDictionaryFloatingWidgetProps } from './ToonDictionaryFloatingWidget'
import { ToonDictionaryContext, type DictionaryPageContext } from './ToonDictionaryContext'

interface ToonDictionaryWidgetProviderProps {
  children: ReactNode
  defaultContext: DictionaryPageContext
  placement?: ToonDictionaryFloatingWidgetProps['placement']
}

export default function ToonDictionaryWidgetProvider({ children, defaultContext, placement }: ToonDictionaryWidgetProviderProps) {
  const [pageContext, setPageContext] = useState<DictionaryPageContext | null>(null)
  const resolvedContext = useMemo(
    () => ({ ...defaultContext, ...pageContext }),
    [defaultContext, pageContext],
  )

  return (
    <ToonDictionaryContext.Provider value={setPageContext}>
      {children}
      <ToonDictionaryFloatingWidget {...resolvedContext} placement={placement} />
    </ToonDictionaryContext.Provider>
  )
}
