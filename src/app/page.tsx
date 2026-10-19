import { redirect } from "next/navigation";

// The app opens on the saved-research list.
export default function Home() {
  redirect("/research");
}
