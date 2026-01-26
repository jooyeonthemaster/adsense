import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import RewardSubmitForm from './reward-submit-form';
import { SubmissionPageWrapper } from '@/components/dashboard/bulk-submission';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RewardSubmitPage() {
  const user = await requireAuth(['client']);

  // Get fresh points from database
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('points')
    .eq('id', user.id)
    .single();

  const currentPoints = client?.points || 0;

  return (
    <SubmissionPageWrapper productType="place">
      <RewardSubmitForm initialPoints={currentPoints} />
    </SubmissionPageWrapper>
  );
}
