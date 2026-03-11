import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard/summary — 아티스트 대시보드 요약
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "아티스트만 접근할 수 있습니다." }, { status: 403 });
        }

        const artistId = user.id;

        const [artist, liveCount, postCount, recentDonations] = await Promise.all([
            prisma.user.findUnique({
                where: { id: artistId },
                select: { choco_balance: true, username: true },
            }),
            prisma.liveStream.count({ where: { artistId } }),
            prisma.post.count({ where: { artistId } }),
            prisma.chocoTransaction.findMany({
                where: { receiverId: artistId },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    sender: { select: { username: true } },
                    stream: { select: { title: true } },
                },
            }),
        ]);

        const totalEarned = await prisma.chocoTransaction.aggregate({
            where: { receiverId: artistId },
            _sum: { amount: true },
        });

        return NextResponse.json({
            chocoBalance: artist?.choco_balance ?? 0,
            totalEarned: totalEarned._sum.amount ?? 0,
            liveCount,
            postCount,
            recentDonations,
        });
    } catch (error) {
        console.error("[DASHBOARD SUMMARY]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
