export const TAGLINE = 'The one and only decentralized userstyles publishing club.';
export const REPO_URL = 'https://github.com/uncenter/userstyles.club';

export const joinPageTitle = (...parts: string[]) => {
  parts.push('userstyles.club');
  return parts.join(' · ');
};
