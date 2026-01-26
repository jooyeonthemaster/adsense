'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 비밀번호 확인
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          company_name: formData.company_name,
          contact_person: formData.contact_person,
          phone: formData.phone,
          email: formData.email || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '회원가입에 실패했습니다.');
        return;
      }

      setSuccess(true);

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl shadow-primary/5 border-primary/10">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900">회원가입 완료!</h2>
              <p className="text-gray-600">
                회원가입이 완료되었습니다.<br />
                잠시 후 로그인 페이지로 이동합니다.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full gradient-primary"
              >
                로그인하러 가기
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
      {/* 커서 트레일 효과 */}
      <motion.div
        className="fixed w-6 h-6 rounded-full bg-primary/20 pointer-events-none z-50"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 150,
          mass: 0.8,
        }}
      />

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
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-gradient">
                회원가입
              </CardTitle>
              <CardDescription className="text-sm">
                마자무에 오신 것을 환영합니다
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 아이디 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  아이디 <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="영문, 숫자, 밑줄 4-20자"
                  required
                  disabled={loading}
                  className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* 비밀번호 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    비밀번호 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="최소 6자"
                    required
                    disabled={loading}
                    className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm" className="text-sm font-medium">
                    비밀번호 확인 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="비밀번호 확인"
                    required
                    disabled={loading}
                    className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* 회사명 */}
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sm font-medium">
                  회사명 / 상호 <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="회사명 또는 상호명"
                  required
                  disabled={loading}
                  className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* 담당자명 */}
              <div className="space-y-2">
                <Label htmlFor="contact_person" className="text-sm font-medium">
                  담당자명 <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="contact_person"
                  name="contact_person"
                  type="text"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="담당자 이름"
                  required
                  disabled={loading}
                  className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* 연락처 & 이메일 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    연락처 <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    required
                    disabled={loading}
                    className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    이메일
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="선택 사항"
                    disabled={loading}
                    className="h-10 transition-all focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                >
                  {error}
                </motion.div>
              )}

              {/* 제출 버튼 */}
              <Button
                type="submit"
                className="w-full h-11 gradient-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  '회원가입'
                )}
              </Button>
            </form>

            {/* 로그인 링크 */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                이미 계정이 있으신가요? 로그인
              </Link>
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
