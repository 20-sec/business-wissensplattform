import { requireAccess } from "@/lib/auth";
import { catalog } from "@/lib/data";
import Dashboard from "./dashboard";
export const dynamic = "force-dynamic";
export default async function Home() { await requireAccess(); return <Dashboard videos={catalog.videos} queue={catalog.reviewQueue} />; }
