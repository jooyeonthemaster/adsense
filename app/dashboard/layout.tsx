import { ClientNav } from '@/components/layout/client-nav';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import { Toaster } from '@/components/ui/toaster';
import { redirect } from 'next/navigation';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth(['client']);

  // Get fresh data from database
  const supabase = await createClient();
  const { data: client } = await supabase
    .from('clients')
    .select('points, onboarding_completed, representative_name, phone, email, company_name')
    .eq('id', user.id)
    .single();

  // 온보딩 미완료 시 온보딩 페이지로 리다이렉트
  if (client?.onboarding_completed === false) {
    redirect('/onboarding');
  }

  const currentPoints = client?.points || 0;

  // 프로필 필수 정보 미완성 체크
  const missingFields: string[] = [];
  if (!client?.company_name?.trim()) missingFields.push('회사명');
  if (!client?.representative_name?.trim()) missingFields.push('대표자명');
  if (!client?.phone?.trim()) missingFields.push('연락처');
  if (!client?.email?.trim()) missingFields.push('이메일');

  const isProfileIncomplete = missingFields.length > 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <ClientNav
        user={{
          name: user.company_name || user.name,
          points: currentPoints,
        }}
        profileAlert={isProfileIncomplete ? {
          missingFields,
          message: '서비스 이용을 위해 필수 정보를 입력해주세요'
        } : undefined}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50 pt-14 lg:pt-0">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">{children}</div>
      </main>
      <Toaster />

      {/* 카카오 채널 플로팅 버튼 */}
      <a
        href="https://pf.kakao.com/_TdxoYn"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
        aria-label="카카오톡 상담"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 3C6.477 3 2 6.463 2 10.692c0 2.646 1.762 4.97 4.4 6.308-.143.514-.918 3.304-.948 3.545 0 0-.02.158.084.218.104.06.226.03.226.03.298-.042 3.448-2.262 3.992-2.65.728.103 1.482.157 2.246.157 5.523 0 10-3.463 10-7.608C22 6.463 17.523 3 12 3z" />
        </svg>
        <span className="font-medium text-sm hidden sm:inline">카카오톡 상담</span>
      </a>
    </div>
  );
}
