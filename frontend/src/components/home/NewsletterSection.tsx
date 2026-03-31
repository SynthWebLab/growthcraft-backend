"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thanks for subscribing! We'll keep you updated.");
    setEmail("");
    setName("");
  };

  return (
    <section className="py-20 lg:py-28 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Stay in the Loop
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Don't miss our next bootcamp or hiring call. Get handpicked
            opportunities, free events, and early bird discounts.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:gap-3">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:border-primary-foreground"
              />
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus:border-primary-foreground"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Mail className="mr-2 h-5 w-5" />
              Subscribe
            </Button>
          </form>

          <p className="text-sm text-primary-foreground/60 mt-4">
            No spam, unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};
