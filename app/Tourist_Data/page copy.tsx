'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Title from "@/components/Title";
import { supabase } from '../../supabaseClient'; // Import Supabase client
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Currency conversion rates, symbols, and flag images
const currencies = {
    LKR: { rate: 1, symbol: 'Rs. ', flag: '/assets/flags/lanka.png?height=20&width=30' },
    USD: { rate: 0.0031, symbol: '$ ', flag: '/assets/flags/us.png?height=20&width=30' },
    EUR: { rate: 0.0028, symbol: '€ ', flag: '/assets/flags/eu.png?height=20&width=30' },
    GBP: { rate: 0.0024, symbol: '£ ', flag: '/assets/flags/uk.png?height=20&width=30' },
};

// Map provider names to their corresponding logos
const providerLogos = {
    Mobitel: '/assets/Telco_logos/mobitel.jpg',
    Dialog: '/assets/Telco_logos/dialog.jpg',
    Hutch: '/assets/Telco_logos/hutch.png',
};

// Define a type for the SIM data
type SimData = {
    provider: keyof typeof providerLogos; // Ensure provider is one of the keys in providerLogos
    price: number;
    data: string;
    validity: string;
    features?: string;
};

export default function SimComparison() {
    const [currency, setCurrency] = useState('LKR');
    const [simData, setSimData] = useState<SimData[]>([]); // Use the defined type

    // Fetch data from Supabase
    useEffect(() => {
        const fetchSimData = async () => {
            const { data, error } = await supabase.from('Tourist Data Plans').select('*');
            if (error) {
                console.error('Error fetching data:', error);
            } else {
                setSimData(data);
            }
        };
        fetchSimData();
    }, []);

    const sortedSimData = useMemo(() => {
        return [...simData].sort((a, b) => a.price - b.price);
    }, [simData]);

    const convertPrice = (price: number) => {
        const convertedPrice = price * currencies[currency as keyof typeof currencies].rate;

        // If the currency is LKR, format without cents
        if (currency === 'LKR') {
            return `${currencies[currency as keyof typeof currencies].symbol}${convertedPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }

        // For other currencies, format with cents
        return `${currencies[currency as keyof typeof currencies].symbol}${convertedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="container py-8">
            <div className="px-4">
            <Title text="Tourist Data Plans" />
            </div>
            <div className="mb-4 flex justify-start px-4">
                <Select onValueChange={setCurrency} defaultValue={currency}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(currencies).map(([code, { flag }]) => (
                            <SelectItem key={code} value={code}>
                                <div className="flex items-center">
                                    <Image src={flag} alt={`${code} flag`} width={20} height={15} className="mr-2" />
                                    {code}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <colgroup>
                        <col className="w-2/5 md:w-1/5" /> {/* Provider column */}
                        <col className="w-1/5" /> {/* Price column */}
                        <col className="w-[6rem] lg:w-[4rem]" /> {/* Data column with max width */}
                        <col className="w-[6rem] lg:w-[4rem]" /> {/* Validity column with max width */}
                        <col className="w-1/5" /> {/* Features column */}
                    </colgroup>
                    <thead>
                        <tr className="bg-gray-100 text-xs sm:text-sm px-0">
                            <th className="py-2 px-2 sm:px-4 text-left font-bold">Provider</th>
                            <th className="py-2 px-2 sm:px-4 text-left font-bold">Price</th>
                            <th className="py-2 px-2 sm:px-4 text-left font-bold">Data</th>
                            <th className="py-2 px-2 sm:px-4 text-left font-bold">Validity</th>
                            <th className="py-2 px-6 sm:px-6 text-left font-bold">Features</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSimData.map((sim, index) => (
                            <tr key={index} className="border-b text-xs sm:text-sm">
                                <td className="py-3 px-2 sm:px-4">
                                    <Image
                                        src={providerLogos[sim.provider] || '/placeholder.svg'}
                                        alt={`${sim.provider} logo`}
                                        width={80}
                                        height={40}
                                        className="object-contain w-16 h-8 sm:w-20 sm:h-10 md:w-24 md:h-12"
                                    />
                                </td>
                                <td className="py-3 px-2 sm:px-4 text-left whitespace-nowrap">{convertPrice(sim.price)}</td>
                                <td className="py-3 px-2 sm:px-4 text-left">{sim.data}</td>
                                <td className="py-3 px-2 sm:px-4 text-left">{sim.validity}</td>

                                <td className="py-3 px-2 sm:px-4">
                                    {sim.features && (
                                        <ul className="list-disc list-inside text-xs sm:text-sm pl-2">
                                            {sim.features.split('\n').map((feature, featureIndex) => (
                                                <li key={featureIndex} className="pl-0 mb-2">
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
