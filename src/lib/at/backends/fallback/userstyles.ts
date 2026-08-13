import { type ActorIdentifier, type RecordKey, parseCanonicalResourceUri } from '@atcute/lexicons';
import { is } from '@atcute/lexicons/validations';

import { getBlobText, getRecord, listRecordsForCollection, listRecordsForRepo } from '../../records';
import { CLUB_USERSTYLE_COLLECTION } from '../../settings';
import { getBlobCid, getLatestDate } from '../../utils';
import { ClubUserstylesAlphaUserstyle } from '@userstyles.club/atcute';
import type { UserstyleView, UserstyleRecord } from '../../services/userstyles';
import { computeRatingSummary } from '../../services/ratings';
import { listRatingsFromConstellation } from './ratings';

async function userstyleRecordToView(record: UserstyleRecord): Promise<UserstyleView> {
  const { repo } = parseCanonicalResourceUri(record.uri);
  const { value } = record;

  const ratingSummary = computeRatingSummary(await listRatingsFromConstellation(record.uri));

  return {
    uri: record.uri,
    cid: record.cid!,
    author: repo,
    title: value.title,
    description: value.description,
    license: value.license,
    upstreamUrl: value.upstreamUrl,
    homepageUrl: value.homepageUrl,
    ignoreUpdateUrl: value.ignoreUpdateUrl,
    sourceCodeCid: getBlobCid(value.sourceCode),
    previewImageCid: value.previewImage ? getBlobCid(value.previewImage) : undefined,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    indexedAt: getLatestDate(value),
    ratingCount: ratingSummary.count,
    ratingAverage: ratingSummary.average,
  };
}

export async function getUserstyleFromPds(
  repo: ActorIdentifier,
  rkey: RecordKey,
): Promise<UserstyleRecord> {
  return await getRecord({ repo, collection: CLUB_USERSTYLE_COLLECTION, rkey });
}

export async function getUserstyleSourceCodeFromPds(userstyle: UserstyleRecord): Promise<string> {
  const { repo } = parseCanonicalResourceUri(userstyle.uri);
  return await getBlobText(repo, userstyle.value.sourceCode);
}

/** Slow relay-fanout: walks every repo that publishes the collection and fetches each one's records directly. */
export async function listAllUserstylesFromRelay(): Promise<UserstyleView[]> {
  const records = await listRecordsForCollection({ collection: CLUB_USERSTYLE_COLLECTION });
  return await Promise.all(records.map(userstyleRecordToView));
}

export async function listUserstylesFromPds(repo: ActorIdentifier): Promise<UserstyleView[]> {
  const records: UserstyleRecord[] = [];
  let cursor: string | undefined;
  do {
    const response = await listRecordsForRepo({
      repo,
      collection: CLUB_USERSTYLE_COLLECTION,
      limit: 100,
      cursor,
    });
    records.push(
      ...response.records.filter((record): record is UserstyleRecord =>
        is(ClubUserstylesAlphaUserstyle.mainSchema, record.value),
      ),
    );
    cursor = response.cursor;
  } while (cursor);

  records.sort((a, b) => b.value.createdAt.localeCompare(a.value.createdAt));
  return await Promise.all(records.map(userstyleRecordToView));
}
