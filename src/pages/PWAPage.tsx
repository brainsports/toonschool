import { Monitor, Smartphone, Tablet } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import PwaInstallModal, { type InstallGuide } from './pwa/PwaInstallModal'
import { usePwaInstall } from './pwa/usePwaInstall'

type DeviceCard = 'android' | 'ipad' | 'windows'

const chromeDesktopGuide: InstallGuide = {
  title: 'Chrome에서 설치하기',
  steps: [
    '주소창 오른쪽의 설치 아이콘을 눌러요.',
    '설치를 눌러요.',
    '아이콘이 보이지 않으면 점 3개 메뉴에서 앱 또는 이 사이트를 앱으로 설치를 선택해요.',
  ],
}

const edgeDesktopGuide: InstallGuide = {
  title: 'Edge에서 설치하기',
  steps: [
    '주소창 오른쪽의 앱 설치 아이콘을 눌러요.',
    '설치를 눌러요.',
    '아이콘이 보이지 않으면 점 3개 메뉴에서 앱을 선택한 뒤 이 사이트를 앱으로 설치를 눌러요.',
  ],
}

const unsupportedDesktopGuide: InstallGuide = {
  title: 'Chrome 또는 Edge에서 설치해 주세요',
  intro: '이 브라우저에서는 자동 설치창을 열 수 없어요.',
  steps: [
    '툰스쿨을 Chrome 또는 Edge에서 열어요.',
    '주소창 오른쪽의 설치 아이콘을 눌러요.',
    '설치를 눌러요.',
  ],
}

const androidChromeGuide: InstallGuide = {
  title: 'Chrome에서 홈 화면에 설치하기',
  steps: [
    '오른쪽 위 점 3개 메뉴를 눌러요.',
    '앱 설치 또는 홈 화면에 추가를 눌러요.',
    '설치를 눌러요.',
  ],
}

const samsungInternetGuide: InstallGuide = {
  title: '삼성 인터넷에서 설치하기',
  steps: [
    '브라우저 아래쪽 또는 오른쪽의 메뉴 버튼을 눌러요.',
    '현재 페이지 추가를 선택해요.',
    '홈 화면을 선택해요.',
    '추가를 눌러요.',
  ],
}

const ipadSafariGuide: InstallGuide = {
  title: '아이패드 홈 화면에 설치하기',
  steps: [
    'Safari에서 툰스쿨을 열어요.',
    '화면 위쪽의 공유 아이콘을 눌러요.',
    '메뉴에서 홈 화면에 추가를 눌러요.',
    '오른쪽 위 추가를 눌러요.',
  ],
}

const ipadOtherBrowserGuide: InstallGuide = {
  title: 'Safari에서 설치해 주세요',
  intro: '아이패드에서는 Safari로 열어야 홈 화면에 설치할 수 있어요.',
  copyAddress: true,
  steps: [
    '아래 버튼으로 현재 주소를 복사해요.',
    'Safari를 열고 주소를 붙여 넣어요.',
    '공유 아이콘을 누른 뒤 홈 화면에 추가를 선택해요.',
  ],
}

