// TODO

// TODAY

// THIS WEEK
// 1] perfect scalability
// 2] bake svg to loaded file
gui.domElement.style.display = 'none';

let svgwidthin = 4 * 12
let svgheightin = 6 * 12
let S = 1000

const urlParams = new URLSearchParams(window.location.search);

let bitstring = urlParams.get('bits') ?? ''
let hash = '0x5660000a990000af80300a0900f0c1f00009f8000000342fc4300f0303ffffff'//urlParams.get('hash') ?? ''
let url_x = urlParams.get('x') ?? ''
let url_y = urlParams.get('y') ?? ''
let url_proj = urlParams.get('project') ?? ''
let url_fill = urlParams.get('fill') ?? ''
let url_bg = urlParams.get('bg') ?? ''
let url_t = urlParams.get('t') ?? ''
let url_int = urlParams.get('float') ?? ''
let url_save = urlParams.get('save') ?? ''
let url_rnd = urlParams.get('rnd') ?? ''
let url_saveGIF = urlParams.get('saveGIF') ?? ''

let P = {}
function setupParams() {
    permanentParams()

    url_x = url_x ? float(url_x) : undefined
    url_y = url_y ? float(url_y) : undefined
    url_proj = url_proj ? int(url_proj) : undefined
    url_fill = url_fill ? int(url_fill) : undefined
    url_bg = url_bg ? int(url_bg) : undefined
    url_t = url_t ? float(url_t) : undefined
    url_int = url_int ? int(url_int) : undefined
    url_save = url_save ? int(url_save) : undefined
    url_saveGIF = url_saveGIF ? int(url_saveGIF) : undefined
    url_rnd = 0 //url_rnd === '' ? 1 : url_rnd === 0 ? 0 : int(url_rnd)
    P.background = url_bg ?? bools[Bbg]
    P.filled = url_fill ?? bools[Bf]
    P.project = url_proj ?? P.project ?? true ?? bools[Bp]
    P.interactive = url_int ?? bools[Bi]
    P.outlines = P.outlines ?? false

    P.length = P.length ?? 18
    P.woodWidth = P.woodWidth ?? 0.74 // 0.802

    P.x = url_x ?? P.x ?? -90 * 0.005
    P.y = url_y ?? P.y ?? 0

    P.randomLayout = randomLayout
    P.gridWidth = P.gridWidth ?? W / 8
    P.ink = '#ffffff'

    if (firstSetup)
        gui.myadds(P)
}



let faces, polys, baked, projections, projectionsStart, attrs, layouts
let firstSetup = true
function setup() {
    faces = []
    polys = []
    layouts = []
    attrs = undefined
    baked = undefined
    projections = undefined
    projectionsStart = []
    if (firstSetup) {
        setupPaperCanvas()
        console.log('thank you to https://p5js.org/, http://paperjs.org/, and all the people involved whose code and love this is built on top of <3 <3 <3')
    }
    setupRandom()
    setupParams()
    firstSetup = false
    frameRate(60)

    getPolysFromSVG('all-all-colors-fixed-copy2.svg').then(groups => {
        let rightMost = groups.reduce((acc, group) => {
            let right = group.reduce((acc, poly) => {
                return Math.max(acc, poly.bbr)
            }, 0)
            return Math.max(acc, right)
        }, 0)
        let bitsIdx = 0
        groups.forEach(group => {
            let face = []
            for (let i = 0; i < group.length; i++) {
                let poly = group[i]
                let rescaled = new Poly(poly.shape, 0, 0, W / rightMost, 0, 1, poly.c, poly.sc, poly.sw, poly.alpha)
                if (poly.alpha != 0.75
                    && poly.sw != 17
                    && poly.sw != 9
                    && poly.c != '#ED1C24'
                    && !((poly.c == '#B7268F' || poly.c == '#3F55A5') && poly.sc == '#FFFFFF')) {
                    rescaled.on = bits[bitsIdx]
                    rescaled.part = true
                    bitsIdx++
                } else {
                    rescaled.part = false
                }
                polys.push(rescaled)
                face.push(rescaled)
            }
            faces.push(face)
        })
    }).then(() => {
        attrs = { sw: [], c: [], sc: [], alpha: [] }
        polys.map(poly => {
            for (let key in attrs) {
                if (!attrs[key].includes(poly[key])) {
                    attrs[key].push(poly[key])
                }
            }
        })
    }).then(() => {
        [baked, projections, layouts] = solve(polys, faces)
        baked = baked.map(path => {
            path = path ?? new paper.Path()
            path.applyMatrix = false
            return path
        })
        projections = projections.map(path => {
            projections.applyMatrix = false
            if (path != undefined) return path
            else return new paper.Path()
        })
        baked = baked.map(path => simplifyCollinear(path, 1 * S))
        layouts = layouts.map(path => simplifyCollinear(path, 10 * S))
        baked.map(path => path.applyMatrix = false)
    }).then(() => {
        if (url_rnd == 1) {

            randomLayout()
        }
        loop()
    })

    noLoop()
}


