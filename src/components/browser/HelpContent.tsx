import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bug, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const HelpContent = () => {
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

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold gradient-text">Help & Contact</h1>
      
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contact">Contact Us</TabsTrigger>
          <TabsTrigger value="bug">Report Bug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <CardTitle>Get in Touch</CardTitle>
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
                <CardTitle>Report a Bug</CardTitle>
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
      </Tabs>
    </div>
  );
};

export default HelpContent;
