'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import type {
  ContentItem,
  FilterMode,
  DateGroup,
  EditDialogState,
  BulkEditDialogState,
} from '@/components/admin/kakaomap/feedback/types';

// 날짜별로 아이템 그룹화
function groupItemsByDate(items: ContentItem[]): Record<string, ContentItem[]> {
  const groups: Record<string, ContentItem[]> = {};

  items.forEach((item) => {
    const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
  });

  return groups;
}

interface UseFeedbackManagementProps {
  submissionId: string;
}

export interface UseFeedbackManagementReturn {
  // Loading state
  loading: boolean;

  // Content data
  contentItems: ContentItem[];
  filteredItems: ContentItem[];
  pendingItems: ContentItem[];
  groupedItems: DateGroup[];

  // Filter
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;

  // Selection
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  selectAllInDate: (dateItems: ContentItem[]) => void;
  selectAll: () => void;
  isAllSelectedInDate: (dateItems: ContentItem[]) => boolean;
  clearSelection: () => void;

  // Edit dialog
  editDialog: EditDialogState;
  handleOpenEdit: (item: ContentItem) => void;
  handleCloseEdit: () => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setEditedScript: (script: string) => void;
  handleSaveEdit: () => Promise<void>;

  // Bulk edit dialog
  bulkEditDialog: BulkEditDialogState;
  handleOpenBulkEdit: () => void;
  handleCloseBulkEdit: () => void;
  setBulkScripts: (scripts: string) => void;
  handleBulkSave: () => Promise<void>;

  // Excel
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isExcelUploading: boolean;
  handleExcelDownload: () => void;
  handleExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

  // Refresh
  fetchContentItems: () => Promise<void>;
}

