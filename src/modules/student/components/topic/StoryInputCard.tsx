import ExtraRequestBox from '../forms/ExtraRequestBox'

interface StoryInputCardProps {
  extraRequest: string
  onExtraRequestChange: (val: string) => void
  onFillExample: () => void
  disabled?: boolean
  loading?: boolean
}

export default function StoryInputCard({ extraRequest, onExtraRequestChange, onFillExample, disabled, loading }: StoryInputCardProps) {
  return (
    <ExtraRequestBox
      value={extraRequest}
      onChange={onExtraRequestChange}
      onAiRecommend={onFillExample}
      disabled={disabled}
      loading={loading}
    />
  )
}
