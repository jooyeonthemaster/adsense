/**
 * ============================================================================
 * [DISABLED] 동적 폼 렌더러 컴포넌트 - 비활성화됨 (2025-11-02)
 * ============================================================================
 *
 * 파일 크기: 439줄
 *
 * 기능:
 * - product_categories.form_schema 기반 동적 폼 생성
 * - 필드 타입: text, number, email, url, textarea, select, checkbox, date
 * - 포인트 계산식 평가 (Function constructor)
 * - dynamic_submissions 테이블에 저장
 *
 * 비활성화 이유:
 * - 4가지 고정 상품은 전용 폼 컴포넌트 사용
 *   - PlaceSubmissionForm
 *   - ReceiptSubmissionForm
 *   - KakaomapSubmissionForm
 *   - BlogSubmissionForm
 * - 동적 폼 시스템 불필요
 *
 * 관련 문서: claudedocs/CUSTOM_PRODUCT_ANALYSIS.md
 * ============================================================================
 */

/*
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormSchema } from '@/types/form-schema';

interface DynamicFormRendererProps {
  schema: FormSchema;
  clientId: string;
  categoryId: string;
  pricePerUnit: number;
  currentPoints: number;
}

export function DynamicFormRenderer({
  schema,
  clientId,
  categoryId,
  pricePerUnit,
  currentPoints,
}: DynamicFormRendererProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [totalPoints, setTotalPoints] = useState(0);

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, any> = {};
    schema.fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      }
    });
    setFormData(initialData);
  }, [schema]);

  // Calculate total points when form data changes
  useEffect(() => {
    if (!schema.calculation) {
      setTotalPoints(0);
      return;
    }

    try {
      const { formula, variables } = schema.calculation;

      // Create evaluation context
      const context: Record<string, any> = {
        pricePerUnit,
        ...formData,
      };

      // Check if all required variables are present
      const hasAllVariables = variables.every(
        (varName) => context[varName] !== undefined && context[varName] !== ''
      );

      if (!hasAllVariables) {
        setTotalPoints(0);
        return;
      }

      // Safely evaluate the formula
      const result = evaluateFormula(formula, context);
      setTotalPoints(Math.round(result));
    } catch (err) {
      console.error('Formula evaluation error:', err);
      setTotalPoints(0);
    }
  }, [formData, pricePerUnit, schema.calculation]);

  const evaluateFormula = (formula: string, context: Record<string, any>): number => {
    // Simple and safe formula evaluation
    // Replace variable names with their values
    let expression = formula;

    Object.keys(context).forEach((varName) => {
      const value = Number(context[varName]) || 0;
      expression = expression.replace(new RegExp(`\\b${varName}\\b`, 'g'), value.toString());
    });

    // Evaluate using Function constructor (safer than eval)
    try {
      const fn = new Function(`return ${expression}`);
      return fn();
    } catch {
      return 0;
    }
  };

  const validateField = (field: any, value: any): string | null => {
    if (field.required && (value === undefined || value === '' || value === null)) {
      return `${field.label}은(는) 필수 항목입니다.`;
    }

    if (field.type === 'number' && value !== undefined && value !== '') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${field.label}은(는) 숫자여야 합니다.`;
      }

      if (field.validation) {
        if (field.validation.min !== undefined && numValue < field.validation.min) {
          return `${field.label}은(는) 최소 ${field.validation.min} 이상이어야 합니다.`;
        }
        if (field.validation.max !== undefined && numValue > field.validation.max) {
          return `${field.label}은(는) 최대 ${field.validation.max} 이하여야 합니다.`;
        }
      }
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `올바른 이메일 형식이 아닙니다.`;
      }
    }

    if (field.type === 'url' && value) {
      try {
        new URL(value);
      } catch {
        return `올바른 URL 형식이 아닙니다.`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate all fields
      for (const field of schema.fields) {
        const value = formData[field.name];
        const validationError = validateField(field, value);

        if (validationError) {
          setError(validationError);
          setLoading(false);
          return;
        }
      }

      // Check if user has enough points
      if (totalPoints > currentPoints) {
        setError(
          `포인트가 부족합니다. (필요: ${totalPoints.toLocaleString()} P, 보유: ${currentPoints.toLocaleString()} P)`
        );
        setLoading(false);
        return;
      }

      // Submit to dynamic submissions API
      const response = await fetch('/api/submissions/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: categoryId,
          form_data: formData,
          total_points: totalPoints,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '접수에 실패했습니다.');
      }

      router.push('/dashboard/submissions');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '접수 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              value={value || ''}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              placeholder={field.placeholder}
              required={field.required}
              disabled={loading}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              value={value || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [field.name]: parseFloat(e.target.value) || 0,
                })
              }
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              required={field.required}
              disabled={loading}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Textarea
              id={field.name}
              name={field.name}
              value={value || ''}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              placeholder={field.placeholder}
              required={field.required}
              disabled={loading}
              rows={5}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Select
              value={value || ''}
              onValueChange={(newValue) =>
                setFormData({ ...formData, [field.name]: newValue })
              }
              disabled={loading}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={field.placeholder || '선택하세요'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value || false}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, [field.name]: checked === true })
              }
              disabled={loading}
            />
            <Label htmlFor={field.name} className="font-normal">
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
          </div>
        );

      case 'date':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-destructive"> *</span>}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="date"
              value={value || ''}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
              disabled={loading}
            />
            {field.helpText && (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>접수 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schema.fields.map((field) => renderField(field))}
        </CardContent>
      </Card>

      {schema.calculation && (
        <Card>
          <CardHeader>
            <CardTitle>포인트 계산</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">단가</span>
              <span className="font-medium">{pricePerUnit.toLocaleString()} P</span>
            </div>
            {schema.calculation.variables
              .filter((v) => v !== 'pricePerUnit')
              .map((varName) => (
                <div key={varName} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{varName}</span>
                  <span className="font-medium">
                    {formData[varName] !== undefined
                      ? formData[varName].toLocaleString()
                      : '-'}
                  </span>
                </div>
              ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">총 차감 포인트</span>
                <span className="text-lg font-bold text-primary">
                  {totalPoints.toLocaleString()} P
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">보유 포인트</span>
                <span
                  className={
                    currentPoints >= totalPoints ? 'text-green-600' : 'text-destructive'
                  }
                >
                  {currentPoints.toLocaleString()} P
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          취소
        </Button>
        <Button type="submit" disabled={loading || totalPoints > currentPoints}>
          {loading ? '접수 중...' : '접수하기'}
        </Button>
      </div>
    </form>
  );
}
*/
