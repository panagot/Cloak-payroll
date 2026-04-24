import type { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { ClusterBanner } from "./ClusterBanner";
import { RpcWarningBanner } from "./RpcWarningBanner";
import { VercelDeploymentRpcBanner } from "./VercelDeploymentRpcBanner";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type Props = { children: ReactNode };

export function AppChrome({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <ClusterBanner />
      <VercelDeploymentRpcBanner />
      <RpcWarningBanner />
      <SiteHeader />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <SiteFooter />
    </div>
  );
}
