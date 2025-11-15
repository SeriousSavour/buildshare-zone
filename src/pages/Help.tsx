import { useState, useEffect } from "react";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bug, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Help = ({ hideNavigation = false }: { hideNavigation?: boolean } = {}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bug Report State
  const [bugTitle, setBugTitle] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [bugEmail, setBugEmail] = useState("");

  // Contact State
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  // DMCA State
  const [dmcaName, setDmcaName] = useState("");
  const [dmcaEmail, setDmcaEmail] = useState("");
  const [dmcaContentUrl, setDmcaContentUrl] = useState("");
  const [dmcaOriginalUrl, setDmcaOriginalUrl] = useState("");
  const [dmcaDescription, setDmcaDescription] = useState("");
  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-help-email', {
        body: {
          type: 'bug',
          title: bugTitle,
          description: bugDescription,
          email: bugEmail || 'no-reply@example.com',
        },
      });

      if (error) throw error;

      toast({
        title: "Bug report submitted",
        description: "Thank you for your report! We'll look into it.",
      });

      setBugTitle("");
      setBugDescription("");
      setBugEmail("");
    } catch (error) {
      console.error('Error submitting bug report:', error);
      toast({
        title: "Error",
        description: "Failed to submit bug report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-help-email', {
        body: {
          type: 'contact',
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        },
      });

      if (error) throw error;

      toast({
        title: "Message sent",
        description: "Thank you for contacting us! We'll get back to you soon.",
      });

      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDmcaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-help-email', {
        body: {
          type: 'dmca',
          name: dmcaName,
          email: dmcaEmail,
          contentUrl: dmcaContentUrl,
          originalUrl: dmcaOriginalUrl,
          description: dmcaDescription,
        },
      });

      if (error) throw error;

      toast({
        title: "DMCA request submitted",
        description: "We've received your DMCA takedown request and will review it promptly.",
      });

      setDmcaName("");
      setDmcaEmail("");
      setDmcaContentUrl("");
      setDmcaOriginalUrl("");
      setDmcaDescription("");
    } catch (error: any) {
      console.error('DMCA submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit DMCA request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {!hideNavigation && <AnnouncementBanner />}
      
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        <h1 className="text-4xl font-bold gradient-text mb-8">Help & Contact</h1>
        
        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="bug">Report Bug</TabsTrigger>
            <TabsTrigger value="dmca" id="dmca-section">DMCA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <CardTitle className="gradient-text">Get in Touch</CardTitle>
                </div>
                <CardDescription>
                  Have a question or feedback? We'd love to hear from you!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      id="contact-name"
                      placeholder="Your name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      id="contact-subject"
                      placeholder="What's this about?"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      id="contact-message"
                      placeholder="Your message..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bug">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bug className="w-5 h-5 text-primary" />
                  <CardTitle className="gradient-text-secondary">Report a Bug</CardTitle>
                </div>
                <CardDescription>
                  Found a bug? Let us know so we can fix it!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBugSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="bug-title" className="block text-sm font-medium mb-2">
                      Bug Title
                    </label>
                    <Input
                      id="bug-title"
                      placeholder="Brief description of the bug"
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bug-description" className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <Textarea
                      id="bug-description"
                      placeholder="Detailed description of the bug, steps to reproduce, etc."
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      required
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bug-email" className="block text-sm font-medium mb-2">
                      Email (optional)
                    </label>
                    <Input
                      id="bug-email"
                      type="email"
                      placeholder="your@email.com"
                      value={bugEmail}
                      onChange={(e) => setBugEmail(e.target.value)}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Bug Report"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dmca">
            <Card className="border-destructive/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-destructive" />
                  <CardTitle className="gradient-text-accent">DMCA Takedown Request</CardTitle>
                </div>
                <CardDescription>
                  Submit a Digital Millennium Copyright Act (DMCA) takedown notice for copyright infringement.
                  Please provide accurate and complete information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDmcaSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="dmca-name" className="block text-sm font-medium mb-2">
                      Your Full Name *
                    </label>
                    <Input
                      id="dmca-name"
                      placeholder="Copyright owner or authorized agent"
                      value={dmcaName}
                      onChange={(e) => setDmcaName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="dmca-email" className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="dmca-email"
                      type="email"
                      placeholder="your@email.com"
                      value={dmcaEmail}
                      onChange={(e) => setDmcaEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="dmca-content-url" className="block text-sm font-medium mb-2">
                      URL of Infringing Content *
                    </label>
                    <Input
                      id="dmca-content-url"
                      type="url"
                      placeholder="https://example.com/infringing-content"
                      value={dmcaContentUrl}
                      onChange={(e) => setDmcaContentUrl(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The URL where the infringing content is located on our platform
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="dmca-original-url" className="block text-sm font-medium mb-2">
                      URL of Original Content *
                    </label>
                    <Input
                      id="dmca-original-url"
                      type="url"
                      placeholder="https://example.com/original-content"
                      value={dmcaOriginalUrl}
                      onChange={(e) => setDmcaOriginalUrl(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The URL where your original copyrighted work is located
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="dmca-description" className="block text-sm font-medium mb-2">
                      Description of Copyrighted Work *
                    </label>
                    <Textarea
                      id="dmca-description"
                      placeholder="Describe the copyrighted work, the nature of infringement, and provide any additional information..."
                      value={dmcaDescription}
                      onChange={(e) => setDmcaDescription(e.target.value)}
                      required
                      className="min-h-[150px]"
                    />
                  </div>
                  
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Notice:</strong> By submitting this form, you declare under penalty of perjury that:
                      (1) You are the copyright owner or authorized to act on behalf of the owner;
                      (2) The information provided is accurate; and
                      (3) You have a good faith belief that the use is not authorized.
                      False claims may result in legal liability.
                    </p>
                  </div>
                  
                  <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting DMCA Request..." : "Submit DMCA Takedown Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Help;
