"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import Image from 'next/image';
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronUp, ChevronDown, Landmark, ExternalLink } from 'lucide-react';
import { MobileNumberSelector } from '@/components/NumberSelector';

type TermType = '6' | '12' | '24';

type BankData = {
  bank_name: string;
  logo: string | null;
  rates: {
    [key in TermType]: {
      maturity: number | null;
      annual_effective: number | null;
    };
  };
  link: string;
};

type RateRow = {
  bank_name: string;
  logo: string | null;
  link: string;
  rate_6_maturity: number | null;
  rate_6_annual_effective: number | null;
  rate_12_maturity: number | null;
  rate_12_annual_effective: number | null;
  rate_24_maturity: number | null;
  rate_24_annual_effective: number | null;
};

export default function Component() {
  const [banksData, setBanksData] = useState<BankData[]>([]);
  const [showAll, setShowAll] = useState(true); // Default to All view
  const [depositAmount, setDepositAmount] = useState(1_000_000);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const termOptions: { label: string; value: TermType }[] = [
    { label: '6 months', value: '6' },
    { label: '1 year', value: '12' },
    { label: '2 years', value: '24' },
  ];

  // Use const assertion without explicit type annotation
  const validTerms = ['6', '12', '24'] as const;

  const [term, setTerm] = useState<TermType>('12');

  // On selection, highlight both annual_effective and maturity columns for that term
  const [selectedColumn, setSelectedColumn] = useState<string>(`rate_${term}_maturity`);

  // Always descending sorting
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({
    key: selectedColumn,
    direction: 'descending',
  });

  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);

  useEffect(() => {
    const fetchBanks = async () => {
      const { data, error } = await supabase.from('fd_rates_new').select('*');
      if (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load bank data. Please try again later.');
      } else {
        const formattedData: BankData[] = (data as RateRow[]).map((item) => ({
          bank_name: item.bank_name,
          logo: item.logo || null,
          link: item.link,
          rates: {
            '6': {
              maturity: item.rate_6_maturity,
              annual_effective: item.rate_6_annual_effective,
            },
            '12': {
              maturity: item.rate_12_maturity,
              annual_effective: item.rate_12_annual_effective,
            },
            '24': {
              maturity: item.rate_24_maturity,
              annual_effective: item.rate_24_annual_effective,
            },
          },
        }));
        setBanksData(formattedData);
      }
    };

    fetchBanks();
  }, []);

  const handleAmountChange = (increment: number) => {
    setDepositAmount((prev) => Math.max(0, Math.min(10_000_000, prev + increment)));
  };

  const requestSort = (key: string) => {
    // Always descending
    // const direction: 'descending' = 'descending';
    const direction = 'descending' as const;
    setSortConfig({ key, direction });
    setSelectedColumn(key);

    // Update term if different column from another term
    const parts = key.split('_');
    const newTerm = parts[1] as TermType;
    setTerm(newTerm);
  };

  // When term changes programmatically, default to maturity column of that term
  useEffect(() => {
    const newKey = `rate_${term}_maturity`;
    requestSort(newKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const sortedBanks = useMemo(() => {
    const sortableBanks = [...banksData]; 
    if (sortConfig !== null) {
      sortableBanks.sort((a, b) => {
        let aValue: number | string | null;
        let bValue: number | string | null;

        if (sortConfig.key === 'bank_name') {
          aValue = a.bank_name.toLowerCase();
          bValue = b.bank_name.toLowerCase();
        } else if (sortConfig.key.startsWith('rate')) {
          const parts = sortConfig.key.split('_');
          const termKey = parts[1] as TermType;
          const rateType = parts[2] as 'annual_effective' | 'maturity';
          aValue = a.rates[termKey][rateType];
          bValue = b.rates[termKey][rateType];
        } else {
          return 0;
        }

        const valA = aValue != null ? aValue : -Infinity;
        const valB = bValue != null ? bValue : -Infinity;

        // always descending
        if (valA < valB) return 1;
        if (valA > valB) return -1;
        return 0;
      });
    }
    return sortableBanks;
  }, [banksData, sortConfig]);

  // Show top 5 or all
  const displayedBanks = showAll ? sortedBanks : sortedBanks.slice(0, 5);

  const calculateReturn = (amount: number, rate: number | null, months = 12) => {
    if (rate == null) return null;
    const annualRate = rate / 100;
    const years = months / 12;
    return amount * Math.pow(1 + annualRate, years);
  };

  // Sync selectedBanks with displayedBanks
  useEffect(() => {
    setSelectedBanks((prev) => prev.filter((b) => displayedBanks.some((db) => db.bank_name === b)));
    displayedBanks.forEach((b) => {
      if (!selectedBanks.includes(b.bank_name)) {
        setSelectedBanks((prev) => [...prev, b.bank_name]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedBanks]);

  const maturityAmount = (bank: BankData) => {
    const chosenTerm = parseInt(term);
    const chosenRate = bank.rates[term].annual_effective;
    const amount = calculateReturn(depositAmount, chosenRate, chosenTerm);
    return amount != null && !isNaN(amount) ? Math.floor(amount).toLocaleString() : 'N/A';
  };

  // Determine the term from selectedColumn (rate_TERM_xxx)
  const parts = selectedColumn.split('_');
  const selectedTerm = parts[1] as TermType;

  // Highlight both annual and maturity columns for selectedTerm + always highlight maturity amount column
  const highlightAnnualKey = `rate_${selectedTerm}_annual_effective`;
  const highlightMaturityKey = `rate_${selectedTerm}_maturity`;

  // Classes for subtle highlighting
  const normalHeading = "text-sm font-normal text-gray-900 transition-all duration-300 text-center align-middle";
  const highlightHeading = "text-sm font-normal text-gray-900 bg-gray-100 transition-all duration-300 text-center align-middle";
  const normalCell = "text-sm font-normal text-gray-700 transition-all duration-300";
  const highlightCell = "text-sm font-normal text-gray-700 transition-all duration-300 bg-gray-100";

  // Always highlight maturity amount column
  const maturityAmountHighlight = "bg-gray-100";

  const isTermSelected = (t: TermType) => t === selectedTerm;
  const isColumnHighlighted = (colKey: string) => {
    return colKey === highlightAnnualKey || colKey === highlightMaturityKey;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Title text="Sri Lanka Fixed Deposits" />

        <div className="space-y-8">
          {errorMessage && (
            <p className="text-xs sm:text-sm text-red-500 mt-4">
              {errorMessage}
            </p>
          )}

          {/* Top 5 / All Buttons */}
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => setShowAll(false)}
              variant={showAll ? "outline" : "default"}
              className={`text-xs sm:text-sm md:text-base py-2 sm:py-3 px-4 sm:px-6 rounded-full transition-all duration-300 ${
                showAll ? 'bg-background text-primary' : 'bg-primary text-primary-foreground shadow-lg'
              }`}
            >
              Top 5
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="depositAmount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Deposit Amount (Rs.)
              </label>
              <div className="sm:hidden">
                <MobileNumberSelector
                  value={depositAmount}
                  onChange={setDepositAmount}
                  min={0}
                  max={10_000_000}
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
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <div className="inline-block min-w-full align-middle">
              <Table className="min-w-full border-separate border-spacing-0">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    {/* Sticky Institution Header */}
                    <TableHead
                      rowSpan={2}
                      className={`${normalHeading} py-3.5 pl-2 sm:pl-6 pr-3 border-r border-gray-300 text-left sticky left-0 z-10 bg-white`}
                    >
                      Institution
                    </TableHead>

                    {/* Terms Headers */}
                    {termOptions.map(({ label, value }) => (
                      <TableHead
                        key={value}
                        colSpan={2}
                        className={`${isTermSelected(value) ? "bg-gray-100" : ""} ${normalHeading} border-r border-gray-300`}
                      >
                        {label}
                      </TableHead>
                    ))}

                    {/* Maturity Amount */}
                    <TableHead
                      rowSpan={2}
                      className={`${normalHeading} px-3 py-3.5 ${maturityAmountHighlight} border-r border-gray-300 text-left`}
                    >
                      Maturity Amount (Rs.)
                    </TableHead>

                    {/* Link */}
                    <TableHead
                      rowSpan={2}
                      className={`${normalHeading} px-3 py-3.5 text-left`}
                    >
                      Link
                    </TableHead>
                  </TableRow>

                  {/* Subheaders */}
                  <TableRow className="bg-gray-50">
                    {validTerms.flatMap((t) => [
                      <TableHead
                        key={`${t}_annual`}
                        onClick={() => requestSort(`rate_${t}_annual_effective`)}
                        className={`cursor-pointer px-3 py-2 border-b border-gray-300 text-left ${
                          isColumnHighlighted(`rate_${t}_annual_effective`) && isTermSelected(t)
                            ? highlightHeading
                            : normalHeading
                        }`}
                      >
                        Annual Rate (%)
                      </TableHead>,
                      <TableHead
                        key={`${t}_maturity`}
                        onClick={() => requestSort(`rate_${t}_maturity`)}
                        className={`cursor-pointer px-3 py-2 border-b border-gray-300 text-left ${
                          isColumnHighlighted(`rate_${t}_maturity`) && isTermSelected(t)
                            ? `${highlightHeading} border-r border-gray-300`
                            : `${normalHeading} border-r border-gray-300`
                        }`}
                      >
                        Maturity Rate (%)
                      </TableHead>,
                    ])}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-200 bg-white">
                  {displayedBanks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="py-4 text-center text-gray-500">
                        No data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedBanks.map((bank) => (
                      <TableRow
                        key={bank.bank_name}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {/* Sticky Institution Cell */}
                        <TableCell
                          className={`${normalCell} py-4 pl-2 sm:pl-6 pr-3 align-middle border-r border-gray-300 text-left sticky left-0 z-10 bg-white`}
                        >
                          <div className="flex items-center">
                            {bank.logo ? (
                              <Image
                                src={bank.logo}
                                alt={`${bank.bank_name} logo`}
                                width={120}
                                height={120}
                                className="h-12 w-12 flex-shrink-0 rounded-full"
                              />
                            ) : (
                              <Landmark className="h-12 w-12 flex-shrink-0 text-gray-400" />
                            )}
                            <div className="ml-2 sm:ml-4 break-words text-gray-900">
                              {bank.bank_name}
                            </div>
                          </div>
                        </TableCell>

                        {/* Data for terms */}
                        {validTerms.flatMap((t) => [
                          <TableCell
                            key={`${bank.bank_name}_${t}_annual`}
                            className={`px-3 py-4 align-middle text-left ${
                              isTermSelected(t) && isColumnHighlighted(`rate_${t}_annual_effective`)
                                ? highlightCell
                                : normalCell
                            }`}
                          >
                            {bank.rates[t]?.annual_effective != null
                              ? `${bank.rates[t].annual_effective.toFixed(2)}%`
                              : 'N/A'}
                          </TableCell>,
                          <TableCell
                            key={`${bank.bank_name}_${t}_maturity`}
                            className={`px-3 py-4 align-middle text-left ${
                              isTermSelected(t) && isColumnHighlighted(`rate_${t}_maturity`)
                                ? `${highlightCell} border-r border-gray-300`
                                : `${normalCell} border-r border-gray-300`
                            }`}
                          >
                            {bank.rates[t]?.maturity != null
                              ? `${bank.rates[t].maturity.toFixed(2)}%`
                              : 'N/A'}
                          </TableCell>,
                        ])}

                        {/* Maturity Amount */}
                        <TableCell
                          className={`${normalCell} px-3 py-4 align-middle ${maturityAmountHighlight} border-r border-gray-300 text-center`}
                        >
                          {maturityAmount(bank)}
                        </TableCell>

                        {/* Link */}
                        <TableCell className="px-3 py-4 text-xs sm:text-sm text-blue-500 align-middle text-center">
                          <Button
                            variant="link"
                            className="flex items-center gap-2 flex-1 text-xs sm:text-sm justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(bank.link, '_blank');
                            }}
                          >
                            Visit Site <ExternalLink size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 mt-4">
            Disclaimer: The rates and calculations provided are for illustrative purposes only. Actual returns may vary.
            Please consult with the respective financial institutions for the most up-to-date and accurate information.
          </p>
        </div>
      </div>
    </div>
  );
}
