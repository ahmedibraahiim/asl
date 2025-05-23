using ASL.Backend.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ASL.Backend.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions options)
        : base(options)
    {
    }
    public DbSet<GameMatch> GameMatches { get; set; }
    public DbSet<ASLAlphabet> ASLAlphabets { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure relationships
        builder.Entity<GameMatch>()
            .HasOne(m => m.PlayerA)
            .WithMany()
            .HasForeignKey(m => m.PlayerAId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<GameMatch>()
            .HasOne(m => m.PlayerB)
            .WithMany()
            .HasForeignKey(m => m.PlayerBId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<GameMatch>()
            .HasOne(m => m.Winner)
            .WithMany()
            .HasForeignKey(m => m.WinnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}