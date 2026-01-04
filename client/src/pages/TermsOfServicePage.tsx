import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Music, Image, Shield, Scale, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function TermsOfServicePage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation(-1 as any)} 
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-primary" />
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: January 4, 2026
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                By creating an account or using Heartbeat Studio by Horton's Tech Innovations ("the Service"), 
                you agree to be bound by these Terms of Service. If you do not agree to these terms, 
                please do not use the Service.
              </p>
              <p>
                These terms constitute a legally binding agreement between you and Horton's Tech Innovations 
                regarding your use of the Service for creating AI-generated songs, greeting cards, and related content.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                2. AI-Generated Content & Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4>2.1 How Content Is Created</h4>
              <p>
                The Service uses artificial intelligence technologies to create songs, 
                greeting cards, and other content based on your inputs and preferences.
              </p>
              
              <h4>2.2 Ownership of AI-Generated Songs</h4>
              <p>
                Songs created through the Service are generated using AI technology. Under current U.S. 
                Copyright Office guidelines, works created entirely by artificial intelligence without 
                sufficient human authorship may not be eligible for copyright protection.
              </p>
              <ul>
                <li><strong>Personal Use:</strong> You may use AI-generated songs for personal, non-commercial purposes 
                such as gifting to loved ones, playing at private celebrations, and sharing with friends and family.</li>
                <li><strong>Commercial Use:</strong> Commercial use of AI-generated songs (including distribution 
                on streaming platforms, monetization, or use in advertising) may be subject to limitations 
                based on your subscription tier and the terms of our underlying AI service providers.</li>
                <li><strong>No Exclusive Rights:</strong> You acknowledge that similar or identical content may be 
                generated for other users based on similar inputs, and you do not have exclusive rights 
                to any AI-generated output.</li>
              </ul>

              <h4>2.3 Your Content</h4>
              <p>
                You retain ownership of any original content you provide to the Service, including:
              </p>
              <ul>
                <li>Custom lyrics you write</li>
                <li>Personal photos you upload</li>
                <li>Names, messages, and personal details you provide</li>
              </ul>
              <p>
                By using the Service, you grant Horton's Tech Innovations a non-exclusive, worldwide license 
                to use your inputs solely for the purpose of generating and delivering your requested content.
              </p>

              <h4>2.4 Greeting Cards and Images</h4>
              <p>
                AI-generated images and greeting cards are provided for personal use. Similar intellectual 
                property considerations apply as outlined for songs above.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                3. Acceptable Use
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>You agree NOT to use the Service to:</p>
              <ul>
                <li>Create content that is hateful, discriminatory, threatening, or harassing</li>
                <li>Generate content that infringes on any third party's intellectual property rights</li>
                <li>Impersonate real individuals (including celebrities) without their consent</li>
                <li>Create content that is obscene, defamatory, or illegal</li>
                <li>Use AI voice cloning or likeness of any person without their explicit permission</li>
                <li>Generate content that promotes violence, illegal activities, or harmful behavior</li>
                <li>Misrepresent AI-generated content as human-created when required by law or platform policies</li>
                <li>Attempt to reverse-engineer, exploit, or abuse the Service or its AI systems</li>
              </ul>
              <p>
                Violation of these terms may result in immediate account termination without refund.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                4. Photo Uploads & Family Portrait Feature
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>When uploading photos for features like Family Portrait Composer or Festive Transform:</p>
              <ul>
                <li>You must have the right to use any photos you upload</li>
                <li>You must have consent from all individuals depicted in the photos</li>
                <li>Photos of minors require parental or guardian consent</li>
                <li>We process photos solely to generate your requested content and do not use them for AI training</li>
                <li>Photos are stored temporarily during processing and may be retained to deliver your content</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                5. Credits, Payments & Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h4>5.1 Credit System</h4>
              <ul>
                <li>1 credit = 1 AI-generated song OR 1 greeting card</li>
                <li>Cards with attached songs cost 2 credits total</li>
                <li>Free accounts receive 3 credits</li>
                <li>Credit packs and subscriptions are available for purchase</li>
              </ul>

              <h4>5.2 Refund Policy</h4>
              <ul>
                <li>If AI generation fails, your credits will be refunded automatically</li>
                <li>Credits are non-refundable once successfully used to generate content</li>
                <li>Subscription cancellations take effect at the end of the current billing period</li>
              </ul>

              <h4>5.3 No Guarantees</h4>
              <p>
                While we strive for high-quality AI generation, we cannot guarantee specific outcomes. 
                AI-generated content quality may vary based on inputs and the nature of AI technology.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                6. Third-Party Services
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                The Service integrates with third-party AI providers and services. Your use of the Service 
                is also subject to the terms and policies of these providers, including but not limited to:
              </p>
              <ul>
                <li>AI music and voice generation services</li>
                <li>AI text and image generation services</li>
                <li>Payment processing services</li>
                <li>Email and SMS delivery services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                7. Disclaimers & Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. HORTON'S TECH INNOVATIONS 
                DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR 
                A PARTICULAR PURPOSE.
              </p>
              <p>
                We are not liable for:
              </p>
              <ul>
                <li>AI generation failures or quality issues</li>
                <li>Service interruptions or downtime</li>
                <li>Loss of content or data</li>
                <li>Any indirect, incidental, or consequential damages</li>
              </ul>
              <p>
                Our maximum liability is limited to the amount you paid for the Service in the 12 months 
                preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                Your privacy is important to us. Please review our{' '}
                <a 
                  href="/privacy" 
                  className="text-primary hover:underline"
                  onClick={(e) => { e.preventDefault(); setLocation('/privacy'); }}
                >
                  Privacy Policy
                </a>{' '}
                for information on how we collect, use, and protect your data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                We may update these Terms of Service from time to time. We will notify you of significant 
                changes by email or through the Service. Your continued use of the Service after changes 
                take effect constitutes acceptance of the updated terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10. Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>
                If you have questions about these Terms of Service, please contact us at{' '}
                <a href="/contact" className="text-primary hover:underline">our contact page</a>.
              </p>
              <p className="mt-4">
                <strong>Horton's Tech Innovations</strong><br />
                Heartbeat Studio
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-muted-foreground">
          By using Heartbeat Studio, you acknowledge that you have read, understood, and agree to these Terms of Service.
        </p>
      </div>
    </div>
  );
}
