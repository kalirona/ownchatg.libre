import { Heart, Bot, Cpu, Layers } from 'lucide-react';
import PageLayout from '~/components/PageLayout';
import { useFavorites } from '~/hooks';
import { useLocalize } from '~/hooks';

function getFavoriteTypeLabel(fav: { agentId?: string; model?: string; spec?: string }): string {
  if (fav.agentId) return 'Agent';
  if (fav.model) return 'Model';
  if (fav.spec) return 'Spec';
  return 'Unknown';
}

function getFavoriteDisplayName(fav: { agentId?: string; model?: string; endpoint?: string; spec?: string }): string {
  if (fav.agentId) return fav.agentId;
  if (fav.model) return `${fav.endpoint}/${fav.model}`;
  if (fav.spec) return fav.spec;
  return 'Unknown';
}

function getFavoriteIcon(fav: { agentId?: string; model?: string; spec?: string }) {
  if (fav.agentId) return Bot;
  if (fav.model) return Cpu;
  if (fav.spec) return Layers;
  return Layers;
}

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const localize = useLocalize();

  return (
    <PageLayout title="Favorites" description="Your pinned agents, models, and specs">
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Heart className="h-12 w-12 text-text-secondary" />
          <p className="text-base text-text-secondary">No favorites yet.</p>
          <p className="max-w-sm text-sm text-text-secondary">
            Pin agents, models, or specs to access them quickly.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav, index) => {
            const Icon = getFavoriteIcon(fav);
            const typeLabel = getFavoriteTypeLabel(fav);
            const displayName = getFavoriteDisplayName(fav);
            const key = fav.agentId || `${fav.endpoint}-${fav.model}` || fav.spec || String(index);

            return (
              <div
                key={key}
                className="rounded-lg border border-border-light bg-surface-primary p-4 transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary">
                    <Icon className="h-4.5 w-4.5 text-text-secondary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{typeLabel}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