let img = `img${Math.floor(Math.random() * 5 + 1)}`

function draw() {
    // print(randomDone)
    // count all paper objects and print the number of them
    // print(paper.project.getItems({ recursive: true }).length)
    // print(allRandom, mapping)

    // print(frameRate() < 46 ? frameCount : 0)
    if (!isLooping()) {
        return
    }

    if (randomDone && url_rnd) {
        randomLayout()
    }

    // remove all objects from the project
    // break all links for garbage collection
    paper.project.activeLayer.removeChildren()
    // paper.project.clear()

    let margin = 2 * S
    let bg = new paper.Shape.Rectangle(margin, margin, W - margin * 2, H - margin * 2)

    bg.fillColor = P.background ? P.ink : '#ffffff'//P.ink
    bg.strokeColor = P.background ? '#ffffff' : P.ink
    bg.strokeWidth = margin

    // let muted = (hexColor) => {
    //     // use p5js color object
    //     let c = color(hexColor)
    //     colorMode(HSB, 360, 100, 100, 1)
    //     let h = hue(c)
    //     let s = saturation(c)
    //     let b = brightness(c)
    //     let a = alpha(c)
    //     let muted = color(h, s, b * 0.5, a)
    //     colorMode(RGB, 255, 255, 255, 1)
    //     return muted
    // }
    document.body.style.backgroundColor = P.background ? P.ink : '#ffffff'//P.ink

    var raster = new paper.Raster(img);
    raster.position = paper.view.center
    raster.scale(0.35);

    if (P.outlines) {
        polys.map(poly => {
            let outline = new Poly(poly.shape, 0, 0, 1 * P.length / 18, 0, 1)
            outline.setColor(-1, '#dddddd').draw()
        })
    }

    baked.forEach(path => {
        path.strokeColor = P.background ? '#ffffff' : P.ink
        path.fillColor = P.filled ? P.ink : '#ffffff'
        paper.project.activeLayer.addChild(path)
    })

    // randomLayout()

    // mapping.map(pair => {
    //     pair[0].fillColor = '#ffffff'
    //     pair[0].strokeColor = P.ink
    //     paper.project.activeLayer.addChild(pair[0])
    // })

    if (P.project && (randomDone || !url_rnd)) {
        baked.forEach(path => {
            path.fillColor = P.background ? P.ink : '#ffffff'
            path.strokeColor = P.background ? '#ffffff' : P.ink
            if (!P.filled) path.remove()
        })
        projections.forEach((path, i) => {
            path.strokeColor = "#ffffff"
            path.fillColor = P.ink
        })

        let arr = project(projections)
        let tops = arr[0]
        let bots = arr[1]
        let orientations = arr[2]
        // print(tops, bots, orientations)
        // print(arr)
        let allSides = projections.map((path, i) => {
            if (projectionsStart.length) {
                path = projectionsStart[i]
            }
            return [orientations[i], path, tops[i], bots[i]]
        })
        let right = allSides[4]
        let left = allSides[5]
        let back = allSides[1]
        let other = [allSides[0], back, allSides[2], allSides[3]]
        other = other.sort((a, b) => - a[0].shape[0].z + b[0].shape[0].z)

        // // if (((P.y - 5 / 180 * PI) % TAU + TAU) % TAU > PI) {
        // print(p5.Vector.dot(allSides[0][0].shape[1], vec(0, 0, 1)))
        // if (p5.Vector.dot(allSides[0][0].shape[1], vec(0, 0, 1)) < 0) {
        //     other = [back, ...other]
        // } else {
        //     other = [...other, back]
        // }

        if ((P.x % TAU + TAU) % TAU > PI) {
            allSides = [right, ...other, left]
        }
        else {
            allSides = [left, ...other, right]
        }
        // P.x += 0.01
        // P.y += 0.01
        // let distance = 1//mouseX / W//1 - constrain(dist(windowWidth / 2, windowHeight / 2, mouseX, mouseY) / W, 0, 1)
        // let t = url_t ?? frameCount
        // let distance = map(sn(t / 600, 1000), -1, 1, -0.05, 2)
        let distance
        if (P.interactive) {
            distance = 1
            if (P.x % TAU > PI / 2 && P.x % TAU < 3 * PI / 2) {
                distance = cos(map(P.x % TAU, PI / 2, 3 * PI / 2, 0, TAU)) * 0.5 + 0.5
            }
            if (mouseIsPressed)
                // distance = (mouseX - W / 2) / W
                distance = distance
            else {
                P.x += 0.003
            }
        }

        // if (!P.interactive || !randomDone) {
        //     // distance = oscillateWithCycle(t / 100, 5)
        //     distance = 1
        //     if (!mouseIsPressed)
        //         P.x += 0.007
        // }

        // tween doubled up baked paths with tops and bots
        allSides.map(([orientation, path, top, bot], i) => {
            path = path.clone()
            path.applyMatrix = true
            // construction
            let pathbot = path.clone()
            paper.project.activeLayer.addChild(pathbot)
            bot.remove()
            pathbot.interpolate(path, bot, distance)

            let pathtop = path.clone()
            paper.project.activeLayer.addChild(pathtop)
            top.remove()
            pathtop.interpolate(path, top, distance)

            let quads = connectTranslatedClones(pathtop, pathbot)
            quads.map(quad => {
                quad.fillColor = '#f6e1c8'
                quad.strokeColor = '#f6e1c8'
                quad.strokeCap = 'butt'
                quad.strokeJoin = 'bevel'
            })
            // path.remove()
            // ordering
            let tol = 0
            let dot = pathtop.clockwise
            if (dot <= tol) {
                pathbot.bringToFront()
                quads.forEach(quad => quad.bringToFront())
                pathtop.fillColor = '#e3c396'
                // pathtop.fillColor = '#ffffff'
                pathtop.strokeColor = '#ffffff'
                pathtop.bringToFront()
            } else {
                pathtop.bringToFront()
                quads.forEach(quad => quad.bringToFront())
                pathbot.bringToFront()
                pathbot.strokeColor = '#ffffff'
                pathbot.fillColor = P.ink
            }
        })
    }

    updatePathsStroke()
    if (url_saveGIF && randomDone) {
        if (gifstart === undefined) {
            P.x = -PI / 8
            gifstart = P.x
        }
        // savePaperSVG()
        print('save')
        if (P.x > gifstart + TAU) {
            url_saveGIF = false
            noLoop()
        }
    }
    if (url_save && randomDone) {
        savePaperSVG()
        url_save = false
        noLoop()
    }
    // if (frameCount > 1000) {
    //reload page
    // window.location.reload()
    // }
}
let gifstart

