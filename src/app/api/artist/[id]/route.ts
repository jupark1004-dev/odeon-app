import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/artist/[id] — 아티스트 프로필 + 무대 이력 + 연습일지(음원/사진 포함) + 응원 슬로건
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const artist = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                genre: true,
                bio: true,
                image: true,
                createdAt: true,
                liveStreams: {
                    orderBy: { scheduledAt: "desc" },
                    take: 8,
                    select: {
                        id: true,
                        title: true,
                        coverImage: true,
                        audioUrl: true,
                        isLive: true,
                        status: true,
                        scheduledAt: true,
                        createdAt: true,
                        _count: { select: { tickets: true, cheers: true } },
                    },
                },
                posts: {
                    orderBy: { createdAt: "desc" },
                    take: 8,
                    select: {
                        id: true,
                        content: true,
                        mediaUrl: true,
                        audioUrl: true,
                        audioTitle: true,
                        practiceDay: true,
                        category: true,
                        createdAt: true,
                        stage: { select: { id: true, title: true } },
                    },
                },
                receivedCheers: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    select: {
                        id: true,
                        badge: true,
                        message: true,
                        createdAt: true,
                        sender: { select: { username: true } },
                    },
                },
                _count: {
                    select: {
                        liveStreams: true,
                        posts: true,
                        receivedCheers: true,
                    },
                },
            },
        });

        if (!artist) {
            return NextResponse.json({ error: "아티스트를 찾을 수 없습니다." }, { status: 404 });
        }

        const totalTickets = await prisma.ticket.count({
            where: { stream: { artistId: id } },
        });

        return NextResponse.json({
            ...artist,
            totalTickets,
        });
    } catch (error) {
        console.error("[ARTIST GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
