namespace DocumentLibraryApi.Models
{
    public class Document
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string StoredFileName { get; set; } // New property for unique file names
        public string Type { get; set; }
        public string PreviewUrl { get; set; }
        public DateTime UploadDate { get; set; }
        public int Downloads { get; set; }

        // Navigation property for share links
        public ICollection<ShareLink> ShareLinks { get; set; }
    }
}
