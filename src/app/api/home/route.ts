import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/home — B1F 메인 라이브하우스 전광판 데이터
export async function GET() {
    try {
        const [stages, practiceLogs, artists] = await Promise.all([
            prisma.liveStream.findMany({
                orderBy: [
                    { isLive: "desc" },
                    { scheduledAt: "asc" },
                ],
                take: 6,
                include: {
                    artist: { select: { id: true, username: true, genre: true } },
                    _count: { select: { tickets: true, cheers: true, practiceLogs: true } },
                },
            }),
            prisma.post.findMany({
                orderBy: { createdAt: "desc" },
                take: 6,
                include: {
                    artist: { select: { id: true, username: true, genre: true } },
                    stage: { select: { id: true, title: true, scheduledAt: true } },
                },
            }),
            prisma.user.findMany({
                where: { role: "ARTIST" },
                take: 8,
                select: {
                    id: true,
                    username: true,
                    genre: true,
                    bio: true,
                    _count: {
                        select: {
                            liveStreams: true,
                            posts: true,
                            receivedCheers: true,
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            stages,
            practiceLogs,
            artists,
        });
    } catch (error) {
        console.error("[HOME GET]", error);
        return NextResponse.json({ stages: [], practiceLogs: [], artists: [] });
    }
}
