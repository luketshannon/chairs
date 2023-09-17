/////// GUI ////////

function savePaperSVG() {
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
    xmlDoc.documentElement.setAttribute("width", 3.5 * 12 + "in");
    xmlDoc.documentElement.setAttribute("height", 4 * 12 + "in");
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

    params.save = savePaperSVG
    params.reload = reload
    params.newLoad = newLoad
    params.redraw = myredraw
    params.newdraw = newdraw

}

function guiChanged() {
    // guiToHash()
    redraw()
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
            this.add(obj, key).onChange(guiChanged);
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
        const elements = g.querySelectorAll('path, polygon, line');
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
            }
            // print(element)

            const style = g.getAttribute('style') || '';
            const styleObj = style.split(';').reduce((acc, curr) => {
                const [key, value] = curr.split(':');
                if (key && value) {
                    acc[key.trim()] = value.trim();
                }
                return acc;
            }, {});

            const stroke = g.getAttribute('stroke') || styleObj.stroke || 'black';
            let fill = g.getAttribute('fill') || -1;
            if (fill === 'none') fill = undefined
            const strokeWidth = parseFloat(g.getAttribute('stroke-width')) || parseFloat(styleObj['stroke-width']) || 1;

            paths.push({ polyline, stroke, strokeWidth, fill });
        }
        groups.push(paths)
    }
    print(groups)

    return groups.map(paths => paths.map(p => {
        let poly = new Poly(p.polyline.map(a => vec(a[0], a[1])), 0, 0, 1, 0, 0, p.fill, p.stroke, p.sw);
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
    seedRNG(hash)

    sn2 = simplex.noise2D.bind(simplex)
    sn3 = simplex.noise3D.bind(simplex)
    sn4 = simplex.noise4D.bind(simplex)

    rnd = random
    vec = createVector
    W = width
    H = height

}

function sn(...args) {
    return ['0 args to sn', noise, sn2,
        sn3, sn4][args.length](...args)
}


function seedRNG() {
    let generateHash = () => {
        let result = '';
        const characters = '0123456789abcdef';
        for (let i = 0; i < 40; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return '0x' + result;
    }
    if (hash == '') {
        hash = generateHash()
    }
    console.log(hash)

    const hashPairs = [];
    for (let j = 0; j < 32; j++) {
        hashPairs.push(hash.slice(2 + (j * 2), 4 + (j * 2)));
    }
    const decPairs = hashPairs.map(x => {
        return parseInt(x, 16);
    });
    // Grab the last 16 values of the hash to use as a noise seed.
    const rndseed = parseInt(hash.slice(-16), 16)
    randomSeed(rndseed)
    noiseSeed(rndseed)
    simplex = new SimplexNoise(rndseed)

    // params.hash = hash
    // params.raw = decPairs
}