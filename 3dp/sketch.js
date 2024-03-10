let seed = ''

function presetup() {

    canvas = createCanvas(800, 800)
    setupUseful()

    // for (let i = 0; i < 5; i++) {
    //     let s = createSlider(0, 1, 0.2, 0.01)
    //     s.mouseReleased(redraw)
    //     SL.push(s)
    // }

    noFill()
}

function setup() {
    presetup()
    // console.log(randomHash())
    d = design(0, 0, 180, 100)
    h = rnd(100, 400)
    t = rnd(PI / 2 / 300)
    c = rnd(cols)
}
let d, h, t, c

function draw() {
    background(255)
    fill(128)
    for (let i = 0; i < h; i += 4) {
        let p = new Poly(d.shape, W / 2, H / 2 + h / 2 - i, map(noise(i / 800), 0, 1, 0.5, 1.2), frameCount / 100 + t * i)
        p.draw()
    }
    // updateSliders()
    // for (let i = 0; i < 200; i++) {
    //     // circle(betaPDF(1, 4) * W, rnd(H), 10)
    //     circle(rnd(W), rnd(H), betaPDF(1, 4) * 5)
    // }
    // saveNamed()
    // setTimeout(window.location.reload.bind(window.location), 200)
}


function design(x, y, r1 = 20, r2 = 200) {
    let arr = []
    let rand = rnd()
    print(rand)
    if (rand < .7) arr = new Array(floor(rnd(2, 6))).fill(0).map(_ => rnd(TAU))
    else if (rand < 0.8) arr = [PI / 2, 0]
    else if (rand < 0.9) arr = [PI / 2]
    else {
        let bank = [-PI / 16, -PI / 8, -PI / 4, -PI / 2, 0]
        let num = floor(rnd(0, 0))
        for (let i = num; i < bank.length; i++) {
            arr.push(bank[i])
        }
    }
    // arr = arr ?? [PI / 2, 0]//-PI / 4]
    let pw = Poly.circle(x, y, r1, 10, r2)
    // pw = pw.wrinkle(40, 10, 3, 100, 100, 1, rnd(9999))
    pw = pw.wrinkle(10, 10, 3, 100, 100, 1, rnd(9999))
    pw.reflect(arr)

    return pw
}

// https://github.com/royhzq/betajs /////////////////////////////////
function betaPDF(a, b) {
    let x = rnd()
    // Beta probability density function impementation
    // using logarithms, no factorials involved.
    // Overcomes the problem with large integers
    return Math.exp(lnBetaPDF(x, a, b))
}
function lnBetaPDF(x, a, b) {
    // Log of the Beta Probability Density Function
    return ((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)) - lnBetaFunc(a, b)
}
function lnBetaFunc(a, b) {
    // Log Beta Function
    // ln(Beta(x,y))
    foo = 0.0;

    for (i = 0; i < a - 2; i++) {
        foo += Math.log(a - 1 - i);
    }
    for (i = 0; i < b - 2; i++) {
        foo += Math.log(b - 1 - i);
    }
    for (i = 0; i < a + b - 2; i++) {
        foo -= Math.log(a + b - 1 - i);
    }
    return foo
}
// https://github.com/royhzq/betajs /////////////////////////////////

function frame(x, y, w, h, s1, s2, c) {
    let bg = []
    s2 = s2 ?? s1
    c = color(c) ?? color(255)
    // bg.push(Poly.rect(x, y, w + s1 * 0.15, h + s1 * 0.15).setColor(rnd(cols)).reseed())


    // cutout(x, y, w - s1 * 0.2, h - s2 * 0.2, s1 / 2 - s1 * 0.2, c)

    let p = design(0, 0, 100, 100)
    let cp = design(0, 0, s1, s1, [PI / 4, -PI / 4])
    cp.resize(x - w / 2 + s1 / 3, y - h / 2 + s2 / 3, s1, s2).setColor(rnd(cols))

    let toppolys = []
    for (let i = 0; i <= w / 2 - s1 / 2; i += s1 / 4) {
        let pp = p.copy()
        pp.resize(x - w / 2 + s1 / 4 + i,
            y - h / 2 + s2 / 4,
            s1 / 2,
            s2 / 2,
            -PI / 2)
        toppolys.push(pp)
    }
    let sidepolys = []
    for (let i = 0; i <= h / 2 - s2 / 2; i += s2 / 4) {
        let pp = p.copy()
        pp.resize(x - w / 2 + s1 / 4,
            y - h / 2 + s2 / 4 + i,
            s2 / 2,
            s1 / 2,
            0)
        sidepolys.push(pp)
    }

    let polys = toppolys.concat(sidepolys)
    polys = polys.map(p => p.setColor(permuteColor(c, 20)))
    polys.push(cp)
    polys = Poly.reflectAll(polys, [TAU, -PI / 2], [vec(x, y)], true, true)

    polys = bg.concat(polys)
    return polys
}

