'use client';

import { useState } from 'react';
import JSZip from 'jszip';
import { FolderOpen, FileArchive, Github, UserX, HardDrive, Trash2, Code2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { loadFiles, toClaudePath, type LoadInput } from '@/lib/claude-data/vfs';

const REPO_URL = 'https://github.com/deshraj/Claud-ometer';

function fromFolder(list: FileList): LoadInput[] {
  const inputs: LoadInput[] = [];
  for (const f of Array.from(list)) {
    const p = toClaudePath(f.webkitRelativePath || f.name);
    if (p) inputs.push({ path: p, size: f.size, mtimeMs: f.lastModified, read: () => f.text() });
  }
  return inputs;
}

async function fromZip(file: File): Promise<LoadInput[]> {
  const zip = await JSZip.loadAsync(file);
  const inputs: LoadInput[] = [];
  zip.forEach((rel, entry) => {
    const p = entry.dir ? null : toClaudePath(rel);
    if (p) inputs.push({
      path: p,
      // Uncompressed size isn't public in JSZip's types; it only weights the progress bar.
      size: (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 1,
      mtimeMs: entry.date.getTime(),
      read: () => entry.async('string'),
    });
  });
  return inputs;
}

const PROMISES = [
  { icon: UserX, title: 'Anonyme', text: 'Aucun compte, aucune connexion. Vos identifiants Claude ne sont jamais lus.' },
  { icon: HardDrive, title: '100 % local', text: 'L’analyse tourne dans votre navigateur : rien n’est envoyé sur Internet.' },
  { icon: Trash2, title: 'Rien n’est conservé', text: 'Fermez l’onglet et tout disparaît. Aucun stockage, aucun cookie de suivi.' },
  { icon: Code2, title: 'Open source', text: 'Code ouvert, sous licence MIT : vous pouvez vérifier chaque promesse.' },
];

export function Landing() {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(getInputs: () => Promise<LoadInput[]> | LoadInput[]) {
    setError(null);
    setProgress(0);
    try {
      const inputs = await getInputs();
      if (!inputs.length) throw new Error('Aucune donnée Claude Code trouvée. Choisissez bien le dossier .claude.');
      await loadFiles(inputs, (done, total) => setProgress(Math.round((done / total) * 100)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture impossible.');
      setProgress(null);
    }
  }

  const busy = progress !== null;
  const btn = 'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors';

  return (
    <div className="flex min-h-screen flex-col px-6 py-6 lg:h-screen lg:overflow-hidden">
      {/* Intro: the mark draws itself, then the page fades in underneath. */}
      <div className="intro-splash pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Logo animated className="h-[31rem] w-[31rem] max-h-[78vh] max-w-[78vh]" />
      </div>

      {/* Loading: the big "C" fills up as files are read. */}
      {busy && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm">
          <Logo progress={progress! / 100} className="h-[39rem] w-[39rem] max-h-[65vh] max-w-[65vh]" />
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums tracking-tight">{progress} %</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {progress! < 100 ? 'Lecture de votre dossier…' : 'Analyse en cours…'}
            </p>
          </div>
        </div>
      )}

      <header className="flex items-center gap-2.5">
        <Logo />
        <span className="text-sm font-semibold tracking-tight">Claud&apos;Ometer</span>
        <ThemeToggle className="ml-auto" />
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              Vos statistiques Claude Code, en un coup d&apos;œil.
            </h1>
            <p className="text-muted-foreground">
              Sessions, tokens, coûts estimés, modèles utilisés et heures de pointe, calculés à partir
              du dossier que Claude Code tient sur votre ordinateur.
            </p>
          </div>

          <ul className="grid grid-cols-2 gap-3">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-xl border border-border bg-card/60 p-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-base font-semibold leading-tight">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <p className="text-sm">
              Chargez votre dossier <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.claude</code>
            </p>
            <p className="text-xs text-muted-foreground">
              Windows : <code>%USERPROFILE%\.claude</code> · macOS / Linux : <code>~/.claude</code>
            </p>

            {!busy && (
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className={`${btn} bg-primary text-primary-foreground hover:bg-primary/90`}>
                  <FolderOpen className="h-4 w-4" />
                  Choisir le dossier
                  <input
                    type="file"
                    // @ts-expect-error non-standard but supported by all major browsers
                    webkitdirectory=""
                    className="hidden"
                    onChange={e => e.target.files && load(() => fromFolder(e.target.files!))}
                  />
                </label>
                <label className={`${btn} border border-border hover:bg-accent`}>
                  <FileArchive className="h-4 w-4" />
                  Ou un fichier .zip
                  <input
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) load(() => fromZip(f)); }}
                  />
                </label>
              </div>
            )}
            {error && <p className="text-xs text-red-500">{error}</p>}

          </div>
        </section>

        <figure className="hidden overflow-hidden rounded-xl border border-border shadow-2xl lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/apercu.png" alt="Aperçu du tableau de bord avec des données d'exemple" className="w-full" />
        </figure>
      </main>

      <footer className="text-center text-xs text-muted-foreground">
        Cette version en ligne repose sur{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-foreground underline underline-offset-2 hover:text-primary">
          <Github className="h-3 w-3" />
          Claud-ometer
        </a>
        , le projet open source de deshraj, publié sous licence MIT.
      </footer>
    </div>
  );
}
