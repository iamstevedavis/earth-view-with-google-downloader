/* eslint-disable no-console */
const fs = require('fs');
const https = require('https');
const { performance } = require('perf_hooks');
const axios = require('axios');
const prompts = require('prompts');
// eslint-disable-next-line prefer-destructuring
const Spinner = require('cli-spinner').Spinner;

async function saveImageToDisk(url, localPath) {
  const file = fs.createWriteStream(localPath);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      response.on('end', () => resolve())
        .on('error', (e) => reject(e));
    });
  });
}

async function getImageDataFromGoogle(urlSlug) {
  return axios
    .get(`https://earthview.withgoogle.com/_api/${urlSlug}.json`)
    .then(({ data }) => ({
      photoUrl: data.photoUrl,
      nextSlug: data.nextSlug,
    }));
}

(async () => {
  const imagesFolder = await prompts({
    type: 'text',
    name: 'value',
    message: 'Where will images be saved? (/images)',
    initial: 'images',
  });
  if (!fs.existsSync(imagesFolder.value)) {
    fs.mkdirSync(imagesFolder.value);
  }
  const saveImagesPromises = [];
  const imagesMap = {};
  const spinner = new Spinner({
    text: 'Processing...',
    stream: process.stderr,
    onTick(msg) {
      this.clearLine(this.stream);
      this.stream.write(msg);
    },
  });
  spinner.start();
  let data = {};
  let curr = 'queensland-australia-1908';
  let i = 0;
  const start = performance.now();
  // eslint-disable-next-line no-constant-condition
  while (i < 10) {
    i += 1;
    try {
      /* eslint-disable no-await-in-loop */
      data = await getImageDataFromGoogle(curr);
    } catch (e) {
      console.log(e);
      break;
    }
    if (imagesMap[data.nextSlug]) break;
    imagesMap[data.nextSlug] = data;
    saveImagesPromises.push(saveImageToDisk(data.photoUrl, `${imagesFolder.value}/${curr}.jpg`));
    curr = data.nextSlug;
    spinner.text = `Got ${i} images so far...`;
  }
  spinner.stop();
  console.clear();
  console.log('Finishing up saving images...');
  return Promise.all(saveImagesPromises)
    .then(() => {
      console.clear();
      console.log(`Saved ${i} images in ${Math.floor(performance.now() - start)} milliseconds.`);
    });
})();
