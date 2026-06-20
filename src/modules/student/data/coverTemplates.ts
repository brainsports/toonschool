export type CoverTemplate = {
  id: string;
  name: string;
  imageUrl: string;
};

export const COMMON_COVER_TEMPLATES: CoverTemplate[] = [
  { id: 'blank-paper', name: '빈 도화지', imageUrl: '/images/covers/cover-blank-paper.webp' },
  { id: 'common-01', name: '표지 1', imageUrl: '/images/covers/cover-common-01.webp' },
  { id: 'common-02', name: '표지 2', imageUrl: '/images/covers/cover-common-02.webp' },
  { id: 'common-03', name: '표지 3', imageUrl: '/images/covers/cover-common-03.webp' },
  { id: 'common-04', name: '표지 4', imageUrl: '/images/covers/cover-common-04.webp' },
  { id: 'common-05', name: '표지 5', imageUrl: '/images/covers/cover-common-05.webp' },
  { id: 'common-06', name: '표지 6', imageUrl: '/images/covers/cover-common-06.webp' },
  { id: 'common-07', name: '표지 7', imageUrl: '/images/covers/cover-common-07.webp' },
  { id: 'common-08', name: '표지 8', imageUrl: '/images/covers/cover-common-08.webp' },
  { id: 'common-09', name: '표지 9', imageUrl: '/images/covers/cover-common-09.webp' },
  { id: 'common-10', name: '표지 10', imageUrl: '/images/covers/cover-common-10.webp' },
];

export const DEFAULT_COVER_TEMPLATE_ID = 'common-01';
