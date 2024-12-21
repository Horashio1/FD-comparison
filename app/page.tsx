'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Wifi, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    title: "Card Offers",
    icon: CreditCard,
    href: "/Card_Offers",
    gradient: "from-blue-100 via-blue-50 to-indigo-50 dark:from-blue-900/20 dark:via-blue-800/20 dark:to-indigo-900/20",
    hoverGradient: "group-hover:from-blue-500 group-hover:to-indigo-500"
  },
  {
    title: "Fixed Deposits",
    icon: Landmark,
    href: "/FD_Rates",
    gradient: "from-emerald-100 via-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:via-emerald-800/20 dark:to-teal-900/20",
    hoverGradient: "group-hover:from-emerald-500 group-hover:to-teal-500"
  },
  {
    title: "Tourist Data Plans",
    icon: Wifi,
    href: "/Tourist_Data",
    gradient: "from-purple-100 via-purple-50 to-pink-50 dark:from-purple-900/20 dark:via-purple-800/20 dark:to-pink-900/20",
    hoverGradient: "group-hover:from-purple-500 group-hover:to-pink-500"
  }
];

const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute w-full h-full">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
          style={{
            width: `${Math.random() * 400 + 200}px`,
            height: `${Math.random() * 400 + 200}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `blob ${Math.random() * 20 + 20}s infinite`,
            backgroundColor: `hsl(${Math.random() * 60 + 180}, 70%, 85%)`,
          }}
        />
      ))}
    </div>
  </div>
);

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [animatingCard, setAnimatingCard] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCardClick = (e, href, index) => {
    e.preventDefault();
    if (animatingCard !== null) return;
    setAnimatingCard(index);
    setTimeout(() => {
      setAnimatingCard(null);
      router.push(href);
    }, 300);
  };

  return (
    <section className="w-full flex flex-col items-center justify-center overflow-hidden">
      <section className="relative w-full py-8 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/40 dark:via-purple-950/40 dark:to-pink-950/40">
        <div className="absolute inset-0 bg-gradient-to-t from-rose-100/20 to-sky-100/20 dark:from-rose-900/20 dark:to-sky-900/20" />
        <AnimatedBackground />
        <div className="container relative mx-auto flex flex-col items-center px-4 md:px-6 text-center">
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-t from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
              Find the Best Rates in Sri Lanka
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl dark:text-gray-300">
              Compare fixed deposits, tourist data plans, and card offers to make informed financial decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-8 md:py-24 lg:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
            {mounted && services.map((service, index) => (
              <a
                href={service.href}
                key={index}
                onClick={(e) => handleCardClick(e, service.href, index)}
                className="group w-full cursor-pointer"
              >
                <Card 
                  className={`h-full relative overflow-hidden transition-all duration-300 
                    bg-gradient-to-b ${service.gradient} 
                    hover:shadow-2xl hover:scale-105
                    ${service.hoverGradient}
                    ${animatingCard === index ? 'scale-105' : ''}
                    ${animatingCard === index ? service.hoverGradient.replace('group-hover:', '') : ''}`}
                >
                  <CardHeader className="relative">
                    <div className={`mb-4 transition-transform duration-300 transform 
                      group-hover:scale-110 group-hover:rotate-3
                      ${animatingCard === index ? 'scale-110 rotate-3' : ''}`}
                    >
                      <service.icon className={`h-16 w-16 text-gray-700 dark:text-gray-300 transition-colors duration-300
                        group-hover:text-white
                        ${animatingCard === index ? 'text-white' : ''}`} />
                    </div>
                    <CardTitle className={`text-3xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100
                      group-hover:text-white
                      ${animatingCard === index ? 'text-white' : ''}`}>
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}