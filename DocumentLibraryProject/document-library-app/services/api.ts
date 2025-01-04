import axios from 'axios';
import { Document } from '../types/document';

const API_BASE_URL = 'https://localhost:7160/api/documents'; 

export const api = {
  getDocuments: async ({
    sortBy = 'UploadDate',
    sortOrder = 'desc',
    searchTerm = '',
    page = 1,
    pageSize = 5,
  }): Promise<Document[]> => {
    try {
      const response = await axios.get(API_BASE_URL, {
        params: { sortBy, sortOrder, searchTerm, page, pageSize },
      });
      return response.data as Document[]; // Aligns with the updated Document interface
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents.');
    }
  },

  uploadDocument: async (file: File): Promise<Document> => {
    const formData = new FormData();
  formData.append('file', file);

  try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // This is required to send files
        },
      });

      return response.data; // The uploaded document details returned from the backend
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error; // Rethrow or handle the error as needed
    }
  },

  downloadDocument: async (id: string): Promise<void> => {
    try {
      // Fetch the document
      const response = await axios.get(`${API_BASE_URL}/download/${id}`, {
        responseType: 'blob',
      });
  
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'downloaded-file'; // Default filename
  
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=([^;\n]*)/);
        if (match && match[1]) {
          fileName = match[1].replace(/["']/g, ''); // Remove quotes
        }
      }
  
      // Trigger file download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); // Use the extracted filename
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      window.URL.revokeObjectURL(url); // Clean up the object URL
    } catch (error) {
      console.error('Error downloading the document:', error);
    }
  },

  generateShareLink: async (id: string, duration: '1h' | '1d'): Promise<string> => {
    try {
      // Send a GET request to your backend API to generate the share link
      const response = await axios.get(`${API_BASE_URL}/share/${id}`, {
        params: { duration },
      });
  
      // Return the generated share link from the API response
      return response.data; // Assuming the API returns the link in the response body
    } catch (error) {
      console.error('Failed to generate share link:', error);
      throw new Error('Could not generate share link. Please try again.');
    }
  },
  
  changeShareLinkValidity: async (linkUrl: string, newDuration: '1h' | '1d' ): Promise<string> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/changeLinkValidity`, {
        linkUrl,
        newDuration,
      });
  
      // The API returns the updated share link
      return response.data; 
    } catch (error) {
      console.error('Error changing share link validity:', error);
      throw new Error('Failed to change share link validity. Please try again.');
    }
  },

  getPreviewLink: async (id: string): Promise<string> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/preview/${id}`, {
        responseType: 'blob',
      });
      // Create a temporary URL for the Blob
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error fetching preview link:', error);
      throw new Error('Failed to fetch the preview link. Please try again later.');
    }
  }
};

