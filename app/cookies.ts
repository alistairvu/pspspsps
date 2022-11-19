import { createCookie } from '@remix-run/node'; // or cloudflare/deno

export const passwordCookie = createCookie('password-cookie', {
  maxAge: 604_800, // one week
});
