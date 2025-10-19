"use client";
import { signIn } from "next-auth/react";
import React from "react";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";
import Google from "../svg/google";
import { ArrowUpRight } from "lucide-react";

export function SignIn({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <Button
    size={"lg"}
      className={cn(
        "bg-primary text-white hover:bg-primary/90  rounded-full px-8 py-6 text-base font-medium transition-colors",
        className,
      )}
      onClick={() => signIn('google', { redirectTo: '/dashboard' })}
      {...props}
    >
      {children ?? (
        <>
          Sign In
          <span className="pointer-events-none ">
            <ArrowUpRight className="opacity-60 h-16 w-16" aria-hidden="true" />
          </span>
        </>
      )}
    </Button>
  );
}
