import { ClientNav } from '@/components/layout/client-nav';
import { requireAuth } from '@/lib/auth';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth(['client']);

  return (
    <div className="flex h-screen overflow-hidden">
      <ClientNav
        user={{
          name: user.company_name || user.name,
          points: user.points || 0,
        }}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50 pt-14 lg:pt-0">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
