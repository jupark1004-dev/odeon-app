import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/lives/[id]
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const live = await prisma.liveStream.findUnique({
            where: { id },
            include: {
                artist: {
                    select: { id: true, username: true, image: true, bio: true },
                },
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    include: {
                        sender: { select: { username: true } },
                    },
                },
            },
        });

        if (!live) {
            return NextResponse.json({ error: "방송을 찾을 수 없습니다." }, { status: 404 });
        }

        return NextResponse.json(live);
    } catch (error) {
        console.error("[LIVE GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
