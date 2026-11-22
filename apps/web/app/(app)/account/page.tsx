import { redirect } from "next/navigation";

// Account settings now live on the Settings page. Keep this route as a
// redirect so old links and bookmarks keep working.
export default function AccountPage() {
  redirect("/settings");
}
