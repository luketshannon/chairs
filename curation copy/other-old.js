

function setupPaperCanvas() {
    noCanvas()
    var canvas = document.getElementById('myCanvas');
    paper.setup(canvas);
    let A_R = svgheightin / svgwidthin
    let DIM = Math.min(window.innerWidth, window.innerHeight / A_R) * 0.98
    paper.view.viewSize = new paper.Size(DIM, DIM * A_R)
    W = paper.view.size.width
    H = paper.view.size.height
    S = W / S
    paper.view.onMouseDown = function (event) {
        // Create a new circle shaped path with a radius of 10
        // at the position of the mouse (event.point):
        if (!polys.length) return
        let bitsIdx = -1
        let change = false
        polys.map(poly => {
            if (poly.alpha != 0.75
                && poly.sw != 17
                && poly.sw != 9
                && poly.c != '#ED1C24'
                && !((poly.c == '#B7268F' || poly.c == '#3F55A5') && poly.sc == '#FFFFFF')) {
                bitsIdx++
                if (poly.contains(vec(event.point.x, event.point.y))) {
                    poly.on = !poly.on
                    bits[bitsIdx] = poly.on ? 1 : 0
                    change = true
                }
            }
        })
        // hash = hashPack()
        if (change)
            setup()
    }
}

function hashPack() {
    bools[Bbg] = P.background ?? bools[Bbg]
    // print(P.background)
    bools[Bf] = P.filled ?? bools[Bf]
    bools[Bp] = P.project ?? bools[Bp]
    bools[Bi] = P.interactive ?? bools[Bi]

    // print(bools)
    let binaryString = bits.map(b => b ? 1 : 0).join('') + bools.map(b => b ? 1 : 0).join('')
    let hexString = ''
    for (let i = 0; i < binaryString.length; i += 4) {
        hexString += parseInt(binaryString.slice(i, i + 4), 2).toString(16)
    }
    hexString += P.rndseed.toString(16)
    hexString += P.ink.slice(1)
    hexString = '0x' + hexString
    print(hexString)
    hash = hexString
    return hexString
}

//0x2f770fce3d2676b0d0f49d12b508d9cf94c466175b7874a0158e649b2cbcd54d
// `     chair                                     `bools`rndseed`color
//       220                                          8     4      24
// & 0x1111...111000
// | 0x000...000color

let bits
let bools
function hashUnpack(hash) {
    hash = hash.slice(2)
    let binaryString = ''
    let bitsLen = 228 / 4
    for (let i = 0; i < bitsLen; i++) {
        binaryString += parseInt(hash[i], 16).toString(2).padStart(4, '0')
    }
    let bits = binaryString.slice(0, 220).split('').map(a => parseInt(a))
    let bools = binaryString.slice(220, bitsLen * 4).split('').map(a => parseInt(a) == 1)
    let rndseed = parseInt(hash.slice(bitsLen, bitsLen + 1), 16)
    let ink = '#' + hash.slice(bitsLen + 1, bitsLen + 6 + 1)
    return [ink, rndseed, bits, bools]
}


/////// GUI ////////
var gui = new dat.gui.GUI();


