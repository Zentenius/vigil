"use client"

import { signOut } from "next-auth/react";
import { Button, type ButtonProps } from "~/components/ui/button";

export function SignOut({ ...props }: ButtonProps) {
  return (
    <Button {...props} onClick={() => signOut()}>
      Sign Out
    </Button>
  );
}
