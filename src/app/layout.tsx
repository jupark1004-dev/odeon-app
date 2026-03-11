import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "@/styles/globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Odeon — 아티스트와 팬을 연결하는 음악 플랫폼",
    description: "라이브 방송, 데일리 포스트, 초코 후원으로 아티스트를 응원하세요.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body className={outfit.variable}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
