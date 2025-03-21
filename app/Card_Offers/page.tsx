'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '../../supabaseClient'
import { Button } from "@/components/ui/button"
import { ArrowUpCircle } from 'lucide-react'
import { OfferCard } from "@/components/OfferCard"

// ---- Interfaces ----
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
  updated_at: string
  bank_id: number
  category_id: number
  merchant_details: string
  offer_details_1: string
  offer_details_2?: string
  image_url: string
  discount?: string
  offer_validity?: string
  more_details_url?: string
  banks: { logo: string } | { logo: string }[]
  card_offer_categories: { name: string }[]
}

interface Offer {
  id: number
  offer_title: string
  updated_at: string
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
  // ---- States ----
  const [banks, setBanks] = useState<Bank[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [offers, setOffers] = useState<Offer[]>([])

  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

  const [openDialogId, setOpenDialogId] = useState<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  
  // More granular loading states
  const [isLoadingEssentials, setIsLoadingEssentials] = useState(true)
  const [isLoadingOffers, setIsLoadingOffers] = useState(true)
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)

  // ---- Scroll to Top Logic ----
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ---- Handle Back Button (Dialog) ----
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

  // ---- Update history when dialog opens/closes ----
  useEffect(() => {
    if (openDialogId !== null) {
      window.history.pushState({ dialogOpen: true }, '')
    }
  }, [openDialogId])

