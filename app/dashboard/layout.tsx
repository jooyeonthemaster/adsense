import { ClientNav } from '@/components/layout/client-nav';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth(['client']);

  // Get fresh points from database instead of session
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('points')
    .eq('id', user.id)
    .single();

  const currentPoints = client?.points || 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <ClientNav
        user={{
          name: user.company_name || user.name,
          points: currentPoints,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50 pt-14 lg:pt-0">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
