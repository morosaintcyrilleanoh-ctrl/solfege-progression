import { safeFileName } from '@/lib/content/files';
import { isUuid, signedRedirect } from '@/lib/content/signed-download';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return signedRedirect(request, async (supabase) => {
    if (!isUuid(id)) return null;
    const { data } = await supabase.from('lesson_resources').select('storage_path, external_url, downloadable, title').eq('id', id).maybeSingle();
    if (!data) return null;
    const ext = data.storage_path?.split('.').pop();
    return { bucket: 'course-files', path: data.storage_path, external: data.external_url, download: data.downloadable ? safeFileName(`${data.title}${ext ? `.${ext}` : ''}`) : false };
  });
}