export function useFeedbackManagement({
  submissionId,
}: UseFeedbackManagementProps): UseFeedbackManagementReturn {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit dialog state
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    item: null,
    editedImage: null,
    editedImagePreview: null,
    editedScript: '',
    isSaving: false,
  });

  // Bulk edit dialog state
  const [bulkEditDialog, setBulkEditDialog] = useState<BulkEditDialogState>({
    open: false,
    scripts: '',
    isSaving: false,
  });

  // Excel upload state
  const [isExcelUploading, setIsExcelUploading] = useState(false);

  // Fetch content items
  const fetchContentItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/kakaomap/${submissionId}/content`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setContentItems(data.content_items || []);
    } catch (error) {
      console.error('Error fetching content items:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '콘텐츠 목록을 불러오는데 실패했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [submissionId, toast]);

  useEffect(() => {
    fetchContentItems();
  }, [fetchContentItems]);

  // Filtered and grouped items
  const filteredItems = useMemo(
    () =>
      filterMode === 'revision_requested'
        ? contentItems.filter((item) => item.review_status === 'revision_requested')
        : contentItems,
    [contentItems, filterMode]
  );

  const pendingItems = useMemo(
    () => filteredItems.filter((item) => item.review_status === 'pending'),
    [filteredItems]
  );

  const groupedItems = useMemo(() => {
    const groups = groupItemsByDate(filteredItems);
    const sortedDates = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(groups[a][0].created_at);
      const dateB = new Date(groups[b][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });
    return sortedDates.map((date) => ({ date, items: groups[date] }));
  }, [filteredItems]);

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const selectAllInDate = useCallback(
    (dateItems: ContentItem[]) => {
      const pendingInDate = dateItems.filter((item) => item.review_status === 'pending');
      const allSelected = pendingInDate.every((item) => selectedIds.has(item.id));

      setSelectedIds((prev) => {
        const newSelected = new Set(prev);
        if (allSelected) {
          pendingInDate.forEach((item) => newSelected.delete(item.id));
        } else {
          pendingInDate.forEach((item) => newSelected.add(item.id));
        }
        return newSelected;
      });
    },
    [selectedIds]
  );

  const selectAll = useCallback(() => {
    const allSelected = pendingItems.every((item) => selectedIds.has(item.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingItems.map((item) => item.id)));
    }
  }, [pendingItems, selectedIds]);

  const isAllSelectedInDate = useCallback(
    (dateItems: ContentItem[]) => {
      const pendingInDate = dateItems.filter((item) => item.review_status === 'pending');
      return pendingInDate.length > 0 && pendingInDate.every((item) => selectedIds.has(item.id));
    },
    [selectedIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Edit dialog handlers
  const handleOpenEdit = useCallback((item: ContentItem) => {
    setEditDialog({
      open: true,
      item,
      editedImage: null,
      editedImagePreview: null,
      editedScript: item.script_text || '',
      isSaving: false,
    });
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: '파일 크기 초과',
          description: '파일 크기는 10MB를 초과할 수 없습니다.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditDialog((prev) => ({
          ...prev,
          editedImage: file,
          editedImagePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    },
    [toast]
  );

  const setEditedScript = useCallback((script: string) => {
    setEditDialog((prev) => ({ ...prev, editedScript: script }));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editDialog.item) return;

    setEditDialog((prev) => ({ ...prev, isSaving: true }));
    try {
      const formData = new FormData();
      if (editDialog.editedImage) {
        formData.append('image', editDialog.editedImage);
      }
      if (editDialog.editedScript.trim()) {
        formData.append('script_text', editDialog.editedScript.trim());
      }

      const response = await fetch(
        `/api/admin/kakaomap/${submissionId}/content/${editDialog.item.id}`,
        { method: 'PATCH', body: formData }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '수정에 실패했습니다.');
      }

      const data = await response.json();
      setContentItems((prev) =>
        prev.map((item) =>
          item.id === editDialog.item!.id
            ? {
                ...item,
                image_url: data.content_item.image_url,
                script_text: data.content_item.script_text,
              }
            : item
        )
      );

      setEditDialog((prev) => ({ ...prev, open: false }));
      toast({
        title: '✓ 수정 완료',
        description: '콘텐츠가 성공적으로 수정되었습니다.',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: error instanceof Error ? error.message : '수정에 실패했습니다.',
      });
    } finally {
      setEditDialog((prev) => ({ ...prev, isSaving: false }));
    }
  }, [editDialog.item, editDialog.editedImage, editDialog.editedScript, submissionId, toast]);

  // Bulk edit dialog handlers
  const handleOpenBulkEdit = useCallback(() => {
    if (selectedIds.size === 0) {
      toast({
        title: '알림',
        description: '수정할 콘텐츠를 선택해주세요.',
      });
      return;
    }

    const selectedItems = contentItems
      .filter((item) => selectedIds.has(item.id))
      .sort((a, b) => a.upload_order - b.upload_order);

    const scripts = selectedItems.map((item) => item.script_text || '').join('\n---\n');
    setBulkEditDialog({ open: true, scripts, isSaving: false });
  }, [selectedIds, contentItems, toast]);

  const handleCloseBulkEdit = useCallback(() => {
    setBulkEditDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const setBulkScripts = useCallback((scripts: string) => {
    setBulkEditDialog((prev) => ({ ...prev, scripts }));
  }, []);

  const handleBulkSave = useCallback(async () => {
    if (!bulkEditDialog.scripts.trim()) return;

    setBulkEditDialog((prev) => ({ ...prev, isSaving: true }));
    try {
      const newScripts = bulkEditDialog.scripts.split('\n---\n').map((s) => s.trim());
      const selectedItems = contentItems
        .filter((item) => selectedIds.has(item.id))
        .sort((a, b) => a.upload_order - b.upload_order);

      if (newScripts.length !== selectedItems.length) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: `선택된 콘텐츠 ${selectedItems.length}개와 입력된 원고 ${newScripts.length}개의 수가 일치하지 않습니다.`,
        });
        setBulkEditDialog((prev) => ({ ...prev, isSaving: false }));
        return;
      }

      const updatePromises = selectedItems.map((item, index) => {
        const formData = new FormData();
        formData.append('script_text', newScripts[index]);

        return fetch(`/api/admin/kakaomap/${submissionId}/content/${item.id}`, {
          method: 'PATCH',
          body: formData,
        });
      });

      const results = await Promise.all(updatePromises);
      const failedCount = results.filter((res) => !res.ok).length;

      if (failedCount > 0) {
        toast({
          variant: 'destructive',
          title: '일부 실패',
          description: `${selectedItems.length - failedCount}건 성공, ${failedCount}건 실패`,
        });
      } else {
        toast({
          title: '✓ 일괄 수정 완료',
          description: `${selectedItems.length}개의 콘텐츠가 수정되었습니다.`,
        });
      }

      setBulkEditDialog((prev) => ({ ...prev, open: false }));
      setSelectedIds(new Set());
      await fetchContentItems();
    } catch (error) {
      console.error('Error bulk saving:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '일괄 수정에 실패했습니다.',
      });
    } finally {
      setBulkEditDialog((prev) => ({ ...prev, isSaving: false }));
    }
  }, [bulkEditDialog.scripts, contentItems, selectedIds, submissionId, toast, fetchContentItems]);

  // Excel handlers
  const handleExcelDownload = useCallback(() => {
    if (selectedIds.size === 0) {
      toast({
        title: '알림',
        description: '다운로드할 콘텐츠를 선택해주세요.',
      });
      return;
    }

    const selectedItems = contentItems
      .filter((item) => selectedIds.has(item.id))
      .sort((a, b) => a.upload_order - b.upload_order);

    const excelData = selectedItems.map((item) => ({
      번호: item.upload_order,
      '리뷰 내용': item.script_text || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '원고 수정');

    worksheet['!cols'] = [{ wch: 8 }, { wch: 100 }];

    const fileName = `원고_수정_${selectedItems.length}개_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: '✓ 다운로드 완료',
      description: `${selectedItems.length}개의 원고가 다운로드되었습니다.`,
    });
  }, [selectedIds, contentItems, toast]);

  const handleExcelUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls'].includes(ext || '')) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '엑셀 파일만 업로드 가능합니다. (.xlsx, .xls)',
        });
        return;
      }

      if (selectedIds.size === 0) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '먼저 수정할 콘텐츠를 선택해주세요.',
        });
        return;
      }

      setIsExcelUploading(true);

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<{ 번호: number; '리뷰 내용': string }>(worksheet);

        if (jsonData.length === 0) {
          throw new Error('엑셀 파일에 데이터가 없습니다.');
        }

        const selectedItems = contentItems
          .filter((item) => selectedIds.has(item.id))
          .sort((a, b) => a.upload_order - b.upload_order);

        const updatePromises: Promise<Response>[] = [];

        for (const row of jsonData) {
          const uploadOrder = row['번호'];
          const scriptText = row['리뷰 내용'];

          if (!uploadOrder || scriptText === undefined) continue;

          const targetItem = selectedItems.find((item) => item.upload_order === uploadOrder);
          if (!targetItem) continue;

          const formData = new FormData();
          formData.append('script_text', String(scriptText).trim());

          updatePromises.push(
            fetch(`/api/admin/kakaomap/${submissionId}/content/${targetItem.id}`, {
              method: 'PATCH',
              body: formData,
            })
          );
        }

        if (updatePromises.length === 0) {
          throw new Error('매칭되는 콘텐츠가 없습니다. 번호를 확인해주세요.');
        }

        const results = await Promise.all(updatePromises);
        const failedCount = results.filter((res) => !res.ok).length;
        const successCount = updatePromises.length - failedCount;

        if (failedCount > 0) {
          toast({
            variant: 'destructive',
            title: '일부 실패',
            description: `${successCount}건 성공, ${failedCount}건 실패`,
          });
        } else {
          toast({
            title: '✓ 엑셀 업로드 완료',
            description: `${successCount}개의 콘텐츠가 수정되었습니다.`,
          });
        }

        setSelectedIds(new Set());
        await fetchContentItems();
      } catch (error) {
        console.error('Excel upload error:', error);
        toast({
          variant: 'destructive',
          title: '오류',
          description: error instanceof Error ? error.message : '엑셀 업로드에 실패했습니다.',
        });
      } finally {
        setIsExcelUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [selectedIds, contentItems, submissionId, toast, fetchContentItems]
  );

  return {
    // Loading state
    loading,

    // Content data
    contentItems,
    filteredItems,
    pendingItems,
    groupedItems,

    // Filter
    filterMode,
    setFilterMode,

    // Selection
    selectedIds,
    toggleSelect,
    selectAllInDate,
    selectAll,
    isAllSelectedInDate,
    clearSelection,

    // Edit dialog
    editDialog,
    handleOpenEdit,
    handleCloseEdit,
    handleImageChange,
    setEditedScript,
    handleSaveEdit,

    // Bulk edit dialog
    bulkEditDialog,
    handleOpenBulkEdit,
    handleCloseBulkEdit,
    setBulkScripts,
    handleBulkSave,

    // Excel
    fileInputRef,
    isExcelUploading,
    handleExcelDownload,
    handleExcelUpload,

    // Refresh
    fetchContentItems,
  };
}
