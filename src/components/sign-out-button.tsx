"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut className="size-5" />
    </Button>
  );
}
