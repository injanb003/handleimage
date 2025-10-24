"use client";

import { useState } from "react";
import Link from "next/link";

export default function AIGenerationPage() {
  const [prompt, setPrompt] = useState<string>("");
  const [size, setSize] = useState<string>("2K");
  const [processing, setProcessing] = useState(false);
  const [images, setImages] = useState<string[]>([]); // urls or data urls
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!prompt.trim()) return;
    setProcessing(true);
    setError(null);
    setImages([]);
    try {
      const resp = await fetch("/api/ai-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, size, response_format: "url" }),
      });
      if (!resp.ok) {
        let msg = `请求失败 (${resp.status})`;
        try {
          const data = await resp.json();
          msg = data?.error || msg;
        } catch {
          try { msg = await resp.text(); } catch {}
        }
        throw new Error(msg);
      }
      const data = await resp.json();
      // Ark images API typically returns { data: [ { url | b64_json } ] }
      const urls: string[] = (data?.data || []).map((d: any) => d?.url || (d?.b64_json ? `data:image/png;base64,${d.b64_json}` : null)).filter(Boolean);
      setImages(urls);
    } catch (e: any) {
      setError(e?.message || "生成失败");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50 md:px-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 bg-white/70 px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition hover:border-transparent hover:text-sky-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
            >
              ← 返回
            </Link>
            <h1 className="text-2xl font-semibold">AI 生图</h1>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">提示词</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="输入你想生成的画面描述..."
            className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-sky-300 dark:border-white/10 dark:bg-white/10"
          />
          <div className="mt-3 flex items-center gap-3 text-sm">
            <label>尺寸</label>
            <select value={size} onChange={(e) => setSize(e.target.value)} className="rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-white/10">
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div className="mt-4">
            <button
              disabled={!prompt.trim() || processing}
              onClick={generate}
              className="rounded-lg bg-purple-600 px-4 py-2 text-white shadow-sm transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "生成中..." : "生成图片"}
            </button>
          </div>
          {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {images.length === 0 ? (
            <div className="text-sm text-zinc-500">暂无结果</div>
          ) : (
            images.map((url, idx) => (
              <div key={idx} className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">结果 {idx + 1}</span>
                  <a href={url} target="_blank" rel="noreferrer" className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 shadow-sm transition hover:border-purple-300 hover:text-purple-600 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300">查看原图</a>
                </div>
                <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`result-${idx+1}`} className="max-h-full max-w-full object-contain" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