  // ---- Scroll to top function ----
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Helper function to preload images and return a promise
  const preloadImage = (url: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (!url) {
        resolve()
        return
      }
      const img = new window.Image()
      img.src = url
      img.onload = () => resolve()
      img.onerror = () => resolve() // Still resolve on error to prevent blocking
    })
  }

  // ---- Step 1: Fetch Banks and Categories and Preload Their Images ----
  useEffect(() => {
    const fetchEssentialData = async () => {
      try {
        // 1) Fetch banks and categories
        const [banksRes, categoriesRes] = await Promise.all([
          supabase.from('banks').select('*'),
          supabase.from('card_offer_categories').select('*'),
        ])

        if (banksRes.error) {
          throw new Error(`Error fetching banks: ${banksRes.error.message}`)
        }
        if (categoriesRes.error) {
          throw new Error(`Error fetching categories: ${categoriesRes.error.message}`)
        }

        const fetchedBanks = (banksRes.data || []) as Bank[]
        const fetchedCategories = (categoriesRes.data || []) as Category[]

        // 2) Select initial bank and category
        const initialBank = fetchedBanks.length > 0 ? fetchedBanks[0] : null
        const initialCategory =
          fetchedCategories.length > 2
            ? fetchedCategories[2]
            : fetchedCategories.length > 0
            ? fetchedCategories[0]
            : null

        // 3) Preload bank logos and category icons
        const bankLogos = fetchedBanks.map(bank => bank.logo).filter(Boolean)
        const categoryIcons = fetchedCategories.map(category => category.icon_url).filter(Boolean)

        // Prioritize initial selection logos
        const initialLogos = [
          initialBank?.logo,
          initialCategory?.icon_url
        ].filter(Boolean) as string[]
        
        const otherLogos = [...bankLogos, ...categoryIcons].filter(
          url => !initialLogos.includes(url)
        )

        // First preload the initial logos (critical path)
        await Promise.all(initialLogos.map(preloadImage))
        
        // Set banks and categories data as soon as initial logos are loaded
        setBanks(fetchedBanks)
        setCategories(fetchedCategories)
        
        if (initialBank) {
          setSelectedBankId(initialBank.id)
        }
        if (initialCategory) {
          setSelectedCategoryId(initialCategory.id)
        }
        
        // Then preload the rest of logos in background
        Promise.all(otherLogos.map(preloadImage))
        
        setIsLoadingEssentials(false)
        
      } catch (err) {
        console.error("Error loading essential data:", err)
        setIsLoadingEssentials(false)
      }
    }

    fetchEssentialData()
  }, [])

  // ---- Step 2: Fetch Offers and Preload Initial Selection Offers ----
  useEffect(() => {
    // Only start loading offers after essential data is loaded
    if (isLoadingEssentials || !selectedBankId || !selectedCategoryId) {
      return
    }

    const fetchOffersData = async () => {
      try {
        // 1) Fetch all offers using pagination
        let allOffers: SupabaseOffer[] = []
        let page = 0
        const pageSize = 1000

        while (true) {
          const offersRes = await supabase
            .from('card_offers')
            .select(
              `id, offer_title, updated_at, bank_id, category_id,
               merchant_details, offer_details_1, offer_details_2, 
               image_url, discount, offer_validity, more_details_url,
               banks(logo), card_offer_categories(name)`
            )
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (offersRes.error) {
            throw new Error(`Error fetching offers: ${offersRes.error.message}`)
          }
          
          if (!offersRes.data || offersRes.data.length === 0) {
            break // No more records to fetch
          }
          
          allOffers = [...allOffers, ...offersRes.data]
          page++
        }

        // 2) Transform offers to our local Offer shape
        const fetchedOffers: Offer[] = allOffers.map((offer) => ({
          id: offer.id,
          offer_title: offer.offer_title,
          updated_at: offer.updated_at,
          bank_id: offer.bank_id,
          category_id: offer.category_id,
          merchant_details: offer.merchant_details,
          offer_details_1: offer.offer_details_1,
          offer_details_2: offer.offer_details_2,
          image_url: offer.image_url,
          discount: offer.discount,
          offer_validity: offer.offer_validity,
          more_details_url: offer.more_details_url,
          bank_logo: Array.isArray(offer.banks)
            ? (offer.banks[0]?.logo || "")
            : (offer.banks?.logo || ""),
        }))

        // Set offers data right away
        setOffers(fetchedOffers)
        
        // 3) Preload initial offer images for selected bank and category (critical path)
        const initialOffers = fetchedOffers.filter(
          offer => offer.bank_id === selectedBankId && offer.category_id === selectedCategoryId
        )
        
        const initialOfferImages = initialOffers.map(offer => offer.image_url).filter(Boolean)
        
        // Preload initial offer images
        await Promise.all(initialOfferImages.map(preloadImage))
        
        setIsLoadingOffers(false)
        setIsLoadingComplete(true)
        
        // 4) Background preload the rest of the offers for this bank and other categories
        const bankOfferImages = fetchedOffers
          .filter(offer => offer.bank_id === selectedBankId && offer.category_id !== selectedCategoryId)
          .map(offer => offer.image_url)
          .filter(Boolean)
          
        // Do this in the background without awaiting
        Promise.all(bankOfferImages.map(preloadImage))
          .then(() => {
            // 5) Then preload remaining offers in background with low priority
            const remainingOfferImages = fetchedOffers
              .filter(offer => offer.bank_id !== selectedBankId)
              .map(offer => offer.image_url)
              .filter(Boolean)
              
            // Load these with very low priority, in batches
            const chunkSize = 10
            for (let i = 0; i < remainingOfferImages.length; i += chunkSize) {
              const chunk = remainingOfferImages.slice(i, i + chunkSize)
              setTimeout(() => {
                chunk.forEach(url => {
                  const img = new window.Image()
                  img.src = url
                })
              }, (i / chunkSize) * 500) // Staggered loading with 500ms between batches
            }
          })
          
      } catch (err) {
        console.error("Error loading offers:", err)
        setIsLoadingOffers(false)
        setIsLoadingComplete(true)
      }
    }

    fetchOffersData()
  }, [isLoadingEssentials, selectedBankId, selectedCategoryId])

  // ---- Preload Images on Selection Change (After Initial Load) ----
  useEffect(() => {
    if (isLoadingComplete && selectedBankId !== null && selectedCategoryId !== null) {
      const filteredOfferImages = offers
        .filter((offer) => offer.bank_id === selectedBankId && offer.category_id === selectedCategoryId)
        .map((offer) => offer.image_url)
        .filter(Boolean)

      // Preload images for the current selection
      Promise.all(filteredOfferImages.map(preloadImage))
    }
  }, [selectedBankId, selectedCategoryId, offers, isLoadingComplete])

  // Show loading spinner if essential data isn't loaded yet
  if (isLoadingEssentials) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
        {/* <p className="ml-4">Loading banks...</p> */}
      </div>
    )
  }

  // ---- Filter Offers Based on Selected Bank and Category ----
  const filteredOffers = offers.filter((offer) =>
    (selectedBankId == null || offer.bank_id === selectedBankId) &&
    (selectedCategoryId == null || offer.category_id === selectedCategoryId)
  )

  // ---- Find the Most Recent Updated Date ----
  const lastUpdatedDateStr = filteredOffers.reduce((latest: string | null, o) => {
    if (!o.updated_at) return latest
    return (!latest || o.updated_at > latest) ? o.updated_at : latest
  }, null)

  const lastUpdatedFormatted = lastUpdatedDateStr
    ? (() => {
        const lastUpdatedDate = new Date(lastUpdatedDateStr)
        const now = new Date()
        const diffTime = now.getTime() - lastUpdatedDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays === 0) return "Today"
        if (diffDays === 1) return "1 day ago"
        return `${diffDays} days ago`
      })()
    : null

  return (
    <div className="container mx-auto p-4 space-y-6 overflow-x-hidden">
      <h1 className="text-2xl font-bold mb-4">Bank Card Offers</h1>

      {/* Bank Selection */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Select Your Bank</h2>
        <div className="grid w-full gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-7">
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
                    priority={true}
                  />
                </div>
              </Button>
            )
          })}
        </div>
      </section>

      {/* Category Selection */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold mt-10">Select a Category</h2>
        <div className="flex flex-wrap gap-2 w-full md:grid md:grid-cols-7">
          {categories
            .sort((a, b) => a.id - b.id)
            .map((category) => {
              const isSelected = selectedCategoryId === category.id
              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  className="flex flex-col items-center space-y-2 h-auto py-4 px-2 min-w-[0px] flex-1 md:flex-none"
                  onClick={() => {
                    const newSelected = isSelected ? null : category.id
                    setSelectedCategoryId(newSelected)
                  }}
                >
                  <div className="relative w-24 h-14 flex items-center justify-center">
                    <Image
                      src={
                        category.icon_url ||
                        "https://res.cloudinary.com/ddqtjwpob/image/upload/v1709144289/restaurant_hjpgyh.png"
                      }
                      alt={`${category.name} icon`}
                      fill
                      className={`object-contain ${isSelected ? "invert" : ""}`}
                      priority={true}
                    />
                  </div>
                  <span className="font-medium text-base md:text-lg text-center">{category.name}</span>
                </Button>
              )
            })}
        </div>
      </section>

      {/* Offers */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold mt-10">Available Offers</h2>

        {selectedBankId && filteredOffers.length > 0 && lastUpdatedFormatted && (
          <small className="text-gray-500">
            Last updated {lastUpdatedFormatted}
          </small>
        )}

        {!selectedBankId && (
          <p className="text-md pt-4 pb-4">Please select a bank to view offers.</p>
        )}

        {selectedBankId === 9 && (
          <p className="text-md pt-4 pb-4">Coming soon ...</p>
        )}

        {isLoadingOffers && selectedBankId && selectedBankId !== 9 && (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
            <p className="ml-4">Loading offers...</p>
          </div>
        )}

        {!isLoadingOffers && selectedBankId && selectedBankId !== 9 && (
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