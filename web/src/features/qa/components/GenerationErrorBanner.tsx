import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import type { GenerationError } from '@/lib/claude/errors.ts';

type GenerationErrorBannerProps = {
  error: GenerationError;
  onRetry?: () => void;
};

export function GenerationErrorBanner({ error, onRetry }: GenerationErrorBannerProps) {
  const status = error.status ? ` (HTTP ${error.status})` : '';
  return (
    <Banner
      status={error.kind === 'missing-key' ? 'warning' : 'error'}
      title={error.title}
      description={`${error.message}${status}`}
      endContent={error.retryable && onRetry ? <Button label="다시 시도" size="sm" variant="secondary" onClick={onRetry} /> : undefined}
    />
  );
}
