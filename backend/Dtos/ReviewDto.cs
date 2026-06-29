using System;
using System.ComponentModel.DataAnnotations;

namespace BdaeyEducat.API.Dtos
{
    public class CreateReviewDto
    {
        [Required]
        public int TeacherProfileId { get; set; }

        public int? BookingId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(500)]
        public string? Comment { get; set; }
    }

    public class ReviewDto
    {
        public int Id { get; set; }
        public int TeacherProfileId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
