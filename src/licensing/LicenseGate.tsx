import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import ActivationScreen from "./ActivationScreen";

type LicenseStatus = {
  configured: boolean;
  state: string;
  reason: string;
  machineId: string;
  allowsBusinessFeatures: boolean;
  activationAvailable: boolean;
};

type Props = { children: ReactNode };

export default function LicenseGate({ children }: Props) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [mode, setMode] = useState<"checking" | "web" | "native">("checking");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/license/status", { cache: "no-store" });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setMode("web");
        return;
      }
      const value = await response.json() as LicenseStatus;
      if (typeof value.configured !== "boolean" || typeof value.state !== "string") {
        throw new Error("Invalid native license status response.");
      }
      setStatus(value);
      setMode("native");
    } catch {
      setMode("native");
      setStatus({
        configured: true,
        state: "Invalid",
        reason: "LICENSE_ENGINE_UNAVAILABLE",
        machineId: "",
        allowsBusinessFeatures: false,
        activationAvailable: true,
      });
    }
  }, []);

  useEffect(() => {
    const port = Number(window.location.port);
    const isWindowsLauncher = window.location.protocol === "http:"
      && window.location.hostname === "127.0.0.1"
      && port >= 48922 && port <= 48960;
    if (!isWindowsLauncher) {
      setMode("web");
      return;
    }
    void refresh();
  }, [refresh]);

  if (mode === "checking") {
    return <div className="license-gate-loading">Vérification de la licence…</div>;
  }
  if (mode === "web" || !status || !status.configured || status.state === "Active") {
    return <>{children}</>;
  }
  return <ActivationScreen status={status} onActivated={refresh} />;
}
