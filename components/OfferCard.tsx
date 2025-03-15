"use client";

import { useEffect, useState, useRef } from "react";
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
import { Clock, Share2 } from "lucide-react";
import Image from "next/image";

interface Offer {
  id: number;
  offer_title: string;
  bank_id: number;
  bank_name?: string;
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
  const cardRef = useRef<HTMLDivElement>(null);
  const merchantRef = useRef<HTMLParagraphElement>(null);
  const discountRef = useRef<HTMLDivElement>(null);

  const originalMerchant = offer.merchant_details || "";
  const originalDiscount = offer.discount || "";

  // Build custom share URL
  const shareUrl = `https://bestrate.lk/card_offers/${offer.bank_id}/${offer.id}`;

  const handleShare = () => {
    const textToShare = `
Check out this offer!
Title: ${offer.offer_title}
Merchant: ${offer.merchant_details}
Bank: ${offer.bank_name || "N/A"}
Validity: ${offer.offer_validity || "N/A"}
View Offer: ${shareUrl}
`;
    if (navigator.share) {
      navigator
        .share({
          title: offer.offer_title,
          text: textToShare,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
        textToShare
      )}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  // ====================
  // Handle mobile back button to close the dialog
  // ====================
  useEffect(() => {
    if (open) {
      history.pushState(null, "");
    }
    const handlePopState = () => {
      if (open) {
        setOpen(false);
        history.forward();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open]);

  // ====================
  // Improved text truncation
  // ====================
  function truncateText(element: HTMLElement, text: string, maxHeight: number): boolean {
    if (!element) return false;
    
    // Reset content to full text
    element.textContent = text;
    
    // If it fits, we're done
    if (element.scrollHeight <= maxHeight) {
      return false;
    }
    
    // Binary search for the right truncation point
    let low = 0;
    let high = text.length;
    let mid;
    let truncated = false;
    
    while (low < high) {
      mid = Math.floor((low + high + 1) / 2);
      element.textContent = text.substring(0, mid) + "...";
      
      if (element.scrollHeight <= maxHeight) {
        low = mid;
        truncated = true;
      } else {
        high = mid - 1;
      }
    }
    
    // Final adjustment
    element.textContent = text.substring(0, low) + (low < text.length ? "..." : "");
    return truncated;
  }

  // Apply truncation with proper line height calculation
  const applyTruncation = () => {
    if (!merchantRef.current || !discountRef.current) return;
    
    // Calculate max height for merchant (3 lines)
    const merchantStyle = window.getComputedStyle(merchantRef.current);
    const merchantLineHeight = parseFloat(merchantStyle.lineHeight) || parseFloat(merchantStyle.fontSize) * 1.2;
    const merchantMaxHeight = merchantLineHeight * 3;
    
    // Calculate max height for discount (2 lines)
    const discountStyle = window.getComputedStyle(discountRef.current);
    const discountLineHeight = parseFloat(discountStyle.lineHeight) || parseFloat(discountStyle.fontSize) * 1.2;
    const discountMaxHeight = discountLineHeight * 2;
    
    // Apply truncation
    truncateText(merchantRef.current, originalMerchant, merchantMaxHeight);
    if (originalDiscount) {
      // For the discount, we need to handle the inner text node
      const discountSpan = discountRef.current.querySelector('span');
      if (discountSpan) {
        truncateText(discountSpan, originalDiscount, discountMaxHeight);
      }
    }
  };

  // Initial truncation and resize handler
  useEffect(() => {
    // Set a delay to ensure the DOM is fully rendered
    const timeoutId = setTimeout(applyTruncation, 100);
    
    // Handle window resize
    const handleResize = () => {
      clearTimeout(timeoutId);
      setTimeout(applyTruncation, 50);
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [originalMerchant, originalDiscount]);

  return (
    <Dialog
      open={open}
      onOpenChange={(dialogOpen) => {
        if (!dialogOpen) setOpen(false);
      }}
    >
      <DialogTrigger asChild>
        <Card
          ref={cardRef}
          className="
            relative
            w-full
            flex
            flex-col
            border
            rounded-lg
            shadow-md
            bg-white
            overflow-hidden
            cursor-pointer
            transition-all
            duration-150
            hover:shadow-lg
            active:scale-95
          "
          onClick={() => setOpen(true)}
        >
          <div className="relative h-40 flex justify-center items-center overflow-hidden bg-white-100">
            <Image
              src={
                offer.image_url ||
                "https://res.cloudinary.com/ddqtjwpob/image/upload/v1709144289/restaurant_hjpgyh.png"
              }
              alt="Offer image"
              width={150}
              height={80}
              className="object-contain w-full h-full"
            />
            <div className="absolute top-1 left-1">
              <Image
                src={offer.bank_logo || "/placeholder-logo.png"}
                alt="Bank logo"
                width={20}
                height={20}
                className="object-contain sm:w-15 sm:h-15"
              />
            </div>
          </div>
          <CardContent className="p-3 flex flex-col space-y-2 items-start">
            {/* Merchant (clamped to 3 lines) */}
            <p
              ref={merchantRef}
              className="text-md sm:text-lg font-bold w-full leading-tight overflow-hidden"
            >
              {originalMerchant}
            </p>
            {/* Discount container - changed to div with inner span for better truncation control */}
            {offer.discount && (
              <div
                ref={discountRef}
                className="inline-block max-w-full"
              >
                <span className="
                  text-xs
                  sm:text-base
                  font-bold
                  sm:font-large
                  text-white
                  bg-[#36b753]
                  px-3
                  py-1
                  rounded
                  inline-block
                  break-words
                  overflow-hidden
                ">
                  {originalDiscount}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent
        className="
          max-w-full
          sm:max-w-2xl
          h-[90vh]
          p-0
          rounded-xl
          shadow-lg
          bg-white
          overflow-hidden
        "
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => setOpen(false)}
        onInteractOutside={() => setOpen(false)}
      >
        <div className="overflow-y-auto flex-1 p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-4">
              {offer.offer_title}
            </DialogTitle>
            {offer.merchant_details &&
              offer.merchant_details !== offer.offer_title && (
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
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 768px"
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
        <div className="flex flex-col gap-2 border-t bg-gray-50 p-4">
          <div className="flex w-full gap-2">
            {offer.more_details_url && (
              <Button
                onClick={() => window.open(offer.more_details_url, "_blank")}
                className="bg-gray-200 text-black hover:bg-gray-300 w-1/2 h-12"
              >
                Visit Site
              </Button>
            )}
            <Button
              onClick={handleShare}
              className={`
                bg-gray-200
                text-black
                hover:bg-gray-300
                flex
                items-center
                justify-center
                ${offer.more_details_url ? "w-1/2" : "w-full"}
                h-12
              `}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          <DialogClose asChild>
            <Button
              className="w-full bg-black text-white hover:bg-black h-12"
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