export default function PWAPage() {
  const { canPrompt, environment, isInstalled, isPrompting, requestInstall } = usePwaInstall()
  const [guide, setGuide] = useState<InstallGuide | null>(null)
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null)

  const closeGuide = useCallback(() => setGuide(null), [])

  const openGuide = (nextGuide: InstallGuide, card: HTMLElement) => {
    if (guide) return
    setReturnFocusTo(card)
    setGuide(nextGuide)
  }

  const handleCardClick = async (device: DeviceCard, card: HTMLButtonElement) => {
    if (isInstalled || isPrompting) return

    if (device === 'ipad') {
      openGuide(environment.isIPad && !environment.isSafari ? ipadOtherBrowserGuide : ipadSafariGuide, card)
      return
    }

    const canUseNativePrompt = canPrompt
      && !environment.isIPad
      && (device === 'windows' || (environment.isAndroid && environment.isChrome))

    if (canUseNativePrompt) {
      const result = await requestInstall()
      if (result !== 'unavailable') return
    }

    if (device === 'android') {
      openGuide(environment.isSamsungInternet ? samsungInternetGuide : androidChromeGuide, card)
      return
    }

    const desktopGuide = environment.isEdge
      ? edgeDesktopGuide
      : environment.isChrome
        ? chromeDesktopGuide
        : unsupportedDesktopGuide
    openGuide(desktopGuide, card)
  }

  const cardClassName = 'group relative flex min-h-[360px] w-full cursor-pointer flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-default disabled:hover:translate-y-0'

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-16 pt-32 text-center">
      <h1 className="mb-4 text-4xl font-extrabold text-on-surface">PC·태블릿 버전</h1>
      <p className="mb-6 text-lg text-on-surface-variant">
        PC와 태블릿에서 툰스쿨을 앱처럼 설치해 사용할 수 있습니다.
      </p>

      {isInstalled && (
        <div className="mb-8 rounded-full bg-emerald-100 px-6 py-3 text-lg font-extrabold text-emerald-800" role="status">
          툰스쿨 앱으로 실행 중이에요!
        </div>
      )}

      <div className="mb-12 grid w-full grid-cols-1 gap-6 md:grid-cols-3">
        <button
          type="button"
          className={cardClassName}
          onClick={(event) => handleCardClick('windows', event.currentTarget)}
          disabled={isPrompting || isInstalled}
          aria-label="윈도우 PC에 툰스쿨 설치하기"
        >
          {isInstalled && <InstallCompleteBadge />}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <Monitor size={32} aria-hidden="true" />
          </div>
          <h2 className="mb-3 text-xl font-bold">윈도우 PC</h2>
          <p className="text-gray-600">
            Chrome 또는 Edge에서<br />
            주소창 오른쪽 <span className="font-bold">설치 아이콘</span>을<br />
            눌러 설치해 주세요.
          </p>
          <CardActionText installed={isInstalled} prompting={isPrompting}>
            클릭해서 바로 설치하기
          </CardActionText>
        </button>

        <button
          type="button"
          className={cardClassName}
          onClick={(event) => handleCardClick('android', event.currentTarget)}
          disabled={isPrompting || isInstalled}
          aria-label="갤럭시탭 홈 화면에 툰스쿨 설치하기"
        >
          {isInstalled && <InstallCompleteBadge />}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
            <Smartphone size={32} aria-hidden="true" />
          </div>
          <h2 className="mb-3 text-xl font-bold">갤럭시탭</h2>
          <p className="text-gray-600">
            Chrome 또는 삼성 인터넷에서<br />
            안내에 따라 <span className="font-bold">홈 화면</span>에<br />
            추가해 주세요.
          </p>
          <CardActionText installed={isInstalled} prompting={isPrompting}>
            클릭해서 홈 화면에 설치하기
          </CardActionText>
        </button>

        <button
          type="button"
          className={cardClassName}
          onClick={(event) => handleCardClick('ipad', event.currentTarget)}
          disabled={isPrompting || isInstalled}
          aria-label="아이패드 툰스쿨 설치 방법 보기"
        >
          {isInstalled && <InstallCompleteBadge />}
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-700">
            <Tablet size={32} aria-hidden="true" />
          </div>
          <h2 className="mb-3 text-xl font-bold">아이패드</h2>
          <p className="text-gray-600">
            Safari에서 공유 버튼을 누른 뒤<br />
            <span className="font-bold">홈 화면에 추가</span>를<br />
            선택해 주세요.
          </p>
          <CardActionText installed={isInstalled} prompting={false}>
            클릭해서 설치 방법 보기
          </CardActionText>
        </button>
      </div>

      <div className="mb-12 rounded-xl bg-primary/10 px-8 py-4 text-lg font-bold text-primary">
        ✨ 설치하면 툰스쿨을 앱처럼 바로 실행할 수 있어요.
      </div>

      <Link
        to="/"
        className="rounded-full bg-primary px-8 py-4 text-lg font-bold text-white shadow-sm transition-colors hover:bg-pink-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200"
      >
        메인으로 돌아가기
      </Link>

      {guide && (
        <PwaInstallModal guide={guide} onClose={closeGuide} returnFocusTo={returnFocusTo} />
      )}
    </main>
  )
}

function InstallCompleteBadge() {
  return (
    <span className="absolute right-4 top-4 rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-800">
      설치 완료
    </span>
  )
}

function CardActionText({ children, installed, prompting }: { children: string; installed: boolean; prompting: boolean }) {
  return (
    <span className="mt-auto pt-7 text-base font-extrabold text-primary">
      {installed ? '툰스쿨 앱으로 실행 중이에요!' : prompting ? '설치창을 여는 중이에요…' : children}
    </span>
  )
}
