const FUN_REASON_CARDS = [
  {
    src: '/images/toonmind/cards/toonmind-fun-card-01-thinking.png',
    alt: '생각이 쑥쑥 정리돼요 - 나의 꿈 마인드맵 카드',
  },
  {
    src: '/images/toonmind/cards/toonmind-fun-card-02-decorating.png',
    alt: '꾸미는 재미가 있어요 - 여름방학 계획 마인드맵 카드',
  },
  {
    src: '/images/toonmind/cards/toonmind-fun-card-03-sharing.png',
    alt: '저장하고 공유할 수 있어요 - 환경을 지키는 방법 마인드맵 카드',
  },
] as const;

export default function FunReasonsSection() {
  return (
    <section
      className="bg-surface-dim py-16 md:py-20"
      aria-labelledby="fun-reasons-title"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <h2
          id="fun-reasons-title"
          className="break-keep text-center text-3xl font-extrabold leading-tight text-on-surface md:text-4xl"
        >
          툰마인드가 <span className="text-primary">재미있는</span>{' '}
          <span className="whitespace-nowrap">3가지 이유</span>
        </h2>
        <p className="mt-3 break-keep text-center text-base leading-relaxed text-on-surface-variant md:mt-4 md:text-lg">
          마인드맵으로 생각을 정리하고, 꾸미고, 나누는 즐거움까지!
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-2 md:gap-8 xl:grid-cols-3">
          {FUN_REASON_CARDS.map((card, index) => (
            <div
              key={card.src}
              className={`aspect-[1122/1402] w-full ${
                index === FUN_REASON_CARDS.length - 1
                  ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-16px)] xl:col-span-1 xl:mx-0 xl:w-full'
                  : ''
              }`}
            >
              <img
                src={card.src}
                alt={card.alt}
                className="block h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
