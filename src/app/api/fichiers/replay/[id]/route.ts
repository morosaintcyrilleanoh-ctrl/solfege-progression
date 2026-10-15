import { isUuid, signedRedirect } from '@/lib/content/signed-download';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return signedRedirect(request, async (supabase) => {
    if (!isUuid(id)) return null;
    const { data } = await supabase.from('live_sessions').select('replay_path').eq('id', id).maybeSingle();
    return data ? { bucket: 'replays', path: data.replay_path } : null;
  });
}
