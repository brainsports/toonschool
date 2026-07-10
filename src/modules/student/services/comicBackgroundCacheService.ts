import { supabase } from '../../../shared/lib/supabase';

export type ComicBackgroundCacheParams = {
  grade?: string;
  subject?: string;
  semester?: string;
  unitId?: string;
  subunitId?: string;
  topicTitle?: string;
  cutNo: number;
  backgroundPrompt: string;
  negativePrompt?: string;
  styleKey?: string;
};

export type ComicBackgroundCacheHit = {
  hit: true;
  cacheKey: string;
  publicUrl: string;
  storagePath: string;
  reusedCount?: number;
};

export type ComicBackgroundCacheMiss = {
  hit: false;
  cacheKey: string;
};

export type ComicBackgroundCacheResult = ComicBackgroundCacheHit | ComicBackgroundCacheMiss;

export type ComicBackgroundCacheSaveResult = {
  publicUrl: string;
  storagePath: string;
  storageBucket: string;
  cacheKey: string;
};

export const normalizeBackgroundPrompt = (prompt: string): string => {
  let normalized = prompt.trim();
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.toLowerCase();
  normalized = normalized.replace(/[\r\n]+/g, ' ');
  normalized = normalized.replace(/[,."']/g, '');

  const forbiddenWords = ['만화', '말풍선', '캐릭터', '사람', '글자', '텍스트', '패널', '칸'];
  const foundWords = forbiddenWords.filter(word => normalized.includes(word));
  
  if (foundWords.length > 0) {
    console.warn(`[ToonSchool Background Cache] 배경 프롬프트에 금지어 포함됨: ${foundWords.join(', ')}`);
  }

  return normalized;
};

export const createComicBackgroundCacheKey = async (params: ComicBackgroundCacheParams): Promise<string> => {
  const normalizedPrompt = normalizeBackgroundPrompt(params.backgroundPrompt);
  
  const parts = [
    'background',
    params.grade || 'unknown',
    params.subject || 'unknown',
    params.semester || 'unknown',
    params.unitId || 'unknown',
    params.subunitId || 'unknown',
    params.cutNo.toString(),
    params.styleKey || 'toonschool-v2',
    normalizedPrompt
  ];

  const rawKey = parts.join('|');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `bg_${hashHex}`;
};

export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

const mapSubject = (subject?: string): string => {
  if (!subject) return 'unknown';
  const mapping: Record<string, string> = {
    '국어': 'korean',
    '수학': 'math',
    '사회': 'social',
    '과학': 'science',
    '영어': 'english'
  };
  return mapping[subject] || 'unknown';
};

const normalizeGrade = (grade?: string): string => {
  if (!grade) return 'grade-unknown';
  const match = grade.match(/\d+/);
  return match ? `grade-${match[0]}` : 'grade-unknown';
};

const toSafeSlug = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9-_]/g, '');
};

export const createStoragePath = (params: ComicBackgroundCacheParams, cacheKey: string, extension: string = 'webp'): string => {
  const gradeStr = normalizeGrade(params.grade);
  const subjectStr = mapSubject(params.subject);
  const semesterStr = !params.semester || params.semester === 'unknown' ? 'semester-none' : `semester-${params.semester}`;
  const unitStr = !params.unitId || params.unitId === 'unknown' ? 'unit-none' : `unit-${params.unitId}`;
  const cutStr = `cut-${params.cutNo}`;
  
  const pathParts = [gradeStr, subjectStr, semesterStr, unitStr];
  
  if (params.subunitId && params.subunitId !== 'unknown') {
    pathParts.push(`subunit-${params.subunitId}`);
  }
  
  pathParts.push(cutStr);
  
  const safePathParts = pathParts.map(part => toSafeSlug(part));
  
  return `${safePathParts.join('/')}/${toSafeSlug(cacheKey)}.${toSafeSlug(extension)}`;
};

export const findCachedComicBackground = async (params: ComicBackgroundCacheParams): Promise<ComicBackgroundCacheResult> => {
  try {
    const cacheKey = await createComicBackgroundCacheKey(params);
    
    const { data, error } = await supabase
      .from('comic_background_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error) {
      console.error(`[ToonSchool Background Cache] LOOKUP FAILED cut=${params.cutNo}`, error);
      return { hit: false, cacheKey };
    }

    if (data && data.public_url) {
      console.log(`[ToonSchool Background Cache] HIT cut=${params.cutNo} cache_key=${cacheKey}`);
      
      const { error: updateError } = await supabase
        .from('comic_background_cache')
        .update({
          reused_count: (data.reused_count || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (updateError) {
        console.warn(`[ToonSchool Background Cache] REUSE COUNT UPDATE FAILED cut=${params.cutNo} cache_key=${cacheKey}`, updateError);
      }
        
      return {
        hit: true,
        cacheKey,
        publicUrl: data.public_url,
        storagePath: data.storage_path,
        reusedCount: data.reused_count
      };
    }

    console.log(`[ToonSchool Background Cache] MISS cut=${params.cutNo} cache_key=${cacheKey}`);
    return { hit: false, cacheKey };
  } catch (err) {
    console.error(`[ToonSchool Background Cache] LOOKUP FAILED cut=${params.cutNo}`, err);
    return { hit: false, cacheKey: '' }; 
  }
};

export const saveComicBackgroundToCache = async (
  cacheKey: string,
  dataUrl: string,
  params: ComicBackgroundCacheParams,
  metadata: any = {}
): Promise<ComicBackgroundCacheSaveResult | null> => {
  if (!cacheKey) return null;

  try {
    const blob = await dataUrlToBlob(dataUrl);
    const isWebp = blob.type === 'image/webp';
    const extension = isWebp ? 'webp' : (blob.type === 'image/jpeg' ? 'jpg' : 'png');
    
    const storagePath = createStoragePath(params, cacheKey, extension);
    const bucketName = 'toonschool-generated-backgrounds';

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, blob, {
        upsert: true,
        contentType: blob.type
      });

    if (uploadError) {
      console.error(`[ToonSchool Background Cache] SAVE FAILED (Upload) cut=${params.cutNo}`, uploadError);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;
    const normalizedPrompt = normalizeBackgroundPrompt(params.backgroundPrompt);

    const { error: dbError } = await supabase
      .from('comic_background_cache')
      .upsert({
        cache_key: cacheKey,
        grade: params.grade,
        subject: params.subject,
        semester: params.semester,
        unit_id: params.unitId,
        subunit_id: params.subunitId,
        topic_title: params.topicTitle,
        cut_no: params.cutNo,
        style_key: params.styleKey || 'toonschool-v2',
        normalized_prompt: normalizedPrompt,
        background_prompt: params.backgroundPrompt,
        negative_prompt: params.negativePrompt,
        storage_bucket: bucketName,
        storage_path: storagePath,
        public_url: publicUrl,
        mime_type: blob.type,
        metadata: metadata,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'cache_key' });

    if (dbError) {
      console.error(`[ToonSchool Background Cache] SAVE FAILED (DB Upsert) cut=${params.cutNo}`, dbError);
      return null;
    }

    console.log(`[ToonSchool Background Cache] SAVED cut=${params.cutNo} cache_key=${cacheKey} path=${storagePath}`);
    return {
      publicUrl,
      storagePath,
      storageBucket: bucketName,
      cacheKey
    };

  } catch (err) {
    console.error(`[ToonSchool Background Cache] SAVE FAILED cut=${params.cutNo}`, err);
    return null;
  }
};
