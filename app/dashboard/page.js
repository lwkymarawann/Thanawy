import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "../../components/DashboardClient";

export default function DashboardPage() {
  const role = cookies().get("thanaweya_role")?.value;
  if (!role) redirect("/");
  return <DashboardClient role={role} />;
}
