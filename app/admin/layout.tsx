import { AdminNav } from '@/components/layout/admin-nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminNav />
      <main className="flex-1 overflow-y-auto bg-slate-50 pt-14 lg:pt-0">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
