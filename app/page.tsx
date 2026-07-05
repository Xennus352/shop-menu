"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Clock,
  Star,
  Sparkles,
  Heart,
  Flame,
  Crown,
  Coffee,
  Soup,
  Utensils,
} from "lucide-react";
import { colors } from "@/constant/themes";
import { getCategories } from "./actions/categoryActions";
import { getMenuItems } from "./actions/menuItemActions";
import TextType from "@/components/TextType";
import SplashScreen from "@/components/SplashScreen";

// Database Schema shapes
interface DbCategory {
  id: string;
  name: string;
  name_en: string | null;
  display_order: number;
}

interface DbMenuItem {
  id: string;
  category_id: string;
  name: string;
  name_en: string | null;
  price: number;
  foodUrl: string | null;
  description: string | null;
  is_available: boolean;
  stock_status: "instock" | "low" | "outofstock";
  is_daily_special: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: { type: "spring", stiffness: 300, damping: 20 },
    boxShadow: "0 20px 40px rgba(0,0,0,0.12), 0 10px 20px rgba(0,0,0,0.08)",
  },
} as const;

const getStockStatusConfig = (status: string) => {
  const configs = {
    instock: {
      label: "ရရှိပါသည်",
      color: "bg-green-100 text-green-800 border-green-300",
    },
    low: {
      label: "နည်းနေသည်",
      color: "bg-amber-100 text-amber-800 border-amber-300",
    },
    outofstock: {
      label: "ပြတ်နေသည်",
      color: "bg-red-100 text-red-800 border-red-300",
    },
  };
  return configs[status as keyof typeof configs] || configs.instock;
};

