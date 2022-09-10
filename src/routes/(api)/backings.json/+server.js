import fs from 'fs';
import { parse } from 'yaml';
import { error } from '@sveltejs/kit';
import { jsonResponse } from '$lib/utils/response';
import { readAssets } from '../assets.json/+server';

export const prerender = true;

/** @returns {object} */
export function readBackings() {
    let backings = parse(fs.readFileSync(`./_generated/backing-tree.yml`, 'utf-8'));

    if (!backings) {
        throw error(404, `Asset mapping not found.`)
    }

    const assets = readAssets();

    backings = Object.entries(backings).reduce((a, [id, backing]) => ({
        ...a,
        [id]: {
            id,
            ...backing,
            nodes: backing.nodes.map((node) => ({ ...node, asset: assets[node.id] })),
        }
    }), {});

    return backings
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
    const backings = readBackings();

    return jsonResponse(backings);
}
