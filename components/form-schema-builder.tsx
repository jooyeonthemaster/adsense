'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Code } from 'lucide-react';
import type { FormField, FormSchema, FieldType } from '@/types/form-schema';

interface FormSchemaBuilderProps {
  value: FormSchema;
  onChange: (schema: FormSchema) => void;
}

export function FormSchemaBuilder({ value, onChange }: FormSchemaBuilderProps) {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const handleAddField = () => {
    setEditingField({
      name: '',
      label: '',
      type: 'text',
      required: false,
    });
    setEditingIndex(-1);
    setFieldDialogOpen(true);
  };

  const handleEditField = (field: FormField, index: number) => {
    setEditingField({ ...field });
    setEditingIndex(index);
    setFieldDialogOpen(true);
  };

  const handleSaveField = (field: FormField) => {
    const newFields = [...value.fields];
    if (editingIndex === -1) {
      // Add new
      newFields.push(field);
    } else {
      // Edit existing
      newFields[editingIndex] = field;
    }

    onChange({
      ...value,
      fields: newFields,
    });

    setFieldDialogOpen(false);
    setEditingField(null);
    setEditingIndex(-1);
  };

  const handleDeleteField = (index: number) => {
    const newFields = value.fields.filter((_, i) => i !== index);
    onChange({
      ...value,
      fields: newFields,
    });
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...value.fields];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newFields.length) return;

    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];

    onChange({
      ...value,
      fields: newFields,
    });
  };

  const handleToggleJsonMode = () => {
    if (!showJsonMode) {
      // Entering JSON mode - convert current schema to JSON
      setJsonText(JSON.stringify(value, null, 2));
    } else {
      // Exiting JSON mode - parse JSON and update schema
      try {
        const parsed = JSON.parse(jsonText);
        onChange(parsed);
      } catch (err) {
        alert('잘못된 JSON 형식입니다');
        return;
      }
    }
    setShowJsonMode(!showJsonMode);
  };

  if (showJsonMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">고급 모드 (JSON 편집)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              개발자 전용 - 직접 JSON 코드를 수정할 수 있습니다
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleToggleJsonMode}>
            <Code className="w-4 h-4 mr-2" />
            일반 모드로 전환
          </Button>
        </div>
        <Textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={20}
          className="font-mono text-sm"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">고객 입력 항목</Label>
          <p className="text-xs text-muted-foreground mt-1">
            고객이 접수할 때 입력할 항목들을 추가하세요
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleToggleJsonMode}>
          <Code className="w-4 h-4 mr-2" />
          고급 모드
        </Button>
      </div>

      {value.fields.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            아직 항목이 없습니다. 고객이 입력할 항목을 추가해주세요.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {value.fields.map((field, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{field.label}</span>
                      {field.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                          필수입력
                        </span>
                      )}
                    </div>
                    {field.placeholder && (
                      <div className="text-sm text-muted-foreground mt-1">
                        안내문구: {field.placeholder}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveField(index, 'up')}
                      disabled={index === 0}
                      title="위로 이동"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveField(index, 'down')}
                      disabled={index === value.fields.length - 1}
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditField(field, index)}
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteField(index)}
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button onClick={handleAddField} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        항목 추가
      </Button>

      <div className="space-y-2 pt-4 border-t">
        <Label className="text-base">포인트 자동 계산 (선택사항)</Label>
        <Input
          placeholder="예: pricePerUnit * count"
          value={value.calculation?.formula || ''}
          onChange={(e) =>
            onChange({
              ...value,
              calculation: e.target.value
                ? {
                    formula: e.target.value,
                    variables: extractVariables(e.target.value),
                  }
                : undefined,
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          💡 위에서 만든 항목들을 사용해서 포인트를 자동으로 계산할 수 있습니다.<br />
          예: pricePerUnit * count (단가 × 수량)
        </p>
      </div>

      {editingField && (
        <FieldEditorDialog
          field={editingField}
          open={fieldDialogOpen}
          onOpenChange={setFieldDialogOpen}
          onSave={handleSaveField}
        />
      )}
    </div>
  );
}

function extractVariables(formula: string): string[] {
  const matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
  return matches ? Array.from(new Set(matches)) : [];
}

interface FieldEditorDialogProps {
  field: FormField;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (field: FormField) => void;
}

function FieldEditorDialog({ field, open, onOpenChange, onSave }: FieldEditorDialogProps) {
  const [editedField, setEditedField] = useState<FormField>(field);

  const handleSave = () => {
    if (!editedField.name || !editedField.label) {
      alert('필드 이름과 레이블은 필수입니다');
      return;
    }
    onSave(editedField);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>입력 항목 {field.name ? '수정' : '추가'}</DialogTitle>
          <DialogDescription>고객이 입력할 항목을 설정하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field_label" className="text-base">항목명 *</Label>
            <Input
              id="field_label"
              value={editedField.label}
              onChange={(e) =>
                setEditedField({ ...editedField, label: e.target.value })
              }
              placeholder="예: 업체명, 수량, 연락처 등"
            />
            <p className="text-xs text-muted-foreground">고객에게 보여질 이름입니다</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_type" className="text-base">입력 형식 *</Label>
            <Select
              value={editedField.type}
              onValueChange={(value) =>
                setEditedField({ ...editedField, type: value as FieldType })
              }
            >
              <SelectTrigger id="field_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">짧은 텍스트</SelectItem>
                <SelectItem value="number">숫자</SelectItem>
                <SelectItem value="email">이메일 주소</SelectItem>
                <SelectItem value="url">웹사이트 주소</SelectItem>
                <SelectItem value="textarea">긴 텍스트 (여러 줄)</SelectItem>
                <SelectItem value="select">선택 목록</SelectItem>
                <SelectItem value="checkbox">체크박스 (예/아니오)</SelectItem>
                <SelectItem value="date">날짜</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_name" className="text-base">항목 코드 *</Label>
            <Input
              id="field_name"
              value={editedField.name}
              onChange={(e) =>
                setEditedField({ ...editedField, name: e.target.value })
              }
              placeholder="예: company_name, count, phone"
            />
            <p className="text-xs text-muted-foreground">
              💡 계산 공식에서 사용할 코드명입니다 (영문, 숫자, _ 만 사용)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_placeholder">안내 문구</Label>
            <Input
              id="field_placeholder"
              value={editedField.placeholder || ''}
              onChange={(e) =>
                setEditedField({ ...editedField, placeholder: e.target.value })
              }
              placeholder="예: 업체명을 입력하세요"
            />
            <p className="text-xs text-muted-foreground">입력란에 표시될 안내 문구</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_help">추가 설명</Label>
            <Input
              id="field_help"
              value={editedField.helpText || ''}
              onChange={(e) =>
                setEditedField({ ...editedField, helpText: e.target.value })
              }
              placeholder="예: 사업자등록증에 표시된 정확한 이름을 입력하세요"
            />
            <p className="text-xs text-muted-foreground">항목 아래에 표시될 상세 설명</p>
          </div>

          {editedField.type === 'number' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_min">최소값</Label>
                <Input
                  id="field_min"
                  type="number"
                  value={editedField.validation?.min || ''}
                  onChange={(e) =>
                    setEditedField({
                      ...editedField,
                      validation: {
                        ...editedField.validation,
                        min: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field_max">최대값</Label>
                <Input
                  id="field_max"
                  type="number"
                  value={editedField.validation?.max || ''}
                  onChange={(e) =>
                    setEditedField({
                      ...editedField,
                      validation: {
                        ...editedField.validation,
                        max: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="field_required" className="text-base cursor-pointer">필수 입력 항목으로 설정</Label>
              <p className="text-xs text-muted-foreground mt-1">
                활성화하면 고객이 반드시 입력해야 합니다
              </p>
            </div>
            <Switch
              id="field_required"
              checked={editedField.required}
              onCheckedChange={(checked) =>
                setEditedField({ ...editedField, required: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
