import Link from "next/link";

const features = [
  {
    title: "图片压缩",
    description: "智能压缩保持画质细节，让图片体积大幅减小。",
    href: "/compress",
    accent: "bg-gradient-to-br from-sky-400/20 to-blue-500/30 text-sky-600",
  },
  {
    title: "抠图去背景",
    description: "一键分离主体与背景，为商品、人物图快速抠图。",
    href: "/remove-background",
    accent: "bg-gradient-to-br from-emerald-400/20 to-teal-500/30 text-emerald-600",
  },
  {
    title: "图片识别",
    description: "识别图片中的文字、物体与场景，辅助数据整理。",
    href: "/recognition",
    accent: "bg-gradient-to-br from-amber-400/20 to-orange-500/30 text-amber-600",
  },
  {
    title: "AI 生图",
    description: "输入提示词即可生成风格化图片，激发创意灵感。",
    href: "/ai-generation",
    accent: "bg-gradient-to-br from-purple-400/20 to-indigo-500/30 text-purple-600",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 py-24 md:px-12">
        <header className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-4 py-1 text-sm font-medium text-zinc-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            图像智能工作台
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-5xl">
            一站式图片处理中心
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            集成压缩、抠图、识别与 AI 生图四大能力，满足电商设计、营销物料、内容创作等多种场景需求。
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-transparent hover:shadow-lg hover:shadow-sky-200/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:shadow-none"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl font-semibold ${feature.accent}`}
              >
                {feature.title.slice(0, 2)}
              </span>
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-zinc-900 transition-colors group-hover:text-sky-600 dark:text-zinc-50 dark:group-hover:text-sky-400">
                  {feature.title}
                </h2>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
              <span className="mt-auto text-sm font-medium text-sky-600 transition group-hover:translate-x-1 group-hover:text-sky-500 dark:text-sky-400 dark:group-hover:text-sky-300">
                进入工具 →
              </span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
