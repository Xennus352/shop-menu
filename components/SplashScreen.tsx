"use client";

import Lottie from "lottie-react";
import animationData from "@/public/PrepareFood.json";
import { Coffee, Soup, Utensils } from "lucide-react";
import TextType from "./TextType";
import { colors } from "@/constant/themes";

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: colors.bg }}
    >
      {/* Floating Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[12%] left-[12%] animate-bounce opacity-30"
          style={{ color: colors.sage }}
        >
          <Soup size={48} />
        </div>
        <div
          className="absolute bottom-[18%] right-[12%] animate-pulse opacity-30"
          style={{ color: colors.darkPeach }}
        >
          <Coffee size={64} />
        </div>
        <div
          className="absolute top-[22%] right-[18%] opacity-25"
          style={{ color: colors.olive }}
        >
          <Utensils size={40} />
        </div>
      </div>

      {/* Lottie Container */}
      <div className="w-full max-w-[280px] h-auto p-4">
        <Lottie
          animationData={animationData}
          loop={false}
          onComplete={onComplete}
        />
      </div>

      <div
        className="absolute bottom-12 text-lg font-bold tracking-widest opacity-60"
        style={{ color: colors.textDark }}
      >
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
