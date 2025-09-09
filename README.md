# OralVis Healthcare - Dental Image Analysis Platform

A comprehensive MERN stack application for dental image submission, annotation, and report generation with role-based access control.

## 🚀 Features

- **Patient Portal**: Upload dental images with patient details
- **Admin Dashboard**: Review submissions with advanced annotation tools
- **PDF Report Generation**: Automated dental reports with treatment recommendations
- **Role-Based Authentication**: Secure access for patients and healthcare providers
- **Image Annotation**: Canvas-based tools (rectangle, circle, arrow, freehand)
- **File Storage**: Secure image and PDF storage with Supabase

## 📋 Prerequisites

Before running this application, ensure you have the following installed on your MacBook:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - [Sign up here](https://supabase.com/)

## 🛠️ Local Setup Instructions

### 1. Clone the Repository

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd oralvis-healthcare

# Or download and extract the ZIP file
\`\`\`

### 2. Install Dependencies

\`\`\`bash
# Install all dependencies
npm install

# Or using yarn
yarn install
\`\`\`

### 3. Environment Variables Setup

Create a `.env.local` file in the root directory:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Add the following environment variables to `.env.local`:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 4. Supabase Database Setup

#### 4.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details and create

#### 4.2 Get API Keys
1. Go to Project Settings → API
2. Copy the Project URL and anon public key
3. Copy the service_role secret key

#### 4.3 Run Database Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Run the contents of `scripts/001_create_tables.sql`
3. Run the contents of `scripts/002_create_storage.sql`

Or use the Supabase CLI:
\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
\`\`\`

### 5. Configure Authentication

#### 5.1 Email Templates (Optional)
1. Go to Authentication → Email Templates
2. Customize signup confirmation and password reset templates

#### 5.2 URL Configuration
1. Go to Authentication → URL Configuration
2. Add `http://localhost:3000` to Site URL
3. Add `http://localhost:3000/**` to Redirect URLs

### 6. Storage Setup

#### 6.1 Create Storage Buckets
The SQL scripts will create the necessary storage buckets:
- `dental-images` - For original uploaded images
- `annotated-images` - For processed annotated images
- `reports` - For generated PDF reports

#### 6.2 Configure Storage Policies
Storage policies are automatically created via the SQL scripts to ensure:
- Patients can only access their own files
- Admins can access all files
- Proper RLS (Row Level Security) enforcement

### 7. Run the Application

\`\`\`bash
# Start the development server
npm run dev

# Or using yarn
yarn dev
\`\`\`

The application will be available at: `http://localhost:3000`

## 👥 Test Accounts

### Creating Test Accounts

#### Patient Account
1. Go to `http://localhost:3000/auth/register`
2. Fill in details:
   - Email: `patient@test.com`
   - Password: `password123`
   - Role: `Patient`
   - Name: `John Doe`
   - Patient ID: `P001`

#### Admin Account
1. Go to `http://localhost:3000/auth/register`
2. Fill in details:
   - Email: `admin@test.com`
   - Password: `password123`
   - Role: `Admin`
   - Name: `Dr. Smith`

### Manual Database Setup (Alternative)
If you prefer to create test accounts directly in the database:

\`\`\`sql
-- Insert test users (run in Supabase SQL Editor)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('patient-uuid', 'patient@test.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('admin-uuid', 'admin@test.com', crypt('password123', gen_salt('bf')), now(), now(), now());

-- Insert user profiles
INSERT INTO public.users (id, email, role, name, patient_id)
VALUES 
  ('patient-uuid', 'patient@test.com', 'patient', 'John Doe', 'P001'),
  ('admin-uuid', 'admin@test.com', 'admin', 'Dr. Smith', NULL);
\`\`\`

## 🔧 Development Workflow

### Patient Workflow
1. **Register/Login** → `http://localhost:3000/auth/login`
2. **Upload Images** → `http://localhost:3000/patient/upload`
3. **View Submissions** → `http://localhost:3000/patient`
4. **Download Reports** → Available when admin generates reports

### Admin Workflow
1. **Login** → `http://localhost:3000/auth/login`
2. **View Dashboard** → `http://localhost:3000/admin`
3. **Review Submissions** → Click on any submission
4. **Annotate Images** → Use annotation tools on submission detail page
5. **Generate Reports** → Click "Generate Report" after annotation

## 📁 Project Structure

\`\`\`
oralvis-healthcare/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin dashboard pages
│   ├── auth/                     # Authentication pages
│   ├── patient/                  # Patient portal pages
│   └── api/                      # API routes
├── components/                   # Reusable React components
├── lib/                         # Utility libraries
│   └── supabase/                # Supabase client configuration
├── scripts/                     # Database migration scripts
└── public/                      # Static assets
\`\`\`

## 🐛 Troubleshooting

### Common Issues

#### 1. Supabase Connection Error
- Verify environment variables are correct
- Check if Supabase project is active
- Ensure API keys have proper permissions

#### 2. File Upload Issues
- Check storage bucket permissions
- Verify RLS policies are correctly set
- Ensure file size limits are appropriate

#### 3. Authentication Problems
- Verify email confirmation settings
- Check redirect URL configuration
- Ensure user roles are properly set

#### 4. PDF Generation Fails
- Check if all required patient data is present
- Verify image URLs are accessible
- Ensure proper permissions for report generation

### Debug Mode
Add debug logging by setting:
\`\`\`env
NODE_ENV=development
\`\`\`

## 📚 API Documentation

See `API_DOCUMENTATION.md` for detailed API endpoints and usage examples.

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
\`\`\`

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact: support@oralvis.com

---

**Note**: This application is for educational/demonstration purposes. For production use in healthcare, ensure compliance with HIPAA and other relevant regulations.
