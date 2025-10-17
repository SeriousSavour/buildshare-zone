import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface ProxyTestResult {
  proxyTest: {
    success: boolean;
    proxyType?: string;
    ip?: string;
    location?: {
      country: string;
      city: string;
      region: string;
      isp: string;
      timezone: string;
    };
    proxy?: string;
    error?: string;
  };
  directTest: {
    ip?: string;
    location?: {
      country: string;
      city: string;
      region: string;
    };
    error?: string;
  };
  message?: string;
  error?: string;
  note?: string;
}

export function ProxyTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProxyTestResult | null>(null);

  const runTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        "https://ptmeykacgbrsmvcvwrpp.supabase.co/functions/v1/test-proxy-location"
      );
      
      const data = await response.json();
      setResult(data);

      if (data.proxyTest?.success) {
        toast.success("Proxy test successful!");
      } else if (data.error) {
        toast.info(data.message || "No proxy configured - using direct connection");
      } else {
        toast.error("Proxy test failed");
      }
    } catch (error) {
      console.error("Test failed:", error);
      toast.error("Failed to run proxy test");
      setResult({
        proxyTest: { success: false, error: String(error) },
        directTest: {},
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Proxy Connection Test</h3>
          <p className="text-sm text-muted-foreground">
            Test if IPRoyal proxy is wrapping all requests
          </p>
        </div>
        <Button onClick={runTest} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Test
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="space-y-4 mt-4">
          {/* Proxy Test Results */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              {result.proxyTest?.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <h4 className="font-semibold">
                {result.proxyTest?.success ? "Proxy Connection" : "Proxy Failed"}
              </h4>
            </div>

            {result.proxyTest?.success && (
              <div className="ml-7 space-y-1 text-sm">
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  <span className="text-primary font-bold">
                    {result.proxyTest.proxyType}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Proxy:</span>{" "}
                  {result.proxyTest.proxy}
                </p>
                <p>
                  <span className="font-medium">IP:</span> {result.proxyTest.ip}
                </p>
                {result.proxyTest.location && (
                  <>
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {result.proxyTest.location.city},{" "}
                      {result.proxyTest.location.region},{" "}
                      {result.proxyTest.location.country}
                    </p>
                    <p>
                      <span className="font-medium">ISP:</span>{" "}
                      {result.proxyTest.location.isp}
                    </p>
                    <p>
                      <span className="font-medium">Timezone:</span>{" "}
                      {result.proxyTest.location.timezone}
                    </p>
                  </>
                )}
              </div>
            )}

            {result.proxyTest?.error && (
              <p className="ml-7 text-sm text-red-500">
                Error: {result.proxyTest.error}
              </p>
            )}
          </div>

          {/* Direct Connection Results */}
          {result.directTest?.ip && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold">Direct Connection (Comparison)</h4>
              <div className="ml-0 space-y-1 text-sm">
                <p>
                  <span className="font-medium">IP:</span> {result.directTest.ip}
                </p>
                {result.directTest.location && (
                  <p>
                    <span className="font-medium">Location:</span>{" "}
                    {result.directTest.location.city},{" "}
                    {result.directTest.location.region},{" "}
                    {result.directTest.location.country}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info Message */}
          {result.message && (
            <p className="text-sm text-muted-foreground italic">
              💡 {result.message}
            </p>
          )}

          {/* No Proxy Configured */}
          {result.error && (
            <div className="border border-yellow-500/50 rounded-lg p-4 bg-yellow-500/10">
              <p className="text-sm">
                ℹ️ {result.message || "No proxy configured"}
              </p>
              {result.note && (
                <p className="text-xs text-muted-foreground mt-2">
                  {result.note}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
