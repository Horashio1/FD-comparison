'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Title from "@/components/Title";
import { supabase } from '../../supabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const currencies = {
    LKR: { rate: 1, symbol: 'Rs. ', flag: '/assets/flags/lanka.png?height=20&width=30' },
    USD: { rate: 0.0031, symbol: '$ ', flag: '/assets/flags/us.png?height=20&width=30' },
    EUR: { rate: 0.0028, symbol: '€ ', flag: '/assets/flags/eu.png?height=20&width=30' },
    GBP: { rate: 0.0024, symbol: '£ ', flag: '/assets/flags/uk.png?height=20&width=30' },
};

const providerLogos = {
    Mobitel: '/assets/Telco_logos/mobitel.jpg',
    Dialog: '/assets/Telco_logos/dialog.jpg',
    Hutch: '/assets/Telco_logos/hutch.png',
};

type SimData = {
    provider: keyof typeof providerLogos;
    price: number;
    data: string;
    validity: string;
    features?: string;
};

export default function SimComparison() {
    const [currency, setCurrency] = useState('LKR');
    const [simData, setSimData] = useState<SimData[]>([]);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

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
        if (currency === 'LKR') {
            return `${currencies[currency as keyof typeof currencies].symbol}${convertedPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        return `${currencies[currency as keyof typeof currencies].symbol}${convertedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="container py-4">
            <div className="text-2xl font-bold mb-4 px-4">
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

            {/* Only modify the table section below */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg shadow-sm overflow-hidden">
                    <colgroup>
                        <col className="w-1/6 md:w-1/8" /> {/* Provider column - reduced width to make space for bigger images */}
                        <col className="w-1/5" /> {/* Price column */}
                        <col className="w-[6rem] lg:w-[4rem]" /> {/* Data column with max width */}
                        <col className="w-[6rem] lg:w-[4rem]" /> {/* Validity column with max width */}
                        <col className="w-[2rem]" /> {/* Features column */}
                    </colgroup>
                    <thead>
                        <tr className="bg-gray-100 text-sm sm:text-base font-bold">
                            <th className="py-3 px-6 sm:px-3 text-left font-semibold">Provider</th>
                            <th className="py-3 px-2 sm:px-3 text-left font-semibold">Price</th>
                            <th className="py-3 px-2 sm:px-3 text-left font-semibold">Data</th>
                            <th className="py-3 px-2 sm:px-3 text-left font-semibold">Validity</th>
                            {/* Renamed to be nameless and hidden on mobile */}
                            <th className="py-3 px-2 sm:px-3 text-left font-semibold sm:text-center" aria-label="Features"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm sm:text-base bg-white font-sans tracking-wide">
                        {sortedSimData.map((sim, index) => {
                            const isExpanded = expandedRow === index;
                            return (
                                <React.Fragment key={index}>
                                    <tr className={`border-b hover:bg-gray-50 transition-colors`}>
                                        <td className="py-3 px-1 sm:px-3 flex justify-center  items-center">
                                            <Image
                                                src={providerLogos[sim.provider] || '/placeholder.svg'}
                                                alt={`${sim.provider} logo`}
                                                width={80} // Increased width
                                                height={30} // Increased height
                                                className="object-contain h-full w-auto px-2"
                                            />
                                        </td>
                                        <td className="py-3 px-2 sm:px-3 whitespace-nowrap text-gray-700 font-semibold">{convertPrice(sim.price)}</td>
                                        <td className="py-3 px-2 sm:px-3 text-gray-700 font-semibold">{sim.data}</td>
                                        <td className="py-3 px-2 sm:px-3 text-gray-700 font-semibold">{sim.validity}</td>
                                        <td className="py-3 px-2 sm:px-3 text-center">
                                            {sim.features ? (
                                                <button
                                                    onClick={() => setExpandedRow(isExpanded ? null : index)}
                                                    className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-gray-600 hover:text-gray-800 transition-colors focus:outline-none"
                                                    aria-label="Toggle features"
                                                >
                                                    {isExpanded ? '–' : '+'}
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 italic hidden sm:inline-block"></span>
                                            )}
                                        </td>
                                    </tr>
                                    {isExpanded && sim.features && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={5} className="py-3 px-4">
                                                <ul className="list-disc ml-4 space-y-1 text-sm sm:text-base text-gray-700">
                                                    {sim.features.split('\n').map((feature, featureIndex) => (
                                                        <li key={featureIndex}>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
