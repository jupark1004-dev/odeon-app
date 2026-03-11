import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 로그인이 필요한 보호 경로
const protectedPaths = ["/dashboard", "/post/new", "/live/new"];

// 이미 로그인한 사용자가 접근하면 홈으로 리디렉션할 경로
const authPaths = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
    const session = await auth();
    const { pathname } = req.nextUrl;

    // 보호 경로 접근 시 미로그인 → 로그인 페이지로
    if (protectedPaths.some((path) => pathname.startsWith(path))) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    // 로그인 상태에서 auth 페이지 접근 시 홈으로
    if (authPaths.includes(pathname) && session) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
