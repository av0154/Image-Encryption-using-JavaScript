const alert = require('cli-alerts');
const fs = require('fs');
const jimp = require('jimp');
const path = require('path');

const decrypt = async flags => {
	if (flags.encrypt) {
		alert({
			type: 'warning',
			name: 'Invalid combination of flags',
			msg: 'Cannot use both --encrypt and --decrypt flags together'
		});
		process.exit(1);
	}

	const filePath = flags.decrypt;
	if (!filePath) {
		alert({
			type: 'warning',
			name: 'Invalid file path',
			msg: 'Please provide a valid file path'
		});
		process.exit(1);
	}

	if (!fs.existsSync(filePath)) {
		alert({
			type: 'warning',
			name: 'Invalid file path',
			msg: 'Please provide a valid file path'
		});
		process.exit(1);
	}

	if (!flags.key) {
		alert({
			type: 'warning',
			name: 'Invalid key',
			msg: 'Please provide a valid key with --key/-k'
		});
		process.exit(1);
	}

	try {
		const ora = (await import('ora')).default;
		const spinner = ora('Reading Image...').start();
		const image = await jimp.read(filePath);
		const extension = image.getExtension();
		const rgba = image.bitmap.data;
		const length = rgba.length;

		spinner.succeed('Image read successfully');

		const spinner2 = ora('Reading Key').start();
		const keyFilePath = path.join(process.cwd(), flags.key);
		const keyBuffer = fs.readFileSync(keyFilePath);
		const key = Buffer.from(keyBuffer.toString(), 'base64');

		spinner2.succeed('Key read successfully');

		const spinner3 = ora('Decrypting image: Decrypting image').start();
		await new Promise(resolve => {
			for (let i = 0; i < length; i++) {
				const k = key[i];
				rgba[i] = rgba[i] ^ k;
			}
			image.bitmap.data = rgba;
			resolve();
		});

		spinner3.succeed('Image decrypted successfully');

		let outputImageFile = filePath.split('.')[0] + `_decrypted.${extension}`;
		const spinner4 = ora('Checking for output image file name').start();

		if (flags.outputImageFileName) {
			outputImageFile = path.basename(flags.outputImageFileName);
			if (!outputImageFile.includes('.')) {
				outputImageFile = `${outputImageFile}.${extension}`;
			} else {
				outputImageFile = outputImageFile.split('.')[0] + `.${extension}`;
			}
		}

		if (fs.existsSync(outputImageFile)) {
			spinner4.fail('Output image file already exists');
			alert({
				type: 'error',
				name: 'Invalid output image file name',
				msg: `The output image file name already exists: ${outputImageFile}\nPlease provide a different output image file name with --outputImageFileName/-i flag`
			});
			process.exit(1);
		}

		spinner4.succeed('Output image file name is valid');

		const spinner5 = ora('Saving Image').start();
		image.write(outputImageFile);
		spinner5.succeed('Image saved successfully');

		alert({
			type: 'success',
			name: 'Image decrypted successfully',
			msg: `Image decrypted successfully: ${outputImageFile}`
		});
	} catch (error) {
		alert({
			type: 'error',
			name: 'Error',
			msg: `${error || 'Unknown error'}`
		});
		process.exit(1);
	}
};

module.exports = decrypt;
