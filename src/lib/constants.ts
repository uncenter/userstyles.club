export const CLUB_BRAND_DID = 'did:plc:z6a2tfjek74wmqinw5vjzbed';
export const CLUB_AUTHOR_DID = 'did:plc:rkm6m4dsc4da2yzdlvxorhf3';

export const TAGLINE = 'The club for sharing, discovering, and installing userstyles.';
export const REPO_URL = 'https://github.com/uncenter/userstyles.club';
export const FEEDBACK_URL = `https://userinput.app/s/${CLUB_BRAND_DID}/3mnwveyimvb22`;

export const joinPageTitle = (...parts: string[]) => {
  parts.push('userstyles.club');
  return parts.join(' · ');
};
