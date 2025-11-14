import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, FileText, Flag, CheckCircle, XCircle, Clock, Eye, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserConsent {
  id: string;
  user_id: string | null;
  consent_type: string;
  ip_address: string | null;
  consented_at: string;
  created_at: string;
}

interface DMCANotice {
  id: string;
  complainant_name: string;
  complainant_email: string;
  copyright_work_description: string;
  infringing_url: string;
  infringing_content_type: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  flagged_content: string;
  violation_words: string[];
  severity: string;
  status: string;
  admin_action: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface ComplianceStats {
  totalConsents: number;
  cookieConsents: number;
  ageVerifications: number;
  pendingDMCA: number;
  pendingFlags: number;
}

const LegalCompliancePanel = () => {
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [dmcaNotices, setDmcaNotices] = useState<DMCANotice[]>([]);
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    totalConsents: 0,
    cookieConsents: 0,
    ageVerifications: 0,
    pendingDMCA: 0,
    pendingFlags: 0,
  });
  const [selectedDMCA, setSelectedDMCA] = useState<DMCANotice | null>(null);
  const [dmcaNotes, setDmcaNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchConsents(),
      fetchDMCANotices(),
      fetchContentFlags(),
      fetchStats(),
    ]);
  };

  const fetchConsents = async () => {
    try {
      const { data, error } = await supabase
        .from("user_consents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setConsents(data || []);
    } catch (error: any) {
      console.error("Error fetching consents:", error);
    }
  };

  const fetchDMCANotices = async () => {
    try {
      const { data, error } = await supabase
        .from("dmca_notices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDmcaNotices(data || []);
    } catch (error: any) {
      console.error("Error fetching DMCA notices:", error);
    }
  };

  const fetchContentFlags = async () => {
    try {
      const { data, error } = await supabase
        .from("content_flags")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setContentFlags(data || []);
    } catch (error: any) {
      console.error("Error fetching content flags:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const [consentsResult, dmcaResult, flagsResult] = await Promise.all([
        supabase.from("user_consents").select("*", { count: "exact", head: true }),
        supabase.from("dmca_notices").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("content_flags").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const cookieConsentsResult = await supabase
        .from("user_consents")
        .select("*", { count: "exact", head: true })
        .eq("consent_type", "cookie");

      const ageVerificationsResult = await supabase
        .from("user_consents")
        .select("*", { count: "exact", head: true })
        .eq("consent_type", "age_verification");

      setStats({
        totalConsents: consentsResult.count || 0,
        cookieConsents: cookieConsentsResult.count || 0,
        ageVerifications: ageVerificationsResult.count || 0,
        pendingDMCA: dmcaResult.count || 0,
        pendingFlags: flagsResult.count || 0,
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateDMCAStatus = async (id: string, status: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("dmca_notices")
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `DMCA notice marked as ${status}`,
      });

      setSelectedDMCA(null);
      setDmcaNotes("");
      fetchAllData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "text-destructive";
      case "moderate":
        return "text-orange-500";
      default:
        return "text-yellow-500";
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; text: string }> = {
      pending: { icon: Clock, color: "bg-yellow-500/10 text-yellow-500", text: "Pending" },
      reviewing: { icon: Eye, color: "bg-blue-500/10 text-blue-500", text: "Reviewing" },
      approved: { icon: CheckCircle, color: "bg-green-500/10 text-green-500", text: "Approved" },
      rejected: { icon: XCircle, color: "bg-destructive/10 text-destructive", text: "Rejected" },
      resolved: { icon: CheckCircle, color: "bg-primary/10 text-primary", text: "Resolved" },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalConsents}</p>
              <p className="text-xs text-muted-foreground">Total Consents</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.cookieConsents}</p>
              <p className="text-xs text-muted-foreground">Cookie Consents</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.ageVerifications}</p>
              <p className="text-xs text-muted-foreground">Age Verifications</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingDMCA}</p>
              <p className="text-xs text-muted-foreground">Pending DMCA</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <div className="flex items-center gap-3">
            <Flag className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.pendingFlags}</p>
              <p className="text-xs text-muted-foreground">Pending Flags</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="consents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consents">User Consents</TabsTrigger>
          <TabsTrigger value="dmca">DMCA Notices</TabsTrigger>
          <TabsTrigger value="flags">Content Flags</TabsTrigger>
        </TabsList>

        {/* User Consents Tab */}
        <TabsContent value="consents" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Recent User Consents
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {consents.map((consent) => (
                <div
                  key={consent.id}
                  className="p-4 bg-card/50 border border-border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm capitalize">{consent.consent_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {consent.ip_address || "No IP"} • {new Date(consent.consented_at).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              ))}
              {consents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No consent records found</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* DMCA Notices Tab */}
        <TabsContent value="dmca" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              DMCA Takedown Notices
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {dmcaNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-4 bg-card/50 border-2 border-border rounded-lg hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{notice.complainant_name}</p>
                        {getStatusBadge(notice.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{notice.complainant_email}</p>
                      <p className="text-sm mb-2">{notice.copyright_work_description}</p>
                      <p className="text-xs text-muted-foreground">
                        URL: <a href={notice.infringing_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{notice.infringing_url}</a>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(notice.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {selectedDMCA?.id === notice.id ? (
                    <div className="space-y-3 mt-4 pt-4 border-t border-border">
                      <Textarea
                        placeholder="Admin notes..."
                        value={dmcaNotes}
                        onChange={(e) => setDmcaNotes(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateDMCAStatus(notice.id, "approved", dmcaNotes)}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Approve & Remove Content
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateDMCAStatus(notice.id, "rejected", dmcaNotes)}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDMCAStatus(notice.id, "resolved", dmcaNotes)}
                        >
                          Mark Resolved
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedDMCA(null);
                            setDmcaNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      {notice.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDMCA(notice);
                            setDmcaNotes(notice.admin_notes || "");
                          }}
                        >
                          Review
                        </Button>
                      )}
                      {notice.admin_notes && (
                        <p className="text-xs text-muted-foreground italic">Notes: {notice.admin_notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {dmcaNotices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No DMCA notices found</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Content Flags Tab */}
        <TabsContent value="flags" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Content Moderation Flags
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {contentFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-4 border-2 rounded-lg ${
                    flag.severity === "severe"
                      ? "bg-destructive/5 border-destructive/30"
                      : flag.severity === "moderate"
                      ? "bg-orange-500/5 border-orange-500/30"
                      : "bg-yellow-500/5 border-yellow-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold uppercase ${getSeverityColor(flag.severity)}`}>
                          {flag.severity}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs font-medium">{flag.content_type}</span>
                        {getStatusBadge(flag.status)}
                      </div>
                      <p className="text-sm mb-2">{flag.flagged_content}</p>
                      {flag.violation_words.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {flag.violation_words.map((word, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Flagged: {new Date(flag.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {flag.admin_action && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground">
                        Action: <span className="text-foreground">{flag.admin_action}</span>
                      </p>
                      {flag.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-1">Notes: {flag.admin_notes}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {contentFlags.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Flag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No content flags found</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalCompliancePanel;
