import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BugReportRequest {
  type: 'bug';
  title: string;
  description: string;
  email: string;
}

interface ContactRequest {
  type: 'contact';
  name: string;
  email: string;
  subject: string;
  message: string;
}

type HelpRequest = BugReportRequest | ContactRequest;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: HelpRequest = await req.json();
    
    let emailResponse;
    
    if (requestData.type === 'bug') {
      const { title, description, email } = requestData;
      
      // Send to admin
      emailResponse = await resend.emails.send({
        from: "GameVault <onboarding@resend.dev>",
        to: ["theplasticegg@gmail.com"],
        subject: `Bug Report: ${title}`,
        html: `
          <h1>New Bug Report</h1>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong></p>
          <p>${description.replace(/\n/g, '<br>')}</p>
          <p><strong>Reporter Email:</strong> ${email}</p>
        `,
      });
      
      console.log("Bug report email sent:", emailResponse);
      
    } else if (requestData.type === 'contact') {
      const { name, email, subject, message } = requestData;
      
      // Send to admin
      emailResponse = await resend.emails.send({
        from: "GameVault <onboarding@resend.dev>",
        to: ["theplasticegg@gmail.com"],
        subject: `Contact Form: ${subject}`,
        html: `
          <h1>New Contact Message</h1>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `,
      });
      
      console.log("Contact email sent:", emailResponse);
    }

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-help-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
