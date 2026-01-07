// app/page.tsx
import { prisma } from "@/lib/prisma";
// 引入 Prisma 生成的类型定义
import { Player } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const players = await prisma.player.findMany({
    orderBy: { level: "desc" },
  });

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-emerald-400 mb-2">
            帕鲁世界——卷狗榜
          </h1>
          <p className="text-neutral-500">钟大师全力贡献</p>
        </header>

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
              {/* 显式声明 p 的类型为 Player，i 的类型为 number */}
              {players.map((p: Player, i: number) => (
                <tr
                  key={p.id}
                  className="hover:bg-neutral-800/30 transition-colors"
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
                  <td className="p-4 font-bold text-lg">{p.name}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium">
                      Lv.{p.level}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-neutral-500 font-mono">
                    {p.lastSeen.toLocaleString("zh-CN", {
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
                    暂无数据，请等待第一次同步...
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
