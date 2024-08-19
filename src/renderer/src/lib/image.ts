import { encode } from "blurhash"

export function getBlurHash(imageObject: HTMLImageElement) {
  if (imageObject instanceof HTMLImageElement === false) {
    return
  }

  const { src } = imageObject
  if (!src) {
    return
  }

  // const canvas = document.createElement("canvas"),
  //   ctx = canvas.getContext("2d")!;

  // canvas.width = imageObject.naturalWidth;
  // canvas.height = imageObject.naturalHeight;
  // ctx.drawImage(imageObject, 0, 0);

  // const dataURL = canvas.toDataURL();
  // const newImage = new Image();
  // newImage.src = dataURL;

  // return new Promise<string>((resolve) => {
  //   newImage.onload = () => {
  //     const canvas = document.createElement("canvas"),
  //       ctx = canvas.getContext("2d")!;

  //     canvas.width = newImage.naturalWidth;
  //     canvas.height = newImage.naturalHeight;
  //     ctx.drawImage(newImage, 0, 0);

  //     const imageData = ctx.getImageData(0, 0, 32, 32)!;

  //     const pixels = new Uint8ClampedArray(imageData.data);
  //     const componentX = 4;
  //     const componentY = 4;

  //     const hash = encode(pixels, 32, 32, componentX, componentY);
  //     resolve(hash);
  //   };
  // });
  return new Promise<string>((resolve) => {
    fetch(src, { mode: "no-cors" })
      .then((res) => {
        return res.blob()
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        console.log(url, blob)
        const img = new Image()
        img.src = url
        document.body.append(img)
        img.style.position = "absolute"
        img.style.left = "0px"
        img.style.top = "0px"
        img.style.zIndex = "1000"

        img.onload = function () {
          // 在主 canvas 中使用 img
          const canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d")!
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, 32, 32)!
          const pixels = new Uint8ClampedArray(imageData.data)
          const componentX = 4
          const componentY = 4
          const hash = encode(pixels, 32, 32, componentX, componentY)
          resolve(hash)
        }
      })
  })
}
