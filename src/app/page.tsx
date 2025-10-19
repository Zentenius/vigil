"use client"

import Link from "next/link"
import { Button } from "~/components/ui/button"
import { useRouter } from "next/navigation"
import { SignIn } from "~/components/auth/sign-in";
import { Navbar } from "~/components/navbar";
import { useSession } from "next-auth/react"
import { useEffect } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const hazardSymbols = ["🔥", "⚠️", "☢️", "⚡", "🚧", "☣️", "💀", "⛔"]

  const continentPositions = [
    // North America
    { left: 20, top: 25 },
    { left: 25, top: 35 },
    { left: 18, top: 40 },
    // South America
    { left: 28, top: 60 },
    { left: 32, top: 68 },
    // Europe
    { left: 48, top: 28 },
    { left: 52, top: 32 },
    // Africa
    { left: 50, top: 50 },
    { left: 48, top: 58 },
    { left: 54, top: 55 },
    // Asia
    { left: 65, top: 30 },
    { left: 70, top: 35 },
    { left: 75, top: 40 },
    { left: 68, top: 45 },
    // Australia
    { left: 78, top: 65 },
    { left: 82, top: 68 },
  ]

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] overflow-hidden">
      <Navbar/>
      {/* Animated rain effect */}
        <div className="absolute top-0 z-[0] h-screen w-full bg-primary/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(16,185,129,0.3),rgba(255,255,255,0))]" />
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-12 bg-gradient-to-b from-transparent via-gray-600 to-transparent opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              animation: `rain ${3 + Math.random() * 2}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
              transform: `rotate(15deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-start pt-20 md:pt-32 px-4 pb-12 leading-7">
        <h1 className="text-7xl md:text-6xl font-bold text-white text-center max-w-5xl text-balance leading-tight lg:text-9xl px-px py-0 mb-px">
          Vigil
        </h1>
        <p className="text-gray-400 text-sm md:text-lg mb-6 mt-3 text-center">Eyes Everywhere, Saftey Anywhere</p>

        

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignIn />
          <Button
            size="lg"
            variant="outline"
            className="bg-transparent border-2 border-gray-600 hover:bg-[#2a2a2a] text-white rounded-full px-8 py-6 text-base font-medium transition-colors"
          >
            Continue as guest
          </Button>
        </div>
      </div>

      <div className="relative z-0 flex items-center justify-center mt-8 md:mt-16 pb-32">
        <div className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] lg:w-[1000px] lg:h-[1000px]">
          <div className="relative w-full h-full globe-container" style={{ perspective: "2000px" }}>
            {/* Main globe sphere */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 shadow-2xl">
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <img
                  src="/images/design-mode/image.png"
                  alt="World Map"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
                  style={{
                    maskImage: "radial-gradient(circle, black 45%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(circle, black 45%, transparent 70%)",
                  }}
                />
              </div>

              {/* Rotating dot pattern overlay */}
              <div className="absolute inset-0 rounded-full overflow-hidden rotating-globe">
                <div className="absolute inset-0 dot-pattern" />
              </div>

              {continentPositions.map((position, i) => {
                const randomSymbol = hazardSymbols[Math.floor(Math.random() * hazardSymbols.length)]
                const randomDelay = Math.random() * 3

                return (
                  <div
                    key={`globe-hazard-${i}`}
                    className="absolute text-2xl md:text-3xl globe-hazard"
                    style={{
                      left: `${position.left}%`,
                      top: `${position.top}%`,
                      animationDelay: `${randomDelay}s`,
                      filter: "drop-shadow(0 0 10px rgba(250, 204, 21, 0.6))",
                    }}
                  >
                    {randomSymbol}
                  </div>
                )
              })}

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-radial from-emerald-500/20 via-transparent to-transparent" />
            </div>

            {/* Orbital rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] orbital-ring-1">
              <div
                className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                style={{ transform: "rotateX(75deg) rotateZ(20deg)" }}
              />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] h-[115%] orbital-ring-2">
              <div
                className="absolute inset-0 rounded-full border-2 border-emerald-400/20"
                style={{ transform: "rotateX(75deg) rotateZ(-30deg)" }}
              />
            </div>

            {/* Shadow underneath */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3/4 h-32 bg-black/40 rounded-full blur-3xl" />
          </div>
        </div>
      </div>

      {/* Feature Cards - Absolute positioned around globe */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Left Card - Predictive Map */}
        <div className="absolute left-4 md:left-[20%] top-[28%] w-72 h-80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-105 bg-gray-900/50 backdrop-blur border border-emerald-500/30 hover:border-emerald-500/60 pointer-events-auto">
          <div className="w-full h-full relative group">
            <img
              src="/prediction.png"
              alt="Predictive Map"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <h3 className="text-white font-bold text-lg mb-1">Predictive Zones</h3>
              <p className="text-gray-300 text-xs">AI-powered hazard prediction</p>
            </div>
          </div>
        </div>

        {/* Right Card - AR Phone */}
        <div className="absolute right-4 md:right-[20%] top-1/4 w-72 h-80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-105 bg-gray-900/50 backdrop-blur border border-emerald-500/30 hover:border-emerald-500/60 pointer-events-auto">
          <div className="w-full h-full relative group">
            <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-gray-900 to-black flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4">📱</div>
                <p className="text-gray-400 text-sm">AR Experience</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <h3 className="text-white font-bold text-lg mb-1">AR Navigation</h3>
              <p className="text-gray-300 text-xs">Navigate with augmented reality</p>
            </div>
          </div>
        </div>

        {/* Bottom Card - Live Feed */}
        <div className="absolute left-[35%]  bottom-12 md:bottom-[45%] w-72 h-80 rounded-2xl overflow-hidden shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-105 bg-gray-900/50 backdrop-blur border border-emerald-500/30 hover:border-emerald-500/60 pointer-events-auto">
          <div className="w-full h-full relative group">
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <p className="text-xs text-gray-400 font-mono">LIVE</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-700"></div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <h3 className="text-white font-bold text-lg mb-1">Live Feed</h3>
              <p className="text-gray-300 text-xs">Real-time community reports</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rain {
          0% {
            transform: translateY(0) rotate(15deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(100vh) rotate(15deg);
            opacity: 0;
          }
        }

        .globe-hazard {
          animation: popPulse 3s ease-in-out infinite;
          will-change: opacity, transform;
        }

        @keyframes popPulse {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5);
          }
          10% {
            opacity: 0.8;
            transform: scale(1.2);
          }
          50% {
            opacity: 0.6;
            transform: scale(1);
          }
          90% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        @keyframes rotate-globe {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .rotating-globe {
          animation: rotate-globe 60s linear infinite;
          will-change: transform;
        }

        .dot-pattern {
          background-image: 
            radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
            radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 40px 40px, 60px 60px;
          background-position: 0 0, 30px 30px;
        }

        .orbital-ring-1 {
          animation: rotate-globe 40s linear infinite reverse;
          will-change: transform;
        }

        .orbital-ring-2 {
          animation: rotate-globe 50s linear infinite;
          will-change: transform;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.2), transparent 70%);
        }
      `}</style>
    </main>
  );
}
