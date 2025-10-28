import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

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
    
    let result;
    
    if (requestData.type === 'bug') {
      const { title, description, email } = requestData;
      
      // Store bug report in database
      const { data, error } = await supabase
        .from('bug_reports')
        .insert({
          title,
          description,
          email,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error storing bug report:", error);
        throw error;
      }
      
      console.log("Bug report stored:", data);
      result = data;
      
    } else if (requestData.type === 'contact') {
      const { name, email, subject, message } = requestData;
      
      // Store contact message in database
      const { data, error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          subject,
          message,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error storing contact message:", error);
        throw error;
      }
      
      console.log("Contact message stored:", data);
      result = data;
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
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
