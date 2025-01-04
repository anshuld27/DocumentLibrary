using DocumentLibraryApi.Data;
using DocumentLibraryApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DocumentLibraryApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DocumentsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DocumentsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocuments(
            string sortBy = "UploadDate",   // Default sorting by UploadDate
            string sortOrder = "desc",      // Default sorting order is descending
            string searchTerm = "",         // Optional search term for filtering
            int page = 1,                   // Default page is 1
            int pageSize = 5               // Default page size is 5
        )
        {
            IQueryable<Document> query = _context.Documents;

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(d => d.Name.Contains(searchTerm));
            }

            switch (sortBy.ToLower())
            {
                case "name":
                    query = sortOrder.ToLower() == "asc" ? query.OrderBy(d => d.Name) : query.OrderByDescending(d => d.Name);
                    break;
                case "uploaddate":
                    query = sortOrder.ToLower() == "asc" ? query.OrderBy(d => d.UploadDate) : query.OrderByDescending(d => d.UploadDate);
                    break;
                default:
                    query = query.OrderByDescending(d => d.UploadDate);
                    break;
            }

            var skip = (page - 1) * pageSize;
            var documents = await query.Skip(skip).Take(pageSize).ToListAsync();
            return Ok(documents);
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<Document>> UploadDocument()
        {
            var request = HttpContext.Request;

            if (!request.HasFormContentType || request.Form.Files.Count == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var file = request.Form.Files[0];

            if (file.Length == 0)
            {
                return BadRequest("File is empty.");
            }

            var uniqueId = Guid.NewGuid();
            var originalFileName = file.FileName;
            var uniqueFileName = $"{uniqueId}_{originalFileName}";

            var uploadsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(uploadsDirectory))
            {
                Directory.CreateDirectory(uploadsDirectory);
            }

            var filePath = Path.Combine(uploadsDirectory, uniqueFileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var document = new Document
            {
                Id = uniqueId,
                Name = originalFileName,
                StoredFileName = uniqueFileName, // New field to store the unique file name
                Type = file.ContentType,
                PreviewUrl = "/placeholder.svg?height=100&width=100",
                UploadDate = DateTime.UtcNow,
                Downloads = 0
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDocuments), new { id = document.Id }, document);
        }

        [HttpGet("download/{id}")]
        public async Task<IActionResult> DownloadDocument(Guid id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound();
            }

            var filePath = Path.Combine("uploads", document.StoredFileName);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound();
            }

            document.Downloads += 1;
            _context.Documents.Update(document);
            await _context.SaveChangesAsync();

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            var contentType = "application/octet-stream";

            var fileExtension = Path.GetExtension(document.Name).ToLower();
            switch (fileExtension)
            {
                case ".pdf":
                    contentType = "application/pdf";
                    break;
                case ".xls":
                case ".xlsx":
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    break;
                case ".docx":
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    break;
                case ".txt":
                    contentType = "text/plain";
                    break;
                case ".jpg":
                case ".jpeg":
                    contentType = "image/jpeg";
                    break;
                case ".png":
                    contentType = "image/png";
                    break;
                default:
                    contentType = "application/octet-stream";
                    break;
            }

            Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{document.Name}\"");

            return File(fileBytes, contentType);
        }

        [HttpGet("share/{id}")]
        public async Task<ActionResult<string>> GenerateShareLink(Guid id, string duration)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound("Document not found.");
            }

            // Validate duration
            var validDurations = new[] { "1h", "1d", "7d" };
            if (!validDurations.Contains(duration))
            {
                return BadRequest("Invalid duration. Allowed values are: 1h, 1d, 7d.");
            }

            // Calculate expiration time
            var expirationTime = duration switch
            {
                "1h" => DateTime.UtcNow.AddHours(1),
                "1d" => DateTime.UtcNow.AddDays(1),
                "7d" => DateTime.UtcNow.AddDays(7),
                _ => DateTime.UtcNow.AddDays(1)
            };

            // Save share link data to database (optional but recommended)
            var shareId = Guid.NewGuid(); // Unique ID for the share link
            var shareLinkData = new ShareLink
            {
                Id = shareId,
                DocumentId = id,
                ExpirationDate = expirationTime
            };
            _context.ShareLinks.Add(shareLinkData);
            await _context.SaveChangesAsync();

            // Generate a real URL (e.g., pointing to a route where shared files are served)
            var baseUrl = $"{Request.Scheme}://{Request.Host.Value}";
            var shareUrl = $"{baseUrl}/shared/{shareId}"; // Route to handle the shared link

            return Ok(shareUrl);
        }

        [HttpPost("changeLinkValidity")]
        public async Task<ActionResult<string>> ChangeShareLinkValidity([FromBody] ChangeValidityRequest request)
        {
            // Validate the provided duration
            var validDurations = new[] { "1h", "1d" };
            if (!validDurations.Contains(request.NewDuration))
            {
                return BadRequest("Invalid duration. Allowed values are: 1h, 1d.");
            }

            // Parse the share link and extract the share ID
            if (!Uri.TryCreate(request.LinkUrl, UriKind.Absolute, out var uri))
            {
                return BadRequest("Invalid link URL.");
            }

            var segments = uri.Segments.LastOrDefault();
            if (!Guid.TryParse(segments, out var shareId))
            {
                return BadRequest("Invalid share link.");
            }

            // Find the share link in the database
            var shareLink = await _context.ShareLinks.FindAsync(shareId);
            if (shareLink == null)
            {
                return NotFound("Share link not found.");
            }

            // Update the expiration time based on the new duration
            var newExpirationTime = request.NewDuration switch
            {
                "1h" => DateTime.UtcNow.AddHours(1),
                "1d" => DateTime.UtcNow.AddDays(1),
                _ => DateTime.UtcNow.AddDays(1)
            };

            shareLink.ExpirationDate = newExpirationTime;

            var timeNow = DateTime.UtcNow;
            // Save the updated share link in the database
            _context.ShareLinks.Update(shareLink);
            await _context.SaveChangesAsync();

            // Generate the updated share link
            var baseUrl = $"{Request.Scheme}://{Request.Host.Value}";
            var updatedShareUrl = $"{baseUrl}/shared/{shareLink.Id}";

            return Ok(updatedShareUrl);
        }

        [HttpGet("/shared/{shareId}")]
        public async Task<IActionResult> DownloadFromSharedLink(Guid shareId)
        {
            // Find the share link in the database
            var shareLink = await _context.ShareLinks
                .Include(sl => sl.Document) // Include the related Document entity
                .FirstOrDefaultAsync(sl => sl.Id == shareId);

            if (shareLink == null)
            {
                return NotFound("Share link not found.");
            }

            // Check if the share link has expired
            if (shareLink.ExpirationDate < DateTime.UtcNow)
            {
                return BadRequest("This share link has expired.");
            }

            // Get the document details
            var document = shareLink.Document;
            if (document == null)
            {
                return NotFound("Associated document not found.");
            }

            // Construct the file path
            var filePath = Path.Combine("uploads", document.StoredFileName); // Assuming files are stored in 'uploads' directory
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("File not found on the server.");
            }

            // Read the file as a byte array
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

            // Determine the content type based on file extension
            var contentType = "application/octet-stream"; // Default binary stream
            var fileExtension = Path.GetExtension(filePath).ToLower();
            switch (fileExtension)
            {
                case ".pdf":
                    contentType = "application/pdf";
                    break;
                case ".docx":
                    contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    break;
                case ".xlsx":
                    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    break;
                case ".jpg":
                case ".jpeg":
                    contentType = "image/jpeg";
                    break;
                case ".png":
                    contentType = "image/png";
                    break;
                case ".txt":
                    contentType = "text/plain";
                    break;
                // Add more cases as needed
                default:
                    contentType = "application/octet-stream";
                    break;
            }

            // Add the Content-Disposition header to trigger download
            Response.Headers.Add("Content-Disposition", $"attachment; filename=\"{document.Name}\"");

            return File(fileBytes, contentType);
        }

        [HttpGet("preview/{id}")]
        public async Task<IActionResult> PreviewDocument(Guid id)
        {
            // Fetch the document from the database
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound("Document not found.");
            }

            // Construct the file path
            var filePath = Path.Combine("uploads", document.StoredFileName);
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("File not found.");
            }

            // Determine the content type based on file extension
            var fileExtension = Path.GetExtension(filePath).ToLower();
            var contentType = fileExtension switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".txt" => "text/plain",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                ".mp4" => "video/mp4",
                ".mp3" => "audio/mpeg",
                ".wav" => "audio/wav",
                ".zip" => "application/zip",
                ".rar" => "application/vnd.rar",
                ".csv" => "text/csv",
                _ => "application/octet-stream" // Default binary stream
            };

            // For unsupported file types, provide a meaningful response
            if (contentType == "application/octet-stream")
            {
                return BadRequest("Preview for this file type is not supported.");
            }

            try
            {
                // Read the file as a stream and send it to the response
                var fileStream = System.IO.File.OpenRead(filePath);
                return File(fileStream, contentType, enableRangeProcessing: true);
            }
            catch (Exception ex)
            {
                // Log the error (if logging is configured) and return an error response
                return StatusCode(500, $"An error occurred while processing the file: {ex.Message}");
            }
        }
    }
}
