export class ImageHandler {
    #imagePath;
    #image;
    #context;
    #pixelatedImage;
    #diameter;
    #maxWidth;
    #maxHeight;
    #nbRows;
    #nbCols;

    /* -----------------------------------
        CONSTRUCTOR
    ----------------------------------- */

    constructor(imagePath, diameter, maxWidth, maxHeight) {
        this.#imagePath = imagePath;
        this.#context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
        this.#diameter = diameter;
        this.#maxWidth = maxWidth || 500; // Default max width if not provided
        this.#maxHeight = maxHeight || 500; // Default max height if not provided
    }

    /* -----------------------------------
        SETTERS AND GETTERS
    ----------------------------------- */

    get nbRows() { return this.#nbRows; }
    get nbCols() { return this.#nbCols; }
    get diameter() { return this.#diameter; }
    set diameter(value) { this.#diameter = value; }

    /* -----------------------------------
        PRIVATE METHODS
    ----------------------------------- */

    #decToHex(dec) { return Number(dec).toString(16).padStart(2, "0"); }

    #resizeWithAspectRatio(imgWidth, imgHeight, maxWidth, maxHeight) {
        const aspectRatio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

        return {
            width: Math.floor(imgWidth * aspectRatio),
            height: Math.floor(imgHeight * aspectRatio)
        };
    }

    /* -----------------------------------
        PUBLIC METHODS
    ----------------------------------- */

    async loadImage() {
        return new Promise((resolve, reject) => {
            this.#image = new Image();
            this.#image.src = this.#imagePath;

            this.#image.onload = () => {
                const width = this.#image.width;
                const height = this.#image.height;

                const { width: resizedWidth, height: resizedHeight } = this.#resizeWithAspectRatio(width, height, this.#maxWidth, this.#maxHeight);

                this.#image.width = resizedWidth;
                this.#image.height = resizedHeight;
                this.#context.canvas.width = resizedWidth;
                this.#context.canvas.height = resizedHeight;

                this.pixelate(this.#diameter);

                resolve();
            };
        });
    }

    changeImage(newImagePath) {
        this.#imagePath = newImagePath;
        this.loadImage();
    }

    pixelate(diameter = this.#diameter) {
        const width = this.#context.canvas.width;
        const height = this.#context.canvas.height;

        this.#context.drawImage(this.#image, 0, 0, this.#image.width, this.#image.height);

        const imageData = this.#context.getImageData(0, 0, width, height);

        const data = [];

        for (let iRow = 0; iRow < (imageData.height) / diameter; iRow++) {
            data[iRow] = [];
        
            for (let iCol = 0; iCol < (imageData.width) / diameter; iCol++) {
                for (let iRoundTileRow = 0; iRoundTileRow < diameter; iRoundTileRow++) {
                    for (let iRoundTileCol = 0; iRoundTileCol < diameter; iRoundTileCol++) {
                        const pixelIndex =
                            (iRow * diameter * imageData.width * 4) +
                            (iCol * diameter * 4) +
                            (iRoundTileRow * imageData.width * 4) +
                            (iRoundTileCol * 4);

                        // Skip if the pixel index is out of bounds
                        if (pixelIndex >= imageData.data.length) continue;

                        if (!data[iRow][iCol]) {
                            data[iRow][iCol] = { r: 0, g: 0, b: 0, count: 0, hex: '' };
                        }

                        data[iRow][iCol].count++;

                        data[iRow][iCol].r += (imageData.data[pixelIndex] - data[iRow][iCol].r) / data[iRow][iCol].count;
                        data[iRow][iCol].g += (imageData.data[pixelIndex + 1] - data[iRow][iCol].g) / data[iRow][iCol].count;
                        data[iRow][iCol].b += (imageData.data[pixelIndex + 2] - data[iRow][iCol].b) / data[iRow][iCol].count;

                        /* Render pixels white and transparent to draw over them */
                        imageData.data[pixelIndex] = 255;
                        imageData.data[pixelIndex + 1] = 255;
                        imageData.data[pixelIndex + 2] = 255;
                        imageData.data[pixelIndex + 3] = 255;
                    }
                }

                data[iRow][iCol].hex = '#' + this.#decToHex(Math.round(data[iRow][iCol].r)) + this.#decToHex(Math.round(data[iRow][iCol].g)) + this.#decToHex(Math.round(data[iRow][iCol].b));
            }
        }

        this.#nbRows = data.length;
        this.#nbCols = data[0].length;
        this.#pixelatedImage = data;
    }

    toTile() {
        return this.#pixelatedImage.map((row, index) => {
            return row.map((tile) => ({
                diameter: this.#diameter,
                color: tile.hex,
                rowIndex: index,
                colIndex: row.indexOf(tile)
            }));
        }).flat();
    }
}