let vec, D, canvas
let PHI = 1.61803398875
let PPI = 96
let V3_WIDTH = 12
let V3_HEIGHT = 17
let S = [], W, H
let SL = []
p5.disableFriendlyErrors = true

function setupUseful() {
    setupRandom()
    createButton('save').mousePressed(saveNamed)
    cols = setupColors(colSubset)
    vec = createVector
    W = width
    H = height
}

function saveNamed() {
    let time = `${new Date().toLocaleDateString()} @ ${new Date().toLocaleTimeString()}`
    save(`${time} -- ${seed}`)
}

function updateSliders() {
    S = SL.map(SL => SL.value())
    print({ S })
}


function liney(v1, v2, amt = 10, w = 0.5) {
    let shape = []
    let d = p5.Vector.sub(v2, v1).mag()
    d /= 2
    w /= 2
    for (let i = 0; i < TAU; i += 0.1) {
        shape.push(vec(d * cos(i), w * sin(i)))
    }
    let half = p5.Vector.lerp(v1, v2, 0.5)
    let ang = p5.Vector.sub(v2, v1).heading()

    let p = new Poly(shape, half.x, half.y, 1, ang)

    p = p.wrinkle(amt, 1, 0, 800, false)
    fill(0)
    p.draw()
}


function gem(v, s, c) {
    c = color(c)
    push()
    translate(v.x, v.y)
    fill(c)
    stroke(0)
    circle(0, 0, s * 1.5)
    beginShape()
    let last = vec(s, 0)
    noStroke()
    for (let i = 0; i < TAU * 4; i += rnd(2)) {
        let nC = permuteColor(c, 150)
        nC.setAlpha(80)
        fill(nC)
        // stroke(nC)
        if (rnd() < 0.1) fill(255)

        let newV = vec(s * cos(i), s * sin(i))
        triangle(0, 0, last.x, last.y, newV.x, newV.y)
        last = newV
    }
    let newV = vec(s * cos(0), s * sin(0))
    triangle(0, 0, last.x, last.y, newV.x, newV.y)
    endShape()
    pop()
}

function cutout(x, y, w, h, bdr, col) {
    w /= 2
    h /= 2
    push();
    // noStroke()
    translate(x, y)
    fill(col);
    beginShape();
    vertex(-w, -h);
    vertex(-w, h);
    vertex(w, h);
    vertex(w, -h);
    beginContour();
    vertex(-w + bdr, -h + bdr);
    vertex(w - bdr, -h + bdr);
    vertex(w - bdr, h - bdr);
    vertex(-w + bdr, h - bdr);
    endContour();
    endShape(CLOSE);
    pop();
}

function subDiv(x, y, w, h, n, rects, modulus = 0.3, skip = 0, blanks = false, maxIters = undefined) {
    maxIters = maxIters ?? n
    let eps = 1;
    if (w < eps || h < eps) return;
    // if (n < maxIters - 3 && random() < blanks) return;
    // if (n == maxIters - 12) skip = random(1, maxIters - 12);
    if (n - skip <= 0) {
        if (!(rnd() < blanks))
            rects.push([x + w / 2, y + h / 2, w, h]);
        return;
    }
    let vert = w > h;
    let r = gain(random(), 0.3);
    r -= r % modulus;
    if (vert) {
        subDiv(x, y, r * w, h, n - 1, rects, modulus, skip, blanks, maxIters);
        subDiv(x + r * w, y, (1 - r) * w, h, n - 1, rects, modulus, skip, blanks, maxIters);
    } else {
        subDiv(x, y, w, r * h, n - 1, rects, modulus, skip, blanks, maxIters);
        subDiv(x, y + r * h, w, (1 - r) * h, n - 1, rects, modulus, skip, blanks, maxIters);
    }
}

function grainify(d) {
    loadPixels()
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let c = get(i, j)
            c = permuteColor(c, d)
            set(i, j, c)
        }
    }
    updatePixels()
}

function shadowCirc(x, y, r, off = 3) {
    push()
    noStroke()
    fill(0, 100)
    circle(x - off, y + off, r)
    pop()

    circle(x, y, r)
}


function spiral(x, y, R) {
    push();
    translate(x, y);
    beginShape();
    let op = createVector(0, 0);
    for (let i = 0; i < (TAU * R) / 10; i += 0.1) {
        let p = createVector(cos(i) * i, sin(i) * i);
        if (p5.Vector.dist(p, op) > 3) {
            vertex(cos(i) * i, sin(i) * i);
            op = p;
        }
    }
    endShape();
    pop();
}

