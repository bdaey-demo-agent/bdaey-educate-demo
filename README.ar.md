# منصة بدائي (Bdaey) - توثيق تقني

## نظرة عامة

منصة تعليمية متكاملة لتحفيظ القرآن الكريم عن بُعد. تربط بين الطلاب والمعلمين في جلسات مباشرة (One-on-One) مع نظام دفع وإدارة متكامل.

## التقنيات المستخدمة

### Backend (API)
- **.NET 10** ASP.NET Core Web API (C#)
- **Entity Framework Core 10** مع PostgreSQL (Npgsql)
- **ASP.NET Identity** للمصادقة والأدوار
- **JWT Bearer Authentication** مع SignalR Authentication
- **AutoMapper 12** لتعيين DTOs
- **Swashbuckle / Swagger** لتوثيق API
- **AWSSDK.S3** لتخزين الملفات على AWS S3
- **Google.Apis.Auth** لتسجيل الدخول بحساب Google
- **SignalR + StackExchangeRedis** للاتصالات اللحظية والإشعارات
- **StackExchangeRedis** لذاكرة التخزين المؤقت الموزعة
- **Rate Limiting** مدمج (ASP.NET Core)
- **IMemoryCache** للتخزين المؤقت المحلي (BlockedUser, Tenant, Password Reset)

### Frontend (SPA)
- **React 18** مع TypeScript
- **Vite 7** أداة بناء
- **React Router DOM 7** للتوجيه
- **Axios** للطلبات HTTP
- **@microsoft/signalr** للاتصالات اللحظية
- **@daily-co/daily-js + @daily-co/daily-react** للفيديو المباشر
- **@react-oauth/google** لتسجيل الدخول بحساب Google
- **Tailwind CSS 3** للتصميم
- **Framer Motion** للحركات والانتقالات
- **React Hot Toast** للإشعارات
- **@heroicons/react + @fortawesome/fontawesome-free** للأيقونات
- **Headless UI** لمكونات واجهة المستخدم

### البنية التحتية
- **Fly.io** (IaaS) لاستضافة Backend
- **Neon.tech** (PostgreSQL) قاعدة البيانات
- **AWS S3** لتخزين الملفات والصور
- **Redis** (Upstash / Redis Cloud) لذاكرة التخزين المؤقت و SignalR Backplane
- **Vercel / Netlify** لاستضافة Frontend
- **Daily.co** لتقديم خدمة الفيديو

---

## هيكل المشروع

```
/
├── backend/                         # API (ASP.NET Core 10)
│   ├── Controllers/                 # 28 Controller (API Endpoints)
│   │   ├── AuthController.cs        # تسجيل، دخول، Google، تغيير كلمة المرور
│   │   ├── BookingsController.cs    # حجز الجلسات والمواعيد
│   │   ├── SessionsController.cs    # إدارة الجلسات الفردية
│   │   ├── TeachersController.cs    # ملفات المعلمين والبحث
│   │   ├── PaymentsController.cs    # استقبال رد Kashier
│   │   ├── WalletController.cs      # المحفظة، الإيداع، الكوبونات
│   │   ├── WithdrawalsController.cs # طلبات سحب المعلمين
│   │   ├── ChatController.cs        # المحادثات
│   │   ├── ReviewsController.cs     # التقييمات والمراجعات
│   │   ├── NotificationsController.cs# الإشعارات
│   │   ├── FilesController.cs       # رفع الصور والملفات
│   │   ├── VideoController.cs       # غرف الفيديو
│   │   ├── GamificationController.cs# النقاط والشارات
│   │   ├── ContactController.cs     # التواصل مع الدعم
│   │   ├── QuranController.cs       # API للقرآن (مخفي من Swagger)
│   │   ├── Admin*.cs                # 7 Admin Controllers
│   │   └── ...                      # باقي الـ Controllers
│   ├── Data/
│   │   ├── ApplicationDbContext.cs  # DbContext مع Fluent API
│   │   ├── Entities/                # 21 Entity class
│   │   └── DesignTimeDbContextFactory.cs
│   ├── Migrations/                  # 6 EF Core Migrations
│   ├── Dtos/                        # 25 DTO class
│   ├── Services/                    # 20 Service class
│   │   ├── Video/                   # Daily.co integration
│   │   ├── JwtTokenService.cs       # توليد JWT (Shared Service)
│   │   ├── KashierPaymentService.cs # بوابة الدفع Kashier
│   │   ├── WalletService.cs         # منطق المحفظة المالية
│   │   ├── PayoutService.cs         # صرف مستحقات المعلمين
│   │   └── ...
│   ├── Middleware/                   # Middleware مخصص
│   │   ├── TenantMigrationMiddleware.cs  # Multi-tenancy
│   │   └── BlockedUserMiddleware.cs      # منع المستخدمين المحظورين
│   ├── Settings/                    # POCO for Config Sections
│   ├── Hubs/                        # SignalR Hub للإشعارات
│   ├── Mappings/                    # AutoMapper Profiles
│   └── Seeders/                     # DataSeeder للتطوير
│
├── quran-front/                     # Frontend (React 18)
│   ├── src/
│   │   ├── pages/                   # 40+ صفحة
│   │   │   ├── public/              # الصفحات العامة (Landing, About, Contact...)
│   │   │   ├── student/             # صفحات الطالب (Dashboard, Schedule, Progress...)
│   │   │   ├── teacher/             # صفحات المعلم (Dashboard, Packages, Students...)
│   │   │   ├── admin/               # 16 صفحة إدارة
│   │   │   ├── common/              # صفحات مشتركة (Profile, Wallet, Chat...)
│   │   │   └── Sessions/            # Classroom و SessionsList
│   │   ├── components/              # 30+ مكون
│   │   ├── services/                # 15 Service file (Axios)
│   │   ├── context/                 # AuthContext, ThemeContext
│   │   ├── types/                   # TypeScript interfaces
│   │   ├── utils/                   # دوال مساعدة
│   │   └── layouts/                 # AdminLayout, PublicLayout
│   ├── .env                         # VITE_API_BASE_URL=http://localhost:5000/api
│   └── .env.production              # VITE_API_BASE_URL=https://bdaey-lms-api.fly.dev/api
│
└── .gitignore
```

---

## التشغيل محليًا

### المتطلبات
- .NET 10 SDK
- Node.js 20+
- PostgreSQL (أو اتصال بـ Neon.tech)
- Redis (اختياري، للتطوير المحلي)

### Backend

```bash
cd backend

# استعادة الحزم
dotnet restore

# تعيين الأسرار (مرة واحدة)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=...;Database=...;Username=...;Password=..."
dotnet user-secrets set "Jwt:Key" "..."
dotnet user-secrets set "Kashier:MerchantId" "..."
dotnet user-secrets set "Kashier:ApiKey" "..."
dotnet user-secrets set "Kashier:SecretKey" "..."
dotnet user-secrets set "AWS:AccessKey" "..."
dotnet user-secrets set "AWS:SecretKey" "..."
dotnet user-secrets set "Daily:ApiKey" "..."
dotnet user-secrets set "SmtpSettings:Email" "..."
dotnet user-secrets set "SmtpSettings:Password" "..."
dotnet user-secrets set "Admin:Email" "admin@bdaey.com"
dotnet user-secrets set "Admin:Password" "..."
dotnet user-secrets set "Google:ClientId" "..."
dotnet user-secrets set "Google:ClientSecret" "..."

# تطبيق الترحيلات
dotnet ef database update

# التشغيل
dotnet run
# يستمع على https://localhost:5001 و http://localhost:5000
```

### Frontend

```bash
cd quran-front

npm install
npm run dev
# يستمع على http://localhost:5173
```

---

## القواعد بيانات

### PostgreSQL (Neon.tech)
- **Schema**: `quran`
- **Entity Framework**: Code First مع Migrations
- **Multi-tenancy**: يدعم 3 أنواع:
  1. **Central DB** → يحدد الـ subdomain ويجلب ConnectionString الخاص بالمستأجر
  2. **Default DB** → يتحقق من `DefaultConnection`
  3. **Auto-provisioning** → ينشئ قاعدة بيانات جديدة إذا لم توجد

### Redis (Upstash / Redis Cloud)
استخدامات Redis:
1. **SignalR Backplane** → توزيع الإشعارات عبر multiple instances
2. **Distributed Cache** → التخزين المؤقت (IDistributedCache)
3. **IMemoryCache** محلي لـ:
   - BlockedUserMiddleware (30s TTL)
   - TenantMiddleware (5 min TTL)
   - Password Reset (5 min TTL)

---

## نقاط الضعف والتحسينات السابقة

### ثغرات أمنية تم إصلاحها (CRITICAL)
| المشكلة | الحل |
|---------|------|
| DataSeeder ينشئ Admin بكلمة مرور ثابتة | Admin password من Config، وتشغيل فقط في Development |
| PaymentsController يتابع التنفيذ حتى لو فشل التحقق من التوقيع | إيقاف فورًا عند فشل التوقيع |
| Open Redirect مفتوح | التحقق من `returnTo` مع `AllowedOrigins` |
| Stack Trace يظهر في رسائل الخطأ | إخفاء التفاصيل الداخلية |
| ChatCleanupService يحذف سطرًا سطرًا (N+1) | حذف مجمع في جملة SQL واحدة |
| PackageArchiverService يحذف الباقات نهائيًا | التحقق من الحجوزات النشطة أولاً، و soft delete |

### تحسينات (HIGH)
- **IDOR**: منع الوصول غير المصرح به إلى بيانات المستخدمين الآخرين
- **ModelState**: التحقق من صحة الإدخال في جميع الـ Controllers
- **N+1 Queries**: استخدام `.Include()` و `.ThenInclude()` و Aggregation
- **Pagination**: إضافة pagination إلى الـ Queries الكبيرة
- **Rate Limiting**: إضافة حدود للطلبات (Auth, Uploads, Contact, Deposits)
- **JWT Token**: استخراج منطق إنشاء JWT إلى Shared Service (`IJwtTokenService`)
- **Magic Byte Validation**: التحقق من صحة الملفات المرفوعة (PDF, PNG, JPG)
- **Secrets Management**: نقل جميع الأسرار من `appsettings.json` إلى `dotnet user-secrets`
- **Google OAuth Credentials**: حذف ملف `client_secret_*.json` المسرب
- **Dockerfile**: إضافة `USER app` و `HEALTHCHECK`
- **`.gitignore`**: إضافة `client_secret_*.json`

---

## API Endpoints الرئيسية

### المصادقة (`/api/auth`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/register` | تسجيل مستخدم جديد (Student/Teacher) |
| POST | `/login` | تسجيل الدخول بالبريد الإلكتروني وكلمة المرور |
| POST | `/google` | تسجيل الدخول بحساب Google |
| GET | `/confirm-email` | تأكيد البريد الإلكتروني |
| POST | `/forgot-password` | طلب إعادة تعيين كلمة المرور |
| POST | `/reset-password` | إعادة تعيين كلمة المرور |
| POST | `/change-password` | تغيير كلمة المرور (مصادق عليه) |
| POST | `/resend-verification` | إعادة إرسال رابط التفعيل |
| PUT | `/profile` | تحديث الملف الشخصي |

### الحجوزات (`/api/bookings`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/my-bookings` | حجوزات المستخدم الحالي |
| POST | `/` | إنشاء حجز جديد (Student) |
| PUT | `/{id}/status` | تحديث حالة الحجز |

### المعلمون (`/api/teachers`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/` | البحث عن المعلمين (مقسم لصفحات) |
| GET | `/{id}` | تفاصيل معلم |
| GET | `/admin/pending` | طلبات معلمين معلقة (Admin) |
| PUT | `/{id}/approve` | الموافقة على معلم (Admin) |

### المحفظة (`/api/wallet`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/` | رصيد المحفظة |
| POST | `/deposit` | إيداع (Kashier) |
| POST | `/redeem-promo` | استرداد كوبون |

### السحب (`/api/withdrawals`)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/request` | طلب سحب (Teacher) |
| GET | `/history` | تاريخ السحوبات |
| GET | `/methods` | طرق السحب المحفوظة |

### لوحة الإدارة (`/api/admin/...`)
- `/admin/overview/stats` - إحصائيات عامة
- `/admin/users` - إدارة المستخدمين
- `/admin/wallet/withdrawals` - إدارة طلبات السحب
- `/admin/bookings` - إدارة الحجوزات
- `/admin/packages` - إدارة الباقات
- `/admin/promocodes` - إدارة أكواد الخصم

---

## الترحيلات (Migrations)

يوجد حاليًا **6 ترحيلات** في مجلد `Migrations/`:
1. `InitialProductionLaunch` - الترحيل الأولي
2. `AddIsDataSubmittedToTeacherProfile` - إضافة حقل IsDataSubmitted
3. `AddEmailConfirmationSentAt` - إضافة حقل تأكيد البريد
4. `AddScheduledCommissionToTeacherProfile` - إضافة العمولة المجدولة
5. `InitialSync` - مزامنة أولية
6. `AddMissingIndexes` - إضافة الفهارس المحسنة (SessionId, ChatMessages, Notifications, AuditLogs, ContactMessages, Reviews, PromoCodeUsages, StudentBadges)

لإضافة ترحيل جديد:
```bash
dotnet ef migrations add <Name> --output-dir Migrations
dotnet ef database update
```

---

## النشر (Deployment)

### Fly.io
```bash
cd backend
fly deploy
```

### Vercel (Frontend)
```bash
cd quran-front
vercel --prod
```

### متغيرات البيئة المطلوبة (Fly.io secrets)
```bash
fly secrets set \
  ConnectionStrings__DefaultConnection="..." \
  Jwt__Key="..." \
  Jwt__Issuer="https://api.bdaey.com" \
  Jwt__Audience="https://bdaey.com" \
  Jwt__ExpireDays="30" \
  Kashier__MerchantId="..." \
  Kashier__ApiKey="..." \
  Kashier__SecretKey="..." \
  AWS__AccessKey="..." \
  AWS__SecretKey="..." \
  AWS__Region="eu-central-1" \
  AWS__BucketName="..." \
  Daily__ApiKey="..." \
  Daily__Domain="..." \
  DAILY_API_KEY="..." \
  SmtpSettings__Host="smtp.gmail.com" \
  SmtpSettings__Port="587" \
  SmtpSettings__Email="..." \
  SmtpSettings__Password="..." \
  Google__ClientId="..." \
  Google__ClientSecret="..." \
  Redis__Configuration="..." \
  Admin__Email="admin@bdaey.com" \
  Admin__Password="..."
```

---

## الملفات المهمة

| الملف | الوصف |
|-------|-------|
| `backend/appsettings.json` | الإعدادات العامة (placeholders للأسرار) |
| `backend/Program.cs` | نقطة الدخول، التسجيل، الـ Middleware |
| `backend/Data/ApplicationDbContext.cs` | تعريف الجداول والعلاقات |
| `backend/Dockerfile` | بناء صورة Docker |
| `backend/fly.toml` | إعدادات Fly.io |
| `backend/Migrations/*.cs` | ترحيلات قاعدة البيانات |
| `quran-front/.env` | إعدادات البيئة المحلية |
| `quran-front/.env.production` | إعدادات الإنتاج |
| `quran-front/vercel.json` | إعدادات Vercel |
| `quran-front/netlify.toml` | إعدادات Netlify |

---

## الأشخاص

- **المطور**: Yousef Taalip
- **المنصة**: Bdaey (بدائي) - منصة تعليم القرآن الكريم
- **جهة الدفع**: Kashier (بوابة دفع مصرية)
- **جهة الفيديو**: Daily.co