function updatePathsStroke() {
    // Iterate over all layers in the project
    for (var i = 0; i < paper.project.layers.length; i++) {
        var layer = paper.project.layers[i];

        // Iterate over all items in the layer
        for (var j = 0; j < layer.children.length; j++) {
            var item = layer.children[j];

            // Check if the item is a path
            if (item instanceof paper.Path || item instanceof paper.CompoundPath) {
                // Set the stroke width and bevel join
                item.strokeWidth = S * 2;
                item.strokeJoin = 'bevel';
                item.strokeCap = 'butt';
            }
        }
    }

}


function bake(faces, polys) {
    let bakes = []
    let projections = []
    let layouts = []
    // let layouts = polys.map(poly => {
    //     let layout = new Poly(poly.shape, 0, 0, 1 * P.length / 18 * 1.1, 0, 1)
    //     return layout
    // })
    faces.map(face => {
        let removals = []
        let united = new Poly([])
        let layoutUnited = new Poly([])
        let projection = new Poly([])
        face.map(poly => {
            let outline = new Poly(poly.shape, 0, 0, 1 * P.length / 18, 0, 1)
            // take each poly, transform it to 0,0 by it's center of mass, scale it up by 1.1, and transform it back to original position
            let layout = new Poly(poly.shape, 0, 0, 1 * P.length / 18, 0, 1)
            layout = layout.expandRect(12 * S, 12 * S)
            // let com = poly.centerOfMass()
            // let layout = new Poly(poly.shape, -com.x, -com.y, 1, 0, 1)
            // layout = new Poly(layout.shape, 0, 0, 1 * P.length / 18 * 1.3, 0, 1)
            // layout = new Poly(layout.shape, com.x, com.y, 1, 0, 1)
            if (poly.on) {
                if (!poly.removal && !poly.joint) {
                    projection = projection.unite(outline)
                }
                if (poly.removal) {
                    removals.push(outline)
                    return
                }
                united = united.unite(outline)
                layoutUnited = layoutUnited.unite(layout)
            }
        })
        removals.map(removal => {
            removal = removal.expandRect(P.woodWidth / (23 / 32), P.woodWidth / (23 / 32))
            united = united.subtract(removal)
        })


        let rasterFixPoly = Poly.rect(740 * S, 435 * S, 450 * S, 30 * S)
        projection.subtract(rasterFixPoly)

        bakes.push(united.path)
        projections.push(projection.path)
        layouts.push(layoutUnited.path)
    })
    return [bakes, projections, layouts]
}

