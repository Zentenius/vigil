"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { ListIcon, XIcon } from "@phosphor-icons/react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { SignIn } from "~/components/auth/sign-in"
import { SignOut } from "~/components/auth/sign-out"
import { ModeToggle } from "~/components/mode-toggle"

interface NavbarProps {
  
}

export function Navbar({}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50) // Change background after scrolling 50px
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const menuItems = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Features", href: "/features" },
    { label: "Partners", href: "/partners" },
  ]
  return (
    <>
      {/* Spacer to prevent content from hiding under navbar */}
        {/* Actual navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300",
          isScrolled 
            ? "max-w-5xl mt-4 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/20 dark:border-gray-800/20" 
            : "max-w-7xl bg-transparent"
        )}>
          <div className={cn(
            "flex items-center justify-between transition-all duration-300",
            isScrolled ? "h-16" : "h-20"
          )}>            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Image 
                src="/logo.png" 
                alt="Navio Logo" 
                width={isScrolled ? 100 : 130} 
                height={isScrolled ? 100 : 130}
                className="rounded-lg transition-all duration-300"
              />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <ModeToggle />
                <div className="flex items-center space-x-3">
                  <SignIn />
                </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <ModeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
              >
                {isMenuOpen ? (
                  <XIcon size={24} />
                ) : (
                  <ListIcon size={24} />
                )}
              </Button>
            </div>
          </div>          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className={cn(
              "md:hidden py-4 backdrop-blur-sm transition-all duration-300",
              isScrolled 
                ? "bg-white/95 dark:bg-gray-950/95 rounded-b-2xl -mx-4 mt-2 border-t border-gray-200/20 dark:border-gray-800/20" 
                : "bg-white/90 dark:bg-gray-950/90"
            )}>
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 font-medium px-4 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 px-4 space-y-3 border-t border-gray-200/30 dark:border-gray-800/30">
                    <div className="space-y-3">
                      <SignIn />
                      <Button 
                        asChild
                        className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
                      >
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </div>
                </div>
              </div>
            </div>
          )}        </div>
      </nav>
    </>
  )
}
