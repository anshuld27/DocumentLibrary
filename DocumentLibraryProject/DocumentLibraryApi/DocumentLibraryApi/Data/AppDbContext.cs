using System.Collections.Generic;
using DocumentLibraryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace DocumentLibraryApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Document> Documents { get; set; }
        public DbSet<ShareLink> ShareLinks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ShareLink>()
                .HasOne(sl => sl.Document)
                .WithMany(d => d.ShareLinks)
                .HasForeignKey(sl => sl.DocumentId)
                .OnDelete(DeleteBehavior.Cascade); // Optional: Configures cascading delete
        }
    }
}
