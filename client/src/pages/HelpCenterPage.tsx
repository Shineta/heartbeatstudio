import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { HelpCircle, Music, CreditCard, Share2, User, Mail } from "lucide-react";

export default function HelpCenterPage() {
  const faqs = [
    {
      category: "Getting Started",
      icon: User,
      questions: [
        {
          q: "How do I create my first song?",
          a: "After signing up, click 'Create New Song' from your dashboard. Fill in details about the recipient and occasion, answer a few AI-generated questions, and we'll create personalized lyrics. Review them, then click 'Generate Song' to create your full audio track with cover art."
        },
        {
          q: "Do I need a credit card to sign up?",
          a: "No! You can create an account and get 3 free songs without entering any payment information. You'll only need to add payment details if you want to purchase more songs."
        },
        {
          q: "What are Experience Kits?",
          a: "Experience Kits are pre-designed song creation flows optimized for specific occasions: Date Night, Birthday Blast, Gospel Greeting, and Classroom Cheers. Each kit has customized genres, tones, and prompts to help you create the perfect song."
        }
      ]
    },
    {
      category: "Songs & Audio",
      icon: Music,
      questions: [
        {
          q: "How long are the generated songs?",
          a: "By default, songs are about 3 minutes long (extended mode). You can also choose 'quick' mode for shorter ~1 minute songs if you prefer."
        },
        {
          q: "What genres are available?",
          a: "We offer R&B, Gospel, Soul, Rap (with sub-genres like Trap, Boom Bap, Drill, East Coast, West Coast, Southern), Hip-Hop, Jazz, Blues, Funk, Reggae, Afrobeat, and more. Each genre has distinct production styles."
        },
        {
          q: "Can I edit the lyrics before generating?",
          a: "Yes! After our AI generates lyrics based on your answers, you can review and edit them before generating the audio. This ensures the song says exactly what you want."
        },
        {
          q: "Can I mention a specific artist for inspiration?",
          a: "Yes! In the song details, you can mention artists like 'inspired by Drake' or 'Beyoncé style' and our AI will incorporate that artist's characteristics into the song's sound and style."
        }
      ]
    },
    {
      category: "Billing & Credits",
      icon: CreditCard,
      questions: [
        {
          q: "How does pricing work?",
          a: "You start with 3 free songs. After that, you can purchase a Credit Pack ($4.99 for 5 songs) or subscribe monthly ($10/month for 15 songs). Credits never expire."
        },
        {
          q: "What happens if song generation fails?",
          a: "If a song fails to generate due to a technical issue, you won't be charged a credit. You can retry the generation or contact support if problems persist."
        },
        {
          q: "Can I get a refund?",
          a: "For billing issues or refund requests, please contact us at support@heartbeatstudio.com. We review each request individually."
        }
      ]
    },
    {
      category: "Sharing",
      icon: Share2,
      questions: [
        {
          q: "How do I share a song?",
          a: "Each song has a unique share link. Click the share button on any creation to copy the link. Recipients can listen without creating an account."
        },
        {
          q: "Can I schedule a song to be sent later?",
          a: "Yes! When creating a song, you can set a delivery date and time. We'll send the song to your recipient at the scheduled moment."
        },
        {
          q: "Can I download the song?",
          a: "Yes, you can download your songs as MP3 files to keep forever or share however you like."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about Heartbeat Studio.
            </p>
          </div>

          <div className="space-y-8 mb-12">
            {faqs.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <category.icon className="w-5 h-5 text-primary" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-left" data-testid={`faq-${category.category.toLowerCase().replace(' ', '-')}-${index}`}>
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-8 text-center">
              <Mail className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Still Have Questions?</h2>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? We're here to help.
              </p>
              <Link href="/contact">
                <Button data-testid="link-help-contact">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
