import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/lives — 라이브 방송 목록
export async function GET() {
    try {
        const lives = await prisma.liveStream.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                artist: {
                    select: { id: true, username: true, bio: true },
                },
                _count: { select: { transactions: true } },
            },
        });
        return NextResponse.json(lives);
    } catch (error) {
        console.error("[LIVES GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}

// POST /api/lives — 라이브 방송 등록 (아티스트 전용)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "아티스트만 등록할 수 있습니다." }, { status: 403 });
        }

        const { title, embedUrl } = await req.json();
        if (!title || !embedUrl) {
            return NextResponse.json({ error: "제목과 URL을 입력해주세요." }, { status: 400 });
        }

        const live = await prisma.liveStream.create({
            data: { title, embedUrl, artistId: user.id },
        });

        return NextResponse.json(live, { status: 201 });
    } catch (error) {
        console.error("[LIVES POST]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
