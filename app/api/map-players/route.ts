// app/api/map-players/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // 确保不缓存，实时获取

export async function GET() {
  try {
    // 定义“在线”为最近 10 分钟内有活动
    // const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const activePlayers = await prisma.player.findMany({
      where: {
        // lastSeen: { gte: tenMinutesAgo }, // 引用 schema 中的 lastSeen
        loc_x: { not: null }, // 引用 schema 中的 loc_x
        loc_y: { not: null }, // 引用 schema 中的 loc_y
      },
      select: {
        name: true,
        level: true,
        loc_x: true,
        loc_y: true,
        playerId: true, // 可选，用于显示头像等
      },
    });

    return NextResponse.json(activePlayers);
  } catch (error) {
    console.error("Map API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch players" },
      { status: 500 }
    );
  }
}