function selectStyle(polys, obj, requireAll = true) {
    return polys.filter(poly => {
        for (let key in obj) {
            if (requireAll && !obj[key].includes(poly[key])) return false
            else if (!requireAll && obj[key].includes(poly[key])) return true
        }
        return requireAll
    })
}

function verifyJoinery(polys) {
    let leftJointSW = 17
    let rightJointSW = 9
    let rightSideSW = 3
    let rightFaceSW = 6
    let leftFaceSW = 14
    let leftSideSW = 11
    let combinedRight = rightSideSW + rightFaceSW
    let combinedLeft = leftSideSW + leftFaceSW
    let relations = {
        3: [rightFaceSW],
        6: [rightSideSW],
        9: [rightJointSW],
        11: [leftFaceSW],
        14: [leftSideSW],
        25: [leftJointSW],
    }
    let verified = []

    let joints = selectStyle(polys, { sw: [leftJointSW, rightJointSW] })
    joints.map(joint => {
        joint.joint = true
        joint.on = 0
    })
    let backs = selectStyle(polys, { c: ['#ED1C24'] })
    backs.push(...selectStyle(polys, { c: ['#B7268F'], sc: ['#FFFFFF'] }))
    backs.push(...selectStyle(polys, { c: ['#3F55A5'], sc: ['#FFFFFF'] }))
    backs.map(back => {
        back.on = false
    })

    let ons = polys.filter(poly => poly.on && poly.sc != '#000000')

    for (let i = 0; i < ons.length; i++) {
        let poly = ons[i]
        let colors = [poly.c, poly.sc]
        for (let c of colors) {
            if (c == 'none') continue
            let colorMatches = selectStyle(ons, { sc: [c], c: [c] }, requireAll = false)
            let oppSWMatches = selectStyle(colorMatches, { sw: relations[poly.sw] })
            if (oppSWMatches.length) {
                let weightMatch = selectStyle(joints, { sw: relations[poly.sw + relations[poly.sw][0]] })
                let correctJoint
                //D7DF23 // 00AEEF
                //2E3192
                // if (c == '#EF4136' || c == '#00A651') {
                // if (c == '#2E3192' || c == '#00AEEF') {
                if (c == '#D7DF23') {
                    correctJoint = selectStyle(weightMatch, { sc: [c] })
                    // print('green', correctJoint)
                } else if (c == '#2E3192') {
                    correctJoint = selectStyle(weightMatch, { sc: [c] })
                    // print('blue', correctJoint)
                } else {
                    correctJoint = selectStyle(weightMatch, { sc: [c], c: [c] }, requireAll = false)
                }
                correctJoint.map(joint => joint.on = 1)
            }
        }
    }

    // fix seat and back
    let backPieces = selectStyle(polys, { alpha: [0.7, .71, .72, .73, .74], c: ['#3F55A5', '#B7268F'] }, requireAll = false)
    let backOns = backPieces.filter(poly => poly.on)
    let alphas = [0.70, 0.71, 0.72, 0.73, 0.74]
    for (let i = 0; i < alphas.length; i++) {
        let alphaChecks = [alphas[i]]
        if (i > 0) alphaChecks.push(alphas[i - 1])
        if (i < alphas.length - 1) alphaChecks.push(alphas[i + 1])
        let thisBack = selectStyle(backOns, { alpha: alphaChecks })
        // thisBack.map(poly => poly.draw())
        if (thisBack.length == 0) continue
        let removals = selectStyle(polys, { c: ['#ED1C24'], alpha: [alphas[i]] })
        if (removals.length) {
            removals.map(poly => {
                // poly.draw()
                poly.on = 1
                poly.removal = true
            })
        }
    }

    if (selectStyle(polys, { c: ['#3F55A5'], sc: ['#231F20'] }).filter(poly => poly.on).length) {
        selectStyle(polys, { c: ['#3F55A5'], sc: ['#FFFFFF'] }).map(poly => {
            poly.on = 1
            poly.removal = 1
        })
    }
    if (selectStyle(polys, { c: ['#B7268F'], sc: ['#231F20'] }).filter(poly => poly.on).length) {
        selectStyle(polys, { c: ['#B7268F'], sc: ['#FFFFFF'] }).map(poly => {
            poly.on = 1
            poly.removal = 1
        })
    }

}

