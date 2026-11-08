const cloudinary = require('cloudinary').v2; // reads CLOUDINARY_URL automatically

// Returns an array of image paths/URLs to store on the pet
async function saveImages(files = []) {
  if (!process.env.CLOUDINARY_URL) return files.map((f) => `/uploads/${f.filename}`);
  return Promise.all(
    files.map(
      (f) =>
        new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: 'pawhome' }, (err, result) => (err ? reject(err) : resolve(result.secure_url)))
            .end(f.buffer);
        })
    )
  );
}

module.exports = { saveImages };