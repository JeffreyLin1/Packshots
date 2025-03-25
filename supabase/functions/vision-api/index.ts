// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

console.log("Hello from Functions!")

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
    const { imageBase64 } = await req.json();
    
    console.log("Received request with image data length:", 
      imageBase64 ? imageBase64.length : 0);
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get Google Cloud Vision service account credentials from Supabase secrets
    const gcpServiceAccount = Deno.env.get('GOOGLE_SERVICE_ACCOUNT');
    if (!gcpServiceAccount) {
      console.error("Google Cloud service account not found in environment");
      return new Response(
        JSON.stringify({ error: 'Google Cloud service account not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Log that we have credentials (don't log the actual credentials)
    console.log("Google Cloud service account found, proceeding with API call");
    
    // Parse the service account JSON
    const serviceAccount = JSON.parse(gcpServiceAccount);
    
    // Generate a JWT token for authentication
    const token = await generateGoogleAuthToken(serviceAccount);
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate authentication token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Call Google Cloud Vision API
    const visionApiUrl = 'https://vision.googleapis.com/v1/images:annotate';
    
    const requestBody = {
      requests: [
        {
          image: {
            content: imageBase64.replace(/^data:image\/\w+;base64,/, '')
          },
          features: [
            { 
              type: 'OBJECT_LOCALIZATION', 
              maxResults: 25
            }
          ]
        }
      ]
    };

    // Make request to Google Cloud Vision API with the JWT token
    const response = await fetch(visionApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Vision API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Google Vision API error', 
          status: response.status,
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    const data = await response.json();
    console.log("Received response from Google Vision API");
    
    // Process and return the results
    let detectedObjects = [];
    
    if (data.responses && data.responses[0] && data.responses[0].localizedObjectAnnotations) {
      detectedObjects = data.responses[0].localizedObjectAnnotations.map(obj => ({
        name: obj.name,
        confidence: obj.score
      }));
      
      // Filter out generic/broad terms
      const genericTerms = [
        'plastic', 'metal', 'cylinder', 'material', 'product', 'liquid', 'fluid',
        'container', 'device', 'object', 'item', 'gadget', 'accessory', 'silver',
        'black', 'white', 'personal care', 'carbon fibers', 'bottled and jarred packaged goods',
        'hardware', 'electronic device', 'technology', 'electronics', 'household hardware'
      ];

      detectedObjects = detectedObjects.filter(obj => 
        !genericTerms.some(term => 
          obj.name.toLowerCase().includes(term.toLowerCase())
        )
      );

      // Filter by minimum confidence
      const MIN_CONFIDENCE = 0.5;  // Slightly lower threshold for object localization
      detectedObjects = detectedObjects.filter(obj => obj.confidence >= MIN_CONFIDENCE);

      // Sort by confidence
      detectedObjects.sort((a, b) => b.confidence - a.confidence);

      // Limit to top 10 results
      detectedObjects = detectedObjects.slice(0, 10);
    }

    return new Response(
      JSON.stringify({ objects: detectedObjects }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Function to generate a Google Auth token from service account credentials
async function generateGoogleAuthToken(serviceAccount) {
  try {
    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    };
    
    // Define the claim set
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600, // Token expires in 1 hour
      scope: 'https://www.googleapis.com/auth/cloud-platform'
    };
    
    // Encode the JWT parts
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedClaimSet = btoa(JSON.stringify(claimSet));
    
    // Create the JWT signature base
    const signatureBase = `${encodedHeader}.${encodedClaimSet}`;
    
    // Import the private key
    const privateKey = serviceAccount.private_key;
    const keyData = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\n/g, '');
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );
    
    // Sign the JWT
    const encoder = new TextEncoder();
    const signatureBytes = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      cryptoKey,
      encoder.encode(signatureBase)
    );
    
    // Convert signature to base64
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    // Combine all parts to form the JWT
    const jwt = `${encodedHeader}.${encodedClaimSet}.${signature}`;
    
    // Get an access token using the JWT
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token generation error:", tokenResponse.status, errorText);
      return null;
    }
    
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error("Error generating auth token:", error);
    return null;
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/vision-api' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