function savePaperSVG() {
    hashPack()

    let removeEmpty = () => {
        for (var i = paper.project.activeLayer.children.length - 1; i >= 0; i--) {
            var child = paper.project.activeLayer.children[i];
            // Check if the child is a path or compound path with no stroke and no fill
            if ((child instanceof paper.Path || child instanceof paper.CompoundPath) &&
                !child.strokeColor && !child.fillColor) {
                // Remove the child from the project
                child.remove();
            }
        }
    }

    removeEmpty()

    let time = `${new Date().toLocaleDateString()}@${new Date().toLocaleTimeString()}`
    let filename = `${window.location.href.split('/')[4] + '-' + time + '-' + hash}.svg`

    const svg = paper.project.exportSVG({ asString: true });
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(svg, "text/xml");
    xmlDoc.documentElement.setAttribute("viewBox", "0 0 " + paper.view.size.width + " " + paper.view.size.height);
    xmlDoc.documentElement.setAttribute("width", svgwidthin + "in");
    xmlDoc.documentElement.setAttribute("height", svgheightin + "in");
    var serializedSvg = new XMLSerializer().serializeToString(xmlDoc);

    const blob = new Blob([serializedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    URL.revokeObjectURL(url);  // Clean up the object URL
}

let permanentParams = () => {
    let reload = () => {
        let currentURL = new URL(window.location.href);
        let searchParams = currentURL.searchParams;
        hash = hashPack()
        searchParams.set('hash', hash);
        currentURL.search = searchParams.toString();
        window.location = currentURL.toString();
    }
    let newLoad = () => {
        let cleanURL = window.location.origin + window.location.pathname;
        window.location = cleanURL
    }
    let myredraw = () => {
        setupRandom()
        redraw()
    }
    let newdraw = () => {
        hash = ''
        setupRandom()
        redraw()
    }
    P.clear = () => {
        bits = bits.map(_ => 0)
    }
    P.full = () => {
        bits = bits.map(_ => 1)
    }
    P.copyToAll = () => {
        let hb = new HashBuilder(hash)
        hb.symmetry(false)
        hb.done()
    }
    P.permute = () => {
        let hb = new HashBuilder(hash)
        hb.bitFlip(0, 220, 0.03)
        hb.done()
    }
    P.remove = () => {
        // turn off a small percent of bits
        let hb = new HashBuilder(hash)
        hb.bitOp(0, 220, HashBuilder.And, 0, 0.03)
        hb.done()
    }
    P.add = () => {
        let hb = new HashBuilder(hash)
        hb.bitOp(0, 220, HashBuilder.Or, 1, 0.03)
        hb.done()
    }
    P.strong = () => {
        let hb = new HashBuilder(hash)
        hb.strong()
        hb.done()
    }
    P.randomInk = () => {
        let hb = new HashBuilder(hash)
        hb.setInk('#' + floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'))
        hb.done()
    }
    P.resetRotation = () => {
        P.x = -PI / 8
        P.y = PI / 12
    }

    P.save = savePaperSVG
    P.reload = reload
    P.newLoad = newLoad
    P.redraw = myredraw
    P.newdraw = newdraw


}

function guiChanged() {
    setup()
}

// Extend dat.GUI prototype
dat.GUI.prototype.myadds = function (params) {
    for (let key in params) {
        this.myadd(params, key);
    }
};

dat.GUI.prototype.myadd = function (obj, key) {
    if (typeof obj[key] === 'number') {
        this.add(obj, key).onChange(guiChanged);
    } else if (typeof obj[key] === 'boolean') {
        this.add(obj, key).onChange(guiChanged);
    } else if (typeof obj[key] === 'string') {
        // Check if it's a color string
        if (/^#([0-9a-f]{3}){1,2}$/i.test(obj[key])) {
            this.addColor(obj, key).onChange(guiChanged);
        } else {
            this.add(obj, key).onChange(guiChanged);
        }
    } else {
        // Handle arbitrary types here
        // For example, if you want to handle arrays:
        if (Array.isArray(obj[key])) {
            this.add(obj, key, obj[key]).onChange(guiChanged);
        }
        // check if type is function
        if (typeof obj[key] === 'function') {
            if (key == 'randomLayout') {
                this.add(obj, key)
            } else {
                this.add(obj, key).onChange(guiChanged)
            }
        }
        // if it is an object add the parameters as above but to a folder
        if (typeof obj[key] === 'object') {
            let folder = this.addFolder(key)
            folder.myadds(obj[key])
        }
        // Extend with other types as needed
    }
    return this
};




/////// SVG /////////

async function getPolysFromSVG(filename) {
    const response = await fetch(filename);
    const svgContent = await response.text();

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const gs = svgDoc.querySelectorAll('g');
    const groups = []
    for (const g of gs) {
        const elements = g.querySelectorAll('path, polygon, line, rect');
        const paths = [];
        for (const element of elements) {
            let polyline = [];
            if (element.tagName === 'path') {
                const d = element.getAttribute('d');
                polyline = pathDataToPolyline(d);
            } else if (element.tagName === 'polygon') {
                const points = element.getAttribute('points');
                polyline = pointsToPolyline(points);
            } else if (element.tagName === 'line') {
                const x1 = parseFloat(element.getAttribute('x1'));
                const y1 = parseFloat(element.getAttribute('y1'));
                const x2 = parseFloat(element.getAttribute('x2'));
                const y2 = parseFloat(element.getAttribute('y2'));
                polyline = [[x1, y1], [x2, y2]];
            } else if (element.tagName === 'rect') {
                let x = parseFloat(element.getAttribute('x'));
                let y = parseFloat(element.getAttribute('y'));
                const width = parseFloat(element.getAttribute('width'));
                const height = parseFloat(element.getAttribute('height'));
                const transform = element.getAttribute('transform');

                if (transform && transform.includes('matrix')) {
                    const matrixValues = transform.match(/matrix\(([^)]+)\)/)[1].split(/\s*,\s*|\s+/).map(val => parseFloat(val));
                    if (matrixValues.length !== 6) {
                        console.error('Unexpected matrix values:', matrixValues);
                        return;
                    }

                    const [a, b, c, d, e, f] = matrixValues;

                    const transformPoint = (x, y) => {
                        return [
                            a * x + c * y + e,
                            b * x + d * y + f
                        ];
                    };

                    [x, y] = transformPoint(x, y);
                    const [x2, y2] = transformPoint(x + width, y);
                    const [x3, y3] = transformPoint(x + width, y + height);
                    const [x4, y4] = transformPoint(x, y + height);

                    polyline = [[x, y], [x2, y2], [x3, y3], [x4, y4], [x, y]];
                } else {
                    polyline = [[x, y], [x + width, y], [x + width, y + height], [x, y + height], [x, y]];
                }
            }
            // print(element)

            const style = element.getAttribute('style') || '';
            const styleObj = style.split(';').reduce((acc, curr) => {
                const [key, value] = curr.split(':');
                if (key && value) {
                    acc[key.trim()] = value.trim();
                }
                return acc;
            }, {});


            const stroke = element.getAttribute('stroke') || styleObj.stroke || 'black';
            let fill = element.getAttribute('fill') || styleObj.fill || -1;
            // if (fill === 'none') fill = undefined
            const strokeWidth = round(parseFloat(element.getAttribute('stroke-width')) || parseFloat(styleObj['stroke-width']) || 1);

            const opacity = parseFloat(element.getAttribute('opacity')) || parseFloat(styleObj.opacity) || 1;
            paths.push({ polyline, stroke, strokeWidth, fill, opacity });
        }
        groups.push(paths)
    }
    // print(groups)

    return groups.map(paths => paths.map(p => {
        let poly = new Poly(p.polyline.map(a => vec(a[0], a[1])), 0, 0, 1, 0, 0, p.fill, p.stroke, p.strokeWidth, p.opacity);
        return poly;
    }));
}

function pointsToPolyline(points) {
    return points
        .trim()
        .split(/\s+|,/)
        .map(Number)
        .reduce((acc, val, idx, arr) => {
            if (idx % 2 === 0) {
                acc.push([arr[idx], arr[idx + 1]]);
            }
            return acc;
        }, []);
}


function pathDataToPolyline(d) {
    // A simple path data to polyline converter
    const pathCommands = d.match(/([A-Za-z]|[+-]?[0-9]+(\.[0-9]+)?)/g);
    const polyline = [];

    let x = 0, y = 0;

    for (let i = 0; i < pathCommands.length; i++) {
        const command = pathCommands[i];

        if (command === 'M' || command === 'm') {
            x = parseFloat(pathCommands[++i]);
            y = parseFloat(pathCommands[++i]);
            polyline.push([x, y]);
        } else if (command === 'L' || command === 'l') {
            x = command === 'L' ? parseFloat(pathCommands[++i]) : x + parseFloat(pathCommands[++i]);
            y = command === 'L' ? parseFloat(pathCommands[++i]) : y + parseFloat(pathCommands[++i]);
            polyline.push([x, y]);
        }
        // You can add more command handling for other commands, such as 'C', 'S', 'Q', 'T', 'A', 'Z', etc.
    }

    return polyline;
}

/////// RANDOM ///////

let rnd, vec, W, H
let simplex, sn2, sn3, sn4;

function setupRandom() {
    rnd = random
    vec = createVector

    seedRNG(hash)

    sn2 = simplex.noise2D.bind(simplex)
    sn3 = simplex.noise3D.bind(simplex)
    sn4 = simplex.noise4D.bind(simplex)

}

function sn(...args) {
    return ['0 args to sn', noise, sn2,
        sn3, sn4][args.length](...args)
}


function seedRNG() {
    if (hash == '') {
        hash = generateHash()
    }

    if (!firstSetup) {
        hash = hashPack()
    }

    let [ink, rndseed, bitsNew, boolsNew] = hashUnpack(hash)
    bits = bitsNew
    bools = boolsNew
    P.ink = ink
    P.rndseed = rndseed

    let colorSeed = parseInt(ink.slice(1), 16)
    randomSeed(P.rndseed * colorSeed)
    noiseSeed(P.rndseed * colorSeed)
    simplex = new SimplexNoise(P.rndseed * colorSeed)

    if (bitstring != '') {
        // bitstring will be like 1000110100101101
        // parse it into hash using hb twoD
        let hb = new HashBuilder()
        // print(bitstring.length)
        for (let i = 0; i < bitstring.length; i++) {
            // print(i, hb.twoD(i % 28, floor(i / 28)))
            hb.bits[hb.twoD(i % 28, floor(i / 28))] = parseInt(bitstring[i])
        }
        hb.done()
        bitstring = ''
    }

}

function generateHash() {
    let hb = new HashBuilder()
    hb.bitFlip(0, 220, 0)
    if (Math.random() < 0.5) hb.toggleBackground()
    if (Math.random() < 0.333) hb.toggleFilled()
    if (Math.random() < 0.8) hb.toggleProject()
    if (hb.bools[Bp] && Math.random() < 0.4) hb.toggleInteractive()
    if (hb.bools[Bbg] && hb.bools[Bf] && hb.bools[Bp] && Math.random() < 0.9) hb.toggleFilled()
    let ink = '#' + floor(rnd(0, 0xffffff)).toString(16).padStart(6, '0')
    hb.setInk(ink)
    // hb.setInk('#abcdef')
    hb.setRndseed(1 * parseInt(ink.slice(1), 16))
    // hb.manyRects(n = 1000, m = 100, s=  4)
    hb.bitFlip(0, 220, 0.5)
    for (let i = 0; i < rnd(10); i++) {
        hb.squareCopy(0)
        print(1)
    }
    hb.symmetry(flip = false)

    hb.strong()
    hb.bitFlip(0, 220, rnd(0, 0.1))
    hb.done()
    return hash
}

let Bbg = 0
let Bf = 1
let Bp = 2
let Bi = 3

class HashBuilder {
    constructor(hash) {
        if (hash) {
            [this.ink, this.rndseed, this.bits, this.bools] = hashUnpack(hash)
        } else {
            this.bits = []
            for (let i = 0; i < 220; i++) {
                this.bits.push(0)
            }
            this.bools = []
            for (let i = 0; i < 8; i++) {
                this.bools.push(0)
            }
            this.rndseed = 0
            this.ink = '#000000'
        }
    }

    // randomize the first row and have every row mirror that one
    symmetry(flip = true) {
        if (flip)
            this.bitFlip(0, 220, 0.5)
        for (let i = 1; i < 8; i++) {
            for (let j = 0; j < 28; j++) {
                this.bits[this.twoD(j, i)] = this.bits[this.twoD(j, 0)]
            }
        }
    }
    strong(remove = 0.2) {
        let strongHash = '0x0ff000000f00000f900000f900000f9000001800003e40000060000600709f30'
        let hbStrong = new HashBuilder(strongHash)
        hbStrong.bitOp(0, 220, HashBuilder.And, 0, remove)
        this.or(hbStrong)
        return this
    }

    // call rect with random effects but only with random rows of 1x8 and columns of 8x1
    rowsColumns(rowN, columnN, effects) {
        let rects = []
        for (let i = 0; i < rowN; i++) {
            let x = 0
            let y = rnd(0, 8)
            let w = 28
            let h = 1
            let x2 = 0
            let y2 = rnd(0, 8)
            let w2 = 28
            let h2 = 1
            let effect = rnd(effects)
            rects.push([effect, x, y, w, h, x2, y2, w2, h2])
        }
        for (let i = 0; i < columnN; i++) {
            let x = rnd(0, 28)
            let y = 0
            let w = 1
            let h = 8
            let x2 = rnd(0, 28)
            let y2 = 0
            let w2 = 1
            let h2 = 8
            let effect = rnd(effects)
            rects.push([effect, x, y, w, h, x2, y2, w2, h2])
        }
        //shuffle
        rects = rects.sort(() => rnd() - 0.5)
        rects.map(r => this.rect(...r))
    }

    static Or(a, b) { return a || b }
    static And(a, b) { return a && b }
    static Xor(a, b) { return a != b }
    static Copy(a, b) { return a }
    static Not(a, b) { return !a }
    static Fill(a, b) { return 1 }
    static Empty(a, b) { return 0 }

    squareCopy(row, from, to) {
        let sq1 = [5, 6, 2, 1, 14, 22, 13, 21]
        let sq2 = [2, 7, 8, 3, 23, 16, 24, 15]
        let sq3 = [4, 3, 9, 10, 17, 25, 18, 26]
        let sq4 = [12, 1, 4, 11, 28, 19, 27, 20]

        let sqMap = {
            0: sq1,
            1: sq2,
            2: sq3,
            3: sq4,
        }
        let face = []

        from = from ?? floor(rnd(0, 4))
        to = to ?? floor(rnd(0, 4))

        let fromSq = sqMap[from]
        let toSq = sqMap[to]

        for (let i = 0; i < 8; i++) {
            face.push(this.bits[this.twoD(fromSq[i] - 1, row)])
        }

        for (let i = 0; i < 8; i++) {
            this.bits[this.twoD(toSq[i] - 1, row)] = face[i]
        }
    }

    // squareReflect(row, sq, vertical = true) {
    // }

    rotateFace(row, n) {
        for (let j = 0; j < n; j++) {
            let rowMapping = {
                1: 2,
                2: 3,
                3: 4,
                4: 1,
                5: 7,
                6: 8,
                7: 9,
                8: 10,
                9: 11,
                10: 12,
                11: 5,
                12: 6,
                13: 15,
                14: 16,
                15: 17,
                16: 18,
                17: 19,
                18: 20,
                19: 13,
                20: 14,
                21: 23,
                22: 24,
                23: 25,
                24: 26,
                25: 27,
                26: 28,
                27: 21,
                28: 22,
            }
            let rowCopy = []
            for (let i = 0; i < 8; i++) {
                rowCopy.push(this.bits[this.twoD(row, i)])
            }
            for (let i = 0; i < 8; i++) {
                this.bits[this.twoD(row, rowMapping[i + 1])] = rowCopy[i]
            }
        }
    }


    rect(effect, x, y, w, h, x2, y2, w2, h2) {
        x = floor(x)
        y = floor(y)
        w = floor(w)
        h = floor(h)
        x2 = floor(x2)
        y2 = floor(y2)
        w2 = floor(w2)
        h2 = floor(h2)



        let source = []
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                source.push(this.bits[this.twoD(i, j)])
            }
        }
        let dest = []
        for (let i = x2; i < x2 + w2; i++) {
            for (let j = y2; j < y2 + h2; j++) {
                dest.push(this.bits[this.twoD(i, j)])
                // this.bits[this.twoD(i, j)] = values.shift()
            }
        }
        let values = source.map((v, i) => effect(v, dest[i]))
        for (let i = x2; i < x2 + w2; i++) {
            for (let j = y2; j < y2 + h2; j++) {
                this.bits[this.twoD(i, j)] = values.shift()
            }
        }

        return this;
    }

    manyRects(n, m, s) {
        n = n ?? rnd(1, 10)
        m = m ?? rnd(1, 10)
        s = s ?? rnd(1, 10)
        let oppool = [HashBuilder.Fill, HashBuilder.Empty]
        // let weights = new Array(oppool.length).fill(0).map(e => rnd())
        let ops = []
        for (let i = 0; i < m; i++) {
            ops.push(rnd(oppool))
            // ops.push(weightedPick(oppool, [...weights]))
        }
        let rects = []
        for (let i = 0; i < n; i++) {
            let w = rnd(4, s)
            let h = rnd(4, 8)
            let x = rnd(0, 28 - w)
            let y = rnd(0, 9 - h)
            let x2 = rnd(0, 28 - w)
            let y2 = rnd(0, 9 - h)
            rects.push([rnd(ops), x, y, w, h, x2, y2, w, h])
        }
        rects.map(r => this.rect(...r))
    }

    twoD(x, y) {
        if (x < 0) throw 'x < 0'
        if (y < 0) throw 'y < 0'
        if (x > 27) throw 'x > 27'
        if (y > 7) throw 'y > 7'
        let idx = x + y * 28
        if (idx == 149) idx = 118
        // if (idx > 149) idx--
        if (idx == 150) idx = 117
        if (idx > 150) idx -= 2
        if (idx == 203) idx = 172
        // if (idx > 203) idx--
        if (idx == 204) idx = 171
        if (idx > 204) idx -= 2
        return idx
    }

    shiftLeft(n) {
        for (let i = 0; i < n; i++) {
            this.bits.shift()
            this.bits.push(0)
        }
        return this;
    }

    shiftRight(n) {
        for (let i = 0; i < n; i++) {
            this.bits.pop()
            this.bits.unshift(0)
        }
        return this;
    }

    or(other) {
        for (let i = 0; i < 220; i++) this.bits[i] = this.bits[i] || other.bits[i]
        return this;
    }

    and(other) {
        for (let i = 0; i < 220; i++) this.bits[i] = this.bits[i] && other.bits[i]
        return this;
    }

    xor(other) {
        for (let i = 0; i < 220; i++) this.bits[i] = this.bits[i] != other.bits[i]
        return this;
    }

    not() {
        for (let i = 0; i < 220; i++) this.bits[i] = !this.bits[i]
        return this;
    }

    bitOp(a, b, op, operand, prob) {
        for (let i = 0; i < b; i++) {
            if (Math.random() < prob) {
                this.bits[i] = op(this.bits[i], operand)
            }
        }
    }

    bitFlip(a = 0, b = 220, prob = 0.5) {
        for (let i = a; i < b; i++) {
            this.bits[i] = Math.random() < prob ? !this.bits[i] : this.bits[i]
        }
        return this;
    }

    toggleInteractive(on) {
        if (on != undefined) this.bools[Bi] = on
        else this.bools[Bi] = !this.bools[Bi]
    }

    toggleProject(on) {
        if (on != undefined) this.bools[Bp] = on
        else this.bools[Bp] = !this.bools[Bp]
    }

    toggleFilled(on) {
        if (on != undefined) this.bools[Bf] = on
        else this.bools[Bf] = !this.bools[Bf]
    }

    toggleBackground(on) {
        if (on != undefined) this.bools[Bbg] = on
        else this.bools[Bbg] = !this.bools[Bbg]
    }

    setInk(ink) {
        this.ink = ink
    }

    setRndseed(rndseed) {
        this.rndseed = rndseed
    }

    validate() {
        // if (this.bits.length != 220 ||
        //     this.bools.length != 8 ||
        //     this.ink.length != 7 ||
        //     this.rndseed < 0 ||
        //     this.rndseed > 15 ||
        //     this.bits.some(b => b != 0 && b != 1) ||
        //     this.bools.some(b => b != 0 && b != 1) ||
        //     !this.ink.startsWith('#')
        // ) {
        //     throw 'hash error'
        // }
        if (this.bits.length != 220) throw "bits length error"
        if (this.bools.length != 8) throw "bools length error"
        if (this.ink.length != 7) throw "ink length error"
        if (this.rndseed < 0) throw "rndseed error"
        // if (this.rndseed > 15) throw "rndseed error"
        if (this.bits.some(b => b != 0 && b != 1)) throw "bits error"
        if (this.bools.some(b => b != 0 && b != 1)) throw "bools error"
        if (!this.ink.startsWith('#')) throw "ink error"
    }

    done() {
        this.validate()
        P.ink = this.ink
        P.rndseed = this.rndseed
        bits = this.bits
        bools = this.bools
        hashPack()
    }

}

function weightedPick(picked, weights) {
    let i;
    for (i = 0; i < weights.length; i++) weights[i] += weights[i - 1] || 0;
    var e = rnd() * weights[weights.length - 1];
    for (i = 0; i < weights.length && !(weights[i] >= e); i++);
    return picked[i];
}