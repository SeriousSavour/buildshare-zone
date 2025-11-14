import Navigation from "@/components/layout/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
          <h1 className="text-4xl font-bold mb-4 text-primary">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">1. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <h3 className="text-xl font-semibold text-foreground">1.1 Account Information</h3>
                <p>When you create an account, we collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Username</li>
                  <li>Password (encrypted)</li>
                  <li>Display name (optional)</li>
                  <li>Profile information you choose to provide</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mt-6">1.2 Usage Information</h3>
                <p>We automatically collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Game play statistics</li>
                  <li>Quest progress</li>
                  <li>Content interactions (likes, favorites, comments)</li>
                  <li>Session information</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mt-6">1.3 Technical Information</h3>
                <p>We may collect:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Access times and dates</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">2. How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>We use collected information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain the service</li>
                  <li>Authenticate users and maintain security</li>
                  <li>Track game progress and achievements</li>
                  <li>Enable social features (friends, chat, comments)</li>
                  <li>Improve and optimize the platform</li>
                  <li>Respond to support requests</li>
                  <li>Enforce our Terms of Service</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">3. Information Sharing</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <h3 className="text-xl font-semibold text-foreground">3.1 Public Information</h3>
                <p>The following information is publicly visible:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Username and display name</li>
                  <li>Profile information you choose to make public</li>
                  <li>Comments and public interactions</li>
                  <li>Games you create or publish</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mt-6">3.2 We Do Not Sell Your Data</h3>
                <p>
                  We do not sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>

                <h3 className="text-xl font-semibold text-foreground mt-6">3.3 Legal Requirements</h3>
                <p>
                  We may disclose your information if required by law or in response to valid legal requests.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Encrypted password storage</li>
                <li>Secure session management</li>
                <li>Row-level security policies on database</li>
                <li>Regular security updates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">5. Your Rights</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Update or correct your information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your data</li>
                  <li>Opt out of certain data collection</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">6. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to maintain your session, remember your preferences, 
                and improve your experience. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">7. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our service is not directed to children under 13. We do not knowingly collect information from children under 13. 
                If you believe we have collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">8. Changes to Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. We will notify you of significant changes 
                by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">9. Cookie Policy</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  We use cookies and similar tracking technologies to enhance your experience on our platform. 
                  Cookies are small data files stored on your device that help us:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Remember your preferences and settings</li>
                  <li>Keep you logged in to your account</li>
                  <li>Analyze site traffic and usage patterns</li>
                  <li>Improve site functionality and performance</li>
                </ul>
                <p>
                  You can control cookie settings through your browser preferences. Note that disabling 
                  cookies may affect the functionality of certain features.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">10. GDPR Compliance</h2>
              <p className="text-muted-foreground leading-relaxed">
                For users in the European Union, we comply with the General Data Protection Regulation (GDPR). 
                You have the right to access, rectify, erase, restrict processing, and port your personal data. 
                To exercise these rights, please contact us at privacy@philosopher.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">11. Contact Us</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>If you have questions about this privacy policy, contact us:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email: privacy@philosopher.com</li>
                  <li>Support page: <a href="/help" className="text-primary hover:underline">/help</a></li>
                </ul>
              </div>
            </section>

            <section className="pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;