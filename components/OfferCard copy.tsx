"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface Offer {
    id: number;
    offer_title: string;
    bank_id: number;
    category_id: number;
    merchant_details: string;
    offer_details_1: string;
    offer_details_2?: string;
    image_url: string;
    bank_logo: string;
    discount?: string;
    offer_validity?: string;
    more_details_url?: string;
}

interface OfferCardProps {
    offer: Offer;
}

export function OfferCard({ offer }: OfferCardProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog
            open={open}
            onOpenChange={(dialogOpen) => !dialogOpen && setOpen(false)}
        >
            <DialogTrigger asChild>
                <Card
                    className="relative w-full flex flex-col border rounded-lg shadow-md bg-white overflow-hidden cursor-pointer
                     transition-all duration-150 hover:shadow-lg active:scale-95"
                    onClick={() => setOpen(true)}
                >
                    <div className="relative h-20 flex justify-center items-center overflow-hidden bg-white-100">
                        <Image
                            src={
                                offer.image_url ||
                                "https://res.cloudinary.com/ddqtjwpob/image/upload/v1709144289/restaurant_hjpgyh.png"
                            }
                            alt="Offer image"
                            width={150}
                            height={80}
                            className="object-contain"
                        />
                        <div className="absolute top-1 left-1">
                            <Image
                                src={offer.bank_logo || "/placeholder-logo.png"}
                                alt="Bank logo"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <CardContent className="p-3 flex flex-col space-y-2 items-start">
                        <p className="text-sm font-semibold truncate-2-lines w-full">
                            {offer.merchant_details}
                        </p>
                        {offer.discount && (
                            <span className="text-xs font-bold text-white bg-green-500 px-3 py-1 rounded break-words">
                                {offer.discount.length > 40
                                    ? `${offer.discount.substring(0, 37)}...`
                                    : offer.discount}
                            </span>
                        )}
                    </CardContent>
                </Card>
            </DialogTrigger>

            {/* Dialog Content */}
            <DialogContent
                className="max-w-lg sm:max-w-2xl h-[90vh] p-0 rounded-xl shadow-lg bg-white overflow-hidden"
                onCloseAutoFocus={(e) => e.preventDefault()}
                onEscapeKeyDown={() => setOpen(false)}
                onInteractOutside={() => setOpen(false)}
            >
                <div className="overflow-y-auto flex-1 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center mb-4">
                            {offer.offer_title}
                        </DialogTitle>
                        {offer.merchant_details && (
                            <DialogDescription className="text-lg font-semibold text-gray-600 text-center">
                                {offer.merchant_details}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    {offer.image_url && (
                        <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden shadow-md">
                            <Image
                                src={offer.image_url}
                                alt="Offer banner"
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="space-y-4 text-left">
                        {offer.discount && (
                            <p className="text-xl font-bold text-green-600">
                                {offer.discount}
                            </p>
                        )}

                        {offer.offer_validity && (
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
                                <Clock className="w-6 h-6 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-700">
                                        {offer.offer_validity}
                                    </span>
                                </p>
                            </div>
                        )}

                        {offer.offer_details_1 && (
                            <p className="text-base text-gray-800 whitespace-pre-line">
                                {offer.offer_details_1}
                            </p>
                        )}

                        {offer.offer_details_2 && (
                            <div className="mt-4">
                                {offer.offer_details_2.startsWith("http") ? (
                                    <Image
                                        src={offer.offer_details_2}
                                        alt="Additional details"
                                        width={500}
                                        height={300}
                                        className="object-contain rounded-lg shadow-md"
                                    />
                                ) : (
                                    <p className="text-sm">{offer.offer_details_2}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:justify-end border-t bg-gray-50">
                    {offer.more_details_url && (
                        <Button
                            className="w-full sm:w-auto bg-white text-black border border-gray-300 hover:bg-gray-100"
                            onClick={() => window.open(offer.more_details_url, "_blank")}
                        >
                            Visit Site
                        </Button>
                    )}
                    <DialogClose asChild>
                        <Button
                            className="w-full sm:w-auto bg-black text-white"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}
