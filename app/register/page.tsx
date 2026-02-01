'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // 카카오 로그인으로 이동
  const handleKakaoLogin = () => {
    window.location.href = '/api/auth/kakao';
  };

  // 카운트다운 후 자동 리다이렉트
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* 메인 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl shadow-primary/5 border-primary/10">
          <CardHeader className="space-y-4 text-center pb-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-3"
            >
              <div className="flex justify-center">
                <Image
                  src="/logo.png"
                  alt="마자무 로고"
                  width={100}
                  height={100}
                  className="object-contain"
                  priority
                />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-gradient">
                회원가입 안내
              </CardTitle>
              <CardDescription className="text-sm">
                마자무에 오신 것을 환영합니다
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="pb-8 space-y-6">
            {/* 안내 메시지 */}
            <div className="text-center space-y-3 py-4">
              <div className="bg-[#FEE500]/10 border border-[#FEE500]/30 rounded-lg p-4">
                <svg
                  className="mx-auto h-12 w-12 text-[#3C1E1E] mb-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.2.72-.72 2.64-.84 3.06-.12.54.2.54.42.42.18-.06 2.82-1.92 3.96-2.7.6.06 1.26.12 1.92.12 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
                </svg>
                <p className="text-gray-900 font-medium">
                  카카오톡으로 간편하게 가입하세요
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  별도의 회원가입 없이 카카오 계정으로<br />
                  바로 시작할 수 있습니다
                </p>
              </div>
            </div>

            {/* 카카오 로그인 버튼 */}
            <Button
              type="button"
              onClick={handleKakaoLogin}
              className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium transition-all duration-300 hover:shadow-lg text-base"
            >
              <svg
                className="mr-2 h-6 w-6"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.16 4.5 6.54-.2.72-.72 2.64-.84 3.06-.12.54.2.54.42.42.18-.06 2.82-1.92 3.96-2.7.6.06 1.26.12 1.92.12 5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
              </svg>
              카카오로 시작하기
            </Button>

            {/* 로그인 페이지 링크 */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {countdown}초 후 로그인 페이지로 이동합니다
              </p>
              <Button
                variant="link"
                onClick={() => router.push('/login')}
                className="text-primary"
              >
                지금 이동하기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 하단 텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          © 2025 주식회사 마매. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
