using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BdaeyEducat.API.Data.Entities;

namespace BdaeyEducat.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    public DbSet<TeacherProfile> TeacherProfiles { get; set; }
    public DbSet<Package> Packages { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }

    public DbSet<Wallet> Wallets { get; set; }
    public DbSet<WalletTransaction> WalletTransactions { get; set; }
    public DbSet<PlatformSetting> PlatformSettings { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ContactMessage> ContactMessages { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<WithdrawalRequest> WithdrawalRequests { get; set; }
    public DbSet<WithdrawalMethod> WithdrawalMethods { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    public DbSet<PromoCode> PromoCodes { get; set; }
    public DbSet<PromoCodeUsage> PromoCodeUsages { get; set; }
    public DbSet<SessionEvaluation> SessionEvaluations { get; set; }
    public DbSet<Badge> Badges { get; set; }
    public DbSet<StudentBadge> StudentBadges { get; set; }
    public DbSet<FavoriteTeacher> FavoriteTeachers { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.HasDefaultSchema("quran");

        builder.Entity<ChatMessage>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ChatMessage>()
            .HasOne(m => m.Receiver)
            .WithMany()
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
        });

        builder.Entity<TeacherProfile>(entity =>
        {
            entity.HasOne(t => t.User)
                .WithOne()
                .HasForeignKey<TeacherProfile>(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Subjects).HasColumnType("text[]");
        });

        builder.Entity<Package>(entity =>
        {
            entity.HasOne(p => p.TeacherProfile)
                .WithMany(t => t.Packages)
                .HasForeignKey(p => p.TeacherProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Booking>(entity =>
        {
            entity.HasOne(b => b.Student)
                .WithMany()
                .HasForeignKey(b => b.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.TeacherProfile)
                .WithMany()
                .HasForeignKey(b => b.TeacherProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Package)
                .WithMany()
                .HasForeignKey(b => b.PackageId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Session>(entity =>
        {
            entity.HasOne(s => s.Booking)
                .WithMany(b => b.Sessions)
                .HasForeignKey(s => s.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Student)
                .WithMany()
                .HasForeignKey(s => s.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.TeacherProfile)
                .WithMany()
                .HasForeignKey(s => s.TeacherProfileId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Wallet>(entity =>
        {
            entity.HasIndex(w => w.UserId).IsUnique();
            entity.Property(w => w.Version).IsRowVersion();
        });

        builder.Entity<WalletTransaction>(entity =>
        {
            entity.HasIndex(e => new { e.Provider, e.ProviderTransactionId })
                .IsUnique()
                .HasFilter("\"Provider\" IS NOT NULL AND \"ProviderTransactionId\" IS NOT NULL");

            entity.HasIndex(e => e.ReferenceId);
        });

        builder.Entity<PromoCode>(entity =>
        {
            entity.HasIndex(p => p.Code).IsUnique();
        });

        builder.Entity<PromoCodeUsage>(entity =>
        {
            entity.HasOne(u => u.PromoCode)
                .WithMany(p => p.Usages)
                .HasForeignKey(u => u.PromoCodeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(u => u.User)
                .WithMany()
                .HasForeignKey(u => u.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.PromoCodeId, e.UserId }).IsUnique();
        });

        builder.Entity<SessionEvaluation>(entity =>
        {
            entity.HasOne(e => e.Session)
                .WithMany()
                .HasForeignKey(e => e.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TeacherProfile)
                .WithMany()
                .HasForeignKey(e => e.TeacherProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.SessionId).IsUnique();
        });

        builder.Entity<FavoriteTeacher>(entity =>
        {
            entity.HasKey(f => new { f.UserId, f.TeacherProfileId });

            entity.HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.TeacherProfile)
                .WithMany()
                .HasForeignKey(f => f.TeacherProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ChatMessage>(entity =>
        {
            entity.HasIndex(e => new { e.SenderId, e.ReceiverId });
        });

        builder.Entity<Notification>(entity =>
        {
            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt });
        });

        builder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(e => new { e.TargetEntity, e.CreatedAt });
        });

        builder.Entity<ContactMessage>(entity =>
        {
            entity.HasIndex(e => new { e.IsRead, e.CreatedAt });
        });

        builder.Entity<Review>(entity =>
        {
            entity.HasIndex(e => new { e.BookingId, e.StudentId }).IsUnique();
        });

        builder.Entity<StudentBadge>(entity =>
        {
            entity.HasIndex(e => new { e.StudentId, e.BadgeId }).IsUnique();
        });
    }
}
