import { redirect } from "next/navigation";

export default function Home() {
  // Middleware handles the primary redirect, but as a fallback, we redirect here server-side
  redirect("/login");
}
