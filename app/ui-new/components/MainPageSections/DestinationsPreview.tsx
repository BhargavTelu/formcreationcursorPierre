"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase, type Destination } from "@/lib/supabase";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay } from "swiper/modules";

import "swiper/css";

interface DestinationsPreviewProps {
  onPlanTrip: () => void;
}

export const DestinationsPreview = ({ onPlanTrip }: DestinationsPreviewProps) => {
  const [regions, setRegions] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  const swiperRef = useRef<SwiperType | null>(null);
  const directionRef = useRef<"forward" | "backward">("forward");

  useEffect(() => {
    const fetchRegions = async () => {
      const { data } = await supabase
        .from("destinations")
        .select("id, name, image_url, parent_id")
        .order("name");

      setRegions((data || []).filter((d) => d.parent_id === null));
      setLoading(false);
    };

    fetchRegions();
  }, []);

  // Reverse direction on loop
  useEffect(() => {
    if (!swiperRef.current) return;

    const swiper = swiperRef.current;

    const handleReachEnd = () => {
      if (directionRef.current === "forward") {
        directionRef.current = "backward";
        swiper.autoplay.stop();
        swiper.params.autoplay!.reverseDirection = true;
        swiper.autoplay.start();
      }
    };

    const handleReachBeginning = () => {
      if (directionRef.current === "backward") {
        directionRef.current = "forward";
        swiper.autoplay.stop();
        swiper.params.autoplay!.reverseDirection = false;
        swiper.autoplay.start();
      }
    };

    swiper.on("reachEnd", handleReachEnd);
    swiper.on("reachBeginning", handleReachBeginning);

    return () => {
      swiper.off("reachEnd", handleReachEnd);
      swiper.off("reachBeginning", handleReachBeginning);
    };
  }, []);

  if (loading || regions.length === 0) return null;

  return (
    <section className="py-24 bg-stone-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">
            Iconic Destinations
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            A glimpse into Africa’s most extraordinary regions — each offering
            its own story, landscape, and rhythm.
          </p>
        </div>
      </div>

      {/* Animated Carousel */}
      <Swiper
        modules={[Autoplay]}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        slidesPerView={3.5}
        spaceBetween={24}
        loop={false}
        allowTouchMove={false}
        speed={6000}
        autoplay={{
          delay: 0,
          disableOnInteraction: false,
          reverseDirection: false,
        }}
        breakpoints={{
          0: { slidesPerView: 1.3 },
          640: { slidesPerView: 2.2 },
          1024: { slidesPerView: 3.5 },
        }}
        className="px-6"
      >
        {regions.map((region) => (
          <SwiperSlide key={region.id}>
            <div className="group rounded-2xl bg-white shadow-sm overflow-hidden">
              <div className="relative h-56 w-full">
                {region.image_url && (
                  <Image
                    src={region.image_url}
                    alt={region.name}
                    fill
                    className="object-cover transition-transform duration-[4000ms] group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/10" />
              </div>

              <div className="p-5 text-center">
                <h3 className="text-base font-serif">
                  {region.name}
                </h3>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
