using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BdaeyEducat.API.Data.Entities
{
    public class Review
    {
        [Key]
        public int Id { get; set; }

        public string StudentId { get; set; } = string.Empty;
        
        [ForeignKey("StudentId")]
        public ApplicationUser? Student { get; set; }

        public int TeacherProfileId { get; set; }
        
        [ForeignKey("TeacherProfileId")]
        public TeacherProfile? TeacherProfile { get; set; }

        public int? BookingId { get; set; } // Optional: Link to a specific completed booking
        
        [ForeignKey("BookingId")]
        public Booking? Booking { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; } // 1 to 5 stars

        [MaxLength(500)]
        public string Comment { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
