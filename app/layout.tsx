import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "အကောင်းဆုံး စားသောက်ဆိုင် | နည်းပညာတက္ကသိုလ်အနီး",
  description: `နည်းပညာတက္ကသိုလ် လမ်းမကြီးဘေး၊ ခြောက်လမ်းထိပ်အနီးရှိ အရသာထူးကဲသော စားသောက်ဆိုင်။
အစားအသောက်ကောင်း၊ သန့်ရှင်းသပ်ရပ်ပြီး ဝန်ဆောင်မှုကောင်းမွန်မှုရှိသည်။
ဆက်သွယ်ရန်: 09428170159 / 09767677914`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="my">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
