using BdaeyEducat.API.Data;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BdaeyEducat.API.Services
{
    public class PackageService : IPackageService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWalletService _walletService;
        private readonly Microsoft.Extensions.Logging.ILogger<PackageService> _logger;

        public PackageService(ApplicationDbContext context, IWalletService walletService, Microsoft.Extensions.Logging.ILogger<PackageService> logger)
        {
            _context = context;
            _walletService = walletService;
            _logger = logger;
        }

        public async Task<IEnumerable<PackageDto>> GetTeacherPackagesAsync(int teacherId, string? currentUserId, bool includeArchived = false)
        {
            var query = _context.Packages.Where(p => p.TeacherProfileId == teacherId);
            
            if (!includeArchived)
            {
                query = query.Where(p => p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active);
            }

            var packages = await query.AsNoTracking().ToListAsync();

            var packageIds = packages.Select(p => p.Id).ToList();

            var bookingCounts = await _context.Bookings
                .Where(b => b.PackageId != null && packageIds.Contains(b.PackageId.GetValueOrDefault()))
                .GroupBy(b => b.PackageId!.Value)
                .Select(g => new
                {
                    PackageId = g.Key,
                    Confirmed = g.Count(b => b.Status == BookingStatus.Confirmed),
                    Pending = g.Count(b => b.Status == BookingStatus.Pending)
                })
                .ToListAsync();

            var bookingCountDict = bookingCounts.ToDictionary(b => b.PackageId);

            var userBookings = new Dictionary<int, Booking>();
            if (!string.IsNullOrEmpty(currentUserId))
            {
                var userBookingList = await _context.Bookings
                    .Where(b => b.StudentId == currentUserId && 
                                b.PackageId != null &&
                                packageIds.Contains(b.PackageId.Value) &&
                                b.Status != BookingStatus.Cancelled && 
                                b.Status != BookingStatus.Completed)
                    .AsNoTracking()
                    .ToListAsync();

                userBookings = userBookingList
                    .GroupBy(b => b.PackageId ?? 0)
                    .ToDictionary(g => g.Key, g => g.First());
            }

            return packages.Select(p => {
                 var userBooking = userBookings.GetValueOrDefault(p.Id);
                 var counts = bookingCountDict.GetValueOrDefault(p.Id);
                 return new PackageDto
                {
                    Id = p.Id,
                    TeacherProfileId = p.TeacherProfileId,
                    Name = p.Name,
                    Description = p.Description,
                    SessionsCount = p.SessionsCount,
                    DurationMinutes = p.DurationMinutes,
                    Price = p.Price,
                    Currency = p.Currency,
                    IsActive = p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active,
                    Status = p.Status.ToString(),
                    AvailableDays = p.AvailableDays,
                    StartTime = p.StartTime.ToString(@"hh\:mm"),
                    EndTime = p.EndTime.ToString(@"hh\:mm"),
                    MaxStudents = p.MaxStudents,
                    ActiveBookingsCount = counts?.Confirmed ?? 0,
                    
                    PeriodType = p.PeriodType,
                    SessionsPerWeek = p.SessionsPerWeek,
                    SessionBufferMinutes = p.SessionBufferMinutes,
                    StartDate = p.StartDate,
                    HasActiveBookings = (counts?.Confirmed ?? 0) > 0,
                    HasPendingBookings = (counts?.Pending ?? 0) > 0,
                    
                    CurrentUserBookingStatus = userBooking?.Status.ToString(),
                    CurrentUserBookingId = userBooking?.Id
                };
            }).ToList();
        }

        public async Task<TeacherProfile?> GetTeacherProfileByUserId(string userId)
        {
            return await _context.TeacherProfiles.FirstOrDefaultAsync(tp => tp.UserId == userId);
        }

        public async Task<IEnumerable<DateTimeOffset>> GetAvailableSlotsAsync(int packageId, DateTimeOffset? start, DateTimeOffset? end, string? excludeUserId)
        {
            var package = await _context.Packages.FindAsync(packageId);
            if (package == null) throw new ArgumentException("Package not found");

            var startDate = start ?? DateTimeOffset.UtcNow.Date;
            var endDate = end ?? startDate.AddMonths(1);

            int weeks = package.PeriodType switch
            {
                "Weekly" => 1,
                "Monthly" => 4,
                "Yearly" => 48,
                _ => 4
            };

            var maxPackageDate = package.StartDate.AddDays((weeks * 7) - 1);
            if (endDate > maxPackageDate) endDate = maxPackageDate;
            if (startDate > maxPackageDate) return new List<DateTimeOffset>();

            var existingSessions = await _context.Sessions
                .Where(s => s.TeacherProfileId == package.TeacherProfileId &&
                            s.ScheduledAt >= startDate && 
                            s.ScheduledAt <= endDate &&
                            s.Status != SessionStatus.Cancelled)
                .AsNoTracking()
                .Select(s => new { s.ScheduledAt, s.DurationMinutes })
                .ToListAsync();

            var studentSessions = new List<dynamic>();
            if (!string.IsNullOrEmpty(excludeUserId))
            {
                studentSessions = await _context.Sessions
                    .Where(s => s.StudentId == excludeUserId &&
                                s.ScheduledAt >= startDate && 
                                s.ScheduledAt <= endDate &&
                                s.Status != SessionStatus.Cancelled &&
                                s.Status != SessionStatus.Completed)
                    .AsNoTracking()
                    .Select(s => new { s.ScheduledAt, s.DurationMinutes })
                    .ToListAsync<dynamic>();
            }

            var slots = new List<DateTimeOffset>();
            
                // Correctly convert Teacher's Local time to UTC using their Timezone
                var tz = TimeZoneInfo.FindSystemTimeZoneById(package.TimezoneId ?? "Africa/Cairo");

                // Convert range to Teacher's Timezone to iterate on HIS/HER days
                var teacherStart = TimeZoneInfo.ConvertTime(startDate, tz);
                var teacherEnd = TimeZoneInfo.ConvertTime(endDate, tz);

                for (var date = teacherStart.Date; date <= teacherEnd.Date; date = date.AddDays(1))
                {
                    if (!package.AvailableDays.Contains((int)date.DayOfWeek)) continue;
                    
                    var localStart = new DateTime(date.Year, date.Month, date.Day, package.StartTime.Hours, package.StartTime.Minutes, 0);
                    var localEnd = new DateTime(date.Year, date.Month, date.Day, package.EndTime.Hours, package.EndTime.Minutes, 0);
                    
                    var dayStart = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localStart, tz));
                    var dayEnd = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localEnd, tz));

                    if (package.EndTime < package.StartTime) dayEnd = dayEnd.AddDays(1);

                var currentSlot = dayStart;
                while (currentSlot.AddMinutes(package.DurationMinutes) <= dayEnd)
                {
                    var slotEnd = currentSlot.AddMinutes(package.DurationMinutes);
                    var currentSlotUtc = currentSlot.UtcDateTime;
                    var slotEndUtc = slotEnd.UtcDateTime;

                    bool isBlocked = existingSessions.Any(s => 
                        s.ScheduledAt < slotEndUtc && 
                        s.ScheduledAt.AddMinutes(s.DurationMinutes) > currentSlotUtc
                    );

                    if (!isBlocked && !string.IsNullOrEmpty(excludeUserId))
                    {
                        isBlocked = studentSessions.Any(s => 
                            s.ScheduledAt < slotEndUtc && 
                            s.ScheduledAt.AddMinutes(s.DurationMinutes) > currentSlotUtc
                        );
                    }

                    // Added 10 minutes tolerance to handle potential second/millisecond discrepancies and user buffer
                    if (currentSlot < package.StartDate.AddMinutes(-10)) 
                    {
                         currentSlot = slotEnd.AddMinutes(package.SessionBufferMinutes);
                         continue;
                    }

                    if (!isBlocked) slots.Add(currentSlot);

                    currentSlot = slotEnd.AddMinutes(package.SessionBufferMinutes);
                }
            }

            return slots;
        }

        public async Task<IEnumerable<DateTimeOffset>> GetMyPackageSlotsAsync(int packageId, string userId)
        {
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.PackageId == packageId && 
                                          b.StudentId == userId && 
                                          b.Status != BookingStatus.Cancelled &&
                                          b.Status != BookingStatus.Completed);
            
            if (booking == null) return new List<DateTimeOffset>();

            var slots = await _context.Sessions
                .Where(s => s.BookingId == booking.Id && s.Status != SessionStatus.Cancelled)
                .AsNoTracking()
                .Select(s => s.ScheduledAt)
                .ToListAsync();

            // Convert UTC stored dates to DateTimeOffset (using system local offset for simplicity, or UTC)
            return slots;
        }

        public async Task<PackageDto> CreatePackageAsync(string requestedByUserId, CreatePackageDto dto, bool isAdmin = false)
        {
            _logger.LogInformation("[DEBUG] CreatePackageAsync started for {user}", requestedByUserId);
            TeacherProfile? teacherProfile = null;
            if (isAdmin && dto.TeacherProfileId.HasValue)
            {
                teacherProfile = await _context.TeacherProfiles.FindAsync(dto.TeacherProfileId.Value);
            }
            else
            {
                teacherProfile = await _context.TeacherProfiles.FirstOrDefaultAsync(t => t.UserId == requestedByUserId);
            }

            if (teacherProfile == null) throw new UnauthorizedAccessException("Teacher profile not found");

            if (!TimeSpan.TryParse(dto.StartTime, out var startTime))
                throw new ArgumentException($"Invalid start time format: '{dto.StartTime}'. Expected format: HH:mm.");
            if (!TimeSpan.TryParse(dto.EndTime, out var endTime))
                throw new ArgumentException($"Invalid end time format: '{dto.EndTime}'. Expected format: HH:mm.");

            // VALIDATION: Ensure enough available days for the sessions per week (One Session Per Day Rule)
            if (dto.AvailableDays == null || dto.AvailableDays.Count < dto.SessionsPerWeek)
            {
                throw new ArgumentException($"غير مسموح. يجب اختيار {dto.SessionsPerWeek} أيام على الأقل لهذه الباقة لتغطية الجلسات الأسبوعية.");
            }

            await ValidateOverlap(teacherProfile.Id, dto.AvailableDays, startTime, endTime, dto.SessionBufferMinutes);

            if (!string.IsNullOrEmpty(dto.TimezoneId))
            {
                try { TimeZoneInfo.FindSystemTimeZoneById(dto.TimezoneId); }
                catch { throw new ArgumentException($"Invalid timezone identifier '{dto.TimezoneId}'. Expected IANA timezone (e.g., Africa/Cairo)."); }
            }

            if (dto.StartDate.Date < DateTime.UtcNow.Date) 
                throw new ArgumentException("تاريخ البدء لا يمكن أن يكون في الماضي.");
            
            if (dto.StartDate.Date == DateTime.UtcNow.Date && startTime < DateTime.UtcNow.TimeOfDay)
                throw new ArgumentException("وقت البدء لا يمكن أن يكون في الماضي بالنسبة لتاريخ اليوم.");

            // VALIDATION: StartDate must be the first available day of the week (Saturday-first cycle)
            var normalizedStartDay = ((int)dto.StartDate.DayOfWeek + 1) % 7;
            var minAvailableDay = dto.AvailableDays.Min(d => (d + 1) % 7);

            if (normalizedStartDay != minAvailableDay)
            {
                var firstDayName = minAvailableDay switch {
                    0 => "السبت", 1 => "الأحد", 2 => "الاثنين", 3 => "الثلاثاء", 
                    4 => "الأربعاء", 5 => "الخميس", 6 => "الجمعة", _ => ""
                };
                throw new ArgumentException($"تاريخ بدء الباقة غير صحيح. يجب أن تبدأ الباقة في أول يوم متاح لها في الأسبوع ({firstDayName}).");
            }

            int sessionsCount = CalculateSessionsCount(dto.PeriodType, dto.SessionsPerWeek);
            DateTimeOffset endDate = CalculateEndDate(dto.StartDate.ToUniversalTime(), dto.PeriodType, dto.AvailableDays, endTime, dto.TimezoneId ?? "Africa/Cairo");

            var package = new Package
            {
                TeacherProfileId = teacherProfile.Id,
                Name = dto.Name,
                Description = dto.Description,
                SessionsCount = sessionsCount,
                DurationMinutes = dto.DurationMinutes,
                Price = dto.Price,
                AvailableDays = dto.AvailableDays,
                StartTime = startTime,
                EndTime = endTime,
                MaxStudents = dto.MaxStudents,
                AllowedGender = dto.AllowedGender,
                PeriodType = dto.PeriodType,
                SessionsPerWeek = dto.SessionsPerWeek,
                SessionBufferMinutes = dto.SessionBufferMinutes,
                StartDate = dto.StartDate.ToUniversalTime(),
                EndDate = endDate,
                TimezoneId = dto.TimezoneId ?? "Africa/Cairo"
            };

            _context.Packages.Add(package);
            try 
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create package for user {User}", requestedByUserId);
                throw new Exception("An error occurred while creating the package. Please try again.");
            }

            await UpdateTeacherPriceStart(teacherProfile.Id);

            return MapToDto(package);
        }

        public async Task<PackageDto> UpdatePackageAsync(int packageId, string requestedByUserId, CreatePackageDto dto, bool isAdmin = false)
        {
            var package = await _context.Packages.Include(p => p.TeacherProfile).FirstOrDefaultAsync(p => p.Id == packageId);
            if (package == null) throw new ArgumentException("Package not found");
            
            if (!isAdmin && package.TeacherProfile?.UserId != requestedByUserId) throw new UnauthorizedAccessException();

            int teacherId = (dto.TeacherProfileId.HasValue && dto.TeacherProfileId.Value > 0) ? dto.TeacherProfileId.Value : package.TeacherProfileId;
            var hasPendingBookings = await _context.Bookings.AnyAsync(b => b.PackageId == packageId && b.Status == BookingStatus.Pending);
            if (hasPendingBookings) throw new InvalidOperationException("توجد حجوزات معلقة لهذه الباقة. يرجى معالجتها أولاً.");

            var hasActiveBookings = await _context.Bookings.AnyAsync(b => b.PackageId == packageId && b.Status == BookingStatus.Confirmed);

            // ALWAYS Parse times from DTO to be used in validation
            if (!TimeSpan.TryParse(dto.StartTime, out var startTime))
                throw new ArgumentException($"Invalid start time format: '{dto.StartTime}'. Expected format: HH:mm.");
            if (!TimeSpan.TryParse(dto.EndTime, out var endTime))
                throw new ArgumentException($"Invalid end time format: '{dto.EndTime}'. Expected format: HH:mm.");

            _logger.LogInformation("[DEBUG] UpdatePackage parsed: Start={startTime} (Raw='{rawStart}'), End={endTime} (Raw='{rawEnd}')", startTime, dto.StartTime, endTime, dto.EndTime);

            // DETERMINATION: Which values are actually being used for the overlap check?
            // If has active bookings, time/days cannot be changed, so we validate existing package values against OTHER active packages.
            // If no bookings, we validate the NEW values from DTO against OTHER active packages.
            var valDays = hasActiveBookings ? package.AvailableDays : dto.AvailableDays;
            var valStart = hasActiveBookings ? package.StartTime : startTime;
            var valEnd = hasActiveBookings ? package.EndTime : endTime;
            var valBuffer = hasActiveBookings ? package.SessionBufferMinutes : dto.SessionBufferMinutes;

            // FIX: Use the resolved teacherId (handles admin moving packages or viewing teacher context)
            await ValidateOverlap(teacherId, valDays, valStart, valEnd, valBuffer, packageId);

            if (hasActiveBookings)
            {
                package.Name = dto.Name;
                package.Description = dto.Description;
                package.AllowedGender = dto.AllowedGender;
            }
            else
            {
                // Full Update Logic (already validated overlap above)
                if (dto.StartDate.Date < DateTime.UtcNow.Date) 
                {
                    // Allow if significant date change didn't happen (e.g. same day)
                    // Compare with existing package.StartDate (converted to User Local Time or just check equality)
                    // Package.StartDate is UTC. dto.StartDate is DateTimeOffset (with potentially different offset).
                    // Let's compare the UTC Date part.
                    if (dto.StartDate.UtcDateTime.Date != package.StartDate.Date)
                    {
                         throw new ArgumentException("تاريخ البدء لا يمكن أن يكون في الماضي.");
                    }
                }
                
                if (dto.StartDate.Date == DateTime.UtcNow.Date && startTime < DateTime.UtcNow.TimeOfDay)
                {
                     if (startTime == package.StartTime && dto.StartDate.UtcDateTime.Date == package.StartDate.Date)
                     {
                         // Allowed (No change)
                     }
                     else
                     {
                         throw new ArgumentException("وقت البدء لا يمكن أن يكون في الماضي بالنسبة لتاريخ اليوم.");
                     }
                }

                // VALIDATION: Ensure enough available days for the sessions per week (One Session Per Day Rule)
                if (dto.AvailableDays == null || dto.AvailableDays.Count < dto.SessionsPerWeek)
                {
                    throw new ArgumentException($"غير مسموح. يجب اختيار {dto.SessionsPerWeek} أيام على الأقل لهذه الباقة لتغطية الجلسات الأسبوعية.");
                }

                // VALIDATION: StartDate must be the first available day of the week (Saturday-first cycle)
                var normalizedStartDay = ((int)dto.StartDate.DayOfWeek + 1) % 7;
                var minAvailableDay = dto.AvailableDays.Min(d => (d + 1) % 7);

                if (normalizedStartDay != minAvailableDay)
                {
                    var firstDayName = minAvailableDay switch {
                        0 => "السبت", 1 => "الأحد", 2 => "الاثنين", 3 => "الثلاثاء", 
                        4 => "الأربعاء", 5 => "الخميس", 6 => "الجمعة", _ => ""
                    };
                    throw new ArgumentException($"تاريخ بدء الباقة غير صحيح. يجب أن تبدأ الباقة في أول يوم متاح لها في الأسبوع ({firstDayName}).");
                }

                if (!string.IsNullOrEmpty(dto.TimezoneId))
                {
                    try { TimeZoneInfo.FindSystemTimeZoneById(dto.TimezoneId); }
                    catch { throw new ArgumentException($"Invalid timezone identifier '{dto.TimezoneId}'. Expected IANA timezone (e.g., Africa/Cairo)."); }
                }

                package.Name = dto.Name;
                package.Description = dto.Description;
                package.AllowedGender = dto.AllowedGender;
                package.SessionsCount = CalculateSessionsCount(dto.PeriodType, dto.SessionsPerWeek);
                package.DurationMinutes = dto.DurationMinutes;
                package.Price = dto.Price;
                package.AvailableDays = dto.AvailableDays;
                package.StartTime = startTime;
                package.EndTime = endTime;
                package.MaxStudents = dto.MaxStudents;
                package.PeriodType = dto.PeriodType;
                package.SessionsPerWeek = dto.SessionsPerWeek;
                package.SessionBufferMinutes = dto.SessionBufferMinutes;
                package.StartDate = dto.StartDate.ToUniversalTime();
                package.EndDate = CalculateEndDate(dto.StartDate.ToUniversalTime(), dto.PeriodType, dto.AvailableDays, endTime, package.TimezoneId);
                package.TimezoneId = dto.TimezoneId ?? package.TimezoneId;
            }

            try 
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update package {PackageId}", packageId);
                throw new Exception("An error occurred while updating the package. Please try again.");
            }
            
            await UpdateTeacherPriceStart(package.TeacherProfileId);
            return MapToDto(package);
        }

        public async Task DeletePackageAsync(int packageId, string requestedByUserId, bool isAdmin = false, bool applyPenalty = true)
        {
            var package = await _context.Packages
                .Include(p => p.TeacherProfile)
                .Include(p => p.TeacherProfile!.User) // Needed for email/notification if we implemented it
                .FirstOrDefaultAsync(p => p.Id == packageId);

            if (package == null) throw new ArgumentException("Package not found");
            
            // Allow if Admin OR if the requester is the owner
            if (!isAdmin && package.TeacherProfile?.UserId != requestedByUserId) 
                throw new UnauthorizedAccessException();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Get Active Bookings
                // 1. Get Active and Pending Bookings
                var relevantBookings = await _context.Bookings
                    .Include(b => b.Sessions)
                    .Include(b => b.Student)
                    .Where(b => b.PackageId == packageId && (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Pending))
                    .ToListAsync();
                
                var activeBookings = relevantBookings.Where(b => b.Status == BookingStatus.Confirmed).ToList();
                var pendingBookings = relevantBookings.Where(b => b.Status == BookingStatus.Pending).ToList();
            
                // Capture this BEFORE cancelling bookings, so we don't lose the state
                bool hasActiveBookings = activeBookings.Any();

                foreach (var booking in relevantBookings)
                {
                    // 2. Calculate Refund
                    var totalSessions = package.SessionsCount;
                    // 2. Verified Refund Calculation
            // We must only refund sessions that are actually scheduled and future-bound.
            // This avoids refunding "Late Join" sessions which were already refunded or never paid for.
            var remainingScheduledSessions = booking.Sessions.Count(s => s.Status == SessionStatus.Scheduled);
            
            // Safety check: ensure we don't refund more than the booking price
            var maxRefundableAmount = booking.TotalPrice; 

            if (booking.Status == BookingStatus.Confirmed && remainingScheduledSessions > 0 && maxRefundableAmount > 0)
            {
                // Calculate price per session based on current booking total
                // Note: booking.TotalPrice might already be reduced if late join logic was different, 
                // but usually TotalPrice is the *paid* amount. 
                // However, with late join, the student pays full price then gets immediate refund.
                // So TotalPrice in DB might be the full amount. 
                // The most accurate way is (TotalPrice / TotalSessions) * RemainingScheduled
                var pricePerSession = booking.TotalPrice / totalSessions;
                var refundAmount = pricePerSession * remainingScheduledSessions;
                
                refundAmount = Math.Round(refundAmount, 2);

                // 3. Process Refund
                await _walletService.ProcessTransactionAsync(
                    booking.StudentId,
                    refundAmount,
                    TransactionType.Refund,
                    $"استرداد تلقائي بسبب حذف الباقة: {package.Name}",
                    referenceId: booking.Id.ToString(),
                    provider: "System",
                    providerTransactionId: $"REFUND-{booking.Id}-{DateTime.UtcNow.Ticks}"
                );
            }
                    else if (booking.Status == BookingStatus.Pending && booking.TotalPrice > 0)
                    {
                        // Full Refund for Pending Bookings
                         await _walletService.ProcessTransactionAsync(
                            booking.StudentId,
                            booking.TotalPrice,
                            TransactionType.Refund,
                            $"استرداد كامل لحجز معلق بسبب حذف الباقة: {package.Name}",
                            referenceId: booking.Id.ToString(),
                            provider: "System",
                            providerTransactionId: $"REFUND-PENDING-{booking.Id}-{DateTime.UtcNow.Ticks}"
                        );
                    }

                    // 4. Cancel Booking
                    booking.Status = BookingStatus.Cancelled;
                    booking.CancelledAt = DateTime.UtcNow;
                    booking.CancellationReason = "تم حذف الباقة من قبل المعلم/المشرف (تعويض تلقائي)";
                    
                    // Cancel pending sessions
                    foreach (var session in booking.Sessions.Where(s => s.Status == SessionStatus.Scheduled))
                    {
                        session.Status = SessionStatus.Cancelled;
                    }
                }

                // 5. Penalize Teacher (If applicable)
                if (applyPenalty && hasActiveBookings)
                {
                    decimal penaltyAmount = 50m; // Default hardcoded fallback
                    
                    // Check Teacher Specific Penalty
                    if (package.TeacherProfile != null && package.TeacherProfile.PackageDeletionPenalty.HasValue)
                    {
                        penaltyAmount = package.TeacherProfile.PackageDeletionPenalty.Value;
                    }
                    else
                    {
                        // Check Global Setting
                        var penaltySetting = await _context.PlatformSettings.FindAsync("PackageDeletionPenalty");
                        if (penaltySetting != null && decimal.TryParse(penaltySetting.Value, out var globalPenalty))
                        {
                            penaltyAmount = globalPenalty;
                        }
                    }

                    // Fallback if configured to 0 but we want a default minimum?
                    // No, if admin set it to 0, it should be 0.
                    // But if it's missing (null), default is 50.

                    if (penaltyAmount > 0)
                    {
                        // FIX: Use package.TeacherProfile.UserId explicitly
                        await _walletService.ProcessTransactionAsync(
                            package.TeacherProfile!.UserId,
                            -penaltyAmount, // Negative for penalty
                            TransactionType.Payment, // Penalty is a payment/deduction
                            $"غرامة حذف باقة نشطة: {package.Name}",
                            referenceId: package.Id.ToString(),
                            provider: "System",
                            providerTransactionId: $"PENALTY-{package.Id}-{DateTime.UtcNow.Ticks}"
                        );
                    }
                }

                // 6. Archive Package
                package.Status = BdaeyEducat.API.Data.Enums.PackageStatus.Archived;
                package.ArchivedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await UpdateTeacherPriceStart(package.TeacherProfileId);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        public async Task<PackageDto> RestorePackageAsync(int packageId, string requestedByUserId, DateTimeOffset? newStartDate = null, bool isAdmin = false)
        {
            var package = await _context.Packages
                .Include(p => p.TeacherProfile)
                .FirstOrDefaultAsync(p => p.Id == packageId);

            if (package == null) throw new ArgumentException("Package not found");
            if (!isAdmin && package.TeacherProfile?.UserId != requestedByUserId) throw new UnauthorizedAccessException();
            if (package.Status != BdaeyEducat.API.Data.Enums.PackageStatus.Archived && package.Status != BdaeyEducat.API.Data.Enums.PackageStatus.Paused)
                throw new InvalidOperationException("Package is not archived or paused.");

            // Update Start Date and recalculate End Date if provided, else check if the old one is past
            if (newStartDate.HasValue)
            {
                if (newStartDate.Value.Date < DateTime.UtcNow.Date)
                    throw new ArgumentException("تاريخ البدء لا يمكن أن يكون في الماضي.");

                package.StartDate = newStartDate.Value.ToUniversalTime();
            }
            else if (package.StartDate.Date < DateTime.UtcNow.Date)
            {
                    throw new ArgumentException("تاريخ بدء الباقة انتهى، يرجى تحديد تاريخ جديد للاستعادة.");
            }

            // VALIDATION: StartDate must be the first available day of the week (Saturday-first cycle)
            var normalizedStartDay = ((int)package.StartDate.DayOfWeek + 1) % 7;
            var minAvailableDay = package.AvailableDays.Min(d => (d + 1) % 7);

            if (normalizedStartDay != minAvailableDay)
            {
                var firstDayName = minAvailableDay switch {
                    0 => "السبت", 1 => "الأحد", 2 => "الاثنين", 3 => "الثلاثاء", 
                    4 => "الأربعاء", 5 => "الخميس", 6 => "الجمعة", _ => ""
                };
                throw new ArgumentException($"تاريخ بدء الباقة غير صحيح. يجب أن تبدأ الباقة في أول يوم متاح لها في الأسبوع ({firstDayName}).");
            }

            await ValidateOverlap(package.TeacherProfileId, package.AvailableDays, package.StartTime, package.EndTime, package.SessionBufferMinutes, package.Id);

            package.EndDate = CalculateEndDate(package.StartDate, package.PeriodType, package.AvailableDays, package.EndTime, package.TimezoneId);

            // Restore
            package.Status = BdaeyEducat.API.Data.Enums.PackageStatus.Active;
            package.ArchivedAt = null;
            package.PausedAt = null;

            await _context.SaveChangesAsync();
            await UpdateTeacherPriceStart(package.TeacherProfileId);

            return MapToDto(package);
        }

        // Helpers
        private async Task UpdateTeacherPriceStart(int teacherId)
        {
            var packages = await _context.Packages
                .Where(p => p.TeacherProfileId == teacherId && p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active)
                .ToListAsync();

            var teacherProfile = await _context.TeacherProfiles.FindAsync(teacherId);
            if (teacherProfile != null)
            {
                if (packages.Any())
                {
                    // Calculate minimum price per session across all active packages
                    // Price / SessionsCount
                    // Avoid division by zero
                    var minPricePerSession = packages
                        .Select(p => p.SessionsCount > 0 ? (p.Price / p.SessionsCount) : p.Price)
                        .Min();
                    
                    teacherProfile.PriceStart = minPricePerSession;
                }
                else
                {
                    teacherProfile.PriceStart = 100; // Default as requested
                }
                
                // We are already in a scoped context, so SaveChangesAsync in the calling method will persist this? 
                // Or we should save here? The calling methods call SaveChangesAsync at the end. 
                // However, they call it BEFORE this might be called if we put it after. 
                // Let's call it explicitly here to be safe and ensure it persists, or handle it in the flow.
                // Since this helper is called AFTER package changes, we might want to save here.
                // Actually, let's just make sure it's tracked and saving happens.
                // But wait, the calling methods `CreatePackageAsync` calls `SaveChanges` *before* returning.
                await _context.SaveChangesAsync();
            }
        }

        private async Task ValidateOverlap(int teacherId, List<int> days, TimeSpan start, TimeSpan end, int bufferMinutes, int? excludePackageId = null)
        {
            var query = _context.Packages.Where(p => p.TeacherProfileId == teacherId && p.Status != BdaeyEducat.API.Data.Enums.PackageStatus.Archived);
            if (excludePackageId.HasValue) query = query.Where(p => p.Id != excludePackageId.Value);

            var existingPackages = await query.ToListAsync();
            _logger.LogInformation("[DEBUG] Validating overlap for Teacher {teacherId}. New: {start}-{end} (Buffer {bufferMinutes}), Days: {daysStr}. Exclude: {excludePackageId}", 
                teacherId, start, end, bufferMinutes, (days != null ? string.Join(",", days) : "NULL"), excludePackageId);

            foreach (var existingPkg in existingPackages)
            {
                var commonDays = (existingPkg.AvailableDays != null && days != null) ? existingPkg.AvailableDays.Intersect(days).ToList() : new List<int>();
                
                _logger.LogInformation("[DEBUG] Checking against Pkg {pkgId} ({pkgName}): {start}-{end} (Buffer {buffer}), Days: {daysStr}", 
                    existingPkg.Id, existingPkg.Name, existingPkg.StartTime, existingPkg.EndTime, existingPkg.SessionBufferMinutes, (existingPkg.AvailableDays != null ? string.Join(",", existingPkg.AvailableDays) : "NULL"));

                if (commonDays.Any())
                {
                    // Normalize existing reserved window with midnight wraparound support
                    var eStart = existingPkg.StartTime;
                    var eEnd = existingPkg.EndTime.Add(TimeSpan.FromMinutes(existingPkg.SessionBufferMinutes));
                    // If end <= start, it means it crosses midnight (or ends at 00:00 which is interpreted as start of next day)
                    if (eEnd <= eStart) eEnd = eEnd.Add(TimeSpan.FromDays(1)); 

                    // Normalize new reserved window with midnight wraparound support
                    var nStart = start;
                    var nEnd = end.Add(TimeSpan.FromMinutes(bufferMinutes));
                    if (nEnd <= nStart) nEnd = nEnd.Add(TimeSpan.FromDays(1));

                    // Overlap formula: max(start1, start2) < min(end1, end2)
                    var intersectStart = nStart > eStart ? nStart : eStart;
                    var intersectEnd = nEnd < eEnd ? nEnd : eEnd;

                    _logger.LogInformation("[DEBUG] Comparison: Exist[{eStart}-{eEnd}], New[{nStart}-{nEnd}] -> Intersect[{intersectStart}-{intersectEnd}]", eStart, eEnd, nStart, nEnd, intersectStart, intersectEnd);

                    if (intersectStart < intersectEnd)
                    {
                        var startStr = existingPkg.StartTime.ToString(@"hh\:mm");
                        var endStr = eEnd.TotalHours >= 24 
                            ? $"{(int)eEnd.TotalHours:D2}:{eEnd.Minutes:D2}" 
                            : eEnd.ToString(@"hh\:mm");

                        _logger.LogWarning("[DEBUG] CONFLICT DETECTED with Pkg {pkgId}", existingPkg.Id);
                        throw new InvalidOperationException($"تعارض في الوقت مع الباقة الموجودة مسبقاً: '{existingPkg.Name}' ({startStr} حتى {endStr} شاملاً الفاصل).");
                    }
                }
            }
        }

        private int CalculateSessionsCount(string type, int perWeek)
        {
            return type switch
            {
                "Weekly" => perWeek,
                "Monthly" => perWeek * 4,
                "Yearly" => perWeek * 48,
                _ => perWeek * 4
            };
        }

        private DateTimeOffset CalculateEndDate(DateTimeOffset startDate, string periodType, List<int> availableDays, TimeSpan endTime, string timezoneId)
        {
            if (availableDays == null || !availableDays.Any())
                return startDate.AddYears(1); // Fallback

            var tz = TimeZoneInfo.FindSystemTimeZoneById(timezoneId);
            var localStart = TimeZoneInfo.ConvertTime(startDate, tz).Date;

            // Determine rough end date based on PeriodType
            DateTime localTargetDate = periodType switch
            {
                "Weekly" => localStart.AddDays(7),
                "Monthly" => localStart.AddMonths(1),
                "Yearly" => localStart.AddYears(1),
                _ => localStart.AddMonths(1)
            };

            // Go backwards from localTargetDate to find the last occurrence of one of the availableDays
            DateTime lastAvailableDate = localTargetDate;
            for (int i = 0; i <= 7; i++)
            {
                if (availableDays.Contains((int)lastAvailableDate.DayOfWeek))
                {
                    break;
                }
                lastAvailableDate = lastAvailableDate.AddDays(-1);
            }

            // Combine the found date with the package's end time
            var localEndDate = new DateTime(lastAvailableDate.Year, lastAvailableDate.Month, lastAvailableDate.Day, endTime.Hours, endTime.Minutes, 0);
            
            // Convert back to UTC
            return new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(localEndDate, tz));
        }

        private PackageDto MapToDto(Package p)
        {
            return new PackageDto
            {
                Id = p.Id,
                TeacherProfileId = p.TeacherProfileId,
                Name = p.Name,
                Description = p.Description,
                SessionsCount = p.SessionsCount,
                DurationMinutes = p.DurationMinutes,
                Price = p.Price,
                Currency = p.Currency,
                IsActive = p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active,
                Status = p.Status.ToString(),
                AvailableDays = p.AvailableDays,
                StartTime = p.StartTime.ToString(@"hh\:mm"),
                EndTime = p.EndTime.ToString(@"hh\:mm"),
                MaxStudents = p.MaxStudents,
                PeriodType = p.PeriodType,
                SessionsPerWeek = p.SessionsPerWeek,
                SessionBufferMinutes = p.SessionBufferMinutes,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                TimezoneId = p.TimezoneId
            };
        }
        public async Task<PagedResult<AdminPackageDto>> GetAdminPackagesAsync(AdminPackageFilterDto filter)
        {
            var query = _context.Packages
                .Include(p => p.TeacherProfile)
                .ThenInclude(t => t!.User)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrEmpty(filter.Search))
            {
                var lowerSearch = filter.Search.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(lowerSearch) || 
                                         (p.TeacherProfile != null && p.TeacherProfile.User != null && 
                                          p.TeacherProfile.User.FullName.ToLower().Contains(lowerSearch)));
            }

            if (filter.Status.HasValue)
                query = query.Where(p => p.Status == filter.Status.Value);

            if (filter.TeacherId.HasValue)
                query = query.Where(p => p.TeacherProfileId == filter.TeacherId.Value);
                
            if (filter.MinPrice.HasValue)
                query = query.Where(p => p.Price >= filter.MinPrice.Value);
                
            if (filter.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= filter.MaxPrice.Value);

            if (filter.HasBookings.HasValue)
            {
                if (filter.HasBookings.Value)
                    query = query.Where(p => _context.Bookings.Any(b => b.PackageId == p.Id));
                else
                    query = query.Where(p => !_context.Bookings.Any(b => b.PackageId == p.Id));
            }

            var totalCount = await query.CountAsync();

            var packageIds = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(p => p.Id)
                .ToListAsync();

            var bookingCounts = await _context.Bookings
                .Where(b => b.PackageId != null && packageIds.Contains(b.PackageId.GetValueOrDefault()))
                .GroupBy(b => b.PackageId!.Value)
                .Select(g => new { PackageId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.PackageId, g => g.Count);

            var items = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(p => new AdminPackageDto
                {
                    Id = p.Id,
                    TeacherProfileId = p.TeacherProfileId,
                    Name = p.Name,
                    Description = p.Description,
                    SessionsCount = p.SessionsCount,
                    DurationMinutes = p.DurationMinutes,
                    Price = p.Price,
                    Currency = p.Currency,
                    Status = p.Status.ToString(),
                    AvailableDays = p.AvailableDays,
                    StartTime = p.StartTime.ToString(@"hh\:mm"),
                    EndTime = p.EndTime.ToString(@"hh\:mm"),
                    MaxStudents = p.MaxStudents,
                    PeriodType = p.PeriodType,
                    SessionsPerWeek = p.SessionsPerWeek,
                    SessionBufferMinutes = p.SessionBufferMinutes,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    TimezoneId = p.TimezoneId,
                    TeacherName = p.TeacherProfile!.User!.FullName ?? string.Empty,
                    TeacherEmail = p.TeacherProfile!.User!.Email ?? string.Empty,
                    TotalBookingsCount = bookingCounts.GetValueOrDefault(p.Id, 0),
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return new PagedResult<AdminPackageDto>
            {
                Items = items,
                TotalCount = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        public async Task<AdminPackageDetailDto> GetAdminPackageDetailAsync(int id)
        {
            var p = await _context.Packages
                .Include(p => p.TeacherProfile)
                .ThenInclude(t => t!.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(pk => pk.Id == id);

            if (p == null) throw new ArgumentException("Package not found");

            var bookingStats = await _context.Bookings
                .Where(b => b.PackageId == id)
                .GroupBy(b => 1)
                .Select(g => new
                {
                    Total = g.Count(),
                    Pending = g.Count(b => b.Status == BookingStatus.Pending),
                    Completed = g.Count(b => b.Status == BookingStatus.Completed),
                    Cancelled = g.Count(b => b.Status == BookingStatus.Cancelled),
                    LastDate = g.Max(b => (DateTime?)b.CreatedAt)
                })
                .FirstOrDefaultAsync();

            var dto = new AdminPackageDetailDto
            {
                Id = p.Id,
                TeacherProfileId = p.TeacherProfileId,
                Name = p.Name,
                Description = p.Description,
                SessionsCount = p.SessionsCount,
                DurationMinutes = p.DurationMinutes,
                Price = p.Price,
                Currency = p.Currency,
                IsActive = p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active,
                Status = p.Status.ToString(),
                AvailableDays = p.AvailableDays,
                StartTime = p.StartTime.ToString(@"hh\:mm"),
                EndTime = p.EndTime.ToString(@"hh\:mm"),
                MaxStudents = p.MaxStudents,
                PeriodType = p.PeriodType,
                SessionsPerWeek = p.SessionsPerWeek,
                SessionBufferMinutes = p.SessionBufferMinutes,
                StartDate = p.StartDate,
                TimezoneId = p.TimezoneId,
                TeacherName = p.TeacherProfile?.User?.FullName ?? "N/A",
                TeacherEmail = p.TeacherProfile?.User?.Email ?? "N/A",
                CreatedAt = p.CreatedAt,
                AdminNote = p.AdminNote,
                
                TotalBookingsCount = bookingStats?.Total ?? 0,
                PendingBookingsCount = bookingStats?.Pending ?? 0,
                CompletedBookingsCount = bookingStats?.Completed ?? 0,
                CancelledBookingsCount = bookingStats?.Cancelled ?? 0,
                
                UpcomingSessionsCount = await _context.Sessions
                    .Where(s => s.Booking != null && s.Booking.PackageId == id && s.ScheduledAt > DateTime.UtcNow && s.Status != SessionStatus.Cancelled)
                    .CountAsync(),
                    
                LastBookingDate = bookingStats?.LastDate
            };
            
            dto.CanDelete = dto.TotalBookingsCount == 0;

            return dto;
        }

        public async Task UpdatePackageStatusAsync(int id, string adminUserId, UpdatePackageStatusDto dto)
        {
            var package = await _context.Packages.FindAsync(id);
            if (package == null) throw new ArgumentException("Package not found");

            var oldStatus = package.Status;
            package.Status = dto.Status;
            
            if (dto.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Archived)
            {
                package.ArchivedAt = DateTime.UtcNow;
            }
            if (dto.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Paused)
            {
                package.PausedAt = DateTime.UtcNow;
            }

            if (!string.IsNullOrEmpty(dto.Reason))
            {
                var entry = $"[{DateTime.UtcNow}] Status changed from {oldStatus} to {dto.Status} by Admin ({adminUserId}). Reason: {dto.Reason}";
                package.AdminNote = string.IsNullOrEmpty(package.AdminNote) ? entry : package.AdminNote + "\n" + entry;
            }
            
            await _context.SaveChangesAsync();
        }
        public async Task HardDeletePackageAsync(int id)
        {
            var package = await _context.Packages.FindAsync(id);
            if (package == null) throw new ArgumentException("Package not found");

            var hasBookings = await _context.Bookings.AnyAsync(b => b.PackageId == id);
            if (hasBookings) throw new InvalidOperationException("Cannot hard delete package with existing bookings. Use Archive.");

            _context.Packages.Remove(package);
            await _context.SaveChangesAsync();
        }
    }
}
