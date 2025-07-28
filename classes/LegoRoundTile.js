import officialLegocolors from '../database/colors.json' assert { type: 'json' };

export class LegoRoundTile {
    #diameter;
    #height;
    #color;

    constructor(diameter, height, color) {
        this.#diameter = diameter;
        this.#height = height;
        this.#color = color;
    }

    get diameter() { return this.#diameter; }
    get height() { return this.#height; }
    get color() { return this.#color; }

    set diameter(value) { this.#diameter = value; }
    set height(value) { this.#height = value; }
    set color(value) { this.#color = value; }

    setDimensions(diameter, height) {
        this.#diameter = diameter;
        this.#height = height;
    }

    setColor(color) {
        this.#color = color;
    }

    findClosestOfficialColor() {
        let closestColor = null;
        let minDistance = Infinity;

        officialLegocolors.forEach(officialColor => {
            const distance = this.#calculateColorDistance(this.#color, officialColor.hex);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = officialColor.hex;
            }
        });

        return closestColor;
    }

    #calculateColorDistance(color1, color2) {
        const rgb1 = this.#hexToRgb(color1);
        const rgb2 = this.#hexToRgb(color2);

        const rDiff = rgb1.r - rgb2.r;
        const gDiff = rgb1.g - rgb2.g;
        const bDiff = rgb1.b - rgb2.b;

        return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
    }

    #hexToRgb(hex) {
        const bigint = parseInt(hex.replace('#', ''), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }
}