"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
    const pathname = usePathname(); // Get the current path

    return (
        <nav className="bg-primary text-primary-foreground w-full">
            <div className="flex">
                
                <Link
                    href="/"
                    className={`px-6 py-4 text-center leading-tight transition-transform duration-100 ${
                        pathname === '/' ? 'font-bold' : 'hover:scale-105'
                    }`}
                >
                    <div>Fixed</div>
                    <div>Deposits</div>
                </Link>

                <Link
                    href="/Tourist_Data"
                    className={`px-6 py-4 my-auto transition-transform duration-100 ${
                        pathname === '/Tourist_Data' ? 'font-bold' : 'hover:scale-105'
                    }`}
                >
                    Tourist Data Plans
                </Link>

                <Link
                    href="/about"
                    className={`px-6 py-4 my-auto transition-transform duration-100 ${
                        pathname === '/about' ? 'font-bold' : 'hover:scale-105'
                    }`}
                >
                    About Us
                </Link>
            </div>
        </nav>
    );
}
