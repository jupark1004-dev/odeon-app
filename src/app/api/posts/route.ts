import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/posts — 지하 연습실 일지(Practice Log) 목록
export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                artist: { select: { id: true, username: true, genre: true, image: true } },
                stage: { select: { id: true, title: true, scheduledAt: true, status: true, isLive: true } },
            },
        });
        return NextResponse.json(posts);
    } catch (error) {
        console.error("[POSTS GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}

// POST /api/posts — 지하 연습실 일지 작성 (ARTIST 전용 — 사진 업로드 + 습작 음원 업로드 + 유튜브 URL 지원)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "뮤지션만 연습일지를 작성할 수 있습니다." }, { status: 403 });
        }

        const { content, mediaUrl, audioUrl, audioTitle, practiceDay, category, stageId } = await req.json();
        if (!content?.trim()) {
            return NextResponse.json({ error: "연습 일지 내용을 입력해주세요." }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                content: content.trim(),
                mediaUrl: mediaUrl?.trim() || null,
                audioUrl: audioUrl?.trim() || null,
                audioTitle: audioTitle?.trim() || null,
                practiceDay: Number(practiceDay) > 0 ? Number(practiceDay) : 1,
                category: category || "곡 작업/습작음원",
                stageId: stageId || null,
                artistId: user.id,
            },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error("[POSTS POST]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
