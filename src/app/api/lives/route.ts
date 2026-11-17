import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/lives — B1F 라이브하우스 무대 목록
export async function GET() {
    try {
        const lives = await prisma.liveStream.findMany({
            orderBy: [
                { isLive: "desc" },
                { scheduledAt: "asc" },
                { createdAt: "desc" },
            ],
            include: {
                artist: {
                    select: { id: true, username: true, genre: true, bio: true, image: true },
                },
                _count: {
                    select: {
                        tickets: true,
                        cheers: true,
                        practiceLogs: true,
                    },
                },
            },
        });
        return NextResponse.json(lives);
    } catch (error) {
        console.error("[LIVES GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}

// POST /api/lives — 새 무대(Stage) 편성 등록 (아티스트 전용)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "뮤지션만 무대를 등록할 수 있습니다." }, { status: 403 });
        }

        const { title, embedUrl, scheduledAt, setlist, description, status } = await req.json();
        if (!title || !embedUrl) {
            return NextResponse.json({ error: "공연 제목과 무대 영상 URL을 입력해주세요." }, { status: 400 });
        }

        const stageStatus = status === "LIVE" ? "LIVE" : "UPCOMING";
        const isLive = stageStatus === "LIVE";

        const live = await prisma.liveStream.create({
            data: {
                title: title.trim(),
                embedUrl: embedUrl.trim(),
                scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
                setlist: setlist?.trim() || null,
                description: description?.trim() || null,
                status: stageStatus,
                isLive,
                artistId: user.id,
            },
        });

        return NextResponse.json(live, { status: 201 });
    } catch (error) {
        console.error("[LIVES POST]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
