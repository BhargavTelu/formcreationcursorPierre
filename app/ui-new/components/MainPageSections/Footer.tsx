"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-stone-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Top Section */}
        <div className="grid gap-16 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-serif text-amber-500 mb-4">
              Finest Africa
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              We design bespoke African journeys defined by elegance, expertise,
              and unforgettable moments — tailored entirely around you.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-sm tracking-widest text-white/60 mb-6">
              EXPLORE
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="hover:text-amber-400 transition">Destinations</li>
              <li className="hover:text-amber-400 transition">Experiences</li>
              <li className="hover:text-amber-400 transition">About Us</li>
              <li className="hover:text-amber-400 transition">Travel Journal</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm tracking-widest text-white/60 mb-6">
              SUPPORT
            </h4>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="hover:text-amber-400 transition">FAQs</li>
              <li className="hover:text-amber-400 transition">
                Travel Insurance
              </li>
              <li className="hover:text-amber-400 transition">
                Terms & Conditions
              </li>
              <li className="hover:text-amber-400 transition">
                Privacy Policy
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm tracking-widest text-white/60 mb-6">
              CONTACT
            </h4>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-400" />
                +1 (888) 555-0123
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-400" />
                hello@finestafrica.com
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-amber-400" />
                <span>
                  123 Adventure Lane
                  <br />
                  San Francisco, CA
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-16" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-white/50">
          <p>
            © {new Date().getFullYear()} Finest Africa. All rights reserved.
          </p>

          <p className="tracking-widest">
            CRAFTED WITH CARE • AFRICA
          </p>
        </div>
      </div>
    </footer>
  );
};