function centerpiece() {
    let gridpolys = []
    let n = 2 ** floor(rnd(1, 6))
    let c = vec(W / 2, H / 2)
    let l = W * 2
    for (let i = 0; i < n; i++) {
        let v = vec(l, 0)
        v.rotate(i / n * TAU)
        let p = new Poly([c, v])
        gridpolys.push(p)
    }
}


function birdTextured(x, y, s) {
    noFill()
    let bird = [vec(398, -196), vec(398, -196), vec(389, -136), vec(378, -86), vec(375, -74), vec(361, -26), vec(329, 45), vec(327, 48), vec(301, 89), vec(273, 116), vec(225, 145), vec(146, 174), vec(119, 181), vec(74, 198), vec(10, 220), vec(7, 224), vec(-6, 270), vec(-2, 301), vec(15, 325), vec(17, 350), vec(-6, 374), vec(-22, 385), vec(-35, 398), vec(-43, 472), vec(-46, 493), vec(-55, 432), vec(-62, 402), vec(-77, 389), vec(-93, 370), vec(-99, 344), vec(-97, 333), vec(-97, 333), vec(-85, 309), vec(-85, 309), vec(-74, 297), vec(-62, 276), vec(-63, 254), vec(-73, 228), vec(-86, 210), vec(-121, 202), vec(-153, 192), vec(-190, 172), vec(-226, 142), vec(-250, 114), vec(-286, 54), vec(-317, -20), vec(-335, -74), vec(-349, -132), vec(-361, -182), vec(-366, -243), vec(-371, -306), vec(-377, -354), vec(-359, -367), vec(-330, -358), vec(-314, -332), vec(-291, -306), vec(-295, -354), vec(-269, -348), vec(-238, -331), vec(-198, -290), vec(-199, -343), vec(-175, -354), vec(-138, -334), vec(-125, -306), vec(-107, -286), vec(-110, -318), vec(-87, -272), vec(-66, -259), vec(-45, -236), vec(-39, -304), vec(-41, -342), vec(-54, -392), vec(-73, -446), vec(-101, -479), vec(-110, -522), vec(-110, -535), vec(-94, -536), vec(-65, -512), vec(-41, -503), vec(-22, -546), vec(-3, -542), vec(-3, -498), vec(-2, -480), vec(67, -527), vec(75, -523), vec(58, -484), vec(54, -475), vec(114, -499), vec(115, -499), vec(106, -460), vec(85, -432), vec(67, -398), vec(50, -352), vec(46, -306), vec(46, -272), vec(46, -248), vec(49, -211), vec(81, -250), vec(137, -295), vec(182, -295), vec(125, -256), vec(118, -223), vec(125, -214), vec(159, -230), vec(197, -255), vec(251, -276), vec(237, -246), vec(219, -211), vec(285, -246), vec(311, -251), vec(309, -219), vec(295, -187), vec(350, -228), vec(370, -252), vec(403, -275), vec(422, -280), vec(401, -226),]
    let p = new Poly(bird, x, y, s / 500, PI, 1)
    let c = Poly.circle(0, 0, 1, 0.1)
    let g = createGraphics(W, H)
    g.background(rnd(cols))
    fastpack(0, 0, W, H, 5, 20, 100000).map(a => {
        button(...a).map(p => {
            p.shadow().drawG(g)
            p.drawG(g)
        })
    })
    // packed = packed.filter(pp => { return !pp.overlaps(p) })

    p.setTexture(g)
    return [p]
}
