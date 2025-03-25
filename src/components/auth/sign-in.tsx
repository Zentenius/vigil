"use client";
import { signIn } from "next-auth/react";
import React from "react";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import Google from "../svg/google";

export function SignIn({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <Button
      className={cn(
        "bg-[#DB4437] text-white after:flex-1 hover:bg-[#DB4437]/90",
        className,
      )}
      onClick={() => signIn('google', { redirectTo: '/' })}
      {...props}
    >
      {children ?? (
        <>
          <span className="pointer-events-none me-2 flex-1">
            <Google className="opacity-60 h-16 w-16" aria-hidden="true" />
          </span>
          Login with Google
        </>
      )}
    </Button>
  );
}