function project(baked) {
    let bakeTransforms = {
        //   x   y   z  rx ry rz
        0: [0, 0, 0, -PI / 2 - 5 / 180 * PI, 0, 0], //seat
        1: [0, -137, 190, 5 / 180 * PI, PI, 0], //back
        2: [0, 190, -186, 0, 0, 0], // front
        3: [0, 205, 195, -5 / 180 * PI, PI, 0], // skirt
        4: [-206, 57, 10, 0, PI / 2, 0], // right side
        5: [206, 57, 10, 0, -PI / 2, 0], // left side
    }

    function projectPiece(com, piece, tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0, reverseInk = false) {
        tx *= S
        ty *= S
        tz *= S
        // rx *= S
        // ry *= S
        // rz *= S

        let zoff = 8 * S
        // increase size by 1.3

        let top = piece.clone()
        // top.position = new paper.Point(0, 0)
        top.translate(-com.x, -com.y)
        // top.position.translate()
        let bot = top.clone()
        let topMatrix = getMatrix(vec(0, 0), tx, ty, tz, rx, ry, rz, zoff)
        let botMatrix = getMatrix(vec(0, 0), tx, ty, tz, rx, ry, rz, -zoff)

        let center = piece.position.clone
        let orientation = new Poly([vec(center.x, center.y), p5.Vector.add(vec(center.x, center.y), vec(0, 0, -1))])
        orientation = orientation.transform3D(topMatrix, false)

        let topPaperMatrix = new paper.Matrix(topMatrix[0][0], topMatrix[1][0], topMatrix[0][1], topMatrix[1][1], topMatrix[0][2], topMatrix[1][2])
        let botPaperMatrix = new paper.Matrix(botMatrix[0][0], botMatrix[1][0], botMatrix[0][1], botMatrix[1][1], botMatrix[0][2], botMatrix[1][2])
        top.matrix.append(topPaperMatrix)
        bot.matrix.append(botPaperMatrix)
        let topTransformation = new paper.Point(topMatrix[0][3], topMatrix[1][3])
        let botTransformation = new paper.Point(botMatrix[0][3], botMatrix[1][3])

        top.translate(topTransformation)
        bot.translate(botTransformation)
        top.translate(W / 2, H / 2)
        bot.translate(W / 2, H / 2)

        return [top, bot, orientation]
    }

    let tops = []
    let bots = []
    let orientations = []
    baked.forEach((piece, i) => {
        // get center of mass of all faces
        let com = faces[i].reduce((acc, poly) => {
            return acc.add(poly.centerOfMass())
        }, vec(0, 0))
        com = com.div(faces[i].length)
        let transform = bakeTransforms[i]
        let arr = projectPiece(com, piece, ...transform, reverseInk = false)
        let top = arr[0]
        let bot = arr[1]
        let orientation = arr[2]
        // bot.bringToFront()
        // top.bringToFront()

        tops.push(top)
        bots.push(bot)
        orientations.push(orientation)
    })
    return [tops, bots, orientations]
}

Poly.prototype.expandRect = function (xAmt, yAmt = xAmt) {
    let { x, y } = new Poly(this.shape.slice(0, -1)).centerOfMass()
    let longestSegmentAngle = (shape) => {
        let maxLen = -Infinity, angle = 0;
        for (let i = 1; i < shape.length; i++) {
            const dx = shape[i].x - shape[i - 1].x;
            const dy = shape[i].y - shape[i - 1].y;
            const sqLen = dx * dx + dy * dy;
            if (sqLen > maxLen) {
                maxLen = sqLen;
                angle = vec(dx, dy).angleBetween(vec(1, 0))
            }
        }
        return angle;
    }

    let angle = longestSegmentAngle(this.shape) + PI / 2
    let newP = new Poly(this.shape, -x, -y)
    newP = new Poly(newP.shape, 0, 0, 1, angle)
    let bbw = newP.bbr - newP.bbl
    let bbh = newP.bbb - newP.bbt
    let xMult = (xAmt + bbw) / bbw
    let yMult = (yAmt + bbh) / bbh
    newP = new Poly(newP.shape.map(v => v.mult(vec(xMult, yMult))))
    // let circ = Poly.ellipse(x, y, 3)
    // circ.setColor('red', 'red')
    // circ.draw()
    return new Poly(newP.shape, x, y, 1, -angle)
}

