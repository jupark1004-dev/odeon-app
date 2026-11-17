import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/dashboard/summary — B1F 아티스트 스튜디오 요약
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "뮤지션만 접근할 수 있습니다." }, { status: 403 });
        }

        const artistId = user.id;

        const [artist, liveCount, postCount, totalTickets, cheerCount, recentCheers, recentTickets] =
            await Promise.all([
                prisma.user.findUnique({
                    where: { id: artistId },
                    select: { username: true, genre: true, bio: true },
                }),
                prisma.liveStream.count({ where: { artistId } }),
                prisma.post.count({ where: { artistId } }),
                prisma.ticket.count({ where: { stream: { artistId } } }),
                prisma.cheer.count({ where: { receiverId: artistId } }),
                prisma.cheer.findMany({
                    where: { receiverId: artistId },
                    orderBy: { createdAt: "desc" },
                    take: 6,
                    include: {
                        sender: { select: { username: true } },
                        stream: { select: { title: true } },
                    },
                }),
                prisma.ticket.findMany({
                    where: { stream: { artistId } },
                    orderBy: { createdAt: "desc" },
                    take: 6,
                    include: {
                        user: { select: { username: true } },
                        stream: { select: { title: true } },
                    },
                }),
            ]);

        return NextResponse.json({
            artist,
            totalTickets,
            cheerCount,
            liveCount,
            postCount,
            recentCheers,
            recentTickets,
        });
    } catch (error) {
        console.error("[DASHBOARD SUMMARY]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
