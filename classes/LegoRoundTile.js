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
}