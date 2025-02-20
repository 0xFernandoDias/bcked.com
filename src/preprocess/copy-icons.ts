import fs from 'fs';
import path from 'path';
import glob from 'glob';
import _ from 'lodash';

export default function copyIcons(source: string, target: string): cache.Icons {
	const icons: cache.Icon[] = glob.sync(source).map((filepath) => {
		const file = path.parse(filepath);
		const basename = path.basename(file.dir);
		return {
			...file,
			basename,
			source: filepath,
			target: path.resolve('./static', target, basename),
			href: path.join(target, basename, file.base)
		};
	});

	// TODO This can be parallelized
	for (const icon of icons) {
		// Create folder if it does not exist
		fs.mkdirSync(icon.target, { recursive: true });
		fs.copyFileSync(path.resolve(icon.dir, icon.base), path.resolve(icon.target, icon.base));
	}

	return _.keyBy(icons, 'basename');
}
