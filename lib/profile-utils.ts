import { createClient } from '@/utils/supabase/server';

export interface ProfileCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
  missingFieldLabels: string[];
}

const REQUIRED_FIELDS = {
  contact_person: '담당자명',
  company_name: '회사명',
  phone: '연락처',
  email: '이메일',
  tax_email: '세금계산서 이메일',
  business_license_url: '사업자등록증',
};

export async function checkProfileCompleteness(
  clientId: string
): Promise<ProfileCompletenessResult> {
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from('clients')
    .select('contact_person, company_name, phone, email, tax_email, business_license_url')
    .eq('id', clientId)
    .single();

  if (error || !client) {
    return {
      isComplete: false,
      missingFields: Object.keys(REQUIRED_FIELDS),
      missingFieldLabels: Object.values(REQUIRED_FIELDS),
    };
  }

  const missingFields: string[] = [];
  const missingFieldLabels: string[] = [];

  for (const [field, label] of Object.entries(REQUIRED_FIELDS)) {
    const value = client[field as keyof typeof client];
    if (!value || (typeof value === 'string' && !value.trim())) {
      missingFields.push(field);
      missingFieldLabels.push(label);
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    missingFieldLabels,
  };
}
