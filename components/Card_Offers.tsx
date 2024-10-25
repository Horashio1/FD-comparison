'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type BankCard = 'Commercial Bank Credit' | 'Commercial Bank Debit' | 'NDB Bank Credit' | 'NDB Bank Debit' | 'Nations Trust Credit' | 'Nations Trust Debit' | 'Sampath Bank Credit' | 'Sampath Bank Debit'
type Category = 'Restaurants' | 'Hotels' | 'Supermarket'

interface Offer {
  id: string
  title: string
  eligibleCards: BankCard[]
  category: Category
  description: string
  details: string
}

const offers: Offer[] = [
  { id: '1', title: '20% Off Dining', eligibleCards: ['Commercial Bank Credit', 'Commercial Bank Debit'], category: 'Restaurants', description: '20% off at selected restaurants', details: 'Valid until 31st December 2023. Maximum discount of $50 per transaction.' },
  { id: '2', title: 'Hotel Discount', eligibleCards: ['NDB Bank Credit'], category: 'Hotels', description: '15% off on hotel bookings', details: 'Minimum stay of 2 nights required. Booking must be made through the bank\'s travel portal.' },
  { id: '3', title: 'Supermarket Cashback', eligibleCards: ['Nations Trust Credit'], category: 'Supermarket', description: '5% cashback on supermarket purchases', details: 'Cashback capped at $30 per month. Valid only at partner supermarkets.' },
  { id: '4', title: 'Buy 1 Get 1 Free', eligibleCards: ['Sampath Bank Credit', 'Sampath Bank Debit'], category: 'Restaurants', description: 'Buy 1 Get 1 Free on main courses', details: 'Offer valid only on weekdays. Participating restaurants may vary.' },
  { id: '5', title: 'Spa Treatment Discount', eligibleCards: ['Commercial Bank Debit'], category: 'Hotels', description: '10% off on spa treatments', details: 'Valid at select hotel spas. Advance booking required.' },
  { id: '6', title: 'Double Points on Groceries', eligibleCards: ['NDB Bank Credit', 'NDB Bank Debit'], category: 'Supermarket', description: 'Double points on grocery shopping', details: 'Points are credited within 7 working days. Terms and conditions apply.' },
  { id: '7', title: 'Family Dining Offer', eligibleCards: ['Nations Trust Debit'], category: 'Restaurants', description: '25% off on family dining', details: 'Valid for groups of 4 or more. Not applicable on public holidays.' },
  { id: '8', title: 'First Online Grocery Order', eligibleCards: ['Sampath Bank Debit'], category: 'Supermarket', description: '10% off on first online grocery order', details: 'Minimum order value of $50 required. One-time use per card.' },
]

// export default function CardOffers() {
export default function Component() {

  const [selectedCards, setSelectedCards] = useState<BankCard[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const filteredOffers = offers.filter(offer =>
    (selectedCards.length === 0 || offer.eligibleCards.some(card => selectedCards.includes(card))) &&
    (selectedCategory === null || offer.category === selectedCategory)
  )

  const toggleCard = (card: BankCard) => {
    setSelectedCards(prev =>
      prev.includes(card) ? prev.filter(c => c !== card) : [...prev, card]
    )
  }

  const selectCategory = (category: Category) => {
    setSelectedCategory(prev => prev === category ? null : category)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Bank Card Offers</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Select Your Cards</h2>
        <p className="text-sm text-muted-foreground">Choose one or more cards to see relevant offers</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['Commercial Bank Credit', 'Commercial Bank Debit', 'NDB Bank Credit', 'NDB Bank Debit', 'Nations Trust Credit', 'Nations Trust Debit', 'Sampath Bank Credit', 'Sampath Bank Debit'].map((card) => (

            <Button
              key={card}
              variant={selectedCards.includes(card as BankCard) ? "default" : "outline"}
              className="h-16 px-2 flex items-center justify-start text-left overflow-hidden"
              onClick={() => toggleCard(card as BankCard)}
            >
              <Image
                src={'https://res.cloudinary.com/ddqtjwpob/image/upload/v1728052840/seylan_r0puh2.png'}
                alt={`${card} logo`}
                width={32}
                height={32}
                className="rounded-full mr-2 flex-shrink-0"
              />
              <span className="font-medium text-xs leading-tight line-clamp-2">{card}</span>
            </Button>




          ))}
        </div>
      </section>



      <section className="space-y-4">
          <h2 className="text-xl font-semibold">Select a Category</h2>
          <div className="flex gap-4 w-full">
          {['Restaurants', 'Hotels', 'Supermarket'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="flex-1 flex flex-col items-center space-y-2 h-auto py-2 min-w-0"
                onClick={() => selectCategory(category as Category)}
              >
                <Image
                  src="https://res.cloudinary.com/ddqtjwpob/image/upload/v1709144289/restaurant_hjpgyh.png"
                  alt={`${category} icon`}
                  width={60}
                  height={60}
                />
                <span className="font-medium">{category}</span>
              </Button>
            ))}
          </div>
        </section>



      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Available Offers</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <CardTitle>{offer.title}</CardTitle>
                <CardDescription>{offer.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{offer.description}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Eligible cards: {offer.eligibleCards.join(', ')}
                </p>
              </CardContent>
              <CardFooter>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">More Details</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{offer.title}</DialogTitle>
                      <DialogDescription>{offer.category}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <p>{offer.description}</p>
                      <p className="text-sm text-muted-foreground">{offer.details}</p>
                      <p className="text-sm font-medium">Eligible cards:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {offer.eligibleCards.map((card, index) => (
                          <li key={index}>{card}</li>
                        ))}
                      </ul>
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