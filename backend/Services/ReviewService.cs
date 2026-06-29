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
    public class ReviewService : IReviewService
    {
        private readonly ApplicationDbContext _context;

        public ReviewService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ReviewDto> AddReviewAsync(string studentId, CreateReviewDto dto)
        {
            var teacherExists = await _context.TeacherProfiles.AnyAsync(t => t.Id == dto.TeacherProfileId);
            if (!teacherExists) throw new ArgumentException("Teacher not found");

            // Optional: Check if student actually booked this teacher (Verified Review)
            if (dto.BookingId.HasValue)
            {
                var booking = await _context.Bookings.FindAsync(dto.BookingId.Value);
                if (booking == null || booking.StudentId != studentId || booking.TeacherProfileId != dto.TeacherProfileId)
                {
                    throw new ArgumentException("Invalid booking reference.");
                }
            }

            var review = new Review
            {
                StudentId = studentId,
                TeacherProfileId = dto.TeacherProfileId,
                BookingId = dto.BookingId,
                Rating = dto.Rating,
                Comment = dto.Comment ?? "",
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // Load student name for DTO
            var student = await _context.Users.FindAsync(studentId);

            return new ReviewDto
            {
                Id = review.Id,
                TeacherProfileId = review.TeacherProfileId,
                StudentName = student?.FullName ?? "Unknown",
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            };
        }

        public async Task<IEnumerable<ReviewDto>> GetTeacherReviewsAsync(int teacherId)
        {
            return await _context.Reviews
                .Include(r => r.Student)
                .Where(r => r.TeacherProfileId == teacherId)
                .OrderByDescending(r => r.CreatedAt)
                .AsNoTracking()
                .Select(r => new ReviewDto
                {
                    Id = r.Id,
                    TeacherProfileId = r.TeacherProfileId,
                    StudentName = r.Student != null ? r.Student.FullName : "Unknown",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }
    }
}
