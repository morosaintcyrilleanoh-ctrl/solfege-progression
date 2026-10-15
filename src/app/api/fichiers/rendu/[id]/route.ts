import { isUuid, signedRedirect } from '@/lib/content/signed-download';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return signedRedirect(request, async (supabase) => {
    if (!isUuid(id)) return null;
    const { data } = await supabase.from('assignment_submissions').select('attachment_path').eq('id', id).maybeSingle();
    return data ? { bucket: 'submissions', path: data.attachment_path, download: data.attachment_path?.split('/').pop() ?? 'rendu' } : null;
  });
}
