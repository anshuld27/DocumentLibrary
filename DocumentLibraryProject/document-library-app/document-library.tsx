'use client'

import { useState, useEffect, useRef } from 'react'
import { Document } from './types/document'
import { api } from './services/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Share2, Check, Copy } from 'lucide-react'
import { FaFilePdf, FaFileExcel, FaFileWord, FaFilePowerpoint, FaFileAlt, FaFileImage, FaFileVideo, FaFileAudio, FaFileArchive, FaCode, FaEye } from 'react-icons/fa';
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { pdfjs } from 'react-pdf';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

// Set up PDF.js worker URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shareLink, setShareLink] = useState('')
  const [shareDuration, setShareDuration] = useState<'1h' | '1d'>('1h')
  const [isCopied, setIsCopied] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isChangingValidity, setIsChangingValidity] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | JSX.Element | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
    // Pagination & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('UploadDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  // New state for the success message
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
   // Fetch documents when the component mounts or any parameter changes
   useEffect(() => {
    fetchDocuments();
  }, [searchTerm, sortBy, sortOrder, page, pageSize]);

  // Fetch documents from the API with search, sorting, and pagination parameters
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await api.getDocuments({
        sortBy,
        sortOrder,
        searchTerm,
        page,
        pageSize
      });
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: 'Error fetching documents',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when search term changes
  };

  const handleSortChange = (field: string) => {
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newSortOrder);
  };

  const handlePaginationChange = (newPage: number) => {
    setPage(newPage);
  };

  // Upload a document to the API
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      try {
        fileInputRef.current.value = ''; // Clear input
        const newDoc = await api.uploadDocument(file);
  
        // Show success message
        setUploadSuccess(`Document "${file.name}" uploaded successfully!`);
  
        // Re-fetch documents to ensure the list is up-to-date
        fetchDocuments();
  
        // Hide success message after 3 seconds
        setTimeout(() => setUploadSuccess(null), 3000);
      } catch (error) {
        console.error('Failed to upload document:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload the document. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Download a document by ID
  const handleDownload = async (id: string) => {
    try {
      await api.downloadDocument(id);
      // Update download count in the UI
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === id ? { ...doc, downloads: doc.downloads + 1 } : doc
        )
      );
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  // Share a document by generating a shareable link
  const handleShare = async (id: string) => {
    try {
      const link = await api.generateShareLink(id, shareDuration);
      setShareLink(link);
      setIsShareDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }
  };

  // Change share link validity
  const handleChangeValidity = async (
    newDuration: '1h' | '1d' = shareDuration
  ) => {
    setIsChangingValidity(true);
    try {
      const newLink = await api.changeShareLinkValidity(shareLink, newDuration);
      setShareLink(newLink);
      setShareDuration(newDuration);
      toast({
        title: 'Success',
        description: `Share link validity changed to ${newDuration === '1h' ? '1 hour' : '1 day'}.`,
      });
    } catch (error) {
      console.error('Failed to change share link validity:', error);
      toast({
        title: 'Error',
        description: 'Failed to change share link validity. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingValidity(false);
    }
  };

  // Copy the share link to the clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const getIconForType = (type: string) => {
    const normalizedType = type.toLowerCase(); // Normalize for case insensitivity
    if (normalizedType.endsWith("pdf")) //PDF
    { 
      return <FaFilePdf size={20} color="red"/>
    }
    if (normalizedType.endsWith("vnd.ms-excel") ||
      normalizedType.endsWith("vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
      normalizedType === "text/csv") {
      return <FaFileExcel size={20} color="green" />; // Excel/CSV
    }

    if (normalizedType.endsWith("msword") ||
      normalizedType.endsWith("vnd.openxmlformats-officedocument.wordprocessingml.document")) 
    {
      return <FaFileWord size={20} color="blue" />; // Word
    }

    if (normalizedType.endsWith("vnd.ms-powerpoint") ||
      normalizedType.endsWith("vnd.openxmlformats-officedocument.presentationml.presentation"))
    {
      return <FaFilePowerpoint size={20} color="orange" />; // PowerPoint
    }

    if (normalizedType.endsWith("plain") ||
      normalizedType.endsWith("txt")) 
    {
      return <FaFileAlt size={20} color="gray" />; // Text file
    }

    if (normalizedType.endsWith("image") ||
      normalizedType.endsWith("jpeg") ||
      normalizedType.endsWith("png") ||
      normalizedType.endsWith("jpg")) 
    {
      return <FaFileImage size={20} color="purple" />; // Image files
    }

    if (normalizedType.endsWith("video")) 
    {
      return <FaFileVideo size={20} color="red" />; // Video files
    }

    if (normalizedType.endsWith("audio")) 
    {
      return <FaFileAudio size={20} color="red" />; // Audio files
    }

    // Default fallback
    return <FaCode size={20} color="black" />;
  }

  const handlePreview = async (doc: Document) => {
    setPreviewDocument(doc);
    setPreviewContent(null);

    try {
      const previewLink = await api.getPreviewLink(doc.id);

      const response = await fetch(previewLink);
      const blob = await response.blob();
      if (doc.type.endsWith('vnd.openxmlformats-officedocument.wordprocessingml.document') || 
        doc.type.endsWith('application/msword') ||
        doc.type.endsWith('msword')) {
          const arrayBuffer = await blob.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setPreviewContent(
            <div
              style={{
                overflowX: "scroll",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                padding: "10px",
                border: "1px solid #ccc",
              }}
              dangerouslySetInnerHTML={{ __html: result.value }}
            />
          );
      }
      else if (doc.type.endsWith('pdf')) {
        setPreviewUrl(URL.createObjectURL(blob));
      } 
      else if (doc.type.endsWith('jpeg')) {
        setPreviewContent(<img src={previewLink} alt="Preview" />);
      } 
      else if (doc.type.endsWith('txt') || doc.type.endsWith('plain')) {
        const text = await blob.text();
        setPreviewContent(<pre>{text}</pre>);
      } 
      else if (doc.type.endsWith("vnd.ms-excel") ||
        doc.type.endsWith("vnd.openxmlformats-officedocument.spreadsheetml.sheet") ||
        doc.type.endsWith("text/csv")) 
        {
          const arrayBuffer = await blob.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          if (workbook.SheetNames.length > 0) {
            const htmlString = XLSX.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]]);
            const styledHtmlString = htmlString.replace(
              '<table>',
              '<table style="border-collapse: collapse; width: 100%;">'
            ).replace(
              /<td/g,
              '<td style="border: 1px solid black; padding: 5px;"'
            );
            setPreviewContent(<div dangerouslySetInnerHTML={{ __html: styledHtmlString }} />);
          } else {
            console.error("No sheets found in Excel file.");
            setPreviewContent(<span>No preview available for this file type.</span>);
          }
        }
      } catch (error) {
      console.error('Failed to preview document:', error);
      toast({
        title: "Error",
        description: "Failed to load preview.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Document Library</h1>
        {/* Display success message */}
        <div className="h-12">
          {uploadSuccess && (
            <div className="bg-lightgreen text-green-600 p-4 rounded-md mb-4 transition-all duration-500 opacity-100">
            {uploadSuccess}
          </div>
          )}
        </div>
      <div className="mb-4 flex justify-between items-center">
      {/* Upload Button on the Left */}
      <div>
      <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".pdf,.xlsx,.docx,.txt,.jpg,.png"
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()}>
            Upload Document
          </Button>
      </div>

      {/* Search Input on the Right */}
      <div>
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search documents..."
          className="w-3/3" // Adjusted width to 2/3 of the available space
        />
      </div>
    </div>

      {isLoading ? (
        <p>Loading documents...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
            <TableHead onClick={() => handleSortChange('Name')} className="cursor-pointer" style={{ width: '30%' }}>
                Name {sortBy === 'Name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead onClick={() => handleSortChange('UploadDate')} className="cursor-pointer">
                Upload Date {sortBy === 'UploadDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getIconForType(doc.type)}
                    {doc.name}
                  </div>
                </TableCell>
                <TableCell>{format(new Date(doc.uploadDate), 'PPpp')}</TableCell>
                <TableCell>{doc.downloads}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleDownload(doc.id)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => handleShare(doc.id)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Share Document</DialogTitle>
                          <DialogDescription>
                            Anyone with this link will be able to view and download the document.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                          <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                              Link
                            </Label>
                            <Input
                              id="link"
                              defaultValue={shareLink}
                              readOnly
                            />
                          </div>
                          <Button size="sm" className="px-3" onClick={handleCopyLink}>
                            <span className="sr-only">Copy</span>
                            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <RadioGroup 
                          value={shareDuration} 
                          onValueChange={(value: '1h' | '1d') => {
                            setShareDuration(value)
                            handleChangeValidity(value)
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1h" id="r1" disabled={isChangingValidity} />
                            <Label htmlFor="r1">1 hour</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1d" id="r2" disabled={isChangingValidity} />
                            <Label htmlFor="r2">1 day</Label>
                          </div>
                        </RadioGroup>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => handlePreview(doc)}>
                          <FaEye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Preview: {previewDocument?.name}</DialogTitle>
                        </DialogHeader>
                          <div
                            style={{
                              maxHeight: "500px", // Adjust height as needed
                              overflowY: "auto",
                              border: "1px solid #ccc",
                              padding: "10px",
                              borderRadius: "4px",
                            }}
                          > 
                          {previewDocument?.type.endsWith("pdf") ? (
                            // Render PDF viewer if file type is PDF
                            previewUrl ? (
                              <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
                                <Viewer fileUrl={previewUrl} />
                              </Worker>
                            ) : previewContent ? (
                              previewContent
                            ) : (
                              <canvas ref={canvasRef} className="w-full border rounded"></canvas>
                            )
                          ) : (
                            // Render non-PDF content
                            previewContent
                          )}
                          </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <Button
          onClick={() => handlePaginationChange(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
          <Button
            onClick={() => handlePaginationChange(page + 1)}
            disabled={documents.length < pageSize}
          >
          Next
        </Button>
      </div>
    </div>
  )
}

