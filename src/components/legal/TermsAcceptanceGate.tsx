import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Shield, FileText, Cookie, Scale } from "lucide-react";
import { Link } from "react-router-dom";

interface TermsAcceptanceGateProps {
  onAccept: () => void;
}

const TermsAcceptanceGate = ({ onAccept }: TermsAcceptanceGateProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allAccepted = termsAccepted && privacyAccepted && cookiesAccepted && ageConfirmed;

  const handleAcceptAll = async () => {
    if (!allAccepted) return;

    setIsSubmitting(true);

    try {
      // Log all consents to database
      const consents = [
        { consent_type: "terms", user_agent: navigator.userAgent },
        { consent_type: "privacy", user_agent: navigator.userAgent },
        { consent_type: "cookie", user_agent: navigator.userAgent },
        { consent_type: "age_verification", user_agent: navigator.userAgent },
      ];

      await supabase.from("user_consents").insert(consents);

      // Store acceptance in localStorage
      localStorage.setItem("legal_terms_accepted", "true");
      localStorage.setItem("legal_acceptance_date", new Date().toISOString());
      localStorage.setItem("cookie_consent", "accepted");

      onAccept();
    } catch (error) {
      console.error("Error logging consents:", error);
      // Still allow access even if logging fails
      localStorage.setItem("legal_terms_accepted", "true");
      localStorage.setItem("legal_acceptance_date", new Date().toISOString());
      onAccept();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-2xl p-8 bg-card border-2 border-primary/20 shadow-2xl my-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Scale className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Philosopher</h1>
          <p className="text-muted-foreground">
            Before you continue, please review and accept our legal agreements
          </p>
        </div>

        <div className="space-y-6 mb-8">
          {/* Terms of Service */}
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-border hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="terms" className="cursor-pointer flex items-center gap-2 font-semibold text-base mb-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Terms of Service
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  I have read and agree to the Terms of Service, including rules for user conduct, 
                  content guidelines, and platform usage.
                </p>
                <Link 
                  to="/terms" 
                  target="_blank"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read Terms of Service →
                </Link>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-border hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="privacy" className="cursor-pointer flex items-center gap-2 font-semibold text-base mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Privacy Policy
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  I understand how my personal data will be collected, used, stored, and protected 
                  in accordance with GDPR and COPPA regulations.
                </p>
                <Link 
                  to="/privacy" 
                  target="_blank"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read Privacy Policy →
                </Link>
              </div>
            </div>
          </div>

          {/* Cookie Consent */}
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-border hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <Checkbox
                id="cookies"
                checked={cookiesAccepted}
                onCheckedChange={(checked) => setCookiesAccepted(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="cookies" className="cursor-pointer flex items-center gap-2 font-semibold text-base mb-2">
                  <Cookie className="w-5 h-5 text-primary" />
                  Cookie Policy
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  I consent to the use of cookies and similar technologies to improve my experience, 
                  maintain my session, and analyze site usage.
                </p>
                <span className="text-xs text-muted-foreground italic">
                  Essential cookies are required for the site to function. You can manage preferences in settings.
                </span>
              </div>
            </div>
          </div>

          {/* Age Verification */}
          <div className="p-4 bg-muted/30 rounded-lg border-2 border-border hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-3">
              <Checkbox
                id="age"
                checked={ageConfirmed}
                onCheckedChange={(checked) => setAgeConfirmed(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="age" className="cursor-pointer flex items-center gap-2 font-semibold text-base mb-2">
                  <Shield className="w-5 h-5 text-destructive" />
                  Age Verification (COPPA Compliance)
                </Label>
                <p className="text-sm text-muted-foreground">
                  I confirm that I am <strong>13 years of age or older</strong>. This platform is not 
                  intended for children under 13 years old in compliance with COPPA regulations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleAcceptAll}
            disabled={!allAccepted || isSubmitting}
            className="w-full h-12 text-lg font-semibold"
          >
            {isSubmitting ? "Processing..." : "Accept All & Continue"}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            By clicking "Accept All & Continue", you acknowledge that you have read, understood, 
            and agree to be bound by all of the above agreements. Your acceptance is legally binding 
            and will be recorded with a timestamp for compliance purposes.
          </p>

          <p className="text-xs text-center text-muted-foreground">
            If you do not agree to these terms, please close this window and do not use this service.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TermsAcceptanceGate;
