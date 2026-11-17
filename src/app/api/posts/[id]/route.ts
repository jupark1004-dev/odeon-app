import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/posts/[id] — 본인 연습일지 삭제
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        const { id } = await params;
        const userId = (session.user as { id: string }).id;

        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) {
            return NextResponse.json({ error: "연습일지를 찾을 수 없습니다." }, { status: 404 });
        }
        if (post.artistId !== userId) {
            return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
        }

        await prisma.post.delete({ where: { id } });
        return NextResponse.json({ message: "연습일지가 삭제되었습니다." });
    } catch (error) {
        console.error("[POST DELETE]", error);
        return NextResponse.json({ error: "서버 오류" }, { status: 500 });
    }
}
