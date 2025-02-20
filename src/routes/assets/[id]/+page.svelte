<script lang="ts">
	import { page } from '$app/stores';
	import LineChart from '$components/line-chart.svelte';
	import LiquidFill from '$components/liquid-fill.svelte';
	import Sankey from '$components/sankey-layer.svelte';
	import Table from '$components/table.svelte';
	import { ApiProxy } from '$lib/query/apis/proxy';
	import { formatCurrency, formatNum, formatPercentage } from '$lib/utils/string-formatting';
	import { CheckCircleIcon, ExclamationIcon } from '@rgossiaux/svelte-heroicons/outline';
	import * as d3 from 'd3';
	import { shuffle } from 'lodash-es';
	import { onMount } from 'svelte';
	import SvelteSeo from 'svelte-seo';
	import type { PageData } from './$types';

	export let data: PageData;

	$: ({ assets, trees, comments, domain } = data);

	$: id = $page.params.id!;

	$: asset = assets[id]!;
	$: tree = trees[id]![0]!;

	$: price = asset.price[0]!;

	const api = new ApiProxy();

	async function fetchCurrentPrice() {
		if (asset.contracts) {
			price = ((await api.getPrice(asset.contracts.token)) ?? price) as cache.Price;
		}
	}

	onMount(async () => {
		await fetchCurrentPrice();
		const interval = setInterval(async () => {
			await fetchCurrentPrice();
		}, 5000);

		return () => {
			clearInterval(interval);
		};
	});

	let stats: api.Stat[] = [];
	$: stats = [
		{
			name: 'Price',
			value: price.usd,
			type: 'currency'
		},
		{
			name: 'Backing Assets',
			value: asset.backing[0]!['backing-assets'],
			type: 'standard'
		},
		{
			name: 'Backing Ratio',
			value: asset.backing[0]!.ratio,
			type: 'percent'
		},
		asset.backing[0]!['backing-assets'] > 0
			? {
					name: 'Backing Uniformity',
					value: asset.backing[0]!.uniformity,
					type: 'percent'
			  }
			: {
					name: 'Backing Uniformity',
					value: 'N/A',
					type: 'standard'
			  }
	];

	$: backingRatio = formatPercentage(asset.backing[0]!.ratio);
	$: backingUsd = formatCurrency(asset.backing[0]!['backing-usd']);
	$: backingAssets = asset.backing[0]!['backing-assets'];
	$: seo = {
		title: `${asset.name} (${asset.symbol}) Backing, History, Chain`,
		description: `${
			asset.name
		} is backed to ${backingRatio} with ${backingUsd} by ${backingAssets} ${
			backingAssets == 1 ? 'asset' : 'assets'
		}. Learn more ...`,
		url: `${domain}/assets/${asset.id}`,
		image: {
			url: `${domain}/previews/assets/${asset.id}.jpg`,
			width: 1200,
			height: 630,
			alt: `Preview of ${asset.name}'s backing view.`
		}
	};
</script>

<SvelteSeo
	title={seo.title}
	description={seo.description}
	openGraph={{
		title: seo.title,
		description: seo.description,
		url: seo.url,
		type: 'website',
		images: [seo.image]
	}}
	twitter={{
		site: '@bcked_com',
		title: seo.title,
		description: seo.description,
		image: seo.image.url,
		imageAlt: seo.image.alt
	}}
/>

