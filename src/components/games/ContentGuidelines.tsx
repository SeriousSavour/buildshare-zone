import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";

const ContentGuidelines = () => {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-2">Content Guidelines & Copyright Policy</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please read carefully before submitting any content. Violation of these guidelines may result in content removal and account suspension.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Allowed Content */}
        <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <h4 className="font-semibold text-green-600 dark:text-green-400">Allowed Content</h4>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground ml-7">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Original Content:</strong> Games and tools you created yourself</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Open Source Licensed:</strong> Content with MIT, Creative Commons, GPL, or similar licenses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Licensed Content:</strong> Content with explicit written permission from copyright holders</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Public Domain:</strong> Content explicitly in the public domain</span>
            </li>
          </ul>
        </div>

        {/* Prohibited Content */}
        <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <h4 className="font-semibold text-red-600 dark:text-red-400">Prohibited Content</h4>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground ml-7">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span><strong>Commercial Games:</strong> Any game from Steam, Epic Games, commercial publishers without explicit permission</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span><strong>Copyrighted Material:</strong> Games, images, or content you don't own or have rights to</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span><strong>Pirated Content:</strong> Illegally distributed or "cracked" games</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span><strong>Malicious Code:</strong> Viruses, malware, or harmful scripts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span><strong>Inappropriate Content:</strong> Offensive, illegal, or harmful material</span>
            </li>
          </ul>
        </div>

        {/* Important Notice */}
        <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <h4 className="font-semibold text-blue-600 dark:text-blue-400">Your Responsibility</h4>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            By submitting content, you certify that you own the rights or have permission to share it. 
            You are fully responsible for any copyright issues that arise from your submissions. 
            Content found to be infringing will be removed immediately.
          </p>
        </div>

        {/* Legal Links */}
        <div className="text-sm text-muted-foreground pt-2">
          For more information, see our{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </Card>
  );
};

export default ContentGuidelines;