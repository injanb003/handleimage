"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function RecognitionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("识别上传的图片");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("请上传图片文件");
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(f);
    objectUrlRef.current = url;
    setFile(f);
    setImgUrl(url);
    setResult("");
    setError(null);
  }

  async function recognize() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResult("");
    try {
      const form = new FormData();
      form.append("image_file", file, file.name);
      form.append("prompt", prompt);

      const resp = await fetch("/api/recognition", { method: "POST", body: form });
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
      setResult(data?.text || "");
    } catch (e: any) {
      setError(e?.message || "识别失败");
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
            <h1 className="text-2xl font-semibold">图片识别</h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr]">
          {/* Upload */}
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
            <input id="uploader" type="file" accept="image/*" onChange={onSelect} className="hidden" />
            <label
              htmlFor="uploader"
              className="mx-auto block w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-5 py-10 text-zinc-700 hover:border-sky-300 hover:text-sky-600 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300"
            >
              {file ? <span className="font-medium">已选择：{file.name}</span> : (
                <>
                  <div className="text-sm">点击选择或拖拽图片到此处</div>
                  <div className="mt-1 text-xs text-zinc-500">支持 JPG、PNG、WEBP 等格式</div>
                </>
              )}
            </label>
          </div>

          {/* Prompt & Action */}
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-2">识别指令</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-sky-300 dark:border-white/10 dark:bg-white/10"
            />
            <div className="mt-3">
              <button
                disabled={!file || processing}
                onClick={recognize}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "识别中..." : "识别图片"}
              </button>
            </div>
            {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
          </div>
        </div>

        {/* Preview & Result */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 text-sm font-medium">图片预览</div>
            <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt="待识别图片" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-sm text-zinc-500">请先上传图片</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 text-sm font-medium">识别结果</div>
            <pre className="h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-900">{result || "暂无结果"}</pre>
          </div>
        </div>
      </main>
    </div>
  );
}
