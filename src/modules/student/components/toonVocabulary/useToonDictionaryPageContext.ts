import { useContext, useEffect } from 'react'
import { ToonDictionaryContext, type DictionaryPageContext } from './ToonDictionaryContext'

export function useToonDictionaryPageContext(value: DictionaryPageContext) {
  const setPageContext = useContext(ToonDictionaryContext)
  const { grade, subject, unit, sourceType, sourceId } = value

  useEffect(() => {
    if (!setPageContext) return
    setPageContext({ grade, subject, unit, sourceType, sourceId })
    return () => setPageContext(null)
  }, [grade, setPageContext, sourceId, sourceType, subject, unit])
}
