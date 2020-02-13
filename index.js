const fs = require('fs');
const https = require('https');

// Node.js Function to save image from External URL.
async function saveImageToDisk(url, localPath) {
  // const fullUrl = url;
  const file = fs.createWriteStream(localPath);
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      // response.on('data', (chunk) => { rawData += chunk; });
      response.on('end', () => resolve())
        .on('error', (e) => {
          reject(e);
        });
    });
  });
}

async function getImageListFromGoogle() {
  return new Promise((resolve, reject) => {
    http.get('https://earthview.withgoogle.com/_api/argentina-13879.json', (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n'
                        + `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n'
                        + `Expected application/json but received ${contentType}`);
      }
      if (error) {
        console.error(error.message);
        // Consume response data to free up memory
        res.resume();
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          console.log(parsedData);
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
    });
  });
}

(async () => {
  try {
    saveImageToDisk(
      'https://www.gstatic.com/prettyearth/assets/full/13879.jpg',
      'images/df.jpg',
    );
  } catch (e) {
    console.log(e);
  }
})();
