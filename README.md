# Earth View with Google Downloader

**Note: This project no longer works because [Earth View with Google](https://earthview.withgoogle.com/) has been taken down.**

This script was designed to download all the images from Earth View with Google.

As a simple quality check, the script verified that every image downloaded was at least 1800×1200 using ImageMagick. This check was optional and required ImageMagick to be installed on your system.

For more information about ImageMagick, visit: [https://imagemagick.org](https://imagemagick.org)

## Usage

1. Optionally, install ImageMagick for your system.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the script:
   ```bash
   npm start
   ```

The script prompted for a save directory and whether to verify image quality using ImageMagick.