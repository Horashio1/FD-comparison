'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '../../supabaseClient'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { ExternalLink } from 'lucide-react'

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
  const maxTitleLength = 75
  const maxMerchantDetailsLength = 75

  const [banks, setBanks] = useState<Bank[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

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
        setSelectedBankId((banksData[0] as Bank).id);
      }
    }

    fetchData()
  }, [])

  const filteredOffers = offers.filter((offer) =>
    (selectedBankId !== null && offer.bank_id === selectedBankId) &&
    (selectedCategoryId === null || offer.category_id === selectedCategoryId)
  )

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Bank Card Offers</h1>

      {/* Bank Selection */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Select Your Bank</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {banks.map((bank) => (
            <Button
              key={bank.id}
              variant={selectedBankId === bank.id ? "default" : "outline"}
              className="h-16 px-2 flex items-center justify-start text-left overflow-hidden"
              onClick={() => {
                const newSelected = selectedBankId === bank.id ? null : bank.id;
                setSelectedBankId(newSelected);
              }}
            >
              <Image
                src={bank.logo}
                alt={`${bank.bank_name} logo`}
                width={100}
                height={100}
                className="mr-2 flex-shrink-0 max-h-[40px] object-contain"
              />
              <span className="font-medium text-base leading-tight line-clamp-2">{bank.bank_name}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Category Selection */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Select a Category</h2>
        <div className="flex gap-4 w-full">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategoryId === category.id ? "default" : "outline"}
              className="flex-1 flex flex-col items-center space-y-2 h-auto py-2 min-w-0"
              onClick={() => {
                const newSelected = selectedCategoryId === category.id ? null : category.id;
                setSelectedCategoryId(newSelected);
              }}
            >
              <Image
                src={category.icon_url || "https://res.cloudinary.com/ddqtjwpob/image/upload/v1709144289/restaurant_hjpgyh.png"}
                alt={`${category.name} icon`}
                width={60}
                height={60}
                className={selectedCategoryId === category.id ? "invert" : ""}
              />
              <span className="font-medium text-base">{category.name}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Offers */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Available Offers</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="relative h-[500px] flex flex-col">
              {/* Banner Image */}
              <div className="relative w-full h-40">
                <Image
                  src={offer.image_url || 'https://res.cloudinary.com/ddqtjwpob/image/upload/v1709144289/restaurant_hjpgyh.png'}
                  alt="Offer image"
                  width={500}
                  height={200}
                  className="object-cover w-full h-full"
                />
                <div className="absolute top-1 left-1 bg-null p-1 rounded-full">
                  <Image
                    src={offer.bank_logo || '/placeholder-logo.png'}
                    alt="Bank logo"
                    width={150}
                    height={150}
                    className="object-contain w-auto h-auto max-w-[80px] max-h-[40px] rounded-md border-1 shadow-lg"
                  />
                </div>
              </div>

              <CardHeader className="flex-none">
                <CardTitle className="text-xl font-bold">
                  {offer.offer_title.length > maxTitleLength
                    ? `${offer.offer_title.substring(0, offer.offer_title.lastIndexOf(' ', maxTitleLength))}...`
                    : offer.offer_title}
                </CardTitle>
                {offer.merchant_details && (
                  <CardDescription className="text-sm font-semibold text-muted-foreground">
                    {offer.merchant_details.length > maxMerchantDetailsLength
                      ? `${offer.merchant_details.substring(0, offer.merchant_details.lastIndexOf(' ', maxMerchantDetailsLength))}...`
                      : offer.merchant_details}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-grow overflow-hidden">
                {offer.discount && (
                  <p className="text-lg font-bold text-green-600 mb-2">
                    {offer.discount.length > 80
                      ? `${offer.discount.substring(0, offer.discount.lastIndexOf(' ', 80))}...`
                      : offer.discount}
                  </p>
                )}
                {offer.offer_details_1 && (
                  <p
                    className="text-sm overflow-hidden text-ellipsis whitespace-pre-line"
                    style={{
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                    }}
                  >
                    {offer.offer_details_1}
                  </p>
                )}
              </CardContent>

              <CardFooter className="flex-none">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                      View Offer Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl h-[90vh] p-0 flex flex-col">
                    <div className="overflow-y-auto flex-1">
                      <div className="p-6">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold mb-2">{offer.offer_title}</DialogTitle>
                          {offer.merchant_details && (
                            <DialogDescription className="text-lg font-semibold text-muted-foreground">
                              {offer.merchant_details}
                            </DialogDescription>
                          )}
                        </DialogHeader>

                        {offer.image_url && (
                          <div className="relative w-full h-48 mb-4">
                            <Image
                              src={offer.image_url}
                              alt="Offer banner"
                              fill
                              className="object-cover rounded-lg"
                            />
                          </div>
                        )}

                        <div className="space-y-4">
                          {offer.discount && (
                            <p className="text-xl font-bold text-green-600">{offer.discount}</p>
                          )}

                          {offer.offer_details_1 && (
                            <p className="whitespace-pre-line">{offer.offer_details_1}</p>
                          )}

                          {offer.offer_validity && (
                            <p className="text-sm text-muted-foreground">
                              Valid until: {offer.offer_validity}
                            </p>
                          )}

                          {offer.offer_details_2 && (
                            <div className="mt-4">
                              {offer.offer_details_2.startsWith('http') ? (
                                <Image
                                  src={offer.offer_details_2}
                                  alt="Additional details"
                                  layout="responsive"
                                  width={500}
                                  height={300}
                                  className="rounded-lg"
                                />
                              ) : (
                                <p className="text-sm">{offer.offer_details_2}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 p-6 border-t bg-background">
                      <DialogClose asChild>
                        <Button variant="outline" className="flex-1">
                          Close
                        </Button>
                      </DialogClose>
                      {offer.more_details_url && (
                        <Button
                          className="flex items-center gap-2 flex-1"
                          onClick={() => window.open(offer.more_details_url, '_blank')}
                        >
                          Visit Site <ExternalLink size={16} />
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}