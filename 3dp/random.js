let rnd
let simplex, sn2, sn3, sn4;

function setupRandom() {
    seedRNG(seed)

    rnd = random
    sn2 = simplex.noise2D.bind(simplex)
    sn3 = simplex.noise3D.bind(simplex)
    sn4 = simplex.noise4D.bind(simplex)
}

function sn(...args) {
    return ['0 args to sn', noise, sn2,
        sn3, sn4][args.length](...args)
}

function seedRNG() {
    if (seed == '') {
        seed = str(floor(random(1e10)))
        txt = seed
    }
    console.log(seed)
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        let char = seed.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash |= 0 // Convert to 32bit integer
    }
    randomSeed(hash)
    noiseSeed(hash)

    simplex = new SimplexNoise(hash)
}

function curlNoise(x, y, t = 0, m = 100, delta = 0.001, rampDistance = 1) {
    let xi = sn(x / m - delta, y / m, t / m)
    let xf = sn(x / m + delta, y / m, t / m)
    let yi = sn(x / m, y / m - delta, t / m)
    let yf = sn(x / m, y / m + delta, t / m)
    let xd = (xf - xi) / delta / 2
    let yd = (yf - yi) / delta / 2
    let v = vec(yd, -xd)
    let r
    if (rampDistance >= 1) r = 1
    else if (rampDistance <= -1) r = -1
    else
        r = 15 / 8 * rampDistance
            - 10 / 8 * pow(rampDistance, 3)
            + 3 / 8 * pow(rampDistance, 5)
    v.mult(r)
    return v
}



// iq
// Its maximum, which is 1, happens at exactly x = 1/k.
function expImpulse(k, min = undefined, max = undefined) {
    let x = rnd()
    if (min == undefined) { min = 1; }
    if (max == undefined) { max = min; min = 0; }
    const h = k * x;
    return h * exp(1.0 - h);
}
// quick estimation of above
function rexp(min, max = undefined) {
    if (max == undefined) { max = min; min = 0; }
    return expImpulse(5) * max + min
}
function extrexp(min, max = undefined) {
    if (max == undefined) { max = min; min = 0; }
    return expImpulse(20) * max + min
}

// generalizes parabola starting and ending at 0
// a controls left side, b controls right side
// k is computationally intensive and only linearly scales to 1
// https://www.desmos.com/calculator/ljcvskr6h6
function pcurve(x, a, b) {
    const k = pow(a + b, a + b) / (pow(a, a) * pow(b, b));
    return k * pow(x, a) * pow(1.0 - x, b);
}
// quick estimation of gaussian using above
function rgauss(w = 1) {
    return gain(rnd(), 0.25) * w
}

function expStep(x, k, n) {
    return exp(-k * pow(x, n));
}

// similar to gaussian pdf
function cubicPulse(x, c, w) {
    x = abs(x - c);
    if (x > w) return 0.0;
    x /= w;
    return 1.0 - x * x * (3.0 - 2.0 * x);
}

// k < 1 makes sqrt
// k = 1 is identity
// k > 1 makes S-shaped
function gain(x, k) {
    const a = 0.5 * pow(2.0 * ((x < 0.5) ? x : 1.0 - x), k);
    return (x < 0.5) ? a : 1.0 - a;
}



function shuffleArr(arr) {
    arr = arr
        .map((value) => ({ value, sort: rnd() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
    return arr
}

function weightedPick(picked, weights) {
    let i;
    for (i = 0; i < weights.length; i++) weights[i] += weights[i - 1] || 0;
    var e = rnd() * weights[weights.length - 1];
    for (i = 0; i < weights.length && !(weights[i] >= e); i++);
    return picked[i];
}