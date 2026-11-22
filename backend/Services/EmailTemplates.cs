using System;

namespace BdaeyEducat.API.Services
{
    public static class EmailTemplates
    {
        // Brand identity, injected once at startup from configuration (Branding:NameAr/NameEn).
        public static string BrandNameAr { get; set; } = "بدائي";
        public static string BrandNameEn { get; set; } = "BDAEY";

        public static string GetVerificationEmail(string name, string verificationLink)
        {
            var year = DateTime.Now.Year;
            return $@"
<!DOCTYPE html>
<html lang=""ar"" dir=""rtl"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Activate your {BrandNameEn} account</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        
        body {{
            font-family: 'Cairo', sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 40px 0;
            direction: rtl;
            text-align: right;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background-color: #111827;
            padding: 40px 32px;
            text-align: center;
            border-bottom: 4px solid #EAB308;
        }}
        .logo {{
            color: #EAB308;
            font-size: 36px;
            font-weight: 800;
            text-decoration: none;
            letter-spacing: 1px;
        }}
        .logo span {{
            color: #10B981;
        }}
        .content {{
            padding: 48px 40px;
            color: #334155;
            line-height: 1.8;
            text-align: center;
        }}
        .heading {{
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 20px;
        }}
        .text {{
            font-size: 16px;
            color: #475569;
            margin-bottom: 28px;
        }}
        .btn-container {{
            margin: 40px 0;
        }}
        .btn {{
            display: inline-block;
            background-color: #EAB308;
            color: #111827 !important;
            font-weight: 800;
            font-size: 16px;
            padding: 16px 40px;
            border-radius: 50px;
            text-decoration: none;
            box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);
        }}
        .footer {{
            background-color: #f1f5f9;
            padding: 32px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }}
        .link {{
            color: #10B981;
            text-decoration: none;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <a href=""#"" class=""logo"">{BrandNameAr} <span>{BrandNameEn}</span></a>
        </div>
        <div class=""content"">
            <h1 class=""heading"">Welcome to {BrandNameEn}!</h1>
            <p class=""text"">
                Hello <strong>{name}</strong>,<br>
                We are glad you joined us. To activate your account and start your learning journey, click the button below to confirm your email address.
            </p>
            
            <div class=""btn-container"">
                <a href=""{verificationLink}"" class=""btn"" style=""background-color: #EAB308; color: #111827 !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 800;"">Activate My Account</a>
            </div>
            
            <p class=""text"" style=""font-size: 13px; color: #94a3b8; margin-top: 40px;"">
                If you did not create a {BrandNameEn} account, you can safely ignore this message.
            </p>
        </div>
        <div class=""footer"">
            <p>&copy; {year} {BrandNameEn}. All rights reserved.</p>
            <p>
                <a href=""https://bdaey.com/privacy"" class=""link"">Privacy Policy</a> | 
                <a href=""https://bdaey.com/contact"" class=""link"">Support</a>
            </p>
        </div>
    </div>
</body>
</html>
";
        }
        public static string GetPasswordResetEmail(string name, string resetLink)
        {
            var year = DateTime.Now.Year;
            return $@"
<!DOCTYPE html>
<html lang=""ar"" dir=""rtl"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Reset your {BrandNameEn} password</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        
        body {{
            font-family: 'Cairo', sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 40px 0;
            direction: rtl;
            text-align: right;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
        }}
        .header {{
            background-color: #111827;
            padding: 40px 32px;
            text-align: center;
            border-bottom: 4px solid #EAB308;
        }}
        .logo {{
            color: #EAB308 !important;
            font-size: 36px;
            font-weight: 800;
            text-decoration: none;
            letter-spacing: 1px;
        }}
        .logo span {{
            color: #10B981 !important;
        }}
        .content {{
            padding: 48px 40px;
            color: #334155;
            line-height: 1.8;
            text-align: center;
        }}
        .heading {{
            font-size: 26px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 20px;
        }}
        .text {{
            font-size: 16px;
            color: #475569;
            margin-bottom: 28px;
        }}
        .btn-container {{
            margin: 40px 0;
        }}
        .btn {{
            display: inline-block;
            background-color: #EAB308;
            color: #111827 !important;
            font-weight: 800;
            font-size: 16px;
            padding: 16px 40px;
            border-radius: 50px;
            text-decoration: none;
            box-shadow: 0 4px 15px rgba(234, 179, 8, 0.3);
        }}
        .footer {{
            background-color: #f1f5f9;
            padding: 32px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }}
        .link {{
            color: #10B981;
            text-decoration: none;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <a href=""#"" class=""logo"" style=""color: #EAB308 !important; text-decoration: none;"">{BrandNameAr} <span style=""color: #10B981 !important;"">{BrandNameEn}</span></a>
        </div>
        <div class=""content"">
            <h1 class=""heading"">Password Reset</h1>
            <p class=""text"">
                Hello <strong>{name}</strong>,<br>
                We received a request to reset the password for your {BrandNameEn} account. Click the button below to choose a new password.
            </p>
            
            <div class=""btn-container"">
                <a href=""{resetLink}"" class=""btn"" style=""background-color: #EAB308; color: #111827 !important; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 800;"">Choose a New Password</a>
            </div>
            
            <p class=""text"" style=""font-size: 13px; color: #94a3b8; margin-top: 40px;"">
                If you did not request a password reset, please ignore this message. No changes will be made to your account.
            </p>
        </div>
        <div class=""footer"">
            <p>&copy; {year} {BrandNameEn}. All rights reserved.</p>
            <p>
                <a href=""https://bdaey.com/privacy"" class=""link"">Privacy Policy</a> | 
                <a href=""https://bdaey.com/contact"" class=""link"">Support</a>
            </p>
        </div>
    </div>
</body>
</html>
";
        }
    }
}
