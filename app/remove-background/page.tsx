"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type PreviewInfo = {
  url: string;
  width: number;
  height: number;
  size: number; // bytes
  mime: string;
};

export default function RemoveBgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [srcInfo, setSrcInfo] = useState<PreviewInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultInfo, setResultInfo] = useState<PreviewInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
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
    const img = new Image();
    img.onload = () => {
      setFile(f);
      setSrcInfo({ url, width: img.width, height: img.height, size: f.size, mime: f.type });
      imgRef.current = img;
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      setResultBlob(null);
      setResultInfo(null);
      setError(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      objectUrlRef.current = null;
      alert("图片加载失败，请重试");
    };
    img.src = url;
  }

  async function removeBg() {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image_file", file, file.name);
      form.append("size", "auto");

      const resp = await fetch("/api/remove-bg", { method: "POST", body: form });
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
      const blob = await resp.blob();
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultBlob(blob);
      setResultInfo({ url, width: srcInfo?.width || 0, height: srcInfo?.height || 0, size: blob.size, mime: blob.type || "image/png" });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "处理失败");
    } finally {
      setProcessing(false);
    }
  }

  const humanSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

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
            <h1 className="text-2xl font-semibold">抠图去背景</h1>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/70 p-6 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
          <input
            id="uploader"
            type="file"
            accept="image/*"
            onChange={onSelect}
            className="hidden"
          />
          <label
            htmlFor="uploader"
            className="mx-auto block w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-5 py-10 text-zinc-700 hover:border-sky-300 hover:text-sky-600 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300"
          >
            {file ? (
              <span className="font-medium">已选择：{file.name}</span>
            ) : (
              <>
                <div className="text-sm">点击选择或拖拽图片到此处</div>
                <div className="mt-1 text-xs text-zinc-500">支持 JPG、PNG、WEBP 等格式</div>
              </>
            )}
          </label>
        </div>

        {/* Controls & Stats */}
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">点击下方按钮开始去除背景</div>
            <div>
              <button
                disabled={!file || processing}
                onClick={removeBg}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "处理中..." : "去除背景"}
              </button>
            </div>
            {error ? <div className="text-sm text-red-600">{error}</div> : null}
          </div>

          <div className="grid content-start gap-3 rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="font-medium">尺寸与大小</div>
            <div className="text-zinc-600 dark:text-zinc-400">
              原图：{srcInfo ? `${srcInfo.width}×${srcInfo.height} · ${humanSize(srcInfo.size)}` : "-"}
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">
              结果：{resultInfo ? `${resultInfo.width}×${resultInfo.height} · ${humanSize(resultInfo.size)}` : "-"}
            </div>
          </div>
        </div>

        {/* Previews */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 text-sm font-medium">原图预览</div>
            <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              {srcInfo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={srcInfo.url} alt="原图" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-sm text-zinc-500">请先上传图片</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">去背景预览</span>
              {resultInfo && resultBlob ? (
                <a
                  href={resultInfo.url}
                  download={genDownloadName(file)}
                  className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600 dark:border-white/10 dark:bg-white/10 dark:text-zinc-300"
                >
                  保存去背景图片
                </a>
              ) : null}
            </div>
            <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0] dark:bg-[linear-gradient(45deg,#2a2a2a_25%,transparent_25%),linear-gradient(-45deg,#2a2a2a_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#2a2a2a_75%),linear-gradient(-45deg,transparent_75%,#2a2a2a_75%)]">
              {resultInfo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resultInfo.url} alt="去背景后" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="text-sm text-zinc-500">结果预览将在此显示</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function genDownloadName(file: File | null) {
  const base = file?.name?.replace(/\.[^.]+$/, "") || "no-bg";
  return `${base}-no-bg-${Date.now()}.png`;
}