function solve(polys, faces) {
    verifyJoinery(polys)
    polys.map(poly => {
        if (poly.alpha == 0.75) poly.removal = true
    })
    let [baked, projections, layouts] = bake(faces, polys)
    return [baked, projections, layouts]
}
function simplifyCollinear(path, eps = 8 * S) {
    if (!path) return path
    if (path instanceof paper.CompoundPath) {
        // Handle compound paths
        if (!path.children.length) return path
        for (let childPath of path.children) {
            simplifyPath(childPath, eps);
        }
    } else {
        // Handle simple paths
        simplifyPath(path, eps);
    }
    return path
}

function simplifyPath(singlePath, eps) {
    for (let i = singlePath.segments.length - 2; i > 0; i--) {
        let point = singlePath.segments[i].point;
        let prevPoint = singlePath.segments[i - 1].point;
        let nextPoint = singlePath.segments[i + 1].point;

        if (isPointCloseToLine(point, prevPoint, nextPoint, eps)) {
            singlePath.removeSegment(i);
        }
    }
}

function isPointCloseToLine(point, lineStart, lineEnd, eps) {
    let A = point.x - lineStart.x;
    let B = point.y - lineStart.y;
    let C = lineEnd.x - lineStart.x;
    let D = lineEnd.y - lineStart.y;

    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) // in case of 0 length line
        param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    let dx = point.x - xx;
    let dy = point.y - yy;
    return (dx * dx + dy * dy) <= (eps * eps);
}

// function simplifyCollinear(path) {
//     function isCollinear(p1, p2, p3, epsilon = 1e-6) {
//         let dx1 = p2.x - p1.x;
//         let dy1 = p2.y - p1.y;
//         let dx2 = p3.x - p2.x;
//         let dy2 = p3.y - p2.y;

//         let crossProduct = dx1 * dy2 - dy1 * dx2;
//         return Math.abs(crossProduct) < epsilon;
//     }
//     function simplifyPathSegments(path) {
//         for (let i = 0; i < path.segments.length - 2; i++) {
//             let p1 = path.segments[i].point;
//             let p2 = path.segments[i + 1].point;
//             let p3 = path.segments[i + 2].point;

//             if (isCollinear(p1, p2, p3)) {
//                 path.segments[i + 1].remove();
//                 i--;  // Decrement to re-check with next point after removal
//             }
//         }
//     }
//     if (path instanceof paper.CompoundPath) {
//         for (let childPath of path.children) {
//             simplifyPathSegments(childPath);
//         }
//     } else {
//         simplifyPathSegments(path);
//     }
//     // path.simplify()
//     // path.flatten()
//     return path
// }

function connectVerticesWithQuad(path1, path2) {
    let quads = []
    for (let i = 0; i < path1.segments.length; i++) {
        let p1 = path1.segments[i].point;
        let p2 = path2.segments[i].point;

        // Determine next points to maintain continuity
        let nextP1 = i + 1 < path1.segments.length ? path1.segments[i + 1].point : path1.segments[0].point;
        let nextP2 = i + 1 < path2.segments.length ? path2.segments[i + 1].point : path2.segments[0].point;

        let quad = new paper.Path([
            p1, nextP1, nextP2, p2
        ]);

        quad.closed = true;
        quads.push(quad)
    }
    return quads
}

function connectCompoundPathChildren(compoundPath1, compoundPath2) {
    let quadss = []
    for (let i = 0; i < compoundPath1.children.length; i++) {
        let quads = connectVerticesWithQuad(compoundPath1.children[i], compoundPath2.children[i]);
        quadss.push(...quads)
    }
    return quadss
}

function connectTranslatedClones(clone1, clone2) {
    let quadsss = []
    if (clone1 instanceof paper.Path && clone2 instanceof paper.Path) {
        quadsss.push(...connectVerticesWithQuad(clone1, clone2))
    } else if (clone1 instanceof paper.CompoundPath && clone2 instanceof paper.CompoundPath) {
        quadsss.push(...connectCompoundPathChildren(clone1, clone2))
    }
    return quadsss
}

