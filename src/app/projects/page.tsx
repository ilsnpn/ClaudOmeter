'use client';

import { useProjects } from '@/lib/hooks';
import { useCostMode } from '@/lib/cost-mode-context';
import { formatTokens, formatCost, timeAgo } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, MessageSquare, Clock, Layers } from 'lucide-react';
import Link from 'next/link';

// Twelve compact cards (four rows) per slide so each one-page block fits the screen.
const PER_SLIDE = 12;
const chunk = <T,>(arr: T[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { pickCost } = useCostMode();

  if (isLoading || !projects) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {chunk(projects, PER_SLIDE).map((group, i) => (
      <div key={i} className="slide space-y-6">
      {i === 0 && <div>
        <h1 className="text-xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">{projects.length} projects tracked</p>
      </div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {group.map(project => (
          <Link key={project.id} href={`/projects/${encodeURIComponent(project.id)}`}>
            <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30 cursor-pointer h-full gap-0 py-0">
              <CardContent className="px-4 py-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-1.5">
                        <FolderKanban className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{project.name}</h3>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                          {project.path}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {[...new Set(project.models)].map(m => (
                      <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {m}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-base font-bold leading-tight">{project.sessionCount}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                        <Layers className="h-2.5 w-2.5" /> sessions
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold leading-tight">{formatTokens(project.totalTokens)}</p>
                      <p className="text-[10px] text-muted-foreground">tokens</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold leading-tight">{formatCost(pickCost(project.estimatedCosts, project.estimatedCost))}</p>
                      <p className="text-[10px] text-muted-foreground">est. usage</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-2.5 w-2.5" />
                      {project.totalMessages.toLocaleString()} messages
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(project.lastActive)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      </div>
      ))}
    </div>
  );
}
