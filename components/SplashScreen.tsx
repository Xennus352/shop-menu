"use client";

import Lottie from "lottie-react";
import animationData from "@/public/PrepareFood.json";
import { Coffee, Soup, Utensils } from "lucide-react"; // Using your existing icons
import TextType from "./TextType";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    // Background color set to your custom cream
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFEED6] overflow-hidden">
      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[10%] animate-bounce text-[#A5AF79] opacity-40">
          <Soup size={48} />
        </div>
        <div className="absolute bottom-[15%] right-[10%] animate-pulse text-[#E8A07C] opacity-40">
          <Coffee size={64} />
        </div>
        <div className="absolute top-[20%] right-[15%] animate-spin-slow text-[#827148] opacity-30">
          <Utensils size={40} />
        </div>
      </div>

      {/* Responsive Lottie Container */}
      <div className="w-full max-w-[300px] h-auto p-4">
        <Lottie
          animationData={animationData}
          loop={false}
          onComplete={onComplete}
        />
      </div>

      <div className="absolute bottom-10 text-[#3E331E] text-lg font-bold tracking-widest opacity-60">
        <TextType
          text={["အကောင်းဆုံး စားသောက်ဆိုင်"]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor
          cursorCharacter="_"
          variableSpeed={{ min: 40, max: 100 }}
        />
      </div>
    </div>
  );
}
