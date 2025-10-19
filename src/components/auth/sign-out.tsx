"use client"

import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";
import type { ButtonHTMLAttributes } from "react";

export function SignOut({ ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button {...props} onClick={() => signOut()}>
      Sign Out
    </Button>
  );
}
