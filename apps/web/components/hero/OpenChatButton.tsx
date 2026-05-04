'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * Hero CTA that opens the chat panel.
 *
 * On large screens the panel is already pinned to the right, so the click
 * just focuses the textarea. On small screens the panel renders as a
 * slide-up sheet — we dispatch a window event the panel listens for.
 */
export function OpenChatButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('amplyd:open-chat'))}
    >
      <MessageSquare size={16} />
      {label}
    </Button>
  );
}
