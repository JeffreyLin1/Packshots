// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

console.log("Weather API Function initialized")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { latitude, longitude } = await req.json();
    
    console.log(`Received weather request for coordinates: ${latitude}, ${longitude}`);
    
    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get OpenWeather API key from Supabase secrets
    const openWeatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');
    if (!openWeatherApiKey) {
      console.error("OpenWeather API key not found in environment");
      return new Response(
        JSON.stringify({ error: 'OpenWeather API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log that we have the API key (don't log the actual key)
    console.log("OpenWeather API key found, proceeding with API calls");
    
    // Fetch current weather data
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${openWeatherApiKey}`;
    const currentWeatherResponse = await fetch(currentWeatherUrl);
    
    if (!currentWeatherResponse.ok) {
      const errorText = await currentWeatherResponse.text();
      console.error("OpenWeather API error (current):", currentWeatherResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'OpenWeather API error', 
          status: currentWeatherResponse.status,
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }
    
    const currentWeather = await currentWeatherResponse.json();
    
    // Fetch forecast data
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${openWeatherApiKey}`;
    const forecastResponse = await fetch(forecastUrl);
    
    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error("OpenWeather API error (forecast):", forecastResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'OpenWeather API error', 
          status: forecastResponse.status,
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }
    
    const forecast = await forecastResponse.json();
    
    // Combine the data
    const weatherData = {
      current: currentWeather,
      forecast: forecast
    };
    
    console.log("Successfully retrieved weather data");
    
    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/weather-api' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"latitude": 40.7128, "longitude": -74.0060}'

*/



