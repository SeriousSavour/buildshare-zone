import Navigation from "@/components/layout/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <h1 className="text-4xl font-bold mb-4 text-primary">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to these terms, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">2. Content & Copyright Policy</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <h3 className="text-xl font-semibold text-foreground">2.1 Acceptable Content</h3>
                <p>Only the following types of games and content may be submitted to this platform:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Original Content:</strong> Games and content you have created yourself</li>
                  <li><strong>Open Source Licensed:</strong> Content with permissive licenses (MIT, Creative Commons, GPL, etc.)</li>
                  <li><strong>Licensed Content:</strong> Content for which you have explicit written permission from the copyright holder</li>
                  <li><strong>Public Domain:</strong> Content that is explicitly in the public domain</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mt-6">2.2 Prohibited Content</h3>
                <p>The following content is strictly prohibited:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Commercial games without explicit permission from publishers/developers</li>
                  <li>Copyrighted material without proper licensing or permission</li>
                  <li>Pirated or illegally distributed content</li>
                  <li>Content that infringes on intellectual property rights</li>
                  <li>Malicious code, viruses, or harmful scripts</li>
                  <li>Inappropriate, offensive, or illegal content</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mt-6">2.3 User Responsibilities</h3>
                <p>By submitting content, you represent and warrant that:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You own or have the necessary rights and permissions to share the content</li>
                  <li>The content does not violate any third-party rights</li>
                  <li>You will provide proper attribution when required by licenses</li>
                  <li>You accept full responsibility for any copyright issues arising from your submissions</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">3. DMCA Policy & Copyright Infringement</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We respect the intellectual property rights of others and expect our users to do the same. 
                  We will respond to valid copyright infringement notices in accordance with the Digital Millennium Copyright Act (DMCA).
                </p>

                <h3 className="text-xl font-semibold text-foreground">3.1 Filing a DMCA Notice</h3>
                <p>If you believe your copyrighted work has been infringed, please provide:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Identification of the copyrighted work claimed to have been infringed</li>
                  <li>Identification of the infringing material and its location on our site</li>
                  <li>Your contact information (address, telephone number, email)</li>
                  <li>A statement that you have a good faith belief that use of the material is not authorized</li>
                  <li>A statement that the information in the notification is accurate</li>
                  <li>Your physical or electronic signature</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mt-6">3.2 Consequences of Infringement</h3>
                <p>Users who repeatedly infringe copyright will have their accounts suspended or terminated.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">4. User Conduct</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Users agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Upload malicious code or attempt to harm the platform</li>
                  <li>Impersonate others or misrepresent your affiliation</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Attempt to gain unauthorized access to the platform or other users' accounts</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">5. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                This service is provided "as is" and "as available" without any warranties of any kind. 
                We do not warrant that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">6. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
                resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">7. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold harmless the platform, its operators, and affiliates from any claims, 
                damages, or expenses arising from your use of the service or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">8. Modifications to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the service after changes 
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">9. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these terms or to report copyright infringement, please use the contact form 
                available on our Help page.
              </p>
            </section>

            <section className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} All rights reserved. This platform and its content are protected by copyright law.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;