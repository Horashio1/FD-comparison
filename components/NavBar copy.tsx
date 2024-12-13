"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Wifi, CreditCard, Info, X } from "lucide-react";

const services = [
    {
        title: "Card Offers",
        description: "Discover the latest credit card offers and promotions",
        icon: CreditCard,
        href: "/Card_Offers",
    },
    {
        title: "Fixed Deposits",
        description:
            "Compare fixed deposit rates across banks and financial institutions in Sri Lanka",
        icon: Landmark,
        href: "/FD_Rates",
    },
    {
        title: "Tourist Data Plans",
        description: "Find the best mobile data packages for tourists visiting Sri Lanka",
        icon: Wifi,
        href: "/Tourist_Data",
    },
    {
        title: "About Us",
        description: "Learn more about our company and team",
        icon: Info,
        href: "/About",
    },
];

export default function NavBar() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [menuOpen]);

    // Animation variants for mobile menu
    const mobileMenuVariants = {
        hidden: { 
            opacity: 0,
            scale: 0.9,
            transition: {
                duration: 0.3
            }
        },
        visible: { 
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                staggerChildren: 0.1
            }
        }
    };

    // Animation variants for menu items
    const menuItemVariants = {
        hidden: { 
            opacity: 0, 
            x: -50 
        },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        }
    };

    // Desktop link animation
    const desktopLinkVariants = {
        hover: { 
            scale: 1.05,
            transition: { 
                type: "spring", 
                stiffness: 300 
            }
        }
    };

    return (
        <nav className="bg-primary text-primary-foreground w-full shadow-md">
            <div className="max-w-full mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo / Brand Section */}
                    <div className="flex-shrink-0">
                        <Link href="/">
                            <motion.span 
                                whileHover={{ scale: 1.1 }}
                                className="font-bold text-xl hover:cursor-pointer hover:text-secondary transition-colors"
                            >
                                BestRates.lk
                            </motion.span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-6">
                        {services.map((service) => (
                            <motion.div
                                key={service.href}
                                variants={desktopLinkVariants}
                                whileHover="hover"
                            >
                                <Link
                                    href={service.href}
                                    className={`flex items-center transition-colors hover:text-secondary py-2 ${
                                        pathname === service.href ? 'font-semibold underline underline-offset-4' : ''
                                    }`}
                                >
                                    <service.icon className="mr-2 h-5 w-5" />
                                    {service.title}
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setMenuOpen(true)}
                            className="text-secondary hover:text-secondary/80 focus:outline-none transition-colors"
                            aria-label="Open menu"
                        >
                            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M3 5h18a1 1 0 110 2H3a1 1 
                                    0 010-2zm0 6h18a1 1 0 110 2H3a1 
                                    1 0 010-2zm0 6h18a1 1 0 110 
                                    2H3a1 1 0 010-2z"
                                />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Mobile Full-Screen Overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={mobileMenuVariants}
                        className={`fixed inset-0 flex flex-col bg-primary/80 backdrop-blur-md transition-opacity duration-300 z-50`}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setMenuOpen(false);
                            }
                        }}
                    >
                        {/* Close Button */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setMenuOpen(false)}
                            className="absolute top-4 right-4 text-primary-foreground hover:text-secondary transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-8 w-8" />
                        </motion.button>

                        {/* Centering Container */}
                        <div className="flex flex-col justify-center items-center flex-1 pointer-events-none">
                            {/* Inner Container for Left Alignment */}
                            <motion.div 
                                className="flex flex-col items-start pointer-events-auto"
                                variants={mobileMenuVariants}
                            >
                                {services.map((service) => (
                                    <motion.div
                                        key={service.href}
                                        variants={menuItemVariants}
                                    >
                                        <Link
                                            href={service.href}
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex items-center text-2xl mb-8 transition-colors hover:text-secondary ${
                                                pathname === service.href ? 'font-semibold underline underline-offset-8' : ''
                                            }`}
                                        >
                                            <service.icon className="mr-3 h-8 w-8" />
                                            {service.title}
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}