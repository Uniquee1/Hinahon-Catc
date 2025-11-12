# Hinahon - Mental Health Booking Platform

## Overview

**Hinahon** is a comprehensive mental health consultation platform designed specifically for LPUB (Lyceum of the Philippines University - Batangas) students. The platform enables students to book online consultations with counselors, access mental health articles, and receive ongoing support through follow-up sessions.

**Website:** [hinahon.me](https://hinahon.me)

---

## Table of Contents

- [Features](#features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Functionalities](#key-functionalities)
- [Deployment Information](#deployment-information)
- [Maintenance & Operations](#maintenance--operations)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Features

### For Students
- 🔐 Secure authentication (Email + Google OAuth)
- 📅 Book online consultations with available counselors
- 📚 Access mental health articles and resources
- 💬 AI-powered mental health assistant
- 🎥 Video conferencing for consultations
- 🔔 Email notifications for booking confirmations and updates
- 📊 View consultation history

### For Counselors
- ✅ Accept or reject consultation requests
- 📅 Manage personal availability schedules
- 📝 Add notes to consultation records
- 📧 Receive email notifications with meeting links
- 🔄 Schedule follow-up consultations with students
- 📊 Track consultation history

### For Admins 
- 👥 Manage users (students, counselors, admins)
- 📝 Create, edit, and delete mental health articles
- 📈 View comprehensive statistics and analytics of consultation records
- 📊 Download a copy of the analytics report

---

## System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────>│   Backend    │────────>│  Supabase   │
│   (Vercel)  │         │   (Render)   │         │  (Database) │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      ├────────────────────────┼────────> Daily.co (Video)
      │                        │
      │                        └────────> Resend (Emails)
      │
      └─────────────────────────────────> Supabase (Auth)
```

---

## Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** CSS3
- **Deployment:** Vercel
- **Authentication:** Supabase Auth (Email + Google OAuth)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Deployment:** Render
- **API Architecture:** RESTful

### External Services
- **Database & Auth:** Supabase
- **Video Conferencing:** Daily.co
- **Email Service:** Resend + ImprovX
- **Domain:** Namecheap (hinahon.me)
- **AI Assistant:** OpenAI API
- **Automation:** GitHub Workflows (Daily follow-up checks)

---

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn package manager
- Git

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (see [Environment Configuration](#environment-configuration))

4. Start the development server:
```bash
npm start
```

The backend will run on `http://localhost:3001` by default.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (see [Environment Configuration](#environment-configuration))

4. Start the development server:
```bash
npm run dev
```

The frontend will typically run on `http://localhost:5173`.

---

## Environment Configuration

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=your_backend_url
```

**Example for production:**
```env
VITE_API_URL=https://your-backend.onrender.com
```

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Daily.co Video Conferencing
DAILY_API_KEY=your_daily_api_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=noreply@hinahon.me
REPLY_TO_EMAIL=support@hinahon.me

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://hinahon.me

# OpenAI (for AI Assistant)
OPENAI_API_KEY=your_openai_api_key
```

> **Important:** Never commit `.env` files to version control. They are already included in `.gitignore`.

---

## User Roles & Permissions

### Student
- Create and manage profile
- Browse and read mental health articles
- Book consultations with counselors
- Join video consultations
- View consultation history
- Interact with AI assistant

### Counselor
- Manage personal availability schedule
- Accept or reject consultation requests
- Join video meetings with students
- Schedule follow-up consultations
- View consultation history
- Receive email notifications with meeting details

### Admin (LPUB CATC Department)
- Full access to admin dashboard
- **User Management:**
  - View all users (students, counselors, admins)
  - Edit user information
  - Assign/remove roles
  - Deactivate accounts
- **Article Management:**
  - Create new mental health articles
  - Edit existing articles
  - Delete articles
  - Organize content categories
- **Analytics & Statistics:**
  - View total consultations
  - Monitor booking trends
  - Export reports

---

## Key Functionalities

### Authentication System
- Email/password authentication via Supabase
- Google OAuth integration
- Password reset functionality
- Secure session management

### Booking System
- Students select available counselor time slots
- Real-time availability checking
- Automatic email notifications to both parties
- Booking confirmation system
- Cancellation and rescheduling options

### Video Consultation
- Powered by Daily.co
- One-click join from dashboard
- Email notifications include direct meeting links
- Secure, private consultation rooms
- Automatic room creation and management

### Follow-Up System
- Counselors can schedule follow-ups after consultations
- Automated GitHub workflow runs daily to check schedules
- Creates follow-up rooms automatically
- Email reminders sent to both parties

### Email Notification System
- **Booking confirmation** (student & counselor)
- **Booking accepted/rejected** (student)
- **Meeting reminder** (both parties)
- **Follow-up scheduled** (both parties)
- **Meeting link delivery** (both parties)

### AI Assistant
- Floating chat interface
- Mental health support and guidance
- Resource recommendations

---

## Deployment Information

### Current Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | https://hinahon-catc.vercel.app |
| Backend | Render | https://hinahon-catc.onrender.com |
| Database | Supabase | Managed via Supabase Dashboard |
| Domain | Namecheap | hinahon.me |

### Frontend Deployment (Vercel)
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
- Custom domain configured with Namecheap DNS

### Backend Deployment (Render)
- Automatic deployments from main branch
- Environment variables configured in Render dashboard
- Always-on instance recommended for production

---

## Maintenance & Operations

### Daily Operations

#### Automated Tasks
- **GitHub Workflow** runs daily to check for scheduled follow-ups
- Automatically creates Daily.co rooms for follow-up sessions
- Sends reminder emails to counselors and students

#### Manual Monitoring
- Check Render logs for backend errors
- Monitor Supabase database usage
- Review email delivery status in Resend dashboard
- Verify Daily.co room creation in Daily.co dashboard

### Database Management
- Database is hosted on Supabase
- Access via: [Supabase Dashboard](https://supabase.com/dashboard)
- Regular backups are handled automatically by Supabase
- Consider exporting manual backups weekly for critical data

### User Management
Admins can manage users directly through the admin dashboard at `hinahon.me/admin`:
1. Log in with admin credentials
2. Navigate to User Management section
3. View, edit, or deactivate user accounts as needed

### Article Management
To maintain mental health content:
1. Log in to admin dashboard
2. Navigate to Article Management
3. Create, edit, or remove articles
4. Organize by categories and relevance

### Monitoring Checklist (Weekly)
- [ ] Review consultation statistics
- [ ] Check for failed email deliveries
- [ ] Monitor GitHub workflow execution logs
- [ ] Verify video conferencing functionality
- [ ] Review user feedback and support requests
- [ ] Check server uptime and performance

---

## Troubleshooting

### Common Issues

#### Students cannot book consultations
- Verify counselor has set availability schedule
- Check if backend server is running (Render status)
- Confirm database connection to Supabase
- Review browser console for frontend errors

#### Emails not being sent
- Verify Resend API key is valid
- Check sender email is verified in Resend
- Review backend logs for email service errors
- Confirm environment variables are set correctly

#### Video meetings not working
- Verify Daily.co API key is valid
- Check room creation in Daily.co dashboard
- Ensure both parties have stable internet connection
- Test on different browsers (Chrome recommended)

#### GitHub workflow not running
- Check GitHub Actions tab in repository
- Verify workflow file is in `.github/workflows/`
- Confirm necessary secrets are configured in GitHub
- Review workflow logs for errors

#### Users cannot log in
- Verify Supabase authentication service is running
- Check Google OAuth credentials if using Google sign-in
- Ensure frontend has correct Supabase configuration
- Clear browser cache and cookies

### Getting Help

For technical issues or questions, contact the **Hinahon Team**.

When reporting issues, please include:
- User role (student, counselor, admin)
- Browser and version
- Steps to reproduce the issue
- Screenshots (if applicable)
- Error messages from browser console

---

## Project Structure

```
├── backend/
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── rateLimiter.js       # Rate limiting protection
│   ├── routes/
│   │   ├── admin.js             # Admin management endpoints
│   │   ├── bookings.js          # Consultation booking logic
│   │   ├── chat.js              # AI assistant integration
│   │   ├── daily.js             # Video conferencing endpoints
│   │   └── followup.js          # Follow-up scheduling
│   ├── scripts/
│   │   └── createFollowUpRooms.js  # Automated follow-up creation
│   ├── utils/
│   │   └── emailService.js      # Email notification service
│   ├── .env                     # Environment variables (not in git)
│   ├── server.js                # Main server entry point
│   └── package.json
│
└── frontend/
    ├── public/                  # Static assets
    ├── src/
    │   ├── assets/              # Images, videos, icons
    │   ├── components/          # Reusable React components
    │   │   ├── AIAssistantFloating.jsx
    │   │   ├── FollowUpSchedulingTab.jsx
    │   │   ├── Footer.jsx
    │   │   ├── LegalContent.jsx
    │   │   ├── ProfileDropdown.jsx
    │   │   └── ResponsiveHeader.jsx
    │   ├── pages/               # Main page components
    │   │   ├── AboutPage.jsx
    │   │   ├── AdminPage.jsx
    │   │   ├── ArticlesPage.jsx
    │   │   ├── AuthCallback.jsx
    │   │   ├── BookingPage.jsx
    │   │   ├── CounselorPage.jsx
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── ProfileCompletionPage.jsx
    │   │   ├── ProfilePage.jsx
    │   │   └── ResetPasswordPage.jsx
    │   ├── utils/               # Utility functions
    │   │   ├── adminApi.js
    │   │   ├── availabilityUtils.js
    │   │   ├── bookingApi.js
    │   │   ├── consultationTimeUtils.js
    │   │   ├── dailyApi.js
    │   │   └── passwordUtils.js
    │   ├── App.jsx              # Main app component
    │   ├── AuthProvider.jsx     # Authentication context
    │   ├── supabaseClient.js    # Supabase initialization
    │   └── main.jsx             # App entry point
    ├── .env                     # Environment variables (not in git)
    ├── vite.config.js           # Vite configuration
    └── package.json
```

---

## Important Notes for LPUB CATC Department

### Security
- All user data is stored securely in Supabase
- Authentication is handled by Supabase with industry-standard practices
- Video consultations are private and secure via Daily.co
- Never share environment variables or API keys

### Data Privacy
- Student consultations are confidential
- Only counselors assigned to a consultation can access it
- Comply with data privacy regulations

### Regular Tasks
1. Monitor user feedback
2. Update mental health articles regularly
3. Review analytics to improve services
4. Ensure counselor availability is up to date
5. Respond to technical issues promptly

### Future Enhancements
Consider implementing:
- Mobile application
- In-app messaging system
- Appointment reminders via SMS
- Group therapy sessions
- Counselor rating system
- Extended analytics dashboard

---

## Contact & Support

**Hinahon Team**

For technical support, feature requests, or general inquiries, please contact the Hinahon Team.

---

## License & Acknowledgments

This project was developed for the **LPUB CATC Department** to support student mental health and well-being.

**Developed by:** Hinahon Team  
**For:** Lyceum of the Philippines University - Batangas (LPUB)  
**Year:** 2024-2025

---

*Thank you for maintaining and supporting the mental health of LPUB students through Hinahon.* 🌸