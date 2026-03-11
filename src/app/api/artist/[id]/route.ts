import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/artist/[id]
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
                bio: true,
                choco_balance: true,
                createdAt: true,
                liveStreams: {
                    orderBy: { createdAt: "desc" },
                    take: 6,
                    select: { id: true, title: true, isLive: true, createdAt: true },
                },
                posts: {
                    orderBy: { createdAt: "desc" },
                    take: 3,
                    select: { id: true, content: true, createdAt: true },
                },
                _count: {
                    select: {
                        liveStreams: true,
                        posts: true,
                        receivedChocos: true,
                    },
                },
            },
        });

        if (!artist || artist.choco_balance === undefined) {
            return NextResponse.json({ error: "아티스트를 찾을 수 없습니다." }, { status: 404 });
        }

        return NextResponse.json(artist);
    } catch (error) {
        console.error("[ARTIST GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
