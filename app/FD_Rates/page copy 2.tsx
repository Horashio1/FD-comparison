"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import Image from 'next/image';
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MobileNumberSelector } from '@/components/NumberSelector';

type TermType = '6' | '12' | '24';

type BankData = {
    id: number;
    name: string;
    logo: string;
    rates: {
        [key in TermType]: number;
    };
};

export default function Component() {
    const [banksData, setBanksData] = useState<BankData[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [depositAmount, setDepositAmount] = useState(1000000);
    const [term, setTerm] = useState<TermType>('12');

    useEffect(() => {
        const fetchBanks = async () => {
            const { data, error } = await supabase.from('fd_rates').select('*');
            if (error) {
                console.error('Error fetching data:', error);
            } else {
                const formattedData: BankData[] = data.map((item) => ({
                    id: item.id,
                    name: item.name,
                    logo: item.logo,
                    rates: {
                        '6': item.rate_6,
                        '12': item.rate_12,
                        '24': item.rate_24,
                    },
                }));
                setBanksData(formattedData);
            }
        };

        fetchBanks();
    }, []);

    const handleAmountChange = (increment: number) => {
        setDepositAmount((prev) => Math.max(0, Math.min(10000000, prev + increment)));
    };

    const sortedBanks = useMemo(() => {
        return [...banksData].sort((a, b) => b.rates[term] - a.rates[term]);
    }, [banksData, term]);

    const displayedBanks = showAll ? sortedBanks : sortedBanks.slice(0, 10);

    const calculateReturn = (amount: number, rate: number) => {
        const monthlyRate = rate / 100 / 12;
        const months = parseInt(term);
        return Math.floor(amount * Math.pow(1 + monthlyRate, months));
    };

    // Define term options
    const termOptions: { label: string; value: TermType }[] = [
        { label: '6 months', value: '6' },
        { label: '1 year', value: '12' },
        { label: '2 years', value: '24' },
    ];

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <Title text="Sri Lanka Fixed Deposits" />

                <div className="space-y-8">
                    {/* Top 10 / All Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                        <Button
                            onClick={() => setShowAll(false)}
                            variant={showAll ? "outline" : "default"}
                            className={`text-xs sm:text-sm md:text-base py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-all duration-300 ${
                                showAll ? 'bg-background text-primary' : 'bg-primary text-primary-foreground shadow-lg'
                            }`}
                        >
                            Top 10
                        </Button>
                        <Button
                            onClick={() => setShowAll(true)}
                            variant={showAll ? "default" : "outline"}
                            className={`text-xs sm:text-sm md:text-base py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-all duration-300 ${
                                showAll ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-background text-primary'
                            }`}
                        >
                            All
                        </Button>
                    </div>

                    {/* Deposit Amount and Term Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Deposit Amount */}
                        <div>
                            <label htmlFor="depositAmount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Deposit Amount (Rs.)
                            </label>
                            <div className="sm:hidden">
                                <MobileNumberSelector
                                    value={depositAmount}
                                    onChange={setDepositAmount}
                                    min={0}
                                    max={10000000}
                                    step={200000}
                                />
                            </div>
                            <div className="hidden sm:block relative">
                                <Input
                                    id="depositAmount"
                                    type="text"
                                    value={depositAmount.toLocaleString()}
                                    readOnly
                                    className="pr-12 text-xs sm:text-sm"
                                />
                                <div className="absolute inset-y-0 right-0 flex flex-col">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-1/2 w-8 rounded-none rounded-tr"
                                        onClick={() => handleAmountChange(200000)}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                        <span className="sr-only">Increase amount</span>
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-1/2 w-8 rounded-none rounded-br"
                                        onClick={() => handleAmountChange(-200000)}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Decrease amount</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Term Selection with Buttons */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Term
                            </label>
                            <div className="flex w-full gap-x-4">
                                {termOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        onClick={() => setTerm(option.value)}
                                        variant={term === option.value ? "default" : "outline"}
                                        className={`flex-1 text-xs sm:text-sm py-2 px-4 rounded ${
                                            term === option.value
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background text-primary'
                                        }`}
                                        aria-pressed={term === option.value}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Banks Table */}
                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full py-2 align-middle">
                            <Table className="min-w-full divide-y divide-gray-300">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="py-3.5 pl-2 sm:pl-6 pr-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                                            Institution
                                        </TableHead>
                                        <TableHead className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900">
                                            Rate (%)
                                        </TableHead>
                                        <TableHead className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900">
                                            Return at Maturity (Rs.)
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-200">
                                    {displayedBanks.map((bank) => (
                                        <TableRow key={bank.id}>
                                            <TableCell className="py-4 pl-2 sm:pl-6 pr-3 text-xs sm:text-sm">
                                                <div className="flex items-center">
                                                    <Image
                                                        src={bank.logo}
                                                        alt={`${bank.name} logo`}
                                                        width={120}
                                                        height={120}
                                                        className="h-12 w-12 flex-shrink-0 rounded-full"
                                                    />
                                                    <div className="ml-2 sm:ml-4 break-words">
                                                        <div className="font-medium text-gray-900">{bank.name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-3 py-4 text-xs sm:text-sm text-gray-500">
                                                {bank.rates[term].toFixed(2)}%
                                            </TableCell>
                                            <TableCell className="px-3 py-4 text-xs sm:text-sm text-gray-500">
                                                {Math.floor(calculateReturn(depositAmount, bank.rates[term])).toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs sm:text-sm text-gray-500 mt-4">
                        Disclaimer: The rates and calculations provided are for illustrative purposes only. Actual returns may vary.
                        Please consult with the respective financial institutions for the most up-to-date and accurate information.
                    </p>
                </div>
            </div>
        </div>
    );
}
