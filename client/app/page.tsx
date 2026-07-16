import { motion } from 'framer-motion';

const languages = [
  'English',
  'French',
  'Spanish',
  'German',
  'Japanese',
  'Arabic'
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10 lg:px-16">
      <section className="mx-auto flex max-w-7xl flex-col gap-12">
        <header className="flex flex-col gap-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-800/80 shadow-glass ring-1 ring-sky-400/20">
            <span className="text-3xl font-black tracking-tight text-cyan-300">VB</span>
          </div>
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300/80">VoiceBridge</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              Free AI voice translator for natural conversations.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Record speech, translate instantly, and play natural AI voice in any supported language. Designed to be open source and Render-ready.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="glass-card rounded-[2rem] p-8 shadow-glass">
            <div className="flex flex-col gap-8">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.35em] text-cyan-300">Live demo</p>
                <h2 className="text-2xl font-semibold text-slate-100">VoiceBridge translator</h2>
                <p className="max-w-xl text-slate-300">
                  Talk through the app with automatic speech recognition, translation, and training-ready text-to-speech.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-600/40 bg-slate-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.35em] text-sky-300/70">Input</p>
                  <p className="mt-4 text-xl font-semibold text-slate-50">English</p>
                  <p className="mt-2 text-sm text-slate-400">Speak naturally and see the live transcript.</p>
                </div>
                <div className="rounded-3xl border border-slate-600/40 bg-slate-950/70 p-5">
                  <p className="text-sm uppercase tracking-[0.35em] text-sky-300/70">Output</p>
                  <p className="mt-4 text-xl font-semibold text-slate-50">Spanish</p>
                  <p className="mt-2 text-sm text-slate-400">Delivered as natural AI voice with instant playback.</p>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2rem] p-8 shadow-glass ring-1 ring-sky-400/10"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/90">Conversation mode</p>
                  <h2 className="text-2xl font-semibold text-slate-100">Automatic back-and-forth</h2>
                </div>
                <div className="rounded-3xl bg-slate-800/90 px-4 py-2 text-sm text-slate-200">Live</div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-600/40 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400">Person A</p>
                  <p className="mt-2 text-lg font-semibold text-slate-50">English → Spanish</p>
                </div>
                <div className="rounded-3xl border border-slate-600/40 bg-slate-950/70 p-5">
                  <p className="text-sm text-slate-400">Person B</p>
                  <p className="mt-2 text-lg font-semibold text-slate-50">Spanish → English</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="glass-card rounded-[2rem] p-8 shadow-glass">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Features</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {languages.map((language) => (
                <div key={language} className="rounded-3xl border border-slate-600/30 bg-slate-950/70 p-5">
                  <p className="font-semibold text-slate-50">{language}</p>
                  <p className="mt-2 text-sm text-slate-400">Ready for real-time translation and voice playback.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] p-8 shadow-glass">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Translator UI</p>
            <div className="mt-8 space-y-4">
              <div className="rounded-[1.75rem] border border-slate-600/30 bg-slate-950/70 p-6">
                <p className="text-sm text-slate-400">Input Language</p>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl bg-slate-800/95 p-4">
                  <span className="text-lg font-semibold text-slate-100">English</span>
                  <button className="rounded-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
                    Record
                  </button>
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-slate-600/30 bg-slate-950/70 p-6">
                <p className="text-sm text-slate-400">Output Language</p>
                <div className="mt-4 rounded-3xl bg-slate-800/95 p-4">
                  <p className="text-lg font-semibold text-slate-100">Spanish</p>
                  <p className="mt-2 text-sm text-slate-400">Translated text with playback controls.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
