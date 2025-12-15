export interface ContentItem {
  id: string;
  upload_order: number;
  image_url?: string;
  script_text?: string;
  review_status: 'pending' | 'approved' | 'revision_requested';
  created_at: string;
}

export type FilterMode = 'all' | 'revision_requested';

export interface DateGroup {
  date: string;
  items: ContentItem[];
}

export interface EditDialogState {
  open: boolean;
  item: ContentItem | null;
  editedImage: File | null;
  editedImagePreview: string | null;
  editedScript: string;
  isSaving: boolean;
}

export interface BulkEditDialogState {
  open: boolean;
  scripts: string;
  isSaving: boolean;
}
