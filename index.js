/* eslint-disable no-console */
const fs = require('fs');
const { performance } = require('perf_hooks');
const axios = require('axios');
const path = require('path');
const prompts = require('prompts');
// eslint-disable-next-line prefer-destructuring
const Spinner = require('cli-spinner').Spinner;
const gm = require('gm').subClass({ imageMagick: true });

let saveDir;

async function checkImageSize(localPath) {
  return new Promise((resolve, reject) => {
    gm(localPath)
      .size((err, size) => {
        if (err) {
          return reject(err);
        }
        if (size.width < 1800 || size.height < 1200) {
          fs.unlinkSync(localPath);
        }
        return resolve(true);
      });
  });
}

function getExtension(fileName) {
  const basename = fileName.split(/[\\/]/).pop();
  const pos = basename.lastIndexOf('.');

  if (basename === '' || pos < 1) { return ''; }

  return basename.slice(pos + 1);
}

async function downloadAndSaveImage(url, fileName) {
  const extension = getExtension(url);
  const localFilePath = path.resolve(__dirname, saveDir, `${fileName}.${extension}`);
  const writer = fs.createWriteStream(localFilePath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  })
    .then(() => localFilePath);
}

async function getImageJSONDataFromGoogle(urlSlug) {
  const { data: imageData } = await axios.get(`https://earthview.withgoogle.com/_api/${urlSlug}.json`);
  return {
    photoUrl: imageData.photoUrl,
    nextSlug: imageData.nextSlug,
  };
}

(async () => {
  const promptsResponses = await prompts([{
    type: 'text',
    name: 'saveDir',
    message: 'Where will images be saved? (./images)',
    initial: 'images',
  }, {
    type: 'toggle',
    name: 'verifyImageQuality',
    message: 'Do you want to verify image size (min. 1800 * 1200) with imagemagick? (must be installed separately)',
    initial: false,
    active: 'yes',
    inactive: 'no',
  }]);

  saveDir = promptsResponses.saveDir;
  const { verifyImageQuality } = promptsResponses;

  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir);
  }

  const spinner = new Spinner({
    text: 'Processing...',
    stream: process.stderr,
    onTick(msg) {
      this.clearLine(this.stream);
      this.stream.write(msg);
    },
  });
  spinner.start();

  const saveImagesPromises = [];
  const imagesMap = {};
  let imageName = 'queensland-australia-1908';
  let i = 0;
  const start = performance.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let imageData;
    i += 1;
    try {
      /* eslint-disable no-await-in-loop */
      imageData = await getImageJSONDataFromGoogle(imageName);
    } catch (e) {
      console.log(e);
    }

    if (imagesMap[imageData.nextSlug]) break;

    imagesMap[imageData.nextSlug] = imageData;
    saveImagesPromises.push(
      downloadAndSaveImage(imageData.photoUrl, imageName)
        .then(async (localFilePath) => {
          if (verifyImageQuality) {
            await checkImageSize(localFilePath);
          }
        })
        .catch((error) => {
          console.log(error);
          return Promise.resolve();
        }),
    );
    imageName = imageData.nextSlug;
    spinner.text = `Got ${i} images so far...`;
  }

  await Promise.all(saveImagesPromises);

  const end = performance.now();

  spinner.stop();
  console.clear();
  console.log(`Got ${i} total images. The folder '${saveDir}' now contains ${fs.readdirSync(saveDir).length} images.`);
  console.log(`Time elapsed: ${Math.floor(end - start)} milliseconds.`);
})();
