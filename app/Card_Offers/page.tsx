'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '../../supabaseClient'
import { Button } from "@/components/ui/button"
import { ArrowUpCircle } from 'lucide-react'
import { OfferCard } from "@/components/OfferCard";

interface Bank {
  id: number
  bank_name: string
  logo: string
}

interface Category {
  id: number
  name: string
  icon_url: string
}

interface SupabaseOffer {
  id: number
  offer_title: string
  bank_id: number
  category_id: number
  merchant_details: string
  offer_details_1: string
  offer_details_2?: string
  image_url: string
  discount?: string
  offer_validity?: string
  more_details_url?: string
  banks: {
    logo: string
  }
  card_offer_categories: {
    name: string
  }
}

interface Offer {
  id: number
  offer_title: string
  bank_id: number
  category_id: number
  merchant_details: string
  offer_details_1: string
  offer_details_2?: string
  image_url: string
  bank_logo: string
  discount?: string
  offer_validity?: string
  more_details_url?: string
}

export default function Page() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [openDialogId, setOpenDialogId] = useState<number | null>(null)

  // Scroll to Top Logic
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Handle back button
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      if (openDialogId !== null) {
        e.preventDefault()
        setOpenDialogId(null)
      }
    }

    window.addEventListener('popstate', handleBackButton)
    return () => window.removeEventListener('popstate', handleBackButton)
  }, [openDialogId])

  // Update history when dialog opens/closes
  useEffect(() => {
    if (openDialogId !== null) {
      window.history.pushState({ dialogOpen: true }, '')
    }
  }, [openDialogId])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data: banksData, error: banksError } = await supabase
        .from('banks')
        .select('*')
      if (banksError) {
        console.error('Error fetching banks:', banksError)
      } else if (banksData) {
        setBanks(banksData as Bank[])
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('card_offer_categories')
        .select('*')
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError)
      } else if (categoriesData) {
        setCategories(categoriesData as Category[])
      }

      const { data: offersData, error: offersError } = await supabase
        .from('card_offers')
        .select('*, banks(logo), card_offer_categories(name)')

      if (offersError) {
        console.error('Error fetching offers:', offersError)
      } else if (offersData) {
        setOffers(
          (offersData as SupabaseOffer[]).map((offer) => ({
            id: offer.id,
            offer_title: offer.offer_title,
            bank_id: offer.bank_id,
            category_id: offer.category_id,
            merchant_details: offer.merchant_details,
            offer_details_1: offer.offer_details_1,
            offer_details_2: offer.offer_details_2,
            image_url: offer.image_url,
            discount: offer.discount,
            offer_validity: offer.offer_validity,
            more_details_url: offer.more_details_url,
            bank_logo: offer.banks.logo,
          }))
        )
      }

      if (banksData && banksData.length > 0) {
        setSelectedBankId((banksData[0] as Bank).id)
      }
    }

    fetchData()
  }, [])

  // Filter offers based on selected bank and category
  const filteredOffers = offers.filter((offer) =>
    (selectedBankId !== null && offer.bank_id === selectedBankId) &&
    (selectedCategoryId === null || offer.category_id === selectedCategoryId)
  )

  return (
    <div className="container mx-auto p-4 space-y-6 overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Bank Card Offers</h1>

      {/* Bank Selection */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Select Your Bank</h2>
        <div className="grid w-full gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          {banks.map((bank) => {
            const isSelected = selectedBankId === bank.id
            return (
              <Button
                key={bank.id}
                variant="outline"
                className={`
                  flex items-center justify-center text-center overflow-hidden 
                  py-4 px-2 min-h-[64px] md:min-h-[96px]
                  ${isSelected ? "border-4 border-black" : ""}
                `}
                onClick={() => {
                  const newSelected = isSelected ? null : bank.id
                  setSelectedBankId(newSelected)
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <Image
                    src={bank.logo}
                    alt={`${bank.bank_name} logo`}
                    width={120}
                    height={60}
                    className="object-contain md:h-[100px] h-[50px] w-[140px]"
                  />
                </div>
              </Button>
            )
          })}
        </div>
      </section>

      {/* Category Selection */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold mt-6">Select a Category</h2>
        <div className="flex flex-wrap gap-2 w-full">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "outline"}
              className="flex flex-col items-center space-y-2 h-auto py-4 px-2 min-w-[0px] flex-1"
              onClick={() => {
                const newSelected = selectedCategoryId === category.id ? null : category.id
                setSelectedCategoryId(newSelected)
              }}
            >
              <div className="relative w-24 h-14 flex items-center justify-center">
                <Image
                  src={category.icon_url || "https://res.cloudinary.com/ddqtjwpob/image/upload/v1709144289/restaurant_hjpgyh.png"}
                  alt={`${category.name} icon`}
                  fill
                  className={`object-contain ${selectedCategoryId === category.id ? "invert" : ""}`}
                />
              </div>
              <span className="font-medium text-base text-center">{category.name}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Offers */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Available Offers</h2>
        {selectedBankId === 9 ? (
          <p className="text-md pt-4 pb-4">Coming soon ...</p>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 via-black-500 to-purple-500 text-white rounded-full shadow-lg 
               flex items-center justify-center 
               hover:scale-110 transition-transform duration-200 ease-in-out
               focus:outline-none focus:ring-4 focus:ring-black-300"
          aria-label="Scroll to top"
        >
          <ArrowUpCircle size={28} />
        </button>
      )}
    </div>
  )
}
