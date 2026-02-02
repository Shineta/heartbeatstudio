import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Review {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  feature: string;
  avatar: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Marcus Johnson",
    location: "Atlanta, GA",
    rating: 5,
    text: "I made a birthday song for my mom and she cried happy tears! The AI captured everything I wanted to say. Best $5 I ever spent.",
    feature: "AI Songs",
    avatar: "MJ"
  },
  {
    id: 2,
    name: "Sarah Chen",
    location: "San Francisco, CA",
    rating: 5,
    text: "The Family Portrait feature is incredible. Got all 4 generations of my family into one beautiful Christmas card photo. Everyone thought we actually took it together!",
    feature: "Family Portraits",
    avatar: "SC"
  },
  {
    id: 3,
    name: "David Williams",
    location: "Chicago, IL",
    rating: 5,
    text: "Created a gospel song for my grandmother's 80th birthday. She plays it every morning now. This app understands the heart.",
    feature: "Gospel Songs",
    avatar: "DW"
  },
  {
    id: 4,
    name: "Aisha Thompson",
    location: "Houston, TX",
    rating: 5,
    text: "The Festive Transform put me in a Fresh Prince style photo and I couldn't stop laughing! So fun and the quality is amazing.",
    feature: "Festive Transform",
    avatar: "AT"
  },
  {
    id: 5,
    name: "Michael Rodriguez",
    location: "Miami, FL",
    rating: 5,
    text: "Made a romantic R&B song for my wife on our anniversary. She said it was more thoughtful than any gift I've ever given her.",
    feature: "AI Songs",
    avatar: "MR"
  },
  {
    id: 6,
    name: "Lisa Washington",
    location: "Brooklyn, NY",
    rating: 5,
    text: "I'm a teacher and used the Classroom Cheers for my students' graduation. The kids went CRAZY! Parents were so impressed.",
    feature: "Experience Kits",
    avatar: "LW"
  }
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
        />
      ))}
    </div>
  );
}

export default function CustomerReviews() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Loved by Thousands
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our community is saying about their celebration experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="hover-elevate" data-testid={`review-card-${review.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                    {review.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{review.name}</h4>
                    <p className="text-sm text-muted-foreground">{review.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={review.rating} />
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {review.feature}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{review.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="flex -space-x-2">
              {['MJ', 'SC', 'DW', 'AT'].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-medium text-primary"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span className="text-sm">
              Join <strong className="text-foreground">10,000+</strong> happy creators
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
