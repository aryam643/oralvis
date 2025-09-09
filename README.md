##OralVis Healthcare – Dental Image Analysis Platform

OralVis Healthcare is a full-stack application designed to make dental image management seamless. Built with the MERN stack, it enables patients to upload dental images, while healthcare providers can annotate, review, and generate detailed PDF reports. With secure role-based access, it’s tailored for both patients and practitioners.


#Key Features
	•	Patient Portal → Upload dental images with personal details
	•	Admin Dashboard → Manage submissions and annotate images with advanced tools
	•	Automated Reports → Generate treatment-ready PDF reports
	•	Secure Access Control → Role-based authentication for patients and admins
	•	Interactive Annotation → Rectangle, circle, arrow, and freehand tools
	•	Cloud Storage → Secure storage of images and reports using Supabase


#Prerequisites

Before you begin, make sure you have:
	•	Node.js v18+
	•	npm or yarn
	•	Git
	•	A Supabase account


#Getting Started (Local Setup)

1. Clone the Repository

git clone <your-repo-url>
cd oralvis-healthcare

2. Install Dependencies

npm install
# or
yarn install

3. Configure Environment Variables

Copy the example file:

cp .env.example .env.local

Then add your Supabase credentials and site details:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

4. Database Setup
	•	Run migration scripts in scripts/ using Supabase SQL Editor OR
	•	Use the Supabase CLI:

npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push

5. Start Development Server

npm run dev
# or
yarn dev

App will be available at http://localhost:3000


##Workflows

For Patients
	1.	Register/Login
	2.	Upload dental images
	3.	Track submissions
	4.	Download reports when ready

For Admins
	1.	Login
	2.	View dashboard and submissions
	3.	Annotate images using built-in tools
	4.	Generate and share reports

#Project Structure

oralvis-healthcare/
├── app/               # Next.js routes (admin, patient, auth, API)
├── components/        # Reusable React components
├── lib/supabase/      # Supabase configuration
├── scripts/           # Database migrations
└── public/            # Static assets

Troubleshooting
	•	Supabase connection issues → Check .env.local variables
	•	File upload errors → Verify storage policies & bucket permissions
	•	Auth issues → Check redirect URLs and email confirmation settings
	•	PDF generation fails → Ensure patient data + images are available

Enable debug mode by setting:

NODE_ENV=development