function recordGIF() {
    frameRate(30)
    createLoop({
        duration: 12,
        framesPerSecond: 10,
        gif: {
            download: true,
            open: false,
            render: false,
            startLoop: 0,
            endLoop: 1,
            fileName: seed + 'ray.gif',
        },
        noise: {
            seed: 0,
            radius: 1,
        }
    });
    // animLoop.progress, animLoop.noise(), animLoop.noise1D(), animLoop.noise2D()
}


function drawRounded(points, r) {
    beginShape();
    for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        const c = points[(i + 2) % points.length];
        const ba = a.copy().sub(b).normalize();
        const bc = c.copy().sub(b).normalize();

        // Points in the direction the corner is accelerating towards
        const normal = ba.copy().add(bc).normalize();

        // Shortest angle between the two edges
        const theta = ba.angleBetween(bc);

        // Find the circle radius that would cause us to round off half
        // of the shortest edge. We leave the other half for neighbouring
        // corners to potentially cut.
        const maxR = (min(a.dist(b), c.dist(b)) / 2) * abs(sin(theta / 2));
        const cornerR = min(r, maxR);
        // Find the distance away from the corner that has a distance of
        // 2*cornerR between the edges
        const distance = abs(cornerR / sin(theta / 2));

        // Approximate an arc using a cubic bezier
        const c1 = b.copy().add(ba.copy().mult(distance));
        const c2 = b.copy().add(bc.copy().mult(distance));
        const bezierDist = 0.5523; // https://stackoverflow.com/a/27863181
        const p1 = c1.copy().sub(ba.copy().mult(2 * cornerR * bezierDist));
        const p2 = c2.copy().sub(bc.copy().mult(2 * cornerR * bezierDist));
        vertex(c1.x, c1.y);
        bezierVertex(p1.x, p1.y, p2.x, p2.y, c2.x, c2.y);
    }
    endShape(CLOSE);
}


function connectPoints(points, maxD = 100) {
    maxD *= maxD
    stroke(0, 20)
    for (let i = 0; i < points.length; i++) {
        let p1 = points[i]
        for (let j = i; j < points.length; j++) {
            let p2 = points[j]
            let d = p5.Vector.sub(p2, p1).magSq()
            if (d < maxD) {
                line(p1.x, p1.y, p2.x, p2.y)
            }
        }
    }
}

function lerpLine(x1, y1, x2, y2, gap) {

    let points = []
    let v1 = vec(x1, y1)
    let v2 = vec(x2, y2)
    let d = p5.Vector.dist(v1, v2)
    let percent = gap / d
    for (let i = 0; i < 1; i += percent) {
        let pos = p5.Vector.lerp(v1, v2, i)
        points.push(pos)
    }
    return points
}

function saveMySVG() {
    let s = createGraphics(width, height, SVG)
    let time = `${new Date().toLocaleDateString()} @ ${new Date().toLocaleTimeString()}`

    s.save(`${time} -- ${seed}`)
}

function sortColorsRunFxns(arr, mod = 1) {
    count = 1;
    let col;
    arr.sort((a, b) => b[0] - a[0])
    arr.map(a => {
        count++
        if (count % mod == 1 || col != a[0]) {
            col = a[0]
            changeColor(a[0], count, mod)
        }
        a[1](...a[2])
    })
}

function changeColor(idx, count = 1, mod = 1) {
    strokeWeight(brushSize)
    stroke(paintPalette[idx])
    noFill()

    let numColors = 7
    let paletteWidth = 8 * PIXELS_PER_INCH
    let paletteHeight = 1 * PIXELS_PER_INCH

    let r = paletteHeight / 2
    let x = map(idx, 0, numColors - 1, paletteHeight / 2, paletteWidth - paletteHeight)
    let y = h + paletteHeight / 2
    circle(x, y, r)
}

function myshuffle(arr) {
    arr = arr
        .map((value) => ({ value, sort: rnd() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
    return arr
}

function signature(x, y, s) {
    noLoop()
    push()
    stroke(0)
    noFill()
    s /= 2
    beginShape()
    curveVertex(x + s / 4, y - s * 1.5)
    curveVertex(x + s / 4, y - s * 1.5)
    let n = rnd(3, 4)
    translate(- n * s / 12 / 2, 0)

    for (let i = 0; i < TAU * n; i += 1) {
        let vx = x + i * n * s / 12
        let vy = y + sin(i) * s * (1 - i / (TAU * n))
        let nx = sn(vx / 500, vy / 500) * 5
        let ny = sn(vx / 500, vy / 500, 100) * 5
        curveVertex(nx + vx, ny + vy)
    }
    curveVertex(x + 1.2 * TAU * n * n * s / 12, y)
    curveVertex(x + 1.2 * TAU * n * n * s / 12, y)
    endShape()
    pop()
}