"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiAdapter, type Device } from "@/lib/api/adapter";
import { MonitorSmartphone, Plus, RefreshCw, Wifi, WifiOff, X, AlertTriangle, ShieldOff } from "lucide-react";

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Pairing State
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [pairingExpiry, setPairingExpiry] = useState<Date | null>(null);
  const [pairingLoading, setPairingLoading] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  // Revoke State
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchDevices = () => {
    setLoading(true);
    ApiAdapter.getDevices()
      .then(setDevices)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleGenerateToken = async () => {
    setPairingLoading(true);
    setPairingError(null);
    setPairingToken(null);
    try {
      const res = await ApiAdapter.generatePairingToken();
      setPairingToken(res.token);
      setPairingExpiry(new Date(res.expiresAt));
    } catch (err: any) {
      setPairingError(err.message || "Failed to generate token.");
    } finally {
      setPairingLoading(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke this device? It will immediately lose sync access and require re-pairing.")) return;
    
    setRevokingId(deviceId);
    try {
      await ApiAdapter.revokeDevice(deviceId);
      fetchDevices();
    } catch (err) {
      alert("Failed to revoke device.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Devices Management</h2>
          <p className="text-muted-foreground">Manage connected Android TV devices.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDevices} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => {
            setShowPairModal(true);
            handleGenerateToken();
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Pair New Device
          </Button>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>
            List of all authenticated and active devices attached to this mosque.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-5 border-b bg-muted/50 p-4 font-medium text-sm text-muted-foreground">
              <div>Device Name</div>
              <div>ID</div>
              <div>Status</div>
              <div>Last Seen</div>
              <div className="text-right">Actions</div>
            </div>
            {loading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading devices...</div>
            ) : devices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No devices found.</div>
            ) : (
              <div className="divide-y">
                {devices.map((device) => (
                  <div key={device.id} className="grid grid-cols-5 p-4 text-sm items-center hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-2 font-medium">
                      <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                      {device.name || "Unknown TV"}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground truncate pr-4" title={device.device_identifier}>{device.device_identifier}</div>
                    <div>
                      {device.status === "ACTIVE" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                          <Wifi className="mr-1 h-3 w-3" /> Active
                        </span>
                      ) : device.status === "DISABLED" ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-500">
                          <WifiOff className="mr-1 h-3 w-3" /> Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                          <WifiOff className="mr-1 h-3 w-3" /> Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      {device.last_heartbeat_at
                        ? new Date(device.last_heartbeat_at).toLocaleString()
                        : "Never"}
                    </div>
                    <div className="text-right">
                      {device.status === "ACTIVE" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRevoke(device.id)}
                          disabled={revokingId === device.id}
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          {revokingId === device.id ? "Revoking..." : "Revoke"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pairing Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-lg border relative flex flex-col items-center text-center">
            <button 
              onClick={() => setShowPairModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-2xl font-bold mb-2">PAIR NEW DEVICE</h3>
            <p className="text-muted-foreground mb-6">
              Enter this 6-digit PIN on your Android TV screen to connect it to this mosque.
            </p>
            
            {pairingLoading ? (
              <div className="py-8 animate-pulse text-muted-foreground">Generating secure PIN...</div>
            ) : pairingError ? (
              <div className="py-6 flex flex-col items-center text-destructive">
                <AlertTriangle className="h-10 w-10 mb-2" />
                <p>{pairingError}</p>
                <Button variant="outline" className="mt-4" onClick={handleGenerateToken}>Try Again</Button>
              </div>
            ) : pairingToken ? (
              <>
                <div className="bg-muted px-8 py-6 rounded-lg w-full mb-6">
                  <div className="text-6xl font-mono font-bold tracking-widest text-primary tabular-nums">
                    {pairingToken.slice(0, 3)} {pairingToken.slice(3)}
                  </div>
                </div>
                {pairingExpiry && (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin-slow" />
                    Expires at {pairingExpiry.toLocaleTimeString()}
                  </p>
                )}
                <Button variant="outline" className="mt-6 w-full" onClick={() => {
                  fetchDevices();
                  setShowPairModal(false);
                }}>
                  Done
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
