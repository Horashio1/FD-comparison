import Link from "next/link";
import { Landmark, Wifi, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const services = [
  {
    title: "Card Offers",
    description: "Discover the latest credit card offers and promotions",
    icon: CreditCard,
    href: "/Card_Offers"
  },
  {
    title: "Fixed Deposits",
    description: "Compare fixed deposit rates across banks and financial institutions in Sri Lanka",
    icon: Landmark,
    href: "/FD_Rates"
  },
  {
    title: "Tourist Data Plans",
    description: "Find the best mobile data packages for tourists visiting Sri Lanka",
    icon: Wifi,
    href: "/Tourist_Data"
  }
];

export default function HomePage() {
    return (
      <section className="w-full flex flex-col items-center justify-center">
        {/* Hero Section */}
        <section className="w-full py-8 md:py-12 lg:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="container mx-auto flex flex-col items-center px-4 md:px-6 text-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
              Find the Best Rates in Sri Lanka
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Compare fixed deposits, tourist data plans, and card offers to make informed financial decisions.
            </p>
          </div>
        </div>
      </section>
  
        {/* Features Section */}
        <section className="w-full py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
            {services.map((service, index) => (
              <Link href={service.href} key={index} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-lg group-hover:bg-primary group-hover:text-primary-foreground">
                  <CardHeader>
                  <service.icon className="h-14 w-14 mb-4 text-primary transition-all duration-300 transform group-hover:scale-125 group-hover:text-primary-foreground" />
                  <CardTitle className="transition-colors group-hover:text-primary-foreground">{service.title}</CardTitle>
                    <CardDescription className="transition-colors group-hover:text-primary-foreground/70">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </section>
    );
  }
  
  
