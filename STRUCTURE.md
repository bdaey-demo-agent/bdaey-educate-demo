# هيكل المشروع الكامل - Bdaey Educate

```
📦 BDAEY-EDUCATE
│
├── 📄 .gitignore
├── 📄 README.ar.md               (التوثيق التقني)
├── 📄 README.md                  (التوثيق العام)
│
├── 📁 backend/                   ◄── ASP.NET Core 10 API
│   │
│   ├── 📄 .gitignore
│   ├── 📄 appsettings.json
│   ├── 📄 appsettings.Development.json
│   ├── 📄 BdaeyEducat.API.csproj
│   ├── 📄 BdaeyEducat.API.http
│   ├── 📄 Dockerfile
│   ├── 📄 fly.toml
│   ├── 📄 Program.cs             ◄── نقطة الدخول
│   ├── 📄 cleanup_duplicates.sql
│   ├── 📄 migrations.sql
│   ├── 📄 build_error.log
│   ├── 📄 build_log.txt
│   ├── 📄 launch_log.txt
│   ├── 📄 migration_log.txt
│   │
│   ├── 📁 Controllers/           ◄── 28 API Controller
│   │   ├── 📄 AdminBookingsController.cs
│   │   ├── 📄 AdminController.cs
│   │   ├── 📄 AdminPackagesController.cs
│   │   ├── 📄 AdminPromoCodesController.cs
│   │   ├── 📄 AdminUsersController.cs
│   │   ├── 📄 AdminWalletController.cs
│   │   ├── 📄 AdminWithdrawalsController.cs
│   │   ├── 📄 AuthController.cs
│   │   ├── 📄 BookingsController.cs
│   │   ├── 📄 ChatController.cs
│   │   ├── 📄 ContactController.cs
│   │   ├── 📄 DashboardController.cs
│   │   ├── 📄 FilesController.cs
│   │   ├── 📄 GamificationController.cs
│   │   ├── 📄 MediaController.cs
│   │   ├── 📄 NotificationsController.cs
│   │   ├── 📄 PackagesController.cs
│   │   ├── 📄 PaymentsController.cs
│   │   ├── 📄 PlatformSettingsController.cs
│   │   ├── 📄 QuranController.cs
│   │   ├── 📄 ReviewsController.cs
│   │   ├── 📄 SessionEvaluationsController.cs
│   │   ├── 📄 SessionsController.cs
│   │   ├── 📄 SitemapController.cs
│   │   ├── 📄 TeachersController.cs
│   │   ├── 📄 VideoController.cs
│   │   ├── 📄 WalletController.cs
│   │   └── 📄 WithdrawalsController.cs
│   │
│   ├── 📁 Data/                  ◄── طبقة البيانات
│   │   ├── 📄 ApplicationDbContext.cs
│   │   ├── 📄 DesignTimeDbContextFactory.cs
│   │   ├── 📁 Entities/          ◄── 21 Entity
│   │   │   ├── 📄 ApplicationUser.cs
│   │   │   ├── 📄 AuditLog.cs
│   │   │   ├── 📄 Badge.cs
│   │   │   ├── 📄 Booking.cs
│   │   │   ├── 📄 ChatMessage.cs
│   │   │   ├── 📄 ContactMessage.cs
│   │   │   ├── 📄 FavoriteTeacher.cs
│   │   │   ├── 📄 Notification.cs
│   │   │   ├── 📄 Package.cs
│   │   │   ├── 📄 PlatformSetting.cs
│   │   │   ├── 📄 PromoCode.cs
│   │   │   ├── 📄 PromoCodeUsage.cs
│   │   │   ├── 📄 Review.cs
│   │   │   ├── 📄 Session.cs
│   │   │   ├── 📄 SessionEvaluation.cs
│   │   │   ├── 📄 StudentBadge.cs
│   │   │   ├── 📄 TeacherProfile.cs
│   │   │   ├── 📄 Wallet.cs
│   │   │   ├── 📄 WalletTransaction.cs
│   │   │   ├── 📄 WithdrawalMethod.cs
│   │   │   └── 📄 WithdrawalRequest.cs
│   │   └── 📁 Enums/
│   │       └── 📄 PackageStatus.cs
│   │
│   ├── 📁 Dtos/                  ◄── 25 DTO
│   │   ├── 📄 AdminPackageDtos.cs
│   │   ├── 📄 AuthResponseDto.cs
│   │   ├── 📄 BookingDto.cs
│   │   ├── 📄 BulkDepositDto.cs
│   │   ├── 📄 BulkDepositStudentDto.cs
│   │   ├── 📄 ChatDtos.cs
│   │   ├── 📄 DashboardDtos.cs
│   │   ├── 📄 GamificationDtos.cs
│   │   ├── 📄 GoogleAuthDto.cs
│   │   ├── 📄 LoginDto.cs
│   │   ├── 📄 PackageDto.cs
│   │   ├── 📄 PasswordDtos.cs
│   │   ├── 📄 ProfileDtos.cs
│   │   ├── 📄 PromoCodeCreateDto.cs
│   │   ├── 📄 PromoCodeRedeemDto.cs
│   │   ├── 📄 PromoCodeResponseDto.cs
│   │   ├── 📄 PromoCodeUsageResponseDto.cs
│   │   ├── 📄 RegisterDto.cs
│   │   ├── 📄 ResendVerificationDto.cs
│   │   ├── 📄 ReviewDto.cs
│   │   ├── 📄 SessionDto.cs
│   │   ├── 📄 SessionEvaluationCreateDto.cs
│   │   ├── 📄 SessionEvaluationResponseDto.cs
│   │   ├── 📄 TeacherDocsDto.cs
│   │   ├── 📄 TeacherProfileDto.cs
│   │   └── 📄 WalletDtos.cs
│   │
│   ├── 📁 Hubs/                  ◄── SignalR
│   │   └── 📄 NotificationHub.cs
│   │
│   ├── 📁 Mappings/              ◄── AutoMapper
│   │   ├── 📄 MappingProfile.cs
│   │   └── 📄 README.md
│   │
│   ├── 📁 Middleware/            ◄── 2 Middleware
│   │   ├── 📄 BlockedUserMiddleware.cs
│   │   └── 📄 TenantMigrationMiddleware.cs
│   │
│   ├── 📁 Migrations/            ◄── 6 ترحيلات EF Core
│   │   ├── 📄 20260313173248_InitialProductionLaunch.cs
│   │   ├── 📄 20260313173248_InitialProductionLaunch.Designer.cs
│   │   ├── 📄 20260316205923_AddIsDataSubmittedToTeacherProfile.cs
│   │   ├── 📄 20260316205923_AddIsDataSubmittedToTeacherProfile.Designer.cs
│   │   ├── 📄 20260319111428_AddEmailConfirmationSentAt.cs
│   │   ├── 📄 20260319111428_AddEmailConfirmationSentAt.Designer.cs
│   │   ├── 📄 20260319145524_AddScheduledCommissionToTeacherProfile.cs
│   │   ├── 📄 20260319145524_AddScheduledCommissionToTeacherProfile.Designer.cs
│   │   ├── 📄 20260609193655_InitialSync.cs
│   │   ├── 📄 20260609193655_InitialSync.Designer.cs
│   │   ├── 📄 20260629073758_AddMissingIndexes.cs
│   │   ├── 📄 20260629073758_AddMissingIndexes.Designer.cs
│   │   └── 📄 ApplicationDbContextModelSnapshot.cs
│   │
│   ├── 📁 Properties/
│   │   └── 📄 launchSettings.json
│   │
│   ├── 📁 Seeders/
│   │   └── 📄 DataSeeder.cs
│   │
│   ├── 📁 Services/              ◄── 20 Service + عقد
│   │   ├── 📄 AuditLogService.cs
│   │   ├── 📄 ChatCleanupService.cs
│   │   ├── 📄 EmailService.cs
│   │   ├── 📄 EmailTemplates.cs
│   │   ├── 📄 FileService.cs
│   │   ├── 📄 GamificationService.cs
│   │   ├── 📄 IEmailService.cs
│   │   ├── 📄 IFileService.cs
│   │   ├── 📄 IJwtTokenService.cs
│   │   ├── 📄 IPackageService.cs
│   │   ├── 📄 IPayoutService.cs
│   │   ├── 📄 IReviewService.cs
│   │   ├── 📄 IS3FileService.cs
│   │   ├── 📄 JwtTokenService.cs
│   │   ├── 📄 KashierPaymentService.cs
│   │   ├── 📄 NotificationCleanupService.cs
│   │   ├── 📄 NotificationService.cs
│   │   ├── 📄 PackageArchiverService.cs
│   │   ├── 📄 PackageService.cs
│   │   ├── 📄 PayoutService.cs
│   │   ├── 📄 PendingEarningsReleaseService.cs
│   │   ├── 📄 ReviewService.cs
│   │   ├── 📄 S3FileService.cs
│   │   ├── 📄 SessionCleanupService.cs
│   │   ├── 📄 WalletService.cs
│   │   └── 📁 Video/
│   │       ├── 📄 DailyVideoProvider.cs
│   │       ├── 📄 IVideoProvider.cs
│   │       └── 📄 VideoService.cs
│   │
│   └── 📁 Settings/
│       └── 📄 KashierSettings.cs
│
├── 📁 quran-front/               ◄── React 18 + TypeScript + Vite
│   │
│   ├── 📄 .env
│   ├── 📄 .env.production
│   ├── 📄 .gitignore
│   ├── 📄 eslint.config.js
│   ├── 📄 index.html
│   ├── 📄 netlify.toml
│   ├── 📄 package.json
│   ├── 📄 package-lock.json
│   ├── 📄 postcss.config.js
│   ├── 📄 tailwind.config.js
│   ├── 📄 tsconfig.json
│   ├── 📄 tsconfig.app.json
│   ├── 📄 tsconfig.node.json
│   ├── 📄 vercel.json
│   ├── 📄 vite.config.ts
│   │
│   ├── 📁 public/
│   │   ├── 📄 _redirects
│   │   ├── 📄 favicon.ico
│   │   ├── 📄 favicon.png
│   │   ├── 📄 logo.png
│   │   ├── 📄 robots.txt
│   │   └── 📄 vite.svg
│   │
│   └── 📁 src/
│       ├── 📄 App.css
│       ├── 📄 App.tsx
│       ├── 📄 config.ts
│       ├── 📄 constants.ts
│       ├── 📄 index.css
│       ├── 📄 main.tsx
│       ├── 📄 queryKeys.ts
│       │
│       ├── 📁 components/         ◄── 30+ مكون
│       │   ├── 📁 admin/
│       │   │   └── 📄 SendNotificationModal.tsx
│       │   ├── 📁 auth/
│       │   │   ├── 📄 GoogleAuthButton.tsx
│       │   │   ├── 📄 ProtectedRoute.tsx
│       │   │   └── 📄 PublicOnlyRoute.tsx
│       │   ├── 📁 chat/
│       │   │   └── 📄 ChatWindow.tsx
│       │   ├── 📁 common/
│       │   │   ├── 📄 Badge.tsx
│       │   │   ├── 📄 Button.tsx
│       │   │   ├── 📄 Card.tsx
│       │   │   ├── 📄 ConfirmModal.tsx
│       │   │   ├── 📄 CustomAudioPlayer.tsx
│       │   │   ├── 📄 DateInput.tsx
│       │   │   ├── 📄 DraggableSection.tsx
│       │   │   ├── 📄 EditableText.tsx
│       │   │   ├── 📄 GuestBanner.tsx
│       │   │   ├── 📄 Input.tsx
│       │   │   ├── 📄 Modal.tsx
│       │   │   ├── 📄 NotificationsDropdown.tsx
│       │   │   ├── 📄 OnboardingGuide.tsx
│       │   │   ├── 📄 SignalRManager.tsx
│       │   │   └── 📄 Skeleton.tsx
│       │   ├── 📁 dashboard/
│       │   │   ├── 📄 BulkDepositModal.tsx
│       │   │   └── 📄 StudentBulkDepositModal.tsx
│       │   ├── 📁 layout/
│       │   │   ├── 📄 Header.tsx
│       │   │   ├── 📄 MainLayout.css
│       │   │   ├── 📄 MainLayout.tsx
│       │   │   ├── 📄 ScrollFrame.tsx
│       │   │   ├── 📄 Sidebar.tsx
│       │   │   ├── 📄 SidebarTeacher.tsx
│       │   │   ├── 📄 StudentLayout.tsx
│       │   │   ├── 📄 TeacherLayout.tsx
│       │   │   └── 📄 TopBar.tsx
│       │   ├── 📁 modals/
│       │   │   └── 📄 RateSessionModal.tsx
│       │   ├── 📁 skeletons/
│       │   │   ├── 📄 BookingsSkeleton.tsx
│       │   │   ├── 📄 DashboardSkeleton.tsx
│       │   │   └── 📄 ScheduleSkeleton.tsx
│       │   ├── 📁 teacher/
│       │   │   └── 📄 WithdrawalModal.tsx
│       │   ├── 📁 teachers/
│       │   │   ├── 📄 TeacherCard.tsx
│       │   │   └── 📄 TeacherCardSkeleton.tsx
│       │   └── 📁 video/
│       │       ├── 📄 ChatPanel.tsx
│       │       ├── 📄 ControlBar.tsx
│       │       ├── 📄 CustomClassroom.tsx
│       │       ├── 📄 ParticipantsPanel.tsx
│       │       ├── 📄 QuranPanel.tsx
│       │       ├── 📄 SessionEvaluationModal.tsx
│       │       └── 📄 VideoTile.tsx
│       │
│       ├── 📁 context/            ◄── 3 Context
│       │   ├── 📄 AuthContext.tsx
│       │   ├── 📄 TenantBlocked.css
│       │   └── 📄 ThemeContext.tsx
│       │
│       ├── 📁 data/
│       │   └── 📄 teachers.ts
│       │
│       ├── 📁 layouts/            ◄── 2 Layout
│       │   ├── 📄 AdminLayout.tsx
│       │   └── 📄 PublicLayout.tsx
│       │
│       ├── 📁 pages/              ◄── 40+ صفحة
│       │   ├── 📄 AdminLogin.tsx
│       │   ├── 📄 ForgotPassword.tsx
│       │   ├── 📄 Home.tsx
│       │   ├── 📄 Login.tsx
│       │   ├── 📄 LoginStudent.tsx
│       │   ├── 📄 LoginTeacher.tsx
│       │   ├── 📄 RegisterStudent.tsx
│       │   ├── 📄 RegisterTeacher.tsx
│       │   ├── 📄 ResetPassword.tsx
│       │   ├── 📄 TeacherProfile.tsx
│       │   ├── 📄 Teachers.tsx
│       │   │
│       │   ├── 📁 admin/          ◄── 16 صفحة إدارة
│       │   │   ├── 📄 AdminBookings.tsx
│       │   │   ├── 📄 AdminDashboard.tsx
│       │   │   ├── 📄 AdminGuidePage.tsx
│       │   │   ├── 📄 AdminMessages.tsx
│       │   │   ├── 📄 AdminOverview.tsx
│       │   │   ├── 📄 AdminPackages.tsx
│       │   │   ├── 📄 AdminPayouts.tsx
│       │   │   ├── 📄 AdminPromoCodes.tsx
│       │   │   ├── 📄 AdminSettings.tsx
│       │   │   ├── 📄 AdminStudents.tsx
│       │   │   ├── 📄 AdminTeacherApproval.tsx
│       │   │   ├── 📄 AdminTeachers.tsx
│       │   │   ├── 📄 AdminUsers.tsx
│       │   │   ├── 📄 FinancialDashboard.tsx
│       │   │   ├── 📄 WithdrawalRequests.tsx
│       │   │   └── 📁 tabs/
│       │   │       └── 📄 MessagesTab.tsx
│       │   │
│       │   ├── 📁 common/
│       │   │   ├── 📄 ChatPage.tsx
│       │   │   ├── 📄 ProfilePage.tsx
│       │   │   ├── 📄 VerifyEmail.tsx
│       │   │   └── 📄 WalletPage.tsx
│       │   │
│       │   ├── 📁 public/         ◄── 12 صفحة عامة
│       │   │   ├── 📄 AboutUs.tsx
│       │   │   ├── 📄 BlogPage.tsx
│       │   │   ├── 📄 ContactPage.tsx
│       │   │   ├── 📄 GoogleSSOCallback.tsx
│       │   │   ├── 📄 HowItWorks.tsx
│       │   │   ├── 📄 HowToUsePlatform.tsx
│       │   │   ├── 📄 LandingPage.tsx
│       │   │   ├── 📄 NotFound.tsx
│       │   │   ├── 📄 PrivacyPolicy.tsx
│       │   │   ├── 📄 StudentRefundPolicy.tsx
│       │   │   ├── 📄 SuspendedPage.tsx
│       │   │   ├── 📄 TeacherFinancialPolicy.tsx
│       │   │   └── 📄 TermsOfUse.tsx
│       │   │
│       │   ├── 📁 Sessions/
│       │   │   ├── 📄 Classroom.tsx
│       │   │   └── 📄 SessionsList.tsx
│       │   │
│       │   ├── 📁 student/
│       │   │   ├── 📄 Dashboard.tsx
│       │   │   ├── 📄 Leaderboard.tsx
│       │   │   ├── 📄 Schedule.tsx
│       │   │   ├── 📄 StudentHome.tsx
│       │   │   └── 📄 StudentProgress.tsx
│       │   │
│       │   └── 📁 teacher/
│       │       ├── 📄 TeacherBookings.tsx
│       │       ├── 📄 TeacherDashboard.tsx
│       │       ├── 📄 TeacherHome.tsx
│       │       ├── 📄 TeacherPackages.tsx
│       │       └── 📄 TeacherStudents.tsx
│       │
│       ├── 📁 services/           ◄── 15 Service
│       │   ├── 📄 adminService.ts
│       │   ├── 📄 api.ts
│       │   ├── 📄 authService.ts
│       │   ├── 📄 bookingsService.ts
│       │   ├── 📄 chatService.ts
│       │   ├── 📄 dashboardService.ts
│       │   ├── 📄 gamificationService.ts
│       │   ├── 📄 messageService.ts
│       │   ├── 📄 notificationService.ts
│       │   ├── 📄 packagesService.ts
│       │   ├── 📄 quranService.ts
│       │   ├── 📄 sessionEvaluationService.ts
│       │   ├── 📄 sessionsService.ts
│       │   ├── 📄 signalrService.ts
│       │   ├── 📄 teacherService.ts
│       │   ├── 📄 videoService.ts
│       │   └── 📄 walletService.ts
│       │
│       ├── 📁 styles/
│       │   ├── 📄 components.css
│       │   ├── 📄 utilities.css
│       │   └── 📄 variables.css
│       │
│       ├── 📁 types/              ◄── 6 Type
│       │   ├── 📄 adminTypes.ts
│       │   ├── 📄 auth.ts
│       │   ├── 📄 booking.ts
│       │   ├── 📄 dashboard.ts
│       │   ├── 📄 session.ts
│       │   └── 📄 teacher.ts
│       │
│       └── 📁 utils/
│           ├── 📄 authUtils.ts
│           ├── 📄 errorUtils.ts
│           ├── 📄 helpers.ts
│           ├── 📄 mediaUtils.ts
│           ├── 📄 statusTranslations.ts
│           └── 📄 stringUtils.ts
```

---

### الإحصائيات

| القسم | عدد الملفات |
|-------|------------|
| **Backend (C#)** | 97 ملف |
| ├── Controllers | 28 |
| ├── Entities | 21 |
| ├── DTOs | 25 |
| ├── Services | 20 |
| ├── Migrations | 13 |
| └── أخرى | 12 |
| **Frontend (TS/TSX)** | 119 ملف |
| ├── Pages | 41 |
| ├── Components | 32 |
| ├── Services | 17 |
| └── أخرى | 13 |
| **ملفات الإعدادات** | 21 |
| **المجموع الكلي** | **~237 ملف** |