<div class="py-10">
	<div class="max-w-7xl mx-auto space-y-4 sm:px-6 lg:px-8">
		<div class="grid grid-cols-2 gap-[0.1rem] sm:gap-4 md:grid-cols-4 shadow sm:shadow-none">
			<!-- {stats.length <= 4 ? stats.length : 4} -->
			{#each stats as item}
				<div class="relative px-4 py-5 bg-gray-50 sm:shadow sm:rounded-lg overflow-hidden sm:p-6">
					{#if item.type == 'percent' && typeof item.value == 'number'}
						<div class="absolute top-0 left-0 h-full w-full">
							<LiquidFill
								fillPercent={item.value}
								class="h-full w-full"
								waveColor="#FFDDDD"
								waveAnimateTime={2000}
								waveHeight={0.1}
								waveHeightScaling={true}
							/>
						</div>
					{/if}
					<dl class="relative">
						<dt class="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
						<dd class="mt-1 text-3xl font-semibold text-gray-900">
							{#if item.type == 'standard'}
								{item.value}
							{:else if item.type == 'currency' && typeof item.value == 'number'}
								{formatCurrency(item.value)}
							{:else if item.type == 'percent' && typeof item.value == 'number'}
								{formatPercentage(item.value)}
							{:else}
								{item.value}
							{/if}
						</dd>
					</dl>
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 shadow-none">
			<div class="bg-gray-50 shadow sm:rounded-lg overflow-hidden">
				<div class="px-4 pt-5 sm:px-6 sm:pt-6">
					<div class="max-w-3xl mx-auto text-center">
						<h2 class="text-3xl tracking-tight font-bold text-gray-900">Backing History</h2>
						<p class="mt-4 text-lg text-gray-500">
							View the backing history of {asset.name}.
						</p>
					</div>
					<div class="flex mt-6 items-center justify-between">
						<dl>
							<dt class="text-sm font-medium text-gray-500 truncate">Current Backing</dt>
							<dd class="mt-1 text-3xl font-semibold text-gray-900">
								{formatCurrency(asset.backing[0]['backing-usd'])}
							</dd>
						</dl>
						<dl class="text-right">
							<dt class="text-sm font-medium text-gray-500 truncate">Current Market Cap</dt>
							<dd class="mt-1 text-3xl font-semibold text-gray-900">
								{formatCurrency(asset.mcap)}
							</dd>
						</dl>
					</div>
				</div>
				<div class="text-center mt-6 text-lg font-thin text-gray-500 overflow-visible">
					<LineChart
						id="{asset.name.toLowerCase().split(' ').join('-')}-backing-history"
						data={asset.backing.map((b) => ({
							x: b.timestamp,
							y: b['backing-usd']
						}))}
						parseX={d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')}
						formatX={d3.timeFormat('%e %B %Y')}
						formatY={(v) => formatCurrency(v)}
						heightRatio={0.39}
					/>
				</div>
			</div>

			<div class="bg-gray-50 shadow sm:rounded-lg overflow-hidden">
				<div class="px-4 pt-5 sm:px-6 sm:pt-6">
					<div class="max-w-3xl mx-auto text-center">
						<h2 class="text-3xl tracking-tight font-bold text-gray-900">Backing Chain</h2>
						<p class="mt-4 text-lg text-gray-500">
							View the full chain of assets backing {asset.name}.
						</p>
					</div>
				</div>

				<div class="flex mt-6 justify-center">
					<Sankey backing={tree} {assets} />
				</div>
			</div>
		</div>

		<div class="px-4 py-5 bg-gray-50 shadow sm:rounded-lg overflow-hidden sm:p-6">
			<div class="max-w-3xl mx-auto text-center">
				<h2 class="text-3xl tracking-tight font-bold text-gray-900">Praise and Doubts</h2>
				<p class="mt-4 text-lg text-gray-500">
					Any praise and doubts the community has about {asset.name}'s backing.
				</p>
			</div>
			{#if comments.length > 0}
				<div
					class="mt-6 space-y-10 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-8"
				>
					{#each shuffle(comments) as comment}
						<div class="relative flex">
							<div class="flex-shrink-0 mr-4">
								{#if comment.type == 'doubt'}
									<ExclamationIcon class="h-6 w-6 text-red-500" aria-hidden="true" />
								{:else if comment.type == 'praise'}
									<CheckCircleIcon class="h-6 w-6 text-green-500" aria-hidden="true" />
								{/if}
							</div>
							<dl class="flex-1">
								{@html comment.html}
							</dl>
						</div>
					{/each}
				</div>
			{:else}
				<div class="max-w-3xl mx-auto text-center mt-12 text-lg font-thin text-gray-500">
					There are no comments yet. Be the first to leave your praise and doubts <a
						href="https://github.com/bcked/bcked.com/issues"
						class="underline hover:text-neon-pink">here</a
					>!
				</div>
			{/if}
		</div>
		<Table
			columns={[
				{ id: 'share', title: '%', class: '' },
				{ id: 'name', title: 'Name', class: 'font-medium', link: true },
				{ id: 'price', title: 'Price', class: 'hidden lg:table-cell' },
				{ id: 'amount', title: 'Amount', class: 'hidden sm:table-cell' },
				{ id: 'backing-usd', title: 'Backing', class: '' },
				{ id: 'backing-ratio', title: 'Backing Ratio', class: '' }
			]}
			rows={tree.nodes
				.filter((node) => node['id'] in assets)
				.filter(({ id, level }) => level == 1 && id != tree.id && id != 'unbacked')
				.map((node) => ({ ...node, asset: assets[node.id] }))
				.map((node, i) => ({
					name: { text: node.asset.name, value: node.asset.name, icon: node.asset.icon },
					'name-path': { text: node.asset.links.ui, value: node.asset.links.ui },
					price: {
						text: formatCurrency(node.value / asset.backing[0].assets[node.id]),
						value: node.value / asset.backing[0].assets[node.id]
					},
					amount: {
						text: formatNum(asset.backing[0].assets[node.id]),
						value: asset.backing[0].assets[node.id]
					},
					share: {
						text: formatPercentage(node.value / tree.backed),
						value: node.value / tree.value
					},
					'backing-usd': { text: formatCurrency(node.value), value: node.value },
					'backing-ratio': {
						text: formatPercentage(node.value / tree.value),
						value: node.value / tree.value
					}
				}))}
			sort={[{ by: 'share' }]}
			class="bg-gray-50 shadow sm:mx-0 sm:rounded-lg overflow-hidden"
		/>
	</div>
</div>
