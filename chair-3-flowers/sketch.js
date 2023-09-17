let A_R = 4 / 3.5

const urlParams = new URLSearchParams(window.location.search);
let hash = urlParams.get('hash') ?? '' //0x293d0064d3d679d63569d709805b2e9b83a4acfa
var gui = new dat.gui.GUI();
gui.domElement.style.transform = 'scale(2, 2)' + 'translate(-25%, 25%)';

let params = {}

function setupParams() {
    permanentParams()

    params.background = color(rnd(255), rnd(255), rnd(255)).toString('#rrggbb')

    params.x = W / 2
    params.y = H / 2
    params.s = 1
    params.centerR = 50
    params.centerN = 12
    params.petalX = 150
    params.petalY = 400

    params.petalWrinkleN = 10
    params.petalWrinkleAmt = 10
    params.petalWrinkleReseeded = 10
    params.wrinkleMin = 100
    params.wrinkleMax = 500
    params.restructureTol = 0.1


    gui.myadds(params)
}

function setup() {
    createCanvas(1000, 1000)
    createButton('save').mousePressed(save)
    setupRandom()

    setupParams()

    noLoop()
}

let polys

function draw() {
    background(222)

    flower([], vec(params.x, params.y), params.s, params.centerR, params.centerN, params.petalX, params.petalY).map(p => p.setColor(255, 0).drawp5())
}

function flower(bboxes, center, s, centerR, centerN, petalX, petalY) {
    // let centerPoly = Poly.ellipse(center.x, center.y, centerR * s)
    // centerPoly.wrinkle(10, 10, 0, 200, 500, 1, 0)

    let petal = Poly.ellipse(W / 2, H / 2, petalX, petalY)
    petal.wrinkle(params.petalWrinkleN, params.petalWrinkleAmt, params.petalWrinkleReseeded, params.wrinkleMin, params.wrinkleMax, 1, 0)
    petal.reflect([PI / 2])
    petal.restructure(params.restructureTol)

    return [petal]
}