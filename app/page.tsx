import { AuthGate } from "@/components/auth-gate";

export const dynamic = "force-dynamic";

export default function Page() {
  return <AuthGate />;
}
