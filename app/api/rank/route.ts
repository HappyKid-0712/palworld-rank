import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 强制动态模式，保证每次获取都是最新数据
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 获取所有玩家，按等级降序排列，等级相同按最后在线时间降序
    const players = await prisma.player.findMany({
      orderBy: [{ level: "desc" }, { lastSeen: "desc" }],
      select: {
        name: true,
        level: true,
        lastSeen: true,
        // 如果机器人需要展示 SteamID 或其他信息，可以在这里加
        // playerId: true,
      },
    });

    // 格式化一下时间，方便机器人直接显示字符串（可选）
    const formattedPlayers = players.map((p, index) => ({
      rank: index + 1,
      name: p.name,
      level: p.level,
      lastSeen: p.lastSeen,
      lastSeenStr: p.lastSeen.toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      }),
    }));

    return NextResponse.json({
      success: true,
      count: formattedPlayers.length,
      data: formattedPlayers,
    });
  } catch (error) {
    console.error("Rank API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
