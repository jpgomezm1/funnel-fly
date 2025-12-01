import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// MixPanel credentials
// API Secret is used for authentication (Basic Auth)
const MIXPANEL_API_SECRET = 'e3b73d4979ce8c497229757deab14b2c';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();

    console.log('MixPanel request:', endpoint, params);

    // Basic auth for MixPanel API (API Secret as username, empty password)
    const authString = btoa(`${MIXPANEL_API_SECRET}:`);

    switch (endpoint) {
      case 'export': {
        // Raw Event Export API - exports raw event data (FREE TIER)
        // https://developer.mixpanel.com/reference/raw-event-export
        const exportParams = new URLSearchParams({
          from_date: params.from_date,
          to_date: params.to_date,
        });

        if (params.event) {
          exportParams.append('event', JSON.stringify([params.event]));
        }

        const url = `https://data.mixpanel.com/api/2.0/export?${exportParams}`;
        console.log('Fetching export data from:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Accept': 'text/plain',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Export API error:', response.status, errorText);
          return new Response(
            JSON.stringify({ error: 'MixPanel Export API error', status: response.status, details: errorText }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Export returns newline-delimited JSON
        const text = await response.text();
        const lines = text.trim().split('\n').filter(line => line);

        // Parse events and aggregate by event name
        const eventCounts: Record<string, number> = {};
        const eventsByDate: Record<string, Record<string, number>> = {};

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            const eventName = event.event || 'unknown';
            eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;

            // Group by date
            if (event.properties && event.properties.time) {
              const date = new Date(event.properties.time * 1000).toISOString().split('T')[0];
              if (!eventsByDate[date]) {
                eventsByDate[date] = {};
              }
              eventsByDate[date][eventName] = (eventsByDate[date][eventName] || 0) + 1;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }

        // Sort events by count
        const sortedEvents = Object.entries(eventCounts)
          .map(([event, count]) => ({ event, count }))
          .sort((a, b) => b.count - a.count);

        // Convert eventsByDate to trend format
        const trend = Object.entries(eventsByDate)
          .map(([date, events]) => ({
            date,
            count: Object.values(events).reduce((sum, c) => sum + c, 0),
            events,
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return new Response(
          JSON.stringify({
            events: eventCounts,
            topEvents: sortedEvents.slice(0, 15),
            trend,
            totalEvents: lines.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'top-events': {
        // Use Export API to get events and aggregate
        const now = new Date();
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - (params.days || 30));

        const fromDate = params.from_date || daysAgo.toISOString().split('T')[0];
        const toDate = params.to_date || now.toISOString().split('T')[0];

        const exportParams = new URLSearchParams({
          from_date: fromDate,
          to_date: toDate,
        });

        const url = `https://data.mixpanel.com/api/2.0/export?${exportParams}`;
        console.log('Fetching top events via export:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Accept': 'text/plain',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Export API error:', response.status, errorText);
          return new Response(
            JSON.stringify({ error: 'MixPanel API error', status: response.status, details: errorText }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const text = await response.text();
        const lines = text.trim().split('\n').filter(line => line);

        // Aggregate by event name
        const eventCounts: Record<string, number> = {};
        const eventsByDate: Record<string, number> = {};

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            const eventName = event.event || 'unknown';
            eventCounts[eventName] = (eventCounts[eventName] || 0) + 1;

            // Also track page views by date
            if (event.properties && event.properties.time) {
              const date = new Date(event.properties.time * 1000).toISOString().split('T')[0];
              eventsByDate[date] = (eventsByDate[date] || 0) + 1;
            }
          } catch {
            // Skip invalid lines
          }
        }

        // Format for frontend
        const events: Record<string, number> = eventCounts;
        const pageViewsTrend = Object.entries(eventsByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return new Response(
          JSON.stringify({
            events,
            pageViewsTrend,
            totalEvents: lines.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint', available: ['export', 'top-events'] }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
