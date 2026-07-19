import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/LoadingStates";

const MarkAttendanceClient = dynamic(() => import("./MarkAttendanceClient"), {
  ssr: false,
  loading: () => <PageLoader />,
});

export default function MarkAttendancePage() {
  return <MarkAttendanceClient />;
}
