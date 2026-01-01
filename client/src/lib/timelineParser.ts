export interface TimelineContent {
  cardType: 'timeline';
  coverMessage: string;
  thenSection: { heading: string; content: string };
  nowSection: { heading: string; content: string };
  futureSection: { heading: string; content: string };
}

export interface TimelineParseResult {
  isTimeline: boolean;
  timelineData: TimelineContent | null;
  cleanContent: string;
}

export function parseTimelineContent(content: string | null | undefined): TimelineParseResult {
  const rawContent = content || '';
  
  try {
    const timelineMatch = rawContent.match(/<!--TIMELINE:([A-Za-z0-9+/=]+)-->/);
    if (timelineMatch) {
      let decoded: string;
      if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        decoded = window.atob(timelineMatch[1]);
      } else if (typeof Buffer !== 'undefined') {
        decoded = Buffer.from(timelineMatch[1], 'base64').toString('utf-8');
      } else {
        return {
          isTimeline: false,
          timelineData: null,
          cleanContent: rawContent.replace(/\n\n<!--TIMELINE:[A-Za-z0-9+/=]+-->/g, ''),
        };
      }
      
      const parsed = JSON.parse(decoded);
      if (parsed.cardType === 'timeline') {
        return {
          isTimeline: true,
          timelineData: parsed as TimelineContent,
          cleanContent: rawContent.replace(/\n\n<!--TIMELINE:[A-Za-z0-9+/=]+-->/g, ''),
        };
      }
    }
  } catch {
    // Parse error, treat as standard card
  }
  
  return {
    isTimeline: false,
    timelineData: null,
    cleanContent: rawContent.replace(/\n\n<!--TIMELINE:[A-Za-z0-9+/=]+-->/g, ''),
  };
}

export function stripTimelineMarker(content: string | null | undefined): string {
  return (content || '').replace(/\n\n<!--TIMELINE:[A-Za-z0-9+/=]+-->/g, '');
}
