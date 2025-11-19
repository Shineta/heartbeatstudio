import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-6 h-6 text-primary fill-primary heartbeat" />
              <div className="flex flex-col">
                <span className="text-xl font-semibold leading-tight" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Heartbeat Studio
                </span>
                <span className="text-xs text-muted-foreground leading-tight">
                  by Horton's Tech Innovations
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Create magic for the people you love—instantly. Beautiful, personalized celebrations powered by AI.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Features</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">How It Works</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Help Center</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Horton's Tech Innovations. Made with love for celebrating the people who matter most.
          </p>
        </div>
      </div>
    </footer>
  );
}