// let randomReturn = { back: false }
// let randomIters = 0

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let randomDone = false
let allRandom = []
let mapping
async function randomLayout() {
    let margin = 15 * S
    let canvasBounds = new paper.Rectangle(margin, margin, W - margin * 2, H - margin * 2)

    let intersectsAny = (path, paths, andCanvas = true) => {
        if (!path.bounds.intersects(canvasBounds) || !canvasBounds.contains(path.bounds)) {
            return true
        }
        for (let other of paths) {
            if (path.intersects(other)) {
                return true
            }
        }
        return false
    }


    async function copyPaths(final = false) {
        projectionsStart = []
        mapping.forEach((match, i) => {
            // print(i, match, baked, baked[match[1]])
            // let match = mapping.find(pair => pair[1] == i)
            let path = baked[match[1]]
            path.applyMatrix = false
            path.rotation = match[0].rotation
            path.position = match[0].position.clone()
            projectionStart = projections[i].clone()
            projectionStart.applyMatrix = false
            projectionStart.rotation = match[0].rotation
            projectionStart.position = match[0].position.clone()
            projectionsStart.push(projectionStart)
            // make a circle and bring it to front in paperjs
            // let circ = new paper.Path.Circle(match[0].position, 10)
            // circ.fillColor = 'red'
            // circ.strokeColor = 'red'
            // circ.bringToFront()
            // let circ2 = new paper.Path.Circle(projectionStart.position, 10)
            // circ2.fillColor = 'green'
            // circ2.strokeColor = 'green'
            // circ2.bringToFront()
            // noLoop()
        })
        if (final) {
            let finalCheck = baked.map(path => intersectsAny(path, baked, andCanvas = true))
            if (finalCheck.includes(true)) {
                print('final check failed')
                randomDone = false
                await continuouslyTry()
            }
        }
    }

    if (randomDone) {
        await copyPaths()
        return
    }

    pieces = layouts

    let randomPaperPlace = (piece, x, y, w, h) => {
        let path = piece
        path.strokeColor = 'black'
        path.fillColor = 'red'
        let nr = rnd(360)
        path.rotate(nr)
        let nx = rnd(x, x + w)
        let ny = rnd(y, y + h)
        path.position = new paper.Point(nx, ny)
        return path
    }

    let shuffleSubarray = (arr, start, end) => {
        for (let i = end - 1; i > start; i--) {
            const j = Math.floor(rnd() * (i - start + 1)) + start;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr
    }

    allRandom = pieces.map(path => {
        if (path == undefined) return
        let filled = removeContainedSubpaths(path)
        // filled.strokeColor = 'red'
        // noLoop()
        // paper.project.activeLayer.addChild(filled)
        filled.applyMatrix = false
        return filled
    })
    allRandom = allRandom.filter(path => path != undefined)

    // allRandom.map(path => {
    //     path.strokeColor = 'red'
    //     path.bringToFront()
    //     paper.project.activeLayer.addChild(path)
    // })
    // return

    mapping = allRandom.map((path, i) => [path, i])
    // mapping = mapping.sort((a, b) => a[0].bounds.area - b[0].bounds.area)
    allRandom = mapping.map(pair => pair[0])


    let subdivideGrid = (gridWidth) => {
        let gridRectangles = []
        let margin = gridWidth
        for (let i = margin; i < W - margin; i += gridWidth) {
            for (let j = margin; j < H - margin; j += gridWidth) {
                let gridTester = new paper.Rectangle(i, j, gridWidth, gridWidth)
                gridRectangles.push(gridTester)
            }
        }
        return gridRectangles
    }

    let filterRectangles = (rectangles, path) => {
        // print(path, rectangles, path.intersects, rectangles[0].intersects)
        // print('this', rectangles[0] instanceof paper.Item)
        // rectangles.map(rectangle => print(path.intersects(rectangle)))

        return rectangles.filter(rectangle => !path.intersects(rectangle))
    }


    let iters = 0;

    async function placePaths(paths, gridWidth) {
        // Step 1: Initialize grid subdivision
        let gridRectangles = subdivideGrid(gridWidth);
        // gridRectangles = shuffleSubarray(gridRectangles, 0, gridRectangles.length)

        // Step 2: Define recursive placement function
        async function placeNextPath(remainingPaths, availableRectangles, finalizedPaths) {
            iters++;
            if (iters % 50 == 0) {
                // print('pause!')
                await copyPaths()
                await delay(1);
            }

            if (remainingPaths.length === 0) {
                return true; // All paths placed
            }
            // print(remainingPaths.length)

            // Step 3: Select a path and try to place it
            let path = remainingPaths.pop();
            availableRectangles = shuffleSubarray(availableRectangles, 0, availableRectangles.length);
            for (let rectangle of availableRectangles) {
                let iters = map((6 - remainingPaths.length) ** 2, 1, 36, 1, 10);

                for (let i = 0; i < iters; i++) {
                    randomPaperPlace(path, rectangle.x, rectangle.y, rectangle.width, rectangle.height);

                    if (!intersectsAny(path, finalizedPaths)) {
                        finalizedPaths.push(path);
                        // Step 4: Filter out intersecting rectangles
                        let newAvailableRectangles = filterRectangles(availableRectangles, path.bounds);
                        // Step 5: Recursively place the next path
                        if (await placeNextPath([...remainingPaths], newAvailableRectangles, [...finalizedPaths])) {
                            return true;
                        }
                    }
                }
            }
            finalizedPaths.pop();
            // Step 6: Backtrack if path placement failed
            remainingPaths.push(path);
            return false; // Path could not be placed
        }

        // Step 7: Start the placement process
        return await placeNextPath(paths, gridRectangles, []);
    }

    let continuouslyTry = async () => {
        let success = false
        while (!success) {
            print('attempt')
            success = await placePaths([...allRandom], P.gridWidth)
            print('success', success)
        }
        print('success')
        await copyPaths(final = true)
    }
    await continuouslyTry()
    // // Usage example
    // placePaths([...allRandom], P.gridWidth).then(result => {
    //     if (result) {
    //         copyPaths()
    //     }
    //     else {
    //         print('failed')
    //         placePaths
    //     }
    // });


    // allRandom.map(path => {
    //     paper.project.activeLayer.addChild(path)
    //     path.fillColor = 'red'
    //     path.strokeColor = 'white'
    //     path.bringToFront()
    // })
    randomDone = true
}


function removeContainedSubpaths(compoundPath) {
    // If the provided path is not a compound path, return it as is.
    if (!(compoundPath instanceof paper.CompoundPath)) {
        return compoundPath.clone();
    }

    // Clone the original compound path to preserve it
    var compoundPathClone = compoundPath.clone();
    var subpaths = compoundPathClone.children.slice(); // Make a copy of the children array
    var pathsToRemove = [];

    // Compare each subpath with every other subpath
    for (var i = 0; i < subpaths.length; i++) {
        for (var j = 0; j < subpaths.length; j++) {
            // Don't compare a path with itself
            if (i === j) {
                continue;
            }

            // Use Paper.js' contains() method to check if one subpath contains another
            if (subpaths[i].contains(subpaths[j].bounds.center) && !pathsToRemove.includes(subpaths[i])) {
                // Mark subpath j for removal if it's contained within subpath i
                pathsToRemove.push(subpaths[j]);
            }
        }
    }

    // Remove the marked subpaths from the cloned compound path
    // and make sure that the path's bounding box does not change, otherwise undo it
    var oldBounds = compoundPathClone.bounds.clone();
    pathsToRemove.forEach(function (path) {
        path.remove();
    });

    //TODO
    // if (!oldBounds.equals(compoundPathClone.bounds)) {
    //     print('not equal')
    //     compoundPathClone = compoundPath;
    // }


    // After removal, if only one path is left, it's no longer a compound path.
    // Convert it to a simple Path.
    if (compoundPathClone.children.length === 1) {
        var singlePath = compoundPathClone.firstChild.clone();
        compoundPathClone.remove();
        return singlePath;
    }

    return compoundPathClone;
}

function mouseDragged() {
    P.x += (mouseX - pmouseX) * 0.005
    P.y += (mouseY - pmouseY) * 0.005
}

function keyPressed() {
    if (key == 'w') {
        P.project = P.project ? false : true
        setup()
    }
    if (key == 'g') {
        P.background = P.background ? false : true
        setup()
    }
    if (key == 'f') {
        P.filled = P.filled ? false : true
        setup()
    }
    if (key == 'd') {
        P.outlines = P.outlines ? false : true
    }
    if (key == 's') {
        savePaperSVG()
    }
    if (key == 'c') {
        P.copyToAll()
        setup()
    }
    if (key == 'q') {
        P.interactive = P.interactive ? false : true
    }
    if (key == 'x') {
        P.clear()
        setup()
    }
    if (key == 'z') {
        P.full()
        setup()
    }
    if (key == 'b') {
        P.randomInk()
        setup()
    }
    if (key == 't') {
        P.randomLayout()
    }
} 