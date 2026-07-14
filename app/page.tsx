"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Clock,
  Star,
  Sparkles,
  Crown,
  Soup,
  Utensils,
  Heart,
} from "lucide-react";
import { colors } from "@/constant/themes";
import { getCategories } from "./actions/categoryActions";
import { getMenuItems } from "./actions/menuItemActions";
import TextType from "@/components/TextType";
import SplashScreen from "@/components/SplashScreen";

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
  tags?: string[];
  reviewCount?: number;
}

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
} as const;

const getStockStatusConfig = (status: string) => {
  const configs = {
    instock: {
      label: "ရရှိပါသည်",
      color: "text-emerald-700 bg-emerald-50",
    },
    low: {
      label: "နည်းနေသည်",
      color: "text-amber-700 bg-amber-50",
    },
    outofstock: {
      label: "ပြတ်နေသည်",
      color: "text-rose-700 bg-rose-50",
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

  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory]);

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
          style={{ background: colors.bg, color: colors.textDark }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `.scrollbar-hide::-webkit-scrollbar { display: none; } .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`,
            }}
          />

          {/* soft floating orbs */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
              animate={{ x: [0, 30, -30, 0], y: [0, -30, 30, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-32 -right-32 w-80 h-80 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.sage}15, transparent 70%)`,
              }}
            />
            <motion.div
              animate={{ x: [0, -30, 30, 0], y: [0, 30, -30, 0] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.darkPeach}15, transparent 70%)`,
              }}
            />
          </div>

          {/* header - soft gradient */}
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative z-10"
          >
            <div
              className="neu-pressed"
              style={{
                background: `linear-gradient(135deg, ${colors.olive}, #6B5F4F)`,
              }}
            >
              <div className="container mx-auto px-4 py-8 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white/95 tracking-tight flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      <ChefHat className="w-5 h-5 text-white/90" />
                    </span>
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
            </div>
          </motion.header>

          {/* main content */}
          <div className="container mx-auto max-w-9xl px-4 py-8 relative z-10">
            {/* category tabs - neumorphic */}
            <div className="flex gap-3 mb-10 overflow-x-auto pb-3 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory("all")}
                className="px-6 py-2.5 rounded-xl font-medium text-sm flex-shrink-0 transition-all duration-200"
                style={{
                  background:
                    selectedCategory === "all"
                      ? colors.olive
                      : "linear-gradient(145deg, #FAF7F2, #EDE8E0)",
                  color: selectedCategory === "all" ? "white" : colors.textDark,
                  boxShadow:
                    selectedCategory === "all"
                      ? `0 4px 12px ${colors.olive}40`
                      : "4px 4px 8px #D4CCC0, -4px -4px 8px #FFFFFF",
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
                  className="px-6 py-2.5 rounded-xl font-medium text-sm flex-shrink-0 transition-all duration-200"
                  style={{
                    background:
                      selectedCategory === cat.id
                        ? colors.olive
                        : "linear-gradient(145deg, #FAF7F2, #EDE8E0)",
                    color:
                      selectedCategory === cat.id ? "white" : colors.textDark,
                    boxShadow:
                      selectedCategory === cat.id
                        ? `0 4px 12px ${colors.olive}40`
                        : "4px 4px 8px #D4CCC0, -4px -4px 8px #FFFFFF",
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* items grid */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                      whileHover={{
                        y: -8,
                        scale: 1.02,
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        },
                      }}
                      whileTap={{ scale: 0.98 }}
                      onHoverStart={() => setHoveredItem(item.id)}
                      onHoverEnd={() => setHoveredItem(null)}
                      className="group relative rounded-3xl overflow-hidden cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.4)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.6)",
                        boxShadow: isHovered
                          ? "0 20px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset"
                          : "0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.4) inset",
                        transition: "box-shadow 0.3s ease",
                      }}
                    >
                      {/* Glow effect on hover */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 0%, rgba(232,180,160,0.15), transparent 70%)",
                        }}
                      />

                      {/* Image section */}
                      <div className="relative h-52 overflow-hidden">
                        {item.foodUrl ? (
                          <motion.img
                            src={item.foodUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.15 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${colors.surface}, ${colors.bg})`,
                            }}
                          >
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 3,
                              }}
                            >
                              <Soup
                                className="w-16 h-16"
                                style={{ color: colors.muted }}
                              />
                            </motion.div>
                          </div>
                        )}

                        {/* Enhanced gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                        {/* Shine effect on hover */}
                        <motion.div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                          style={{
                            background:
                              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
                            transform: "translateX(-100%)",
                          }}
                          animate={isHovered ? { x: "200%" } : { x: "-100%" }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                        />

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          {item.is_daily_special && (
                            <motion.div
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                              style={{
                                background:
                                  "linear-gradient(135deg, #E8B4A0, #D4A89B)",
                                boxShadow: "0 4px 12px rgba(232,180,160,0.4)",
                              }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Today's Special
                            </motion.div>
                          )}
                          <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${stockConfig.color} backdrop-blur-sm`}
                            style={{
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            }}
                          >
                            {stockConfig.label}
                          </motion.div>
                        </div>

                        {/* Price float with enhanced design */}
                        <motion.div
                          className="absolute bottom-4 right-4"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div
                            className="px-4 py-2 rounded-2xl font-bold text-sm"
                            style={{
                              background: "rgba(255,255,255,0.7)",
                              backdropFilter: "blur(12px)",
                              WebkitBackdropFilter: "blur(12px)",
                              color: colors.textDark,
                              border: "1px solid rgba(255,255,255,0.6)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                          >
                            <span className="text-xs font-medium opacity-75">
                              MMK
                            </span>{" "}
                            {item.price.toLocaleString()}
                          </div>
                        </motion.div>

                        {/* Favorite button */}
                        <motion.button
                          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: "rgba(255,255,255,0.6)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.4)",
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Heart
                            className="w-4 h-4"
                            style={{ color: colors.darkPeach }}
                          />
                        </motion.button>
                      </div>

                      {/* Content */}
                      <div className="p-5 relative">
                        {/* Decorative line */}
                        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                        <div className="flex items-start justify-between mt-1">
                          <div className="min-w-0 flex-1">
                            <h3
                              className="font-bold text-lg tracking-tight"
                              style={{ color: colors.textDark }}
                            >
                              {item.name}
                            </h3>
                            {item.name_en && (
                              <p
                                className="text-xs font-medium mt-1 opacity-60"
                                style={{ color: colors.muted }}
                              >
                                {item.name_en}
                              </p>
                            )}
                          </div>
                          {item.is_daily_special && (
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Crown
                                className="w-6 h-6 flex-shrink-0"
                                style={{ color: colors.darkPeach }}
                              />
                            </motion.div>
                          )}
                        </div>

                        {/* Tags/Categories */}
                        {item.tags && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {item.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 rounded-lg text-xs font-medium"
                                style={{
                                  background: "rgba(232,180,160,0.15)",
                                  color: colors.darkPeach,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Description with smooth animation */}
                        <motion.div
                          initial={false}
                          animate={{
                            height: isHovered ? "auto" : 0,
                            opacity: isHovered ? 1 : 0,
                          }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          {item.description && (
                            <p
                              className="text-sm mt-3 leading-relaxed opacity-80"
                              style={{ color: colors.muted }}
                            >
                              {item.description}
                            </p>
                          )}
                        </motion.div>

                        {/* Footer with enhanced design */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100/50">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4"
                                    style={{
                                      fill:
                                        i < 4 ? colors.darkPeach : "#E5DDD5",
                                      color:
                                        i < 4 ? colors.darkPeach : "#E5DDD5",
                                      filter:
                                        i < 4
                                          ? "drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                                          : "none",
                                    }}
                                  />
                                ))}
                              </div>
                              <span
                                className="text-sm ml-1.5 font-semibold"
                                style={{ color: colors.textDark }}
                              >
                                4.8
                              </span>
                            </div>
                            <span
                              className="text-xs opacity-50"
                              style={{ color: colors.muted }}
                            >
                              •
                            </span>
                            <span
                              className="text-xs opacity-50"
                              style={{ color: colors.muted }}
                            >
                              {item.reviewCount || 24} reviews
                            </span>
                          </div>

                          {/* Add to cart button appears on hover */}
                          {/* <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{
                              opacity: isHovered ? 1 : 0,
                              scale: isHovered ? 1 : 0.8,
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                            style={{
                              background:
                                "linear-gradient(135deg, #E8B4A0, #D4A89B)",
                              boxShadow: "0 4px 12px rgba(232,180,160,0.4)",
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            + Add
                          </motion.button> */}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>

            {/* loading */}
            {loading && (
              <div className="flex justify-center py-16">
                <div
                  className="animate-spin rounded-full h-10 w-10 border-[3px]"
                  style={{
                    borderColor: `${colors.olive}20`,
                    borderTopColor: colors.olive,
                  }}
                />
              </div>
            )}

            {/* empty */}
            {!loading && displayItems.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 neu-card">
                  <span className="text-3xl">🍽️</span>
                </div>
                <h3
                  className="text-xl font-medium"
                  style={{ color: colors.textDark }}
                >
                  မီနူးများ မရှိသေးပါ
                </h3>
                <p className="text-sm mt-2" style={{ color: colors.muted }}>
                  ကျေးဇူးပြု၍ နောက်မှ ပြန်လာပါ
                </p>
              </motion.div>
            )}

            
              <motion.div 
  ref={observerTarget} 
  className="relative w-full py-6"
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true }}
  transition={{ duration: 0.8 }}
>
  {/* Glass container */}
  <div 
    className="mx-4 rounded-2xl px-6 py-4 text-center"
    style={{
      background: "rgba(255,255,255,0.2)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.3)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
    }}
  >
    <div className="flex items-center justify-center gap-3">
      {/* Left decorative line */}
      <div className="hidden sm:block h-px flex-1 bg-gradient-to-r from-transparent to-gray-300/50" />
      
      {/* Content */}
      <div className="flex items-center gap-2">
        <motion.span 
          className="text-lg"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ✨
        </motion.span>
        <span 
          className="text-sm font-semibold tracking-wide"
          style={{ color: colors.textDark }}
        >
          Developed by{" "}
          <span 
            className="font-bold"
            style={{ color: colors.darkPeach }}
          >
            SMK
          </span>
        </span>
        <motion.span 
          className="text-lg"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
        >
          ✨
        </motion.span>
      </div>
      
      {/* Right decorative line */}
      <div className="hidden sm:block h-px flex-1 bg-gradient-to-l from-transparent to-gray-300/50" />
    </div>
  </div>
</motion.div>
          </div>
        </div>
      )}
    </>
  );
}
