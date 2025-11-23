import { createClient } from '@/utils/supabase/server';
import { requireAuth } from '@/lib/auth';
import { ClientsTable } from './clients-table';
import { CreateClientDialog } from './create-client-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

async function getClients() {
  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return clients || [];
}

export default async function ClientsPage() {
  await requireAuth(['admin']);
  const clients = await getClients();

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">거래처 관리</h1>
          <CreateClientDialog>
            <Button className="h-8 sm:h-9 text-xs sm:text-sm px-3">
              <Plus className="mr-1 sm:mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              추가
            </Button>
          </CreateClientDialog>
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground">
          거래처 계정을 생성하고 관리합니다
        </p>
      </div>

      <ClientsTable clients={clients} />
    </div>
  );
}
