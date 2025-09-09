import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-4xl font-bold text-blue-600 mb-2">OralVis Healthcare</CardTitle>
            <CardDescription className="text-lg">Advanced Dental Image Analysis & Reporting Platform</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Upload dental images for professional analysis and receive detailed reports with annotations and treatment
              recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/register">Create Account</Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-blue-600 mb-2">For Patients</h3>
                <p className="text-sm text-muted-foreground">
                  Upload dental photos and receive professional analysis with detailed reports
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-blue-600 mb-2">For Healthcare Providers</h3>
                <p className="text-sm text-muted-foreground">
                  Review submissions, annotate images, and generate comprehensive reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
