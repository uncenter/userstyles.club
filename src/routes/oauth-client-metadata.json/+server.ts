import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createClientMetadata } from '$lib/at/metadata';

export const prerender = true;

function getBuildOrigin() {
  return env.SITE_ORIGIN?.trim() || env.VITE_SITE_ORIGIN?.trim() || 'https://userstyles.club';
}

export function GET() {
  return json(createClientMetadata(getBuildOrigin()));
}