export default function Home() {
  const [items, setItems] = useState<DbMenuItem[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // PERFORMANCE: Lazy Loading States
  const [visibleCount, setVisibleCount] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const [fetchedCats, fetchedItems] = await Promise.all([
          getCategories(),
          getMenuItems(),
        ]);
        setCategories(fetchedCats || []);
        setItems(fetchedItems || []);
      } catch (err) {
        console.error("Error connecting menu database:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  const displayItems = useMemo(() => {
    return selectedCategory === "all"
      ? items.filter((item) => item.is_available)
      : items.filter(
          (item) => item.category_id === selectedCategory && item.is_available,
        );
  }, [items, selectedCategory]);

  // Reset lazy load count when category changes
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, []);

  const dailySpecialItem = items.find(
    (item) => item.is_daily_special && item.is_available,
  );

  const handleAnimationComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <SplashScreen onComplete={handleAnimationComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {!showSplash && (
        <div
          className="min-h-screen relative pb-12"
          style={{ background: colors.cream, color: colors.textDark }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`,
            }}
          />

          {/* Animated Background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
              animate={{ x: [0, 40, -40, 0], y: [0, -40, 40, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-15"
              style={{ background: colors.sage }}
            />
            <motion.div
              animate={{ x: [0, -40, 40, 0], y: [0, 40, -40, 0] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15"
              style={{ background: colors.darkPeach }}
            />
          </div>

          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative shadow-xl z-10"
            style={{
              background: `linear-gradient(135deg, ${colors.olive}, #5C4F33)`,
            }}
          >
            <div className="container mx-auto px-4 py-6 flex items-center justify-between">
              <div>
  <h1 className="text-xl md:text-3xl font-bold text-white tracking-tight flex flex-nowrap items-center gap-2 whitespace-nowrap">
    <ChefHat className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
    <TextType
      text={["အကောင်းဆုံး စားသောက်ဆိုင် Menu"]}
      typingSpeed={75}
      pauseDuration={1500}
      showCursor
      cursorCharacter="_"
      variableSpeed={{ min: 40, max: 100 }}
    />
  </h1>
</div>
            </div>
          </motion.header>

          {/* Main Content */}
          <div className="container mx-auto max-w-5xl px-4 py-6 relative z-10">
            {/* Category Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className="px-5 py-2.5 rounded-full font-medium text-sm shadow-sm transition-all border-2 flex-shrink-0"
                style={{
                  background:
                    selectedCategory === "all" ? colors.olive : "white",
                  color: selectedCategory === "all" ? "white" : colors.textDark,
                  borderColor:
                    selectedCategory === "all"
                      ? colors.olive
                      : `${colors.olive}20`,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-4 h-4" />
                  အားလုံး
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="px-5 py-2.5 rounded-full font-medium text-sm shadow-sm transition-all border-2 flex-shrink-0"
                  style={{
                    background:
                      selectedCategory === cat.id ? colors.olive : "white",
                    color:
                      selectedCategory === cat.id ? "white" : colors.textDark,
                    borderColor:
                      selectedCategory === cat.id
                        ? colors.olive
                        : `${colors.olive}20`,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {displayItems.slice(0, visibleCount).map((item) => {
                  const stockConfig = getStockStatusConfig(item.stock_status);
                  const isHovered = hoveredItem === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      layout
                      initial="hidden"
                      animate="visible"
                      whileHover={{ y: -6, scale: 1.01 }}
                      onHoverStart={() => setHoveredItem(item.id)}
                      onHoverEnd={() => setHoveredItem(null)}
                      className="group relative rounded-3xl overflow-hidden cursor-pointer"
                      style={{
                        background:
                          "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(248,250,252,0.8))",
                        border: "1px solid rgba(148,163,184,0.25)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {/* IMAGE SECTION (floating style) */}
                      <div className="relative h-56 overflow-hidden">
                        {item.foodUrl ? (
                          <motion.img
                            src={item.foodUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.12 }}
                            transition={{ duration: 0.6 }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Soup className="w-14 h-14 text-gray-300" />
                          </div>
                        )}

                        {/* dark overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                        {/* BADGES */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {item.is_daily_special && (
                            <div className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Today Special
                            </div>
                          )}

                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border ${
                              item.stock_status === "instock"
                                ? "bg-green-500/20 text-green-700 border-green-300"
                                : item.stock_status === "low"
                                  ? "bg-amber-500/20 text-amber-700 border-amber-300"
                                  : "bg-red-500/20 text-red-700 border-red-300"
                            }`}
                          >
                            {stockConfig.label}
                          </div>
                        </div>

                        {/* PRICE FLOAT */}
                        <div className="absolute bottom-3 right-3">
                          <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md shadow-md">
                            <span className="font-bold text-gray-900">
                              {item.price.toLocaleString()} ကျပ်
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 truncate">
                              {item.name}
                            </h3>
                            {item.name_en && (
                              <p className="text-xs text-gray-400 font-medium truncate">
                                {item.name_en}
                              </p>
                            )}
                          </div>

                          {item.is_daily_special && (
                            <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                          )}
                        </div>

                        {/* DESCRIPTION (animated reveal) */}
                        {item.description && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{
                              opacity: isHovered ? 1 : 0,
                              height: isHovered ? "auto" : 0,
                            }}
                            className="text-sm text-gray-500 mt-2 line-clamp-2"
                          >
                            {item.description}
                          </motion.p>
                        )}

                        {/* FOOTER */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-amber-400">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < 4 ? "fill-amber-400" : "fill-gray-200 text-gray-200"}`}
                                />
                              ))}
                            </div>
                            <span className="text-md text-gray-400 ml-1">
                              (8.5)
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-12">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
                  style={{ borderColor: colors.olive }}
                />
              </div>
            )}

            {/* Empty State */}
            {!loading && displayItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">🍽️</div>
                <h3
                  className="text-xl font-medium"
                  style={{ color: colors.textDark }}
                >
                  မီနူးများ မရှိသေးပါ
                </h3>
                <p className="text-sm mt-2" style={{ color: colors.olive }}>
                  ကျေးဇူးပြု၍ နောက်မှ ပြန်လာပါ
                </p>
              </motion.div>
            )}

            {/* Sentinel for infinite scroll */}
            <div ref={observerTarget} className="h-10 w-full" />
          </div>
        </div>
      )}
    </>
  );
}
