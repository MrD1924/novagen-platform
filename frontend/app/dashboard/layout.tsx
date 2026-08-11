import Sidebar from "@/components/dashboard/Sidebar";
import DashboardChat from "@/components/dashboard/DashboardChat";
import TutorialOverlay from "@/components/dashboard/TutorialOverlay";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-surface-gray min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
      <DashboardChat />
      <TutorialOverlay />
    </div>
  );
}
