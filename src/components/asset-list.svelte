<script lang="ts">
	import type { ComponentType } from 'svelte';
	import { base } from '$app/paths';
	import { ChevronRightIcon } from '@rgossiaux/svelte-heroicons/solid';
	import { CashIcon } from '@rgossiaux/svelte-heroicons/outline';

	export let assets: api.Assets;
	export let icon: ComponentType;
	export let title: string;
	export let compare: (a: api.Asset, b: api.Asset) => number;
	export let size: number;
	export let select: (asset: api.Asset) => string;
	export let filter: (asset: api.Asset) => boolean;
</script>

<div class="px-4 py-5 overflow-hidden sm:p-6 text-gray-900">
	<dt>
		<div class="flex items-center space-x-2 ">
			<svelte:component this={icon} class="h-5 w-5 text-neon-pink" aria-hidden="true" />
			<span class="text-lg font-semibold">{title}</span>
		</div>
	</dt>
	<dd>
		<ul class="mt-2 space-y-2">
			{#each Object.values(assets).filter(filter).sort(compare).slice(0, size) as asset, i}
				<li>
					<a href={asset.links.ui} class="rounded-md block">
						<div class="flex items-center min-w-0 flex-1 justify-between">
							<div class="flex items-center">
								<div class="text-gray-500 text-sm">
									{i + 1}
								</div>
								<div class="flex items-center space-x-1 px-4 sm:px-6">
									{#if asset.icon}
										<img
											class="h-5 w-5 object-contain"
											src="{base}/{asset.icon}"
											alt="Icon of {asset.name}"
										/>
									{:else}
										<CashIcon class="h-5 w-5 text-gray-500" aria-hidden="true" />
									{/if}
									<div class="flex items-center space-x-1">
										<span class="block font-semibold">
											{asset.name}
										</span>
										<span class="block text-gray-500 text-sm">
											({asset.symbol})
										</span>
									</div>
								</div>
							</div>
							<div class="flex items-center">
								<div>
									{select(asset)}
								</div>
								<div class="ml-5 flex-shrink-0">
									<ChevronRightIcon class="h-5 w-5 text-gray-500" aria-hidden="true" />
								</div>
							</div>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	</dd>
</div>
