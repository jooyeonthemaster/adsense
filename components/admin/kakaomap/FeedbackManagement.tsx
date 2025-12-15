'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Loader2,
  Filter,
  ChevronDown,
  Calendar,
  CheckSquare,
  Square,
  Pencil,
  Download,
  Upload,
} from 'lucide-react';

import { useFeedbackManagement } from '@/hooks/admin/kakaomap/useFeedbackManagement';
import {
  EditContentDialog,
  BulkEditDialog,
  ContentCard,
  type FilterMode,
} from './feedback';

interface FeedbackManagementProps {
  submissionId: string;
}

export function FeedbackManagement({ submissionId }: FeedbackManagementProps) {
  const {
    loading,
    contentItems,
    filteredItems,
    pendingItems,
    groupedItems,
    filterMode,
    setFilterMode,
    selectedIds,
    toggleSelect,
    selectAllInDate,
    selectAll,
    isAllSelectedInDate,
    editDialog,
    handleOpenEdit,
    handleCloseEdit,
    handleImageChange,
    setEditedScript,
    handleSaveEdit,
    bulkEditDialog,
    handleOpenBulkEdit,
    handleCloseBulkEdit,
    setBulkScripts,
    handleBulkSave,
    fileInputRef,
    isExcelUploading,
    handleExcelDownload,
    handleExcelUpload,
  } = useFeedbackManagement({ submissionId });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (contentItems.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            아직 업로드된 콘텐츠가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const revisionRequestedCount = contentItems.filter(
    (item) => item.review_status === 'revision_requested'
  ).length;

  return (
    <div className="space-y-4">
      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleExcelUpload}
        className="hidden"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>콘텐츠 관리</CardTitle>
              <CardDescription>
                콘텐츠를 선택하여 개별 또는 일괄 수정할 수 있습니다
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Tabs
                value={filterMode}
                onValueChange={(value) => setFilterMode(value as FilterMode)}
              >
                <TabsList>
                  <TabsTrigger value="all">전체 ({contentItems.length})</TabsTrigger>
                  <TabsTrigger value="revision_requested">
                    <Filter className="h-4 w-4 mr-1" />
                    수정 요청 ({revisionRequestedCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* 선택 및 일괄 수정 버튼 */}
          {pendingItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t mt-4">
              <Button variant="outline" size="sm" onClick={selectAll} className="gap-2">
                {pendingItems.every((item) => selectedIds.has(item.id)) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                전체 선택 ({pendingItems.length})
              </Button>

              {selectedIds.size > 0 && (
                <>
                  <Badge variant="secondary" className="text-sm">
                    {selectedIds.size}개 선택됨
                  </Badge>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleOpenBulkEdit}
                      className="gap-2 bg-amber-600 hover:bg-amber-700"
                    >
                      <Pencil className="h-4 w-4" />
                      텍스트 수정
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExcelDownload}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      엑셀 다운로드
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExcelUploading}
                      className="gap-2"
                    >
                      {isExcelUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      엑셀 업로드
                    </Button>
                  </div>
                  <p className="w-full text-xs text-muted-foreground mt-1">
                    엑셀 업로드 시 선택된 콘텐츠의 번호와 일치하는 항목만 업데이트됩니다
                  </p>
                </>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {filterMode === 'revision_requested'
                ? '수정 요청된 콘텐츠가 없습니다.'
                : '콘텐츠가 없습니다.'}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map(({ date, items: dateItems }) => {
                const pendingInDate = dateItems.filter(
                  (item) => item.review_status === 'pending'
                );

                return (
                  <Collapsible key={date} defaultOpen={true}>
                    {/* 날짜 헤더 */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted rounded-lg">
                      {pendingInDate.length > 0 && (
                        <Checkbox
                          checked={isAllSelectedInDate(dateItems)}
                          onCheckedChange={() => selectAllInDate(dateItems)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}

                      <CollapsibleTrigger asChild>
                        <button className="flex-1 flex items-center gap-2 text-left">
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:-rotate-90" />
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{date}</span>
                          <Badge variant="secondary" className="ml-auto">
                            {dateItems.length}개
                          </Badge>
                        </button>
                      </CollapsibleTrigger>
                    </div>

                    {/* 해당 날짜의 콘텐츠 그리드 */}
                    <CollapsibleContent className="pt-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dateItems.map((item) => (
                          <ContentCard
                            key={item.id}
                            item={item}
                            isSelected={selectedIds.has(item.id)}
                            onToggleSelect={toggleSelect}
                            onEdit={handleOpenEdit}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 개별 수정 다이얼로그 */}
      <EditContentDialog
        dialog={editDialog}
        onClose={handleCloseEdit}
        onImageChange={handleImageChange}
        onScriptChange={setEditedScript}
        onSave={handleSaveEdit}
      />

      {/* 일괄 수정 다이얼로그 */}
      <BulkEditDialog
        dialog={bulkEditDialog}
        selectedCount={selectedIds.size}
        onClose={handleCloseBulkEdit}
        onScriptsChange={setBulkScripts}
        onSave={handleBulkSave}
      />
    </div>
  );
}
