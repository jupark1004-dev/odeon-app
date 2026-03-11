import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/posts — 포스트 목록
export async function GET() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                artist: { select: { id: true, username: true } },
            },
        });
        return NextResponse.json(posts);
    } catch (error) {
        console.error("[POSTS GET]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}

// POST /api/posts — 포스트 작성 (ARTIST 전용)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const user = session.user as { id: string; role?: string };
        if (user.role !== "ARTIST") {
            return NextResponse.json({ error: "아티스트만 포스트를 작성할 수 있습니다." }, { status: 403 });
        }

        const { content, mediaUrl } = await req.json();
        if (!content?.trim()) {
            return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
        }

        const post = await prisma.post.create({
            data: { content, mediaUrl: mediaUrl ?? null, artistId: user.id },
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error("[POSTS POST]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
