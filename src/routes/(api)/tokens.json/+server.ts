import { jsonError, jsonResponse } from '$lib/utils/response';
import { readFromCache } from '$pre/cache';
import type { RequestHandler } from './$types';

export const prerender = false;

export function _readTokens(): api.Tokens {
	const tokens = readFromCache<api.Tokens>('tokens');

	if (!tokens) {
		throw jsonError(404, { message: `Token mapping not found.` });
	}

	return tokens;
}

export const GET: RequestHandler = async ({ params }) => {
	const tokens = _readTokens();

	return jsonResponse(tokens);
};
