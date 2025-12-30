import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 2025
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Overview</h2>
              <p className="text-muted-foreground mb-4">
                Heartbeat Studio by Horton's Tech Innovations ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <h3 className="text-lg font-medium mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Name and email address when you create an account</li>
                <li>Payment information when you purchase credits or subscriptions</li>
                <li>Profile information for your loved ones (names, relationships, birthdays)</li>
              </ul>
              
              <h3 className="text-lg font-medium mb-2">Content You Create</h3>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Song details, lyrics, and preferences you provide</li>
                <li>Generated songs, cover art, and other creations</li>
                <li>Messages and communications through our platform</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Usage Information</h3>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-1">
                <li>Device information and browser type</li>
                <li>Usage patterns and feature interactions</li>
                <li>Log data and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>To provide and maintain our service</li>
                <li>To generate personalized songs and content</li>
                <li>To process payments and manage subscriptions</li>
                <li>To send you updates and promotional communications (with your consent)</li>
                <li>To improve our service and develop new features</li>
                <li>To respond to your inquiries and provide customer support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li><strong>Service providers</strong> who help us operate our platform (payment processors, cloud hosting, AI services)</li>
                <li><strong>Recipients</strong> when you share a creation via a share link</li>
                <li><strong>Legal authorities</strong> when required by law or to protect our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong> privacy@heartbeatstudio.com<br />
                <strong>Company:</strong> Horton's Tech Innovations
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
