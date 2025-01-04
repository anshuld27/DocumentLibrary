namespace DocumentLibraryApi.Models
{
    public class ShareLink
    {
        public Guid Id { get; set; } // Unique identifier for the share link
        public Guid DocumentId { get; set; } // Associated document
        public DateTime ExpirationDate { get; set; } // Expiration timestamp

        // Navigation property
        public Document Document { get; set; }
    }
}
