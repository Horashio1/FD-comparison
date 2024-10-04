import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronUp, ChevronDown } from 'lucide-react'

// Define the type for the term
type TermType = '6' | '12' | '24';

// Define the type for the bank data
type BankData = {
  id: number;
  name: string;
  logo: string;
  rates: {
    [key in TermType]: number;
  };
};

// Configurable JSON structure for bank list and rates
const banksData: BankData[] = [
  {
    id: 1,
    name: 'Commercial Bank',
    logo: 'https://res.cloudinary.com/ddqtjwpob/image/upload/v1728054937/combank1_b22jn5.png',
    rates: { '6': 7.64, '12': 7.50, '24': 8.50 }
  },
  {
    id: 2,
    name: 'Sampath Bank',
    logo: 'https://res.cloudinary.com/ddqtjwpob/image/upload/v1728055341/sampath_bvnd65.png',
    rates: { '6': 7.50, '12': 8.0, '24': 10.0 }
  },
  {
    id: 3,
    name: 'HNB',
    logo: 'https://res.cloudinary.com/ddqtjwpob/image/upload/v1728057690/hnb_duntmg.png',
    rates: { '6': 7.50, '12': 7.50, '24': 9.15 }
  },
  {
    id: 4,
    name: 'Peoples Bank',
    logo: 'https://res.cloudinary.com/ddqtjwpob/image/upload/v1728058093/peoples_bank_uhneut.png',
    rates: { '6': 7.25, '12': 7.75, '24': 8.0 }
  },
  {
    id: 5,
    name: 'Bank of Ceylon',
    logo: 'https://res.cloudinary.com/ddqtjwpob/image/upload/v1728058220/BOC_bank_hudndt.png',
    rates: { '6': 7.25, '12': 7.75, '24': 7.75 }
  }
]

export default function Component() {
  const [showAll, setShowAll] = useState(false)
  const [depositAmount, setDepositAmount] = useState(1000000)
  const [term, setTerm] = useState<TermType>('12')

  const handleAmountChange = (increment: number) => {
    setDepositAmount(prev => Math.max(0, prev + increment))
  }

  const sortedBanks = useMemo(() => {
    return [...banksData].sort((a, b) => b.rates[term] - a.rates[term])
  }, [term])

  const displayedBanks = showAll ? sortedBanks : sortedBanks.slice(0, 10)

  const calculateReturn = (amount: number, rate: number) => {
    const monthlyRate = rate / 100 / 12
    const months = parseInt(term)
    return amount * Math.pow(1 + monthlyRate, months)
  }

  return (
    <Card className="w-full max-w-[95vw] sm:max-w-4xl mx-auto">
      <CardHeader className="px-2 sm:px-4 md:px-6 pb-8">
        <CardTitle className="text-xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-center text-primary leading-tight">
          <span className="inline-block">Sri Lankan</span>{' '}
          <span className="inline-block">Fixed Deposit Comparison</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 md:px-6 pt-0">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => setShowAll(false)}
              variant={showAll ? "outline" : "default"}
              className={`text-xs sm:text-sm md:text-base py-1 sm:py-6 px-1 sm:px-7 rounded-full transition-all duration-300 ${
                showAll ? 'bg-background text-primary' : 'bg-primary text-primary-foreground shadow-lg'
              }`}
            >
              Top 10
            </Button>
            <Button
              onClick={() => setShowAll(true)}
              variant={showAll ? "default" : "outline"}
              className={`text-xs sm:text-sm md:text-base py-1 sm:py-6 px-1 sm:px-8 rounded-full transition-all duration-300 ${
                showAll ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-background text-primary'
              }`}
            >
              All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="depositAmount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Deposit (LKR)
              </label>
              <Input
                id="depositAmount"
                type="text"
                value={depositAmount.toLocaleString()}
                readOnly
                className="pr-12 text-xs sm:text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex flex-col mt-6">
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
            <div>
              <label htmlFor="term" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Term
              </label>
              <Select onValueChange={(value) => setTerm(value as TermType)} defaultValue={term}>
                <SelectTrigger id="term" className="text-xs sm:text-sm">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">1 year</SelectItem>
                  <SelectItem value="24">2 years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6">
            <div className="inline-block min-w-full py-2 align-middle">
              <Table className="min-w-full divide-y divide-gray-300">
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3.5 pl-2 sm:pl-6 pr-3 text-left text-xs sm:text-sm font-semibold text-gray-900">Institution</TableHead>
                    <TableHead className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900">Rate (%)</TableHead>
                    <TableHead className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900">Return at Maturity (LKR)</TableHead>
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
                        {calculateReturn(depositAmount, bank.rates[term]).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-500 mt-4">
            Disclaimer: The rates and calculations provided are for illustrative purposes only. Actual returns may vary. Please consult with the respective financial institutions for the most up-to-date and accurate information.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}