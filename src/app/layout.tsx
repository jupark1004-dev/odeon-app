import type { Metadata } from "next";
import "@/styles/globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
    title: "B1F — 지하 1층 연습실 & 언더그라운드 라이브하우스",
    description: "지하 연습실의 땀방울부터 약속된 라이브 무대까지. 뮤지션과 관객이 서사를 함께 만드는 전용 라이브하우스 B1F.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
