import { Check, Mail, Phone } from "lucide-react";
import { Button } from "../ui/button";

interface ConfirmationScreenProps {
  onStartOver: () => void;
}

export const ConfirmationScreen = ({ onStartOver }: ConfirmationScreenProps) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-up">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-safari-light flex items-center justify-center">
          <Check className="w-10 h-10 text-safari" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-4">
          Thank You!
        </h1>
        
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Your dream African journey has been received. One of our expert travel designers will be in touch within 24 hours to bring your vision to life.
        </p>

        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">What happens next?</p>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-gold" />
              </div>
              <span className="text-sm">You'll receive a confirmation email shortly</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-gold" />
              </div>
              <span className="text-sm">A travel specialist will call to discuss your journey</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onStartOver}
        //   variant="outline"
          className="rounded-full px-8"
        >
          Plan Another Journey
        </Button>
      </div>
    </div>
  );
};
