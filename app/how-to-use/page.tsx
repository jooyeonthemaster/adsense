'use client';

import { useState, useEffect } from 'react';
import { slides } from '@/lib/slides-data';
import { Slide } from '@/types/slides';
import { ChevronLeft, ChevronRight, X, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowToUsePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = slides.length;

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        previousSlide();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
      } else if (e.key === 'Escape') {
        window.location.href = '/';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Home className="h-5 w-5 text-gray-400" />
          <span className="text-white font-medium">애드센스 마케팅 플랫폼 사용 설명서</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <X className="h-4 w-4 mr-2" />
            닫기
          </Button>
        </Link>
      </div>

      {/* 슬라이드 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center p-8">
        {/* 16:9 비율 컨테이너 */}
        <div className="relative w-full max-w-7xl aspect-[16/9] bg-white rounded-2xl shadow-2xl overflow-hidden">
          <SlideContent slide={slide} />
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-8">
        {/* 이전 버튼 */}
        <Button
          onClick={previousSlide}
          disabled={currentSlide === 0}
          size="lg"
          className="bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-gray-700"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          이전
        </Button>

        {/* 페이지 인디케이터 */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm mr-4">
            {currentSlide + 1} / {totalSlides}
          </span>
          <div className="flex gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-blue-500'
                    : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`슬라이드 ${index + 1}로 이동`}
              />
            ))}
          </div>
        </div>

        {/* 다음 버튼 */}
        <Button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          size="lg"
          className="bg-gray-700 text-white border-2 border-gray-600 hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-gray-700"
        >
          다음
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function SlideContent({ slide }: { slide: Slide }) {
  const { type, title, subtitle, content, bgColor } = slide;

  // Intro 타입 슬라이드
  if (type === 'intro') {
    // 배경색 매핑
    const bgGradientMap: Record<string, string> = {
      'from-blue-600 to-blue-800': 'bg-gradient-to-br from-blue-600 to-blue-800',
      'from-purple-600 to-purple-800': 'bg-gradient-to-br from-purple-600 to-purple-800',
      'from-green-600 to-green-800': 'bg-gradient-to-br from-green-600 to-green-800',
      'from-orange-600 to-orange-800': 'bg-gradient-to-br from-orange-600 to-orange-800',
      'from-indigo-600 to-indigo-800': 'bg-gradient-to-br from-indigo-600 to-indigo-800'
    };
    
    const gradientClass = bgColor ? bgGradientMap[bgColor] || 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-blue-600 to-blue-800';
    
    return (
      <div className={`h-full flex flex-col items-center justify-center ${gradientClass} text-white p-12`}>
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg">{title}</h1>
          {subtitle && (
            <p className="text-2xl font-light text-white drop-shadow-md">{subtitle}</p>
          )}
          {content.main && (
            <p className="text-xl font-medium text-white drop-shadow-md">{content.main}</p>
          )}
          {content.points && (
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-5xl mx-auto">
              {content.points.map((point, index) => (
                <div
                  key={index}
                  className="text-lg font-semibold leading-snug text-white drop-shadow-md bg-white/10 backdrop-blur-sm p-3 rounded-lg border border-white/20 hover:bg-white/15 transition-all"
                >
                  {point}
                </div>
              ))}
            </div>
          )}
          {content.highlight && (
            <div className="mt-6 p-4 bg-white/25 backdrop-blur-sm rounded-xl border-2 border-white/40 shadow-xl">
              <p className="text-lg font-bold text-white drop-shadow-md">
                {content.highlight}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Feature 타입 슬라이드
  if (type === 'feature') {
    return (
      <div className="h-full flex flex-col p-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{title}</h2>
          {subtitle && (
            <p className="text-xl text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center overflow-y-auto">
          {content.main && (
            <p className="text-xl text-gray-700 mb-6 font-medium">
              {content.main}
            </p>
          )}

          {content.points && (
            <div className="space-y-3">
              {content.points.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-base text-gray-800 bg-white p-4 rounded-xl shadow-sm"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <span className="flex-1 leading-snug">{point}</span>
                </div>
              ))}
            </div>
          )}

          {content.highlight && (
            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <p className="text-base text-yellow-900 font-semibold text-center">
                💡 {content.highlight}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step-by-step 타입 슬라이드
  if (type === 'step-by-step' && content.steps) {
    return (
      <div className="h-full flex flex-col p-12 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">{title}</h2>
          {subtitle && (
            <p className="text-xl text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="flex-1 grid grid-cols-2 gap-5">
          {content.steps.map((step, index) => (
            <div
              key={index}
              className="bg-white p-5 rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2 leading-snug">
                    {step.description}
                  </p>
                  {step.tip && (
                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded leading-tight">
                      💡 {step.tip}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {content.highlight && (
          <div className="mt-5 p-3 bg-green-50 border-2 border-green-200 rounded-xl">
            <p className="text-base text-green-900 font-semibold text-center">
              ✅ {content.highlight}
            </p>
          </div>
        )}
      </div>
    );
  }

  // 기본 슬라이드
  return (
    <div className="h-full flex items-center justify-center p-16">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-xl text-gray-600 mt-4">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

