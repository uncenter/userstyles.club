export const TAGLINE = 'The one and only decentralized userstyles publishing club.';
export const REPO_URL = 'https://github.com/uncenter/userstyles.club';
export const FEEDBACK_URL =
  'https://userinput.app/s/did:plc:z6a2tfjek74wmqinw5vjzbed/3mnwveyimvb22';

export const joinPageTitle = (...parts: string[]) => {
  parts.push('userstyles.club');
  return parts.join(' · ');
};
