using AutoMapper;
using BdaeyEducat.API.Data.Entities;
using BdaeyEducat.API.Dtos;

namespace BdaeyEducat.API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<CreateTeacherProfileDto, TeacherProfile>()
            .ForMember(dest => dest.UserId, opt => opt.Ignore())
            .ForMember(dest => dest.AverageRating, opt => opt.Ignore())
            .ForMember(dest => dest.TotalReviews, opt => opt.Ignore());

        CreateMap<UpdateTeacherProfileDto, TeacherProfile>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<UpdateTeacherProfileWithDocsDto, TeacherProfile>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        CreateMap<TeacherProfile, TeacherProfileResponseDto>()
            .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : string.Empty))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty))
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.UserName : null))
            .ForMember(dest => dest.ProfilePictureUrl, opt => opt.MapFrom(src => src.User != null ? src.User.ProfilePictureUrl : null))
            .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.AverageRating))
            .ForMember(dest => dest.ReviewCount, opt => opt.MapFrom(src => src.TotalReviews))
            .ForMember(dest => dest.NationalId, opt => opt.MapFrom(src => src.User != null ? src.User.NationalId : null))
            .ForMember(dest => dest.Gender, opt => opt.MapFrom(src => src.User != null ? src.User.Gender : string.Empty))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.User != null ? src.User.PhoneNumber : null))
            .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.User != null ? src.User.DateOfBirth : (DateTime?)null))
            .ForMember(dest => dest.MinPackagePrice, opt => opt.MapFrom(src =>
                src.Packages != null && src.Packages.Any(p => p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active)
                ? src.Packages.Where(p => p.Status == BdaeyEducat.API.Data.Enums.PackageStatus.Active).Min(p => p.Price)
                : (decimal?)null));

        CreateMap<PromoCodeCreateDto, PromoCode>();
        CreateMap<PromoCode, PromoCodeResponseDto>();
        CreateMap<PromoCodeUsage, PromoCodeUsageResponseDto>()
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User != null ? src.User.FullName : string.Empty));

        CreateMap<SessionEvaluationCreateDto, SessionEvaluation>();
        CreateMap<SessionEvaluation, SessionEvaluationResponseDto>()
            .ForMember(dest => dest.TeacherName, opt => opt.MapFrom(src => src.TeacherProfile != null && src.TeacherProfile.User != null ? src.TeacherProfile.User.FullName : string.Empty))
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student != null ? src.Student.FullName : string.Empty));
    }
}
