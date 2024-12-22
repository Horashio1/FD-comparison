"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "../../supabaseClient";
// import Title from "@/components/Title"; // Removed since it's unused
import { motion, AnimatePresence } from "framer-motion";

export default function AboutPage() {
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (subscribeNewsletter && !userEmail) {
      alert("Please provide an email to subscribe to the newsletter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("user_feedback").insert({
        feedback_type: feedbackType,
        feedback,
        user_email: userEmail || null,
        subscribed: subscribeNewsletter,
      });

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFeedbackType(null);
        setFeedback("");
        setUserEmail("");
        setSubscribeNewsletter(false);
      }, 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        alert("An error occurred while submitting your feedback. Please try again.");
      } else {
        console.error("Unknown error:", err);
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-green-600 text-white flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-4xl font-bold">Thank You!</h2>
              <p className="text-l">Your feedback helps us improve BestRates.lk</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="container mx-auto px-4 py-12 max-w-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-8">About BestRates.lk</h1>

        <motion.div
          className="text-xl text-gray-800 mt-8 space-y-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="leading-relaxed">
            At BestRates.lk, we&apos;re passionate about helping Sri Lankans find the best financial
            deals and rates. Our platform is designed to make comparing and choosing financial
            products simple and transparent.
          </p>
          <p className="leading-relaxed">
            Your feedback drives our improvements and helps us better serve our community. We value
            every suggestion and work continuously to enhance your experience.
          </p>
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Share Your Thoughts</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Type of Feedback</label>
              <Select onValueChange={(value) => setFeedbackType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comment">💬 General Feedback</SelectItem>
                  <SelectItem value="Bug">🐞 Issue</SelectItem>
                  <SelectItem value="Idea">💡  Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Your Feedback</label>
              <Textarea
                className="h-32"
                placeholder="We'd love to hear your thoughts..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-gray-700 font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required={subscribeNewsletter}
              />
            </div>

            <div className="ml-2 flex items-center space-x-3">
              <input
                type="checkbox"
                checked={subscribeNewsletter}
                onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                id="subscribe"
                className="w-6 h-6"
              />
              <label htmlFor="subscribe" className="text-gray-700">
                Keep me updated with new features
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg font-semibold rounded-lg shadow-lg transform transition-transform hover:scale-105"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback →"}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </>
  );
}
