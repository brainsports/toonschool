import ExtraRequestBox from '../forms/ExtraRequestBox'

interface StoryInputCardProps {
  extraRequest: string
  onExtraRequestChange: (val: string) => void
  onFillExample: () => void
}

export default function StoryInputCard({ extraRequest, onExtraRequestChange, onFillExample }: StoryInputCardProps) {
  return (
    <ExtraRequestBox
      value={extraRequest}
      onChange={onExtraRequestChange}
      onAiRecommend={onFillExample}
    />
  )
}
