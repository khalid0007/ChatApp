const sizeOf = require("buffer-image-size");
const sharp = require("sharp");

exports.resizeImg = async (bufferImg) => {
  const dimensions = sizeOf(bufferImg);
  const maxWidth = 500;

  const scaleFactor = maxWidth / dimensions.width;

  const height = Math.ceil(dimensions.height * scaleFactor);

  if (maxWidth < dimensions.width) {
    const newImgBuffer = await sharp(bufferImg)
      .resize(maxWidth, height)
      //   .resize(maxWidth, height, {
      //     kernel: sharp.kernel.nearest,
      //     fit: sharp.fit.inside,
      //     withoutEnlargement: true,
      //     position: "right top",
      //     background: { r: 255, g: 255, b: 255, alpha: 0.5 },
      //   })
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toBuffer();

    return { photo: newImgBuffer, compressed: true };
  } else {
    return { photo: bufferImg, compressed: false };
  }
};
