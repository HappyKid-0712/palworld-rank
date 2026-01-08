// app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Player } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const players = await prisma.player.findMany({
    orderBy: { level: "desc" },
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        {" "}
        {/* 稍微加宽了一点容器，给按钮腾出空间 */}
        {/* --- 头部区域修改开始 --- */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-neutral-800 pb-8">
          {/* 左侧：标题部分 */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400 mb-2">
              帕鲁世界——卷狗榜
            </h1>
            <p className="text-neutral-500">钟大师全力贡献</p>
          </div>

          {/* 右侧：地图跳转按钮 */}
          <Link
            href="/map"
            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30 active:scale-95"
          >
            <span className="text-xl">🗺️</span>
            <span>查看世界地图</span>
            {/* 悬浮时显示的小箭头动画 */}
            <span className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300">
              →
            </span>
          </Link>
        </header>
        {/* --- 头部区域修改结束 --- */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-neutral-800/50 text-neutral-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">Player</th>
                <th className="p-4">Level</th>
                <th className="p-4 text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {players.map((p: Player, i: number) => (
                <tr
                  key={p.id}
                  className="hover:bg-neutral-800/30 transition-colors group"
                >
                  <td className="p-4 font-mono text-neutral-500">
                    {i === 0
                      ? "🥇"
                      : i === 1
                      ? "🥈"
                      : i === 2
                      ? "🥉"
                      : `#${i + 1}`}
                  </td>
                  <td className="p-4 font-bold text-lg flex items-center gap-2">
                    {p.name}
                    {/* 可选：如果在地图页存了 SteamID，这里以后甚至可以加头像 */}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        i < 3
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      Lv.{p.level}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-neutral-500 font-mono group-hover:text-neutral-300 transition-colors">
                    {p.lastSeen.toLocaleString("zh-CN", {
                      timeZone: "Asia/Shanghai",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="p-10 text-center text-neutral-600"
                  >
                    暂无数据，请先去地图页点击刷新...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
