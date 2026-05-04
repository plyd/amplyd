import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const DEFAULT_USERNAME = 'vincent-juhel-jvhelq';
const DEFAULT_EVENT = '30min';

/**
 * Hero CTA opening Vincent's Cal.com booking page in a new tab.
 *
 * Visual weight is intentionally lower than `OpenChatButton` (primary) and
 * `Voir le CV` (secondary) — the agent panel is the main funnel; this is
 * the express lane for visitors who already know they want a call.
 */
export function BookCallButton({
  label,
  ariaLabel,
}: {
  label: string;
  ariaLabel: string;
}) {
  const username =
    process.env.NEXT_PUBLIC_CALCOM_USERNAME ?? DEFAULT_USERNAME;
  const event =
    process.env.NEXT_PUBLIC_CALCOM_EVENT_SLUG ?? DEFAULT_EVENT;
  const href = `https://cal.eu/${username}/${event}`;

  return (
    <Button variant="ghost" asChild>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
      >
        <Calendar size={14} />
        {label}
      </a>
    </Button>
  );
}
