'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>, userType: 'admin' | 'client') => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, userType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        return;
      }

      // Redirect based on user type
      if (userType === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Track mouse position and clicks
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleClick = (e: MouseEvent) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
      {/* 커서 트레일 효과 */}
      <motion.div
        className="fixed w-8 h-8 rounded-full border-2 border-primary/30 pointer-events-none z-50"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 200,
          mass: 0.5,
        }}
      />
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
      <motion.div
        className="fixed w-4 h-4 rounded-full bg-primary/40 pointer-events-none z-50"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: 'translate(-50%, -50%)',
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 100,
          mass: 1,
        }}
      />

      {/* 클릭 리플 효과 - 3개의 동심원 파장 */}
      {ripples.map((ripple) => (
        <div key={ripple.id}>
          <motion.div
            className="fixed rounded-full border-2 border-primary/60 pointer-events-none z-50"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ scale: 0, opacity: 0.8, width: '20px', height: '20px', x: '-10px', y: '-10px' }}
            animate={{ scale: 15, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          />
          <motion.div
            className="fixed rounded-full border border-primary/40 pointer-events-none z-50"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ scale: 0, opacity: 0.6, width: '20px', height: '20px', x: '-10px', y: '-10px' }}
            animate={{ scale: 18, opacity: 0 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          />
          <motion.div
            className="fixed rounded-full bg-primary/20 pointer-events-none z-50"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
            initial={{ scale: 0, opacity: 0.5, width: '15px', height: '15px', x: '-7.5px', y: '-7.5px' }}
            animate={{ scale: 12, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      ))}

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
          <CardHeader className="space-y-4 text-center pb-8">
            {/* 제목 */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-2"
            >
              <CardTitle className="text-4xl font-bold tracking-tight text-gradient">
                AdSense
              </CardTitle>
              <CardDescription className="text-base">
                마케팅 상품 접수 시스템
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="pb-8">
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/50">
                <TabsTrigger
                  value="client"
                  className="data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=inactive]:text-muted-foreground transition-all duration-300"
                >
                  거래처
                </TabsTrigger>
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 data-[state=inactive]:text-muted-foreground transition-all duration-300"
                >
                  관리자
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="space-y-4 mt-6">
                <form onSubmit={(e) => handleLogin(e, 'client')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-username" className="text-sm font-medium">
                      아이디
                    </Label>
                    <Input
                      id="client-username"
                      name="username"
                      type="text"
                      placeholder="아이디를 입력하세요"
                      required
                      disabled={loading}
                      className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password" className="text-sm font-medium">
                      비밀번호
                    </Label>
                    <Input
                      id="client-password"
                      name="password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      required
                      disabled={loading}
                      className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                    >
                      {error}
                    </motion.div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-11 gradient-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        로그인 중...
                      </>
                    ) : (
                      '로그인'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4 mt-6">
                <form onSubmit={(e) => handleLogin(e, 'admin')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-username" className="text-sm font-medium">
                      아이디
                    </Label>
                    <Input
                      id="admin-username"
                      name="username"
                      type="text"
                      placeholder="관리자 아이디"
                      required
                      disabled={loading}
                      className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-sm font-medium">
                      비밀번호
                    </Label>
                    <Input
                      id="admin-password"
                      name="password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      required
                      disabled={loading}
                      className="h-11 transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                    >
                      {error}
                    </motion.div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-11 gradient-primary hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        로그인 중...
                      </>
                    ) : (
                      '로그인'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 하단 텍스트 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          © 2024 애드센스. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  );
}
