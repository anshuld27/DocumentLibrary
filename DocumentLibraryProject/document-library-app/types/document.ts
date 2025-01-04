export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'word' | 'txt' | 'image';
  previewUrl: string;
  uploadDate: string;
  downloads: number;
}

