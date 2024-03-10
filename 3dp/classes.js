// implement area takeovers

class Poly {
    //https://editor.p5js.org/amygoodchild/sketches/L7X-WH6X0
    constructor(shape, x = 0, y = 0, s = 1, r = 0, closed = true, c = undefined, sc = undefined) {
        // let settings = defaults({
        //     shape: [],
        //     x: 0,
        //     y: 0,
        //     s: 1,
        //     r: 0,
        //     breaks: [],
        // }, arguments)
        this.shape = shape.map((v) => {
            let rv = p5.Vector.rotate(v, r)
            return vec(
                x + rv.x * s,
                y + rv.y * s
            )
        })
        this.closed = closed

        this.inactive = []
        this.inactive.length = this.shape.length
        this.findBBox()

        this.tex = null
        this.c = c
        this.sc = sc
    }

    static circle(x, y, r, arc, r2 = undefined) {
        r2 = r2 ?? r
        let a = arc / max(r, r2)
        let shape = []
        let start = rnd(TAU)
        for (let i = start; i < TAU + start; i += a) {
            shape.push(vec(x + r * cos(i), y + r2 * sin(i)))
        }
        return new Poly(shape, 0, 0, 1, 0, 1)
    }

    static personpoints() {
        let pp = [vec(99, 371), vec(132, 342), vec(155, 300), vec(206, 220), vec(232, 163), vec(270, 16), vec(230, 86), vec(215, 122), vec(203, 152), vec(170, 207), vec(144, 238), vec(128, 246), vec(147, 196), vec(176, 86), vec(184, 24), vec(192, -41), vec(207, -189), vec(212, -282), vec(215, -441), vec(210, -454), vec(174, -394), vec(167, -378), vec(143, -282), vec(124, -213), vec(94, -109), vec(91, -101), vec(75, 48), vec(56, -37), vec(24, -125), vec(-5, -234), vec(-37, -313), vec(-81, -390), vec(-125, -480), vec(-122, -450), vec(-113, -348), vec(-90, -205), vec(-69, -97), vec(-40, -16), vec(-4, 103), vec(34, 215), vec(47, 254), vec(31, 234), vec(4, 191), vec(-29, 130), vec(-70, 60), vec(-112, 6), vec(-90, 59), vec(-46, 170), vec(-9, 268), vec(14, 330), vec(40, 359), vec(47, 379), vec(42, 394), vec(35, 410), vec(38, 423), vec(48, 438), vec(70, 452), vec(87, 444), vec(107, 430), vec(108, 403), vec(96, 382),]
        pp.reverse()
        // pp = pp.map(v => v.div(1000))
        return pp
    }

    static letter(x, y, s, character, r = 0) {
        let polys = []
        let data = letterData[character]
        for (let i = 0; i < data.length; i++) {
            let vecData = []
            for (let j = 0; j < data[i].length; j += 2) {
                vecData.push(vec(data[i][j], data[i][j + 1]))
            }
            let poly = new Poly(vecData, x, y, s / letterData.size, r, 1)
            polys.push(poly)
        }
        return polys
    }


    static rect(x, y, w, h) {
        w /= 2
        h /= 2
        let eps = 0.000001
        let shape = [
            vec(x - w, y - h),
            vec(x + w, y - h),
            vec(x + w + eps, y + h),
            vec(x - w - eps, y + h)
        ]
        let poly = new Poly(shape)
        return poly
    }

    static randomPoly(x, y, w, h, num, closed = true) {
        let shape = []
        for (let i = 0; i < num; i++) {
            shape.push(
                vec(
                    rnd(x, x + w),
                    rnd(y, y + h)
                )
            )
        }
        let poly = new Poly(shape, 0, 0, 1, 0, closed)
        return poly
    }

    static order(polys, start = 0, pct = 1) {
        let ordered = []
        let coms = polys.map((p, i) => { return [p.centerOfMass(), i] })
        let curr = coms.splice(start, 1)[0]
        while (ordered.length < polys.length * pct) {
            coms = coms.sort((a, b) => {
                let d1 = p5.Vector.sub(curr[0], a[0]).magSq()
                let d2 = p5.Vector.sub(curr[0], b[0]).magSq()
                return d1 - d2
            })
            curr = coms.shift()
            ordered.push(polys[curr[1]])
        }
        return ordered
    }

    stepnodes(gap = 10, r = undefined) {
        if (r > gap) throw 'r > gap'
        this.reseed(gap)
        if (r) r *= r
        let nodes = []
        let sumd = 0
        for (let i = 0; i < this.shape.length; i++) {
            let ip = (i + 1) % this.shape.length
            let pt0 = this.shape[i]
            let pt1 = this.shape[ip]
            let d = p5.Vector.dist(pt0, pt1)
            let pct = (gap - sumd) / d
            if (pct > 1) {
                sumd += d
                continue
            }
            let newn = p5.Vector.lerp(pt0, pt1, pct)
            if (r && nodes.reduce((acc, v) => {
                return acc || p5.Vector.sub(v, newn).magSq() < r
            }, false)) { print(1); continue }
            nodes.push(newn)
            sumd = (1 - pct) * d
        }
        return nodes
    }

    restructure(tol = 0.12, alsoReseed = 5) {
        let shape = [this.shape[0]]
        for (let i = 0; i < this.shape.length - 1; i++) {
            let ip = (i + 1) % this.shape.length
            let ipp = (i + 2) % this.shape.length
            let p0 = shape[shape.length - 1]
            let p1 = this.shape[ip]
            let p2 = this.shape[ipp]
            let v0 = p5.Vector.sub(p1, p0)
            let v1 = p5.Vector.sub(p2, p1)
            if (abs(v0.angleBetween(v1)) > tol)
                shape.push(p1)
        }
        this.shape = shape
        if (alsoReseed)
            this.reseed(alsoReseed)
        return this
    }

    reflect(angles, c = undefined, reflectionOnly = false, keepAll = false) {
        c = c ?? this.centerOfMass()
        let shape = this.shape
        for (let j = 0; j < angles.length; j++) {
            let angle = angles[j]
            let newshape = []
            let refline = vec(1, 0).rotate(angle)
            refline.setMag(3000)
            // push()
            // // if (j == angles.length - 1)
            // line(c.x, c.y, refline.x + c.x, refline.y + c.y)
            // pop()
            let start
            if (keepAll) newshape = shape
            else
                for (let i = 0; i < shape.length; i++) {
                    let v = shape[i]
                    let dir = p5.Vector.sub(v, c)
                    if (dir.cross(refline).z > 0) {
                        newshape.push(v)
                    }
                    else
                        start = start ?? i
                }
            refline.rotate(PI / 2)
            newshape = newshape.concat(newshape.splice(0, start))
            let len = newshape.length
            for (let i = len - 1; i >= 0; i--) {
                let v = vec(newshape[i].x, newshape[i].y)
                v.sub(c)
                let newv = v.reflect(refline)
                newv.add(c)
                newshape.push(newv)
            }
            shape = newshape
            if (reflectionOnly) shape.splice(0, len)
        }
        this.shape = shape
        this.findBBox()
        return this
    }

    static reflectAll(polys, angles, centers, reflectionOnly = true, keepAll = true) {
        for (let i = 0; i < angles.length; i++) {
            let a = angles[i]
            let c = centers[i % centers.length]
            let cp = polys.map(p => p.copy())
            cp = cp.map(p => p.reflect([a], c, reflectionOnly, keepAll))
            polys = polys.map((p, i) => [p, cp[i]]).flat()
        }
        return polys
    }

    copy(x = undefined, y = undefined, s = 1, c = undefined, sc = undefined) {
        x = x ?? 0
        y = y ?? 0
        s = s ?? 1
        c = c ?? this.c
        sc = sc ?? this.sc
        return new Poly(this.shape, x, y, s, 0, this.closed, c, sc)
    }

    setValue(v) {
        this.value = v
        return this
    }

    setColor(c = undefined, sc = undefined) {
        this.c = c
        this.sc = sc
        return this
    }

    shadow(x = -2, y = 3, c = undefined) {
        c = c ?? color([10, 10, 10, 200])
        return new Poly(this.shape, x, y, 1, 0, 1, c, -1)
    }

    onCanvas(lm = 0, rm = width, tm = 0, bm = height) {
        return (this.bbl > lm &&
            this.bbr < rm &&
            this.bbt > tm &&
            this.bbb < bm)
    }

    // Checks if two lines intersect using method explained here - 
    // https://stackoverflow.com/a/30160064
    static intersect(line0p0, line0p1, line1p0, line1p1) {
        // Finds direction (clockwise or anti) of point in relation to line
        let isClockwiseFromLine = (linep0, linep1, p) => {
            let vec1 = p5.Vector.sub(linep0, linep1);
            let vec2 = p5.Vector.sub(p, linep1);
            let a = vec1.angleBetween(vec2);
            return (a < 0)
        }

        let line0dir0 = isClockwiseFromLine(line0p0, line0p1, line1p0);
        let line0dir1 = isClockwiseFromLine(line0p0, line0p1, line1p1);

        if (line0dir0 != line0dir1) {
            let line1dir0 = isClockwiseFromLine(line1p0, line1p1, line0p0);
            let line1dir1 = isClockwiseFromLine(line1p0, line1p1, line0p1);
            return line1dir0 != line1dir1
        }
        return false;
    }

    findBBox() {
        this.bbl = 999999;
        this.bbr = -999999;
        this.bbt = 999999;
        this.bbb = -999999;

        for (let p of this.shape) {
            if (p.x < this.bbl) this.bbl = p.x;
            if (p.x > this.bbr) this.bbr = p.x;
            if (p.y < this.bbt) this.bbt = p.y;
            if (p.y > this.bbb) this.bbb = p.y;
        }
    }

    BBoxOverlap(poly) {
        return (this.bbr > poly.bbl && this.bbb > poly.bbt) &&
            (this.bbr > poly.bbl && this.bbt < poly.bbb) &&
            (this.bbl < poly.bbr && this.bbb > poly.bbt) &&
            (this.bbl < poly.bbr && this.bbt < poly.bbb)

    }

    setTexture(gfx) {
        this.gfx = gfx
    }

    texture(gfx, x = 0, y = 0, r = 0, s = 1) {
        let tex = createGraphics(gfx.width, gfx.height)
        tex.push()
        tex.translate(x, y)
        tex.translate(tex.width / 2, tex.height / 2)
        tex.rotate(r)
        tex.translate(-tex.width / 2, -tex.height / 2)
        tex.scale(s)
        tex.image(gfx, 0, 0)
        tex.pop()
        tex.fill(200)
        tex.erase()
        tex.beginShape()
        tex.vertex(-10, -10)
        tex.vertex(tex.width + 10, -10)
        tex.vertex(tex.width + 10, tex.height + 10)
        tex.vertex(-10, tex.height + 10)
        tex.beginContour()
        for (let i = this.shape.length - 1; i >= 0; i--) {
            let v = this.shape[i]
            tex.vertex(v.x, v.y)
        }
        tex.endContour()
        tex.endShape(CLOSE)
        this.tex = tex
    }

    //https://stackoverflow.com/questions/16285134/calculating-polygon-area
    getArea() {
        let vertices = this.shape
        var total = 0;
        for (var i = 0, l = vertices.length; i < l; i++) {
            var addX = vertices[i].x;
            var addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
            var subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
            var subY = vertices[i].y;

            total += (addX * addY * 0.5);
            total -= (subX * subY * 0.5);
        }

        return Math.abs(total);
    }

    // for closed shapes
    getPerimeterSq() {
        return this.shape.reduce((perim, v, i) => {
            let j = (i + 1) % this.shape.length
            return perim + p5.Vector.magSq(p5.Vector.sub(v, this.shape[j]))
        }, 0)
    }

    contains(p) {
        // Check if the dot is roughly in the region 
        if (p.x < this.bbl || p.x > this.bbr
            || p.y < this.bbt || p.y > this.bbb) {
            return false;
        }

        // Create dot2 as the other end of the imaginary horizontal line extending off edge of canvas
        let off = vec(999999, p.y);
        // Check each line around this polygon, and count up the number of intersects
        let intersections = 0;
        this.shape.map((_, i) => {
            let j = (i + 1) % this.shape.length;
            intersections += Poly.intersect(p, off, this.shape[i], this.shape[j]);
        })

        // If it's even, the dot is outside
        // stroke(intersections % 2 * 255, 0, 0)
        // circle(p.x, p.y, 20)
        return !(intersections % 2 == 0)
    }

    overlaps(poly, andNotInside = false) {
        if (!this.BBoxOverlap(poly)) return false

        for (let i = 0; i < this.shape.length; i++) {
            let j = (i + 1) % this.shape.length;
            for (let k = 0; k < poly.shape.length; k++) {
                let l = (k + 1) % poly.shape.length;
                if (Poly.intersect(
                    this.shape[i],
                    this.shape[j],
                    poly.shape[k],
                    poly.shape[l]))
                    return true
            }
        }
        if (andNotInside) {
            return poly.contains(this.shape[0]) || this.contains(poly.shape[0])
        }
        return false
    }

    // checks if poly overlaps with canvas or an array of polys
    overlapsAny(polys, andNotOnCanvas = true, andNotInside = true) {
        return (andNotOnCanvas && !this.onCanvas()) || polys.reduce((canPack, poly2) => {
            return canPack || this.overlaps(poly2, andNotInside)
        }, false)
    }

    hardPlace(polys, x = 0, y = 0, w = W, h = H, n = 5, miniR = 0, maxiR = 0, mini = 0.001, andNotOnCanvas = true, andNotInside = true) {
        this.resize(0, 0)
        let p
        let success = false
        for (let i = 0; i < n; i++) {
            let ps = lerp(1, mini, i / n)
            let px = rnd(x, x + w)
            let py = rnd(y, y + h)
            let pr = rnd(miniR, maxiR)
            p = new Poly(this.shape, px, py, ps, pr, 1, this.c, this.sc)
            if (!p.overlapsAny(polys, andNotOnCanvas, andNotInside)) {
                success = true
                // print(i)
                break
            }
        }
        return success ? p : false
    }

    addToQT() {
        this.qt = new QT(new BB((this.bbl + this.bbr) / 2,
            (this.bbb + this.bbt) / 2,
            (this.bbr - this.bbl) / 2,
            (this.bbb - this.bbt) / 2), 4)
        this.qt.show()
        for (let i = 0; i < this.shape.length; i++) {
            let ip = (i + 1 + this.shape.length) % this.shape.length
            let p1 = this.shape[i]
            let p2 = this.shape[ip]
            this.qt.insert({
                x1: p1.x,
                y1: p1.y,
                x2: p2.x,
                y2: p2.y
            })
        }
    }

    distort(s = 100, m = 500, off = 0, rand = false) {
        this.shape = this.shape.map(v => {
            return vec(
                v.x + (rand ? rnd(-s, s) : s * sn(v.x / m, v.y / m, 100 + off)),
                v.y + (rand ? rnd(-s, s) : s * sn(v.x / m, v.y / m, 1000 + off))
            )
        })

        this.findBBox()
        return this
    }

    sindistort(a, b, off) {
        this.shape = this.shape.map(v => {
            let normPos = (v.x - this.bbl) / (this.bbr - this.bbl) * TAU;
            return vec(
                v.x,
                v.y - a * sin(b * normPos + off)
            )
        })

        this.findBBox()
    }

    wrinkle(n = 100, amt = 16, reseeded = false, mini = 100, maxi = 800, centered = true, off = 0,) {
        let com;
        if (centered) com = this.centerOfMass()
        for (let i = 0; i < n; i++) {
            this.distort(amt, rnd(mini, maxi), off, false, false)
            if (reseeded)
                this.reseed(reseeded)
        }
        if (centered) {
            let newcom = this.centerOfMass()
            let trans = p5.Vector.sub(newcom, com)

            return new Poly(this.shape, -trans.x, -trans.y)
        }
        this.findBBox()
        return this
    }

    reseed(gap = 5) {
        let shape = []
        for (let i = 0; i < this.shape.length; i++) {
            let ip = (i + 1) % this.shape.length
            let v1 = this.shape[i]
            let v2 = this.shape[ip]
            let d = p5.Vector.dist(v1, v2)
            let percent = gap / d
            shape.push(v1)
            if (percent < 1) {
                if (percent > 0.5) {
                    shape.push(p5.Vector.lerp(v1, v2, 0.5))
                } else
                    for (let j = percent; j < 1; j += percent) {
                        shape.push(p5.Vector.lerp(v1, v2, j))
                    }
            }
        }
        this.shape = shape
        return this
    }

    handwrite(r = 2) {
        let shape = []
        for (let i = 0; i < this.shape.length; i++) {
            let v = this.shape[i]
            shape.push(vec(v.x + rnd(-r, r), v.y + rnd(-r, r)))
        }
        this.shape = shape
    }

    straighten(percent, n = 1) {
        for (let j = 0; j < n; j++) {
            let points = this.shape
            let newShape = []
            for (let i = 0; i < points.length; i++) {
                let im1 = (i - 1 + points.length) % points.length
                let ip1 = (i + 1) % points.length
                let p = vec((points[im1].x + points[ip1].x) * percent / 2 + points[i].x * (1 - percent),
                    (points[im1].y + points[ip1].y) * percent / 2 + points[i].y * (1 - percent))
                newShape.push(p)
            }
            this.shape = newShape
        }
        this.findBBox()
        return this
    }

    shrink(d = 10, n = 3) {

        let shape = []
        for (let i = 0; i < this.shape.length; i++) {
            let sum = vec(0, 0)
            for (let j = -n; j < n; j++) {
                let ip = (i + j + this.shape.length * n) % this.shape.length
                let ipp = (i + j + 1 + this.shape.length * n) % this.shape.length

                let v0 = this.shape[ip]
                let v1 = this.shape[ipp]
                let norm = p5.Vector.sub(v1, v0)
                norm.rotate(PI / 2)
                sum.add(norm)
            }
            sum.setMag(d)
            let v = p5.Vector.add(this.shape[i], sum)
            shape.push(v)
        }
        this.shape = shape
        this.findBBox()
        return this
    }

    subAll(polys) {
        let returnedPolys = [this]
        for (let i = 0; i < polys.length; i++) {
            let newReturnedPolys = []
            for (let j = 0; j < returnedPolys.length; j++) {
                newReturnedPolys = newReturnedPolys.concat(returnedPolys[j].sub(polys[i], 5, false, true))
            }
            returnedPolys = newReturnedPolys
        }
        return returnedPolys
    }

    sub(p, threshold = 5, cc = false, shuffle = false) {
        let returnedPolys = [] // in case of splitting when doingn sub
        let shape = [] // current
        let startidx = 0
        // get first overlap
        while (startidx < this.shape.length && !p.contains(this.shape[startidx])) {
            startidx++
        }
        // get first exit from overlap
        if (startidx > this.shape.length) return [this]
        while (startidx < this.shape.length && p.contains(this.shape[startidx])) {
            startidx++
        }
        if (startidx > this.shape.length) return [this]
        // start there
        let idx = startidx
        let counter = 0
        while (counter < this.shape.length) {
            counter++
            // push current vertex
            let i = (idx + this.shape.length) % this.shape.length
            let v1 = this.shape[i]
            shape.push(v1)


            let ip = (i + 1) % this.shape.length
            let v2 = this.shape[ip]
            idx++
            // if next vertex not overlapping, continue
            if (!p.contains(v2)) continue
            // if it is, find intersection points
            let l1 = { 'x1': v1.x, 'y1': v1.y, 'x2': v2.x, 'y2': v2.y }
            for (let j = 0; j < p.shape.length; j++) {

                let jp = (j + 1) % p.shape.length
                let pv1 = p.shape[j]
                let pv2 = p.shape[jp]
                let l2 = { 'x1': pv1.x, 'y1': pv1.y, 'x2': pv2.x, 'y2': pv2.y }
                if (!lineSegmentIntersection(l1, l2)) continue
                // intersection poins found
                let removeIP = ip
                // while still inside, skip these vertices
                while (p.contains(this.shape[removeIP])) {
                    counter++
                    removeIP = (removeIP + 1) % this.shape.length
                    idx = removeIP
                }
                // let addJP = cc ? jp : j
                let addJP = j

                // add ovelapping vertices from other shape
                while (this.contains(p.shape[addJP])) {
                    let toAdd = p.shape[addJP]
                    //shuffle adds randomness in case multiple polys are subbing same other poly
                    if (shuffle) toAdd.add(vec(rnd(-0.01, 0.01), rnd(-0.01, 0.01)))
                    shape.push(toAdd)
                    //addJP = cc ? (addJP + 1 + p.shape.length) % p.shape.length : 
                    addJP = (addJP - 1 + p.shape.length) % p.shape.length
                }
                // if the distance between is large, then they are not continuous so split polys
                let thisFirstOut = this.shape[idx]
                let thatFirstOut = p.shape[addJP]
                if (p5.Vector.dist(thisFirstOut, thatFirstOut) > threshold) {
                    returnedPolys.push(shape)
                    shape = []
                }

                break
            }
        }
        // if there is shape remaining, push it
        if (shape.length > 0)
            returnedPolys.push(shape)

        return returnedPolys.map(shape => new Poly(shape))
    }

    // TODO implement rot (by finding com and furthest point of BB and filling in circle from there)
    fill(gap = 5, gap2 = 2, vert = true) {
        this.fills = []
        let continuous = false
        let fillLine = []

        let encapsulate = (i, j) => {
            let v = vec(i, j)
            if (this.contains(v)) {
                if (!continuous) {
                    this.fills.push(fillLine)
                    fillLine = []
                }
                fillLine.push(v)
                continuous = true
            } else {
                continuous = false
            }
        }

        if (vert)
            for (let i = this.bbl; i <= this.bbr; i += gap) {
                for (let j = this.bbt; j <= this.bbb; j += gap2) {
                    encapsulate(i, j)
                }
                continuous = false
            }
        else
            for (let j = this.bbt; j <= this.bbb; j += gap) {
                for (let i = this.bbl; i <= this.bbr; i += gap2) {
                    encapsulate(i, j)
                }
                continuous = false
            }

        this.fillsInactive = this.fills.map(f => {
            let inactive = []
            inactive.length = f.length
            return inactive
        })
    }

    symCutAll(polys) {
        polys.map(poly => this.symCut(poly, true))
    }

    symCut(poly, recurse = true) {
        let newShape = this.shape.filter(v => !poly.contains(v))
        let newFills
        if (this.fills)
            newFills = this.fills.filter(f => {
                return f.filter(v => !poly.contains(v))
            })
        if (recurse) {
            poly.symCut(this, false)
        }
        this.shape = newShape
        if (this.fills)
            this.fills = newFills
        this.findBBox()
    }

    cutAll(polys) {
        polys.map(poly => {
            if (this != poly)
                this.cut(poly)
        })
    }


    cut(poly) {
        if (!this.BBoxOverlap(poly)) return
        this.inactive = this.shape.map((v, i) => this.inactive[i] || poly.contains(v))
        if (this.fills)
            this.fillsInactive = this.fills.map((f, fi) =>
                f.map((v, vi) =>
                    this.fillsInactive[fi][vi] || poly.contains(v)))
    }

    invertActivity() {
        this.inactive = this.inactive.map(bool => !bool)
        if (this.fillsInactive)
            this.fillsInactive = this.fillsInactive.map(fI => fI.map(bool => !bool))
    }

    closest(poly) {
        // find closest two points to each other (one in each shape)
        return this.shape.reduce((last, new1, i) => {
            poly.shape.map((new2, j) => {
                let d = p5.Vector.dist(new1, new2)
                if (last[2] > d)
                    last = [i, j, d]
            })
            return last
        }, [0, 0, Infinity])
    }

    fractalize() {
        let shape = []
        for (let i = 0; i < this.shape.length; i++) {
            shape.push(this.shape[i])
            shape.push(p5.Vector.lerp(this.shape[i], this.shape[(i + 1) % this.shape.length], 0.5))
        }
        this.shape = shape
    }

    centerOfMass() {
        return p5.Vector.div(this.shape.reduce((prev, curr) => {
            prev.add(curr)
            return prev
        }, vec(0, 0)), this.shape.length)
    }

    drawG(g, withFills = false) {
        g.push()
        if (this.c != undefined) {
            if (this.c == -1) g.noFill()
            else
                g.fill(this.c)
        }
        if (this.sc != undefined) {
            if (this.sc == -1) g.noStroke()
            else
                g.stroke(this.sc)
        }

        g.beginShape()
        this.shape.map(v => g.vertex(v.x, v.y))
        g.endShape(CLOSE)

        if (this.fills && withFills) {
            this.fills.map((f, fi) => {
                g.beginShape()
                f.map((v, vi) => {
                    if (this.fillsInactive && this.fillsInactive[fi][vi]) {
                        g.endShape()
                        g.beginShape()
                    } else
                        g.vertex(v.x, v.y)
                })
                g.endShape()
            })
        }
        g.pop()
    }

    resize(x, y, w, h, r = 0) {
        w = w ?? this.bbr - this.bbl
        h = h ?? this.bbb - this.bbt

        let com = vec((this.bbl + this.bbr) / 2, (this.bbb + this.bbt) / 2)
        this.shape = this.shape.map((v) => {
            v.sub(com)
            v.mult(vec(w / (this.bbr - this.bbl), h / (this.bbb - this.bbt)))
            let rv = p5.Vector.rotate(v, r)
            return vec(
                x + rv.x,
                y + rv.y
            )
        })
        this.findBBox()
        return this
    }

    draw(withOutline = true, withFills = false, smooth = false) {
        push()
        if (this.c != undefined) {
            if (this.c == -1) noFill()
            else
                fill(this.c)
        }
        if (this.sc != undefined) {
            if (this.sc == -1) noStroke()
            else
                stroke(this.sc)
        }
        if (this.gfx) { this.texture(this.gfx) }
        if (this.tex) { image(this.tex, 0, 0) }

        if (this.fills && withFills) {
            this.fills.map((f, fi) => {
                beginShape()
                f.map((v, vi) => {
                    if (this.fillsInactive && this.fillsInactive[fi][vi]) {
                        endShape()
                        beginShape()
                    } else
                        vertex(v.x, v.y)
                })
                endShape()
            })
        }

        if (withOutline) {
            beginShape()
            this.shape.map((v, i) => {
                if (this.inactive[i]) {
                    endShape()
                    beginShape()
                } else {
                    if (smooth) curveVertex(v.x, v.y)
                    else vertex(v.x, v.y)
                }
            })
            if (this.closed)
                endShape(CLOSE)
            else
                endShape()
        }
        pop()
    }

    drawNodes(r = 3) {
        for (let p of this.shape) {
            circle(p.x, p.y, r)
        }
    }

    drawBBox() {
        push()
        stroke(0, 20)
        rect(this.bbl, this.bbt, this.bbr - this.bbl, this.bbb - this.bbt)
        pop()
    }

}


// linear force
// Hooke's law  = F = -k*dx
// series: 1/k = 1/k_1 + 1/k_2 (aka dx of two equivalent springs in series is 2dx)
// parallel: k = k_1 + k_2 (aka dx of 2 equiv. in || is 0.5dx)
class SpringNode {
    constructor(pos, vel, fixed = false, i = 0, fixFactor = 0.001, friction = 0.9) {
        this.pos = pos;
        this.vel = vel;
        this.fixed = fixed;
        this.springs = [];
        this.fixFactor = fixFactor;
        this.friction = friction
        this.i = i
    }

    connect(node, k, eqLen, recurse = true) {
        this.k = k;
        this.eqLen = eqLen;
        this.springs.push([node, eqLen, k])
        if (recurse)
            node.connect(this, k, eqLen, false)
    }

    move(withGrav = false, withWind = false) {
        if (this.fixed) return
        let acc = vec(0, 0)
        let addForce = (node, eqLen, k) => {
            let dir = p5.Vector.sub(this.pos, node.pos);
            let d = dir.mag()
            dir.normalize()
            let f = -k * (d - eqLen) * this.fixFactor
            dir.mult(f)
            acc.add(dir)
        }
        this.springs.map((s) => addForce(...s))
        acc.add()
        if (withGrav)
            acc.add(vec(0, 1))
        if (withWind) {
            let m = 200
            let n = vec(
                sn(this.pos.x / m, this.pos.y / m, millis() / 30000),
                sn(this.pos.x / m, this.pos.y / m, millis() / 30000 + 1000),
            )
            n.mult()
            acc.add(n)
        }
        // acc.normalize()
        this.vel.add(acc)
        this.vel.mult(this.friction)
        // this.vel.normalize()
        this.pos.add(this.vel)
    }

    draw() {
        circle(this.pos.x, this.pos.y, 10)


        // if (this.i > 0)
        //     line(nodes[this.i - 1].pos.x, nodes[this.i - 1].pos.y, this.pos.x, this.pos.y)
        this.springs.map((s) => line(s[0].pos.x, s[0].pos.y, this.pos.x, this.pos.y))
    }

    tick(withGrav = false, withWind = false) {
        this.move(withGrav, withWind)
        this.draw()
    }

}

class Boid {
    constructor(pos, vel, acc, c) {
        this.pos = pos
        if (vel === undefined)
            this.vel = vec(0, 0)
        else
            this.vel = vel
        if (acc === undefined)
            this.acc = vec(0, 0)
        else
            this.acc = acc
        if (c === undefined)
            this.c = color(0)
        else this.c = c


        this.history = []
    }

    updateVel(vel) {
        this.vel = vel
        return this
    }

    updateVelNoise(m, a, t = 0) {
        let n = sn(this.pos.x / m, this.pos.y / m, t)
        this.vel = vec(0, 1)
        let rot = map(n, -1, 1, 0, a)
        this.vel.rotate(rot)
    }

    updateVelCurl(m = 1, t = 0, delta = 0.001, rampDistance = 1) {
        this.vel = curlNoise(this.pos.x / m, this.pos.y / m, t = t,
            m = 100, delta = delta, rampDistance = rampDistance)
    }

    move() {
        this.vel.add(this.acc)
        this.pos.add(this.vel)
        return this
    }

    draw() {
        fill(this.c)
        stroke(this.c)
        circle(this.pos.x, this.pos.y, 1)
    }

    tick() {
        this.move()
        this.draw()
    }

    addToHistory() {
        this.history.push(vec(this.pos.x, this.pos.y))
    }

    inBounds(wm = 0, hm = 0, w = width, h = height) {
        return this.pos.x >= wm &&
            this.pos.x <= w - wm &&
            this.pos.y >= hm &&
            this.pos.y <= h - hm;
    }
}


class Ray {
    constructor(px, py, v, r) {
        this.pos = createVector(px, py);
        this.opos = vec(px, py)

        this.vel = v;
        this.vel.normalize()
        this.ovel = vec(v.x, v.y)

        this.refractionIdx = r;
    }

    static line(x1, y1, x2, y2, angle = 0) {
        let v = vec(x2 - x1, y2 - y1)
        let r = new Ray(x1, y1, v, angle)
        r.pos = vec(x2, y2)
        r.path = [r.opos, r.pos]
        return r
    }

    static polyToRays(poly, angle = 0) {
        let rays = []
        for (let i = 0; i < poly.shape.length; i++) {
            if (poly.inactive[i]) continue
            let ip = (i + poly.shape.length + 1) % poly.shape.length
            let v1 = poly.shape[i]
            let v2 = poly.shape[ip]
            let r = Ray.line(v1.x, v1.y, v2.x, v2.y, angle)
            rays.push(r)
        }
        return rays
    }

    intersect(path = [], counter = 0) {
        //add path
        path.push(vec(this.pos.x, this.pos.y))
        this.path = path

        // check bounds
        if (!this.inBounds()) {
            return 'oob'
        }
        if (counter > 200) {
            print('count exceeded')
            return
        }

        // run intersection
        let intersections = []
        let stepSize = 40
        let currentStep = vec(this.opos.x, this.opos.y)
        let endStep
        let counter2 = 0
        do {
            counter2++
            endStep = p5.Vector.add(currentStep, p5.Vector.mult(this.vel, stepSize))
            let center = p5.Vector.lerp(currentStep, endStep, 0.5)
            let diff = p5.Vector.sub(endStep, currentStep)
            let bbrange = new BB(center.x, center.y, abs(diff.x), abs(diff.y))

            // push()
            // stroke('green')
            // rectMode(CENTER)
            // circle(center.x, center.y, 10)
            // circle(this.opos.x, this.opos.y, 10)
            // circle(endStep.x, endStep.y, 10)
            // rect(center.x, center.y, this.vel.x * stepSize, this.vel.y * stepSize)
            // pop()

            let rays = me.qt.q(bbrange)
            // let rays = me.qt.ql({ x1: currentStep.x, y1: currentStep.y, x2: endStep.x, y2: endStep.y })
            currentStep = endStep
            if (!rays) continue
            intersections = rays.map((r) => [getRaysIntersection(this.pos, this.vel, r.opos, r.vel, r.pos), r])
            intersections = intersections.filter(a => a[0])
        } while (intersections.length == 0 && this.inBounds(endStep.x, endStep.y) && counter2 < 99)
        let champ, champD = Infinity
        for (let i = 0; i < intersections.length; i++) {
            if (intersections[i][0] == undefined) { continue }
            let d = abs(this.pos.x - intersections[i][0].x)
            if (d < champD) {
                champD = d
                champ = intersections[i]
            }
        }
        // intersections.sort((a, b) => abs(this.pos.x - a[0].x) - abs(this.pos.x - b[0].x))
        // champ = intersections[0]

        // check intersection
        if (!champ) return
        this.pos = champ[0]
        if (p5.Vector.sub(this.opos, this.pos).magSq() < pow(2, 2)) return
        if (this.path.length > 10) {
            if (p5.Vector.sub(this.path[this.path.length - 2], this.pos).magSq() < pow(4, 2)) return
        }

        // get ready to create new ray
        let r = bounceRay(this, champ)

        insertRay(this)
        if ('oob' == r.intersect(path, ++counter)) {
            r = bounceRay(this, champ, true)
            r.intersect(path, counter)
        }

        // if this is the last ray, draw it
        // this.draw(path)
    }

    draw() {
        let dashed = rnd() < 0.
        if (dashed) {
            let ov = this.path[0]
            this.path.map(v => {
                let points = lerpLine(ov.x, ov.y, v.x, v.y, 10)
                points.map(p => circle(p.x, p.y, 5))
                // cause of weird circle bug that i like
                // ov = v
            })
        } else {
            beginShape()
            this.path.map(v => vertex(v.x, v.y))
            endShape()
        }
    }


    inBounds(x, y) {
        // x = x ?? this.pos.x
        // y = y ?? this.pos.y
        x = this.pos.x
        y = this.pos.y
        return x > 0 && x < width &&
            y > 0 && y < height &&
            (me.bbox.reduce((prev, poly) => poly.contains(vec(x, y)) ? !prev : prev, 0))
    }
}

/**
 * Get the intersection of two rays, with origin points p0 and p1, and direction vectors n0 and n1.
 * @param p0 The origin point of the first ray
 * @param n0 The direction vector of the first ray
 * @param p1 The origin point of the second ray
 * @param n1 The direction vector of the second ray
 * @returns
 * 
 */

function getRaysIntersection(p0, v0, p1, v1, np1) {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const det = v1.x * v0.y - v1.y * v0.x;
    const u = (dy * v1.x - dx * v1.y) / det;
    const v = (dy * v0.x - dx * v0.y) / det;
    let eps = 0
    if (u < eps || v < eps) return undefined; // Might intersect as lines, but as rays.
    // if (u > t) return undefined;

    const m0 = v0.y / v0.x;
    const m1 = v1.y / v1.x;
    const b0 = p0.y - m0 * p0.x;
    const b1 = p1.y - m1 * p1.x;
    const x = (b1 - b0) / (m0 - m1);
    const y = m0 * x + b0;


    if (isNotBetween(vec(x, y), p1, np1)) {
        return undefined
    }

    return Number.isFinite(x) ? vec(x, y) : undefined;
}

function isNotBetween(p, b1, b2) {
    let eps = 1;
    return (
        min(b1.x, b2.x) > p.x + eps ||
        max(b1.x, b2.x) < p.x - eps ||
        min(b1.y, b2.y) > p.y + eps ||
        max(b1.y, b2.y) < p.y - eps)
}

let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
let letterData = { "size": 500, "A": [[-51, -250, 51, -250, 230, 250, 131, 250, 94, 142, -94, 142, -131, 250, -230, 250, -51, -250], [1, -124, -1, -124, -64, 56, 63, 56, 1, -124]], "B": [[177, -202, 177, -45, 115, -9, 115, -8, 177, 28, 177, 202, 94, 250, -177, 250, -177, -250, 94, -250, 177, -202], [77, 34, -77, 34, -77, 164, 77, 164, 77, 34], [77, -164, -77, -164, -77, -51, 77, -51, 77, -164]], "C": [[83, 165, 83, 102, 181, 102, 181, 203, 100, 250, -100, 250, -181, 203, -181, -203, -100, -250, 100, -250, 181, -203, 181, -102, 83, -102, 83, -165, -83, -165, -83, 165, 83, 165]], "D": [[195, -202, 195, 202, 112, 250, -195, 250, -195, -250, 112, -250, 195, -202], [95, -164, -95, -164, -95, 164, 95, 164, 95, -164]], "E": [[107, 36, -50, 36, -50, 164, 150, 164, 150, 250, -150, 250, -150, -250, 150, -250, 150, -164, -50, -164, -50, -50, 107, -50, 107, 36]], "F": [[110, 36, -53, 36, -53, 250, -153, 250, -153, -250, 153, -250, 153, -164, -53, -164, -53, -50, 110, -50, 110, 36]], "G": [[83, 74, 2, 74, 2, -11, 181, -11, 181, 203, 100, 250, -100, 250, -181, 203, -181, -203, -100, -250, 100, -250, 181, -203, 181, -102, 83, -102, 83, -165, -83, -165, -83, 165, 83, 165, 83, 74]], "H": [[98, 36, -98, 36, -98, 250, -198, 250, -198, -250, -98, -250, -98, -50, 98, -50, 98, -250, 198, -250, 198, 250, 98, 250, 98, 36]], "I": [[50, 250, -50, 250, -50, -250, 50, -250, 50, 250]], "J": [[-59, 165, 59, 165, 59, -250, 158, -250, 158, 202, 76, 250, -76, 250, -158, 202, -158, 66, -59, 66, -59, 165]], "K": [[-114, 250, -214, 250, -214, -250, -114, -250, -114, -25, -113, -25, 74, -250, 192, -250, -5, -16, 214, 250, 94, 250, -65, 56, -114, 114, -114, 250]], "L": [[135, 250, -135, 250, -135, -250, -35, -250, -35, 164, 135, 164, 135, 250]], "M": [[250, 242, 157, 242, 157, -77, 155, -77, 46, 242, -46, 242, -155, -81, -157, -81, -157, 242, -250, 242, -250, -242, -122, -242, 0, 114, 1, 114, 122, -242, 250, -242, 250, 242]], "N": [[-104, -74, -105, -74, -105, 250, -205, 250, -205, -250, -112, -250, 104, 74, 105, 74, 105, -250, 205, -250, 205, 250, 112, 250, -104, -74]], "O": [[192, -203, 192, 203, 110, 250, -110, 250, -192, 203, -192, -203, -110, -250, 110, -250, 192, -203], [93, -165, -93, -165, -93, 165, 93, 165, 93, -165]], "P": [[-73, 250, -173, 250, -173, -250, 90, -250, 173, -202, 173, 21, 90, 69, -73, 69, -73, 250], [73, -164, -73, -164, -73, -17, 73, -17, 73, -164]], "Q": [[73, -184, -73, -184, -73, 76, 73, 76, 73, -184], [64, 250, 4, 142, -86, 142, -151, 105, -151, -213, -86, -250, 86, -250, 151, -213, 151, 105, 86, 142, 149, 250, 64, 250]], "R": [[81, 61, 190, 250, 80, 250, -27, 61, -90, 61, -90, 250, -190, 250, -190, -250, 81, -250, 164, -202, 164, 14, 81, 61], [64, -164, -90, -164, -90, -24, 64, -24, 64, -164]], "S": [[-86, 44, -167, -4, -167, -203, -86, -250, 93, -250, 174, -203, 174, -109, 76, -109, 76, -165, -69, -165, -69, -48, 93, -48, 174, -1, 174, 203, 93, 250, -93, 250, -174, 203, -174, 109, -76, 109, -76, 165, 76, 165, 76, 44, -86, 44]], "T": [[185, -164, 50, -164, 50, 250, -50, 250, -50, -164, -185, -164, -185, -250, 185, -250, 185, -164]], "U": [[94, 158, 94, -250, 193, -250, 193, 202, 111, 250, -111, 250, -193, 202, -193, -250, -94, -250, -94, 158, 94, 158]], "V": [[132, -250, 234, -250, 55, 250, -55, 250, -234, -250, -132, -250, 0, 128, 1, 128, 132, -250]], "W": [[175, -192, 250, -192, 152, 192, 70, 192, 1, -68, -1, -68, -70, 192, -152, 192, -250, -192, -175, -192, -110, 71, -109, 71, -39, -192, 39, -192, 109, 70, 110, 70, 175, -192]], "X": [[-105, 250, -218, 250, -57, -6, -211, -250, -98, -250, 0, -95, 98, -250, 211, -250, 56, -6, 218, 250, 105, 250, 0, 84, -105, 250]], "Y": [[50, 250, -50, 250, -50, 36, -211, -250, -102, -250, -1, -63, 0, -63, 102, -250, 211, -250, 50, 37, 50, 250]], "Z": [[48, -164, -162, -164, -162, -250, 177, -250, 177, -186, -48, 163, -48, 164, 177, 164, 177, 250, -177, 250, -177, 186, 48, -163, 48, -164]] }
// let letters = "!@$%^&*()_+{}|[]=-0137;:'/?.>,<qwertyasgnxzlkjipo";
// let typography = { "size": 500, "!": [[65.12293739103544, 250.06152927506704, -65.04914983544403, 250.07609145239917, -65.00068683081581, 119.95290257762426, 65.12788922017788, 119.89815080657844, 65.08404081178533, 250.02841942523247], [41.09915264055354, 52.78045915971797, -41.09208304026501, 52.81898777044252, -58.83131629486934, -249.9455591112249, 58.96724354770499, -249.91989762830946, 41.10348335635379, 52.8359245213976]], "@": [[181.7941253436276, 184.19429841296912, 181.8642647088584, 248.9091354715726, -181.75542443853902, 248.8630306560547, -249.9482804110913, 209.4581651754623, -249.9726392647507, -209.38010382012558, -181.6805419577756, -248.73656603066289, 181.8362733919447, -248.73847112113694, 250.0988681220589, -209.4020523971849, 250.07230147293873, 104.78517533760676, 181.83293893400725, 144.1702063040103, 58.31058039532099, 144.20513196479573, 19.430990704195818, 120.02394932767699, -25.27815522939203, 144.21548885784688, -72.92263448875113, 144.20390675569567, -136.98650559236935, 104.73552248396574, -114.066891210745, -110.54944371969417, -41.73341265616505, -149.95249380635533, 5.952794030722785, -149.90326590027857, 44.74424149412522, -125.87029711202607, 89.43119872243408, -149.9174687771105, 128.32444740545995, -149.91403577504286, 104.18149871628965, 79.43671439171582, 173.61538015364673, 79.44815778368168, 173.5704564959436, -184.11055726101253, -173.52188139904345, -184.0519616350406, -173.48267699640522, 184.14623145953325, 181.7816199225685, 184.2138320527103], [40.032973547145524, -81.14272563008912, -37.02027937666236, -81.12098046762664, -52.91206787278483, 75.39372429060106, 24.204537211228295, 75.38759010267259, 40.065583292201445, -81.09090242884778]], "$": [[36.295123389223704, 187.72708036010832, 36.27258625814569, 250.03207333880107, -27.212921783197142, 250.01043996988165, -27.2092614503367, 187.7118339966793, -69.44231776068368, 187.68543751791802, -130.75164820044105, 152.26126747159347, -130.7348578862447, 81.9828910788872, -56.7770586040933, 81.98089359347819, -56.77336303100571, 124.23263420143132, 56.916770209167346, 124.22268521843661, 56.862979504717494, 32.83830318386284, -64.21549348755435, 32.8051880007083, -125.49577377216598, -2.622640269381516, -125.49136862182576, -152.14833006893085, -64.15134450599945, -187.56939156457952, -27.124201786515584, -187.62947443002153, -27.198427949011243, -249.93856283687273, 36.22133447899183, -249.9736064550618, 36.226511852432886, -187.5965529827437, 69.5063642530966, -187.54913931158563, 130.9117801510655, -152.20422905082035, 130.85881162859187, -81.87954945586262, 56.87124173774159, -81.83933034893755, 56.90972589355185, -124.19735562274403, -51.52708556081263, -124.1175475832375, -51.453665074545036, -35.86726412703404, 69.51208465897192, -35.93853152073888, 130.86516441790593, -0.4941195732889751, 130.9102814002762, 152.25867410667266, 69.55044255001206, 187.69850805013223, 36.2829571646634, 187.66543980454165]], "%": [[-35.498926761283336, -172.1330654568969, -35.44742888734775, -43.37954438134775, -103.66843814329658, -4.102439519461594, -181.77042944786305, -4.015477930912831, -249.9949553229245, -43.431999239634344, -249.9386077229417, -172.10320867053045, -181.756035942031, -211.50454658163582, -103.63844805376955, -211.45429168769604, -35.46262402003697, -172.1171602176157], [-106.55339610476221, -146.2359562071486, -178.85827248781132, -146.26669556734598, -178.85769014669347, -69.24199221173765, -106.54381990065403, -69.24330453201661, -106.61587709960446, -146.22915232462478], [-188.80832871946706, 211.57885274448287, 112.59313439575881, -211.42264465138507, 188.90430210832739, -211.4651038461258, -112.42562732767534, 211.60822528513745, -188.82339791813044, 211.51741641294734], [35.59377313606842, 172.18528479893456, 35.63850191073441, 43.561023880426816, 103.75601186945852, 4.135853590963506, 181.93169080443033, 4.1213637066228515, 250.0453153483457, 43.50712495166547, 250.07717135944307, 172.17853314964447, 181.8494773396349, 211.5952425511582, 103.79340791853934, 211.5802925919294, 35.57210013819517, 172.1649324202561], [106.66963299527174, 146.396505947415, 178.9620262966663, 146.381142606695, 178.99607904575169, 69.34288968870769, 106.65707706329383, 69.33397481701356, 106.65494333534753, 146.31586879253683]], "^": [[0.04184570263122045, -31.547980916973742, -109.16106528811109, 153.34614347902618, -249.9594404918115, 153.312100715481, -58.42469940251733, -153.18697575522148, 58.4555469735738, -153.2416861639971, 250.04935700563303, 153.29380646646598, 109.2799899120874, 153.26050044165268, 1.0111267554271466, -31.59339343167941, 0.02610280918576843, -31.511895600664833]], "&": [[126.47812296395001, -50.61992831612124, 195.50699741709016, -50.64456006308869, 195.4512803464562, 33.80941645586273, 143.3559044570512, 33.86692567017967, 143.35399947599024, 202.908177033639, 61.66432443917382, 250.00704373658917, -113.66393828417402, 250.01643367859737, -195.3459851972477, 202.8603140432309, -195.3898878444915, 27.528551380252654, -134.0605696762814, -7.660939326453285, -134.15430407156643, -9.066191123055807, -195.3600223167265, -44.27560457738264, -195.36168316342463, -202.81323357523573, -113.66440961343186, -249.9960778136836, 33.52811446989462, -249.96204202391627, 115.20127575539556, -202.8017279051179, 115.21141892961103, -102.07949629828653, 16.551211395240017, -102.08439039773717, 16.615176748736317, -165.45414368322022, -96.81970315793274, -165.41560643414556, -96.73559083943361, -50.61058801180713, 5.3070995678441735, -50.639852690639856, 5.298099406442699, 33.82892062959495, -96.73323290262135, 33.85855863458222, -96.81562140895599, 165.58619860007974, 44.81743818374911, 165.56895224953698, 44.74908106410225, -3.470593929351983, 126.49015619585401, -50.66071289255428]], "*": [[91.77969961779529, 237.49355324265127, 0.5150683055137428, 97.2325425803244, -0.4188961887823748, 97.26841594634011, -91.59802453229773, 237.55875966176157, -194.8380493577595, 163.3491498642509, -88.60167797557435, 33.12263346709292, -249.97753732065428, -10.008477745310495, -210.868591579992, -131.220286524559, -54.510469927230695, -70.09590185691486, -63.61210686563438, -237.4048811562766, 63.6404164946316, -237.44584150965005, 54.696297727759166, -70.06491433624701, 210.92419350096395, -131.2181642278975, 250.00238193413432, -9.951661425784076, 88.7688314744233, 33.0923924904749, 194.90370152599166, 163.3539898600125, 91.75152031550908, 237.48172428428927]], "(": [[65.32761564912465, -196.19454300218942, 4.663327074968526, -196.18560956542768, 4.579738530172821, 196.26282474218178, 65.32611649931852, 196.27137303983176, 65.34689163068735, 250.0324069013448, -2.8609282920725363, 250.04377162157823, -65.27726929606654, 214.05493948093334, -65.24410237660874, -213.96105061935125, -2.886646370168831, -249.93319313774194, 65.34075950773442, -249.96529147261103, 65.39304005543553, -196.221551336662]], ")": [[-65.30711504816145, 196.3090626913026, -4.5363166179800825, 196.29462588051666, -4.562063859280234, -196.13929446235923, -65.26229858986937, -196.15152596610494, -65.31712080300004, -249.9191438674531, 2.9819598793343665, -249.91914411635418, 65.32295278172334, -213.94647500137344, 65.34843837825514, 213.9811543786457, 3.052501522320488, 250.0213739530237, -65.27712187901359, 250.0137699066847, -65.25593543935996, 196.32422080761066]], "_": [[-249.96024951735248, -43.6795012426852, 250.00986987010094, -43.66757371577668, 250.07489441193403, 43.73536520596367, -249.96255170975144, 43.718038314217694, -249.92313649377718, -43.62061007864021]], "+": [[-249.90923998320653, 64.47320510051739, -249.9429896035189, -64.36151432567107, -64.38796521043642, -64.35209395617551, -64.36472316925297, -249.98061505998743, 64.45685176922422, -249.90708897339243, 64.43736095536549, -64.38280522158817, 250.01292498940094, -64.34281386955409, 250.03679337399993, 64.45994914785597, 64.46558805366992, 64.4650324119421, 64.4325836133047, 250.01550393915772, -64.39395033744744, 250.0196137814373, -64.38511870472135, 64.48413040519866, -249.99118720093847, 64.44332438962853]], "{": [[-5.905592812984611, 0.6372125670747368, 30.201239479846993, 21.588071987834628, 30.1090117368159, 196.32933628469362, 85.5789602635077, 196.23899591992594, 85.50069899037871, 250.0917871243743, 22.666649198094962, 250.07587420304313, -39.74653213132027, 214.0694418859189, -39.78054757106727, 26.914100698933016, -85.39455535468427, 26.901694866002675, -85.46225450709403, -26.842278708990076, -39.77053861528718, -26.8443002164203, -39.740609153205966, -213.96435644369026, 22.61744207245226, -249.91950264538093, 85.5371853374625, -249.92032488318662, 85.55880554841853, -196.21351840343596, 30.181674397521526, -196.13852610390765, 30.175982605925277, -21.425724651352265, -5.862654250306982, -0.48919063531660434, -5.824519095870147, 0.5412947008973229]], "}": [[-85.42726004497295, 196.30180261148482, -30.091521688828404, 196.2784993430406, -30.020620720683052, 21.591370122721667, 5.949353718812638, 0.5883330803251158, 5.957446343777928, -0.46168064518826846, -30.02170502738834, -21.502743658360444, -30.07247624008816, -196.2356825333958, -85.40961266719901, -196.233832612837, -85.4795529884981, -249.9260759768373, -22.543622616552106, -249.9866488371454, 39.846445360609025, -213.8992779460505, 39.87208276367034, -26.818636090883743, 85.49042830488467, -26.832288458285035, 85.49584218468004, 26.978596574481408, 39.82258836254289, 26.947823702450723, 39.82734529634888, 213.99968219912037, -22.510039030455875, 250.06824888500074, -85.45636546289074, 250.0990989874594, -85.43792422409896, 196.32447513582608]], "|": [[35.013683980516355, 250.02343015089036, -34.906356751220954, 250.09500071528518, -34.91362795805935, -249.94981358515017, 34.99201394727635, -249.9648650744235, 35.022467149283656, 250.00038262982866]], "[": [[62.638775622941075, -196.21337015153662, 7.291645254449167, -196.15254016522792, 7.258736225537923, 196.29231080950814, 62.68245635775703, 196.3331743707682, 62.636614159589314, 250.00380488432646, -62.60122410682226, 250.00257071322662, -62.53718083447234, -249.90016683037337, 62.66729190286646, -249.92577264632953, 62.72679804011458, -196.23447534019112]], "]": [[-62.55338111955, 196.24316244321264, -7.161354241414192, 196.30187206176862, -7.224574766369095, -196.21137595208947, -62.57611825538085, -196.21053492353568, -62.53620023587606, -249.9276683021701, 62.66391178082621, -249.97358188103183, 62.73244702342297, 250.03391792474383, -62.558304146574166, 250.02649277500154, -62.622733216941974, 196.2454327913163]], "=": [[-249.9501285913718, 50.05701430193739, 250.01746825386056, 50.03048916616021, 250.04800286977613, 169.3102379744792, -249.92014776295449, 169.24604079071975, -249.90540192963525, 50.01112803522067], [-249.95936374861066, -169.1627757188796, 250.04958753365395, -169.1944391379316, 250.06848266343036, -49.92587948889138, -249.99098771819888, -49.97719014403683, -249.9871379951702, -169.22535414244442]], "-": [[250.06107256273182, 99.90218022903598, -249.91494742621066, 99.86473234342938, -249.9049397797721, -99.83073204404712, 250.04339851120417, -99.74562669744927, 250.04900822979909, 99.9136114006906]], "0": [[177.8225869291838, -202.77081000008025, 177.8658015224546, 202.85925205293614, 96.20480528762988, 250.04108826010665, -96.06169672034778, 250.08881479001457, -177.80763583572804, 202.87628976374367, -177.72751264763914, -202.74305572672472, -96.06811967873357, -249.98852371906946, 96.17960715022184, -249.99288562848733, 177.85400070831324, -202.8108912325558], [79.32264525642697, -165.46497520464592, -79.19698286000379, -165.45249266537218, -79.13196614696065, 165.54379481190517, 79.30792077218693, 165.51127994163602, 79.23532779606838, -165.4887783661974]], "1": [[-49.94482251919808, -148.52859826186216, -164.2521083286056, -82.82246321248628, -164.2841717919128, -176.41705124234426, -35.66172619495046, -249.94921958850668, 50.03005753895989, -249.91290888245345, 50.003859794624084, 164.38428075188673, 164.30853732633895, 164.32438271911238, 164.36736447004478, 250.0100889251824, -164.25563696934069, 250.07970215354098, -164.2178669706215, 164.3836231790635, -49.92566823418857, 164.33755993566845, -49.967987331071335, -148.55601243896078]], "3": [[172.92811049062993, 202.84604977284664, 91.22699992801478, 250.07831881903385, -91.15534187018912, 250.0188094331854, -172.8470803410123, 202.87671679484072, -172.8729608365416, 102.13444261057228, -74.21412917085402, 102.15148221344765, -74.25248760813425, 165.5243977968192, 74.39394841339593, 165.5042304953605, 74.35232952256072, 33.84357055355708, -48.93334767142452, 33.89354426392258, -48.88341967564468, -50.613857038330906, 74.37054103204252, -50.63004832906972, 74.37659978228851, -165.43711498637833, -74.27692475172596, -165.45391864125847, -74.2719709022959, -102.03296405778154, -172.84120024774057, -102.07255303320628, -172.79178511252712, -202.7742668407981, -91.16617523639111, -249.93762246114997, 91.20745757387381, -249.99522865917749, 172.9743732328187, -202.75185340094265, 172.9522175805549, -44.306154454264814, 111.69424348708408, -9.130023448926632, 111.66778493386683, -7.700837680260355, 172.8995769879599, 27.505050958652312, 172.95311873893561, 202.82556528996125]], "7": [[187.5401552375836, -185.67198898225743, -13.878837637788369, 250.00211118212934, -118.85180687688813, 250.05113553809758, 73.24100092988951, -162.8409280548823, 73.28147344109394, -164.21753697304814, -87.45195470650152, -164.25592541903546, -87.47001394747919, -99.92829364886806, -187.48424901577738, -99.98813087658125, -187.4991151204259, -249.9989928592458, 187.59497937073382, -249.99852132945225, 187.50061931950162, -185.70303401683984]], ";": [[-8.982341855957726, 250.01673710970476, -65.93747257819844, 250.03464472371752, -65.96187558811349, -20.736696557071507, 65.98117301064357, -20.817766917758224, 66.05098082101637, 36.19308252774288, -8.958989713491704, 250.0428918231783], [66.02727113018622, -117.95886608216621, -65.93413713184998, -117.99536774820068, -65.94380162601301, -249.92484596896674, 65.99522220728377, -249.94611017477268, 66.04485958161503, -117.96794487774086]], ":": [[91.3926660503516, 250.09506646860441, -91.24824548539489, 250.00779576037792, -91.27360331996178, 67.37836692334976, 91.41916872552598, 67.36426381016072, 91.36546105425383, 250.02879347579338], [91.35533789049236, -67.22097283669682, -91.317322179025, -67.22210864847176, -91.34107833438811, -249.96143040285264, 91.39913035297805, -249.95418436077733, 91.442438500099, -67.24336019269384]], "'": [[88.20679559739011, 250.07693855756892, -88.11722407218632, 250.046264509389, -120.1395996146581, -249.9171074147032, 120.2690479231461, -249.90982582330702, 88.15935468406892, 250.0573831983553]], "/": [[-35.808681559469605, 250.08014741386393, -123.63817248373854, 250.08950893827932, 35.84015924217134, -249.90287217331672, 123.6520232110827, -249.955074180075, -35.78819932645879, 250.08494412007266]], "?": [[64.38653756103241, -7.441210574606819, 15.12936104990927, -7.46223187486394, 8.96196379943778, 52.779880779681264, -66.4034264667979, 52.80438613270454, -73.269810457595, -43.74859102636557, 6.188922762815674, -89.70549504642379, 48.02793622727156, -89.7048958541781, 47.97098464426737, -167.7224939508159, -47.8724148123173, -167.75171826432046, -47.87635986639378, -106.11955458274203, -143.82198644954573, -106.06448473403364, -143.81522606091934, -204.01043407335644, -64.3065927956299, -249.95135984404791, 64.456756387566, -249.97997606396441, 143.90786929321632, -204.07527198325278, 143.87215707138333, -53.367904721690365, 64.45585477328095, -7.521571413262272], [36.387668025083464, 250.0053037716547, -93.76675830495901, 250.06884917025204, -93.822664330463, 119.95368791192297, 36.348181729518906, 119.92252037695793, 36.31817671893579, 250.05917702644797]], ".": [[250.0182328113265, 250.09374661957244, -249.94428605110423, 250.00818881991145, -249.92228471551866, -249.9304011987469, 250.05758427101586, -249.97579212283523, 250.0400213206433, 250.02977087786235]], ">": [[91.35656506259446, -0.9567311431465049, -249.91586482103241, -112.49319837673897, -249.92536287320766, -241.32780046325203, 250.08823351957514, -68.2395849461544, 250.06082780725978, 68.30899525494601, -249.97776246798657, 241.40797085216343, -249.92436048892102, 112.50523184680624, 91.35848485513624, 1.0557318337192345, 91.43763171488813, -0.8745338518767571]], ",": [[-16.579431226598434, 250.0998049353601, -121.7715623394733, 250.05065971007517, -121.75857859037431, -249.90669504277756, 121.81756313923512, -249.9790242831893, 121.87494761052679, -144.82778115995808, -16.575181469784834, 250.07231207254563]], "<": [[-249.9787795534324, -68.23619200538516, 250.05082555901276, -241.2681408230703, 250.0922843973198, -112.41617942996217, -91.25443017524083, -0.8704009717268298, -91.31490759766727, 1.015127085752414, 250.05834819677224, 112.50071369831703, 250.04097922886962, 241.36604206411675, -249.90830967870468, 68.27757050740544, -249.92074454649105, -68.25506116508282]], "q": [[64.25069880606969, 82.6276924089919, 13.8734540480152, 111.71593773171037, -79.07072089539976, 111.73266892082495, -161.3223647793141, 64.25339127122405, -161.29572829551603, -202.47446076838818, -78.99047966782088, -249.97800482975225, 13.911868413209644, -249.95926675416706, 64.20016852935343, -220.86649808206008, 114.61744211724051, -249.98732189325395, 161.3604516647699, -249.95599896547293, 161.3739378562071, 250.03694650514666, 64.19357284516599, 250.01730820916146, 64.26571196134572, 82.68944934235276], [-64.12156440861828, 28.7963334851218, 64.24794366689495, 28.75929853876973, 64.19760334849035, -167.01729101910337, -64.15886196624399, -167.00417837798358, -64.16179886748746, 28.81931002604849]], "w": [[61.99485784723939, 174.13749185114963, 0.7588292670764244, -45.91629769134752, -0.6672930915318517, -45.86467874079643, -61.943806179127826, 174.18123388105275, -160.76872573755367, 174.10699962560182, -249.91296260198877, -174.0713580312713, -161.46253053908748, -174.01098292318403, -107.194937839033, 48.14707352829573, -105.74958616105776, 48.09940512979978, -43.79877924107409, -174.00161732085144, 43.93853817226645, -174.0391483760477, 105.89853740606647, 48.12936639642227, 107.29509068781567, 48.10319518375191, 161.61135232917295, -174.0573145461576, 250.05569024350635, -174.08369186005632, 160.9454054710416, 174.120246568371, 62.01518042135001, 174.17453379524994]], "e": [[-69.78433587004902, 134.17029208951882, 205.4887016793232, 134.20148629898955, 205.44611831007126, 250.07408646800272, -90.58512825806856, 250.0733099787608, -205.35034701554264, 183.6934669070787, -205.3748252085564, -183.6081632896616, -90.57398988787655, -249.9873429443289, 90.6354823505358, -249.95022273733898, 205.49804188079892, -183.62263141746047, 205.54341236971916, 52.996757286242264, -69.78811199026687, 53.041368359224855, -69.78979490945092, 134.21463168774], [69.8215061447713, -134.08549247980937, -69.74472951828466, -134.09680398431476, -69.75952432234128, -48.93512822206326, 69.88949402755571, -49.00809123893204, 69.8031694674505, -134.11051547484234]], "r": [[154.56932603193084, -249.9258314805416, 154.50396348000248, -132.93630755683984, -17.45738671207202, -132.90673613859735, -17.46878809231141, 250.0617519071187, -154.40959888101654, 250.04974696702064, -154.49086973147013, -249.92083344257367, -41.42008134128295, -249.9415224329625, -17.42126921457477, -208.91648145278, 53.504630780008966, -249.92499142224423, 154.56897023065721, -249.91249430332786]], "t": [[-58.34839150134107, -38.740673526381265, -127.77518596216568, -38.7743540424302, -127.7670566626514, -127.00709588379979, -58.39744913957681, -127.03946724201367, -58.3716592059201, -190.39147580064065, 44.91071383935872, -249.970446514426, 44.88017929109194, -127.00072351700628, 127.89985867069689, -126.9947182890693, 127.82881070385939, -38.75491898410538, 44.923933345879114, -38.836199904440555, 44.90272863552122, 161.862185379717, 127.91968115416807, 161.77511776181908, 127.85046125596465, 250.03756372897817, 29.081118058079166, 250.0081196506239, -58.41360251366652, 199.5508235278707, -58.3614405677387, -38.81693239944033]], "y": [[-16.76356315632806, 250.0931663214634, -113.15411145808754, 250.02427879445185, -47.41049530480596, 82.22184213744605, -183.8907480874, -249.93629394633084, -86.0287639431363, -249.91922785276356, 1.8817803529550072, -39.95606921182193, 3.2551689756234583, -39.92646119286475, 86.16065284001031, -249.90567210999558, 184.0269498563168, -249.9728964469293, -16.771989797703036, 250.07748853602985]], "a": [[69.85816598894469, 50.029438162974685, -69.70398990422919, 50.071711084746084, -69.71598552491163, 136.16020074361788, 69.83412378759384, 136.14332492961148, 69.89598339239585, 50.03562960381615], [-0.4021990263372973, 250.02437032730458, -90.51623187600799, 250.05453232340219, -205.40957672427987, 183.74812901486425, -205.4246746289951, 12.472343288534265, -90.512593264285, -53.92900246715567, 69.81638033584876, -53.95173543280548, 69.8822348265459, -134.15365482808318, -155.93101912055835, -134.08550074853318, -155.87555127026303, -249.97436730745096, 90.64058425673961, -249.9251825451993, 205.50737988152514, -183.57803345720515, 205.54539660882344, 250.0395334843881, 140.10054651223263, 250.07201936560966, 69.87081360680476, 209.42655128113697, -0.48064503984987056, 250.01901417747595]], "s": [[82.00997972666735, -62.951931684344316, 198.0045132675002, 4.084186529715458, 198.0765586265875, 183.08968857478266, 82.0629610104234, 250.0766163172868, -197.97518777089257, 250.01396927981725, -197.97255436991642, 133.0770877010224, 61.03162517843407, 133.06042130703943, 61.0167000095899, 56.02859029519359, -81.93578579322099, 56.015199471697535, -197.96130351310865, -10.985131313221656, -197.96367124632428, -182.91673868015627, -81.90218289810731, -249.91473369853105, 188.03308432209275, -249.9716155261081, 188.09321856876284, -132.96435954556014, -60.98868307411249, -132.9509038463379, -60.91639759560273, -62.952505264834834, 82.06502423527269, -62.998359767918444]], "g": [[-86.11715750100153, 250.01669606114024, -168.39787752296894, 202.52797660395146, -168.4112491330901, 152.86789431850218, -86.15239881524879, 104.61560910966283, -154.21734261150092, 64.98508030265076, -154.1912148108332, 1.1598775532675178, -103.88558043821094, -28.001608435296674, -154.25191030726282, -57.0467361346046, -154.1752336689482, -202.44305024576113, -71.92856278898302, -249.9020524910087, 168.45065351246512, -249.9591874313381, 168.52123570832222, -204.57806217541204, 103.9782293959576, -166.92822942027948, 147.2232193898471, -141.40134504848288, 147.2588059182937, -64.87198697045615, 64.91890805595759, -17.324531487898113, -57.05243452677784, -17.360922967376748, -57.03474178853551, 28.725681161772215, 86.2037061025151, 28.752916129702985, 168.4484223152969, 76.30891747269702, 168.45034234382024, 202.5004951379159, 86.18788327229964, 250.0973024203722, -86.13852801292192, 250.0972465283275], [71.3329473467444, 168.44030950322082, 71.36715808215924, 104.65163811407022, -71.27438329728625, 104.61784774935748, -71.27082473243198, 168.47961754113044, 71.3018258766086, 168.4447288348143], [50.041694563274135, -170.54341913999824, -57.081262937683505, -170.53858849268232, -57.063648055720975, -96.76418677161938, 50.033952960992, -96.77244255343163, 50.08169541291005, -170.5466447545326]], "n": [[105.54103100438628, -249.92584176962004, 220.36646360231452, -183.59298854662413, 220.38159781013374, 250.0198813537629, 84.68813372248357, 250.04456043529382, 84.66342640655985, -134.06715779472407, -84.55508544472042, -134.0895424854905, -84.59913313047994, 250.0472492073851, -220.2481578412748, 250.07449938752637, -220.23580317518667, -249.9579696297845, -108.41383808619317, -249.93981129297288, -84.61289807245532, -209.3558948056708, -14.348322038383538, -249.91830578232347, 105.45979847180989, -249.9242817303148]], "x": [[-104.732108967292, 247.0789271979809, -249.92571800942673, 247.08647777518797, -70.08083464246899, -4.854620850154582, -244.05536142760872, -247.01742905564817, -96.78211185818212, -246.99724535914618, 0.003993630555448158, -107.6219646036537, 96.92024531895085, -246.98444939054698, 244.08774832156206, -246.97411328475684, 69.20693445008837, -4.852101188088382, 250.06675995512202, 247.09479405563135, 104.84181277616507, 247.06947549891976, 0.07859474905946177, 98.87894828611809, -104.71667024184632, 247.1208303882069]], "z": [[-197.98645165842555, 250.00032114486518, -197.939944015842, 154.04860810448952, 18.050769133029448, -130.90790274702945, 18.098049965632523, -132.94662645785237, -187.9179077396862, -132.9879691345968, -187.95347190380073, -249.97645576858883, 198.0683320689779, -249.92085823780047, 198.06317671531178, -153.9088485894261, -17.950545491515374, 131.00958352189735, -17.921378262115546, 133.07409572688798, 198.0537794279532, 133.00751087132332, 198.05577792626852, 250.0049479047883, -197.99553611771768, 250.08125158723468]], "l": [[81.19510637212103, 250.0275359928232, -1.7014960384663824, 250.0966931948381, -81.06594555968373, 204.1310225803641, -81.15540801962295, -249.9377627531817, 12.72732836114594, -249.94189012968826, 12.76808275728306, 169.9234248012464, 81.21747433994072, 169.87101858815697, 81.24346866568511, 250.0455910855672]], "k": [[-164.72157178093929, -249.91213083768238, -70.86320491342421, -249.95539669726605, -70.8736722318522, 45.2474093649349, -69.42189279689006, 45.259053758287145, 36.70494061292868, -92.4087874728647, 144.21197232343556, -92.4378670923565, 21.629780750437263, 60.314461204047454, 164.73625031659594, 250.06565932956713, 55.84349813783419, 250.02348235216127, -33.127840295921054, 128.81119865999278, -70.80971777912548, 176.05655636056065, -70.87819487043295, 250.0860078615856, -164.657744574128, 250.0464820480129, -164.634608777706, -249.97246068667226]], "j": [[65.11326587645856, -176.2453377962544, -13.950623064002201, -176.2614843642345, -13.910144892773289, -249.94058012600922, 65.14366037526135, -249.94991812308268, 65.13678688870665, -176.2854333953485], [-11.276897905061166, -126.2783473028417, 62.371413595226244, -126.24977715394571, 62.42275847066674, 213.9816896994085, 0.0812078830828971, 250.0643849065158, -64.95682123928772, 250.04972843140646, -65.02901205794592, 187.10405078051159, -11.25945708725427, 187.17261644226087, -11.270213466212319, -126.30713697968797]], "i": [[-46.8224436378787, -92.39246560016909, 46.97202780798613, -92.40348313574049, 46.94878685964071, 250.01221328127045, -46.87131770651839, 250.05696584264393, -46.8473904398446, -92.37588362544429], [50.41538706120193, -156.1266999728728, -50.318183680276796, -156.12978513174127, -50.243170843233045, -249.9673293229345, 50.37076169359756, -249.92553357619713, 50.42219606380405, -156.12323985542963]], "p": [[161.37725232998176, 64.27761715408754, 79.13834206101826, 111.7070140134628, -13.767971062606994, 111.74020531977963, -64.12304034581311, 82.71243769116188, -64.17840925804278, 250.04888812855205, -161.29106189109012, 250.0487613194153, -161.26403700529409, -249.98350152063114, -81.1996396148341, -249.93834201869348, -64.12764281465748, -220.9116247759517, -13.795891356117373, -249.976916884836, 79.14708529120297, -249.93774686510258, 161.38098360256367, -202.48032900128416, 161.3486837585788, 64.26881150221347], [64.26659424486954, -166.92322285954597, -64.17285255551235, -166.94433303476086, -64.10879617235962, 28.80547740212959, 64.26625844906815, 28.779042032851727, 64.21616421011892, -167.01735960893302]], "o": [[218.18161137942388, -184.25658636779107, 218.2110947943622, 184.33110827746535, 104.46844790194397, 250.05145509204098, -104.40557292423134, 250.07085472028615, -218.0935480642558, 184.36263596798918, -218.0589785582593, -184.31012938314853, -104.32458757516426, -249.94919381791394, 104.45311372277986, -249.99426645428608, 218.19543978020138, -184.2772131321648], [83.91754224261324, -135.29041140206553, -83.736216988037, -135.20131712744453, -83.81478568767648, 135.31730093160513, 83.85929004512441, 135.39302576739468, 83.85168553270626, -135.21986451863984]] }
// let letters = "®"
// let typography = { "size": 500, "®": [[63, 45, 124, 149, 40, 149, -18, 47, -35, 47, -35, 149, -111, 149, -111, -149, 58, -149, 111, -120, 111, 17, 63, 45], [34, -84, -35, -84, -35, -18, 34, -18, 34, -84], [239, -203, 239, 203, 158, 250, -158, 250, -239, 203, -239, -203, -158, -250, 158, -250, 239, -203], [155, -180, -155, -180, -155, 180, 155, 180, 155, -180]] }

function lineSegmentIntersection(l1, l2) {
    let line1Start = createVector(l1.x1, l1.y1);
    let line1End = createVector(l1.x2, l1.y2);
    let line2Start = createVector(l2.x1, l2.y1);
    let line2End = createVector(l2.x2, l2.y2);

    let diffLA = p5.Vector.sub(line1End, line1Start);
    let diffLB = p5.Vector.sub(line2End, line2Start);

    let compareA = diffLA.x * line1Start.y - diffLA.y * line1Start.x;
    let compareB = diffLB.x * line2Start.y - diffLB.y * line2Start.x;

    if ((((diffLA.x * line2Start.y - diffLA.y * line2Start.x) <= compareA)
        ^ ((diffLA.x * line2End.y - diffLA.y * line2End.x) <= compareA))
        && (((diffLB.x * line1Start.y - diffLB.y * line1Start.x) <= compareB)
            ^ ((diffLB.x * line1End.y - diffLB.y * line1End.x) <= compareB))) return true;
    return false;
}

class BB {

    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(l) {
        if (this.inside(l.x1, l.y1)) return true;
        if (this.inside(l.x2, l.y2)) return true;
        if (lineSegmentIntersection(l, { x1: this.x - this.w, y1: this.y - this.h, x2: this.x + this.w, y2: this.y - this.h })) return true;
        if (lineSegmentIntersection(l, { x1: this.x + this.w, y1: this.y - this.h, x2: this.x + this.w, y2: this.y + this.h })) return true;
        if (lineSegmentIntersection(l, { x1: this.x + this.w, y1: this.y + this.h, x2: this.x - this.w, y2: this.y + this.w })) return true;
        if (lineSegmentIntersection(l, { x1: this.x - this.w, y1: this.y + this.h, x2: this.x - this.w, y2: this.y - this.h })) return true;
        return false;
    }

    inside(x, y) {
        return (x >= this.x - this.w &&
            x < this.x + this.w &&
            y >= this.y - this.h &&
            y < this.y + this.h);
    }

    intersect(r) {
        return !(r.x - r.w > this.x + this.w ||
            r.x + r.w < this.x - this.w ||
            r.y - r.h > this.y + this.h ||
            r.y + r.h < this.y - this.h);
    }

}

class QT {
    constructor(bb, cap) {
        this.bb = bb;
        this.cap = cap;
        this.ls = [];
        this.div = false;
    }

    subdivide() {
        let x = this.bb.x;
        let y = this.bb.y;
        let w = this.bb.w;
        let h = this.bb.h;
        this.ne = new QT(new BB(x + w / 2, y - h / 2, w / 2, h / 2), this.cap);
        this.nw = new QT(new BB(x - w / 2, y - h / 2, w / 2, h / 2), this.cap);
        this.se = new QT(new BB(x + w / 2, y + h / 2, w / 2, h / 2), this.cap);
        this.sw = new QT(new BB(x - w / 2, y + h / 2, w / 2, h / 2), this.cap);
        this.div = true;
    }

    insert(l) {

        if (!this.bb.contains(l)) return false;

        if (this.ls.length < this.cap) {
            this.ls.push(l);
            return true;
        }

        if (!this.div) this.subdivide();

        let isInserted = false;
        if (this.ne.insert(l)) isInserted = true;
        if (this.nw.insert(l)) isInserted = true;
        if (this.se.insert(l)) isInserted = true;
        if (this.sw.insert(l)) isInserted = true;

        return isInserted;

    }

    q(rng, f) {

        if (!f) f = [];

        if (!this.bb.intersect(rng)) return;

        else {
            for (let l of this.ls) {
                if (rng.contains(l)) f.push(l.idx);
            }
            if (this.div) {
                this.nw.q(rng, f);
                this.ne.q(rng, f);
                this.sw.q(rng, f);
                this.se.q(rng, f);
            }
        }
        let idxs = Array.from(new Set(f.map(JSON.stringify))).map(JSON.parse);
        return idxs.map(i => me.rays[i])
    }

    ql(l, f) {
        if (!f) f = [];

        if (!this.bb.contains(l)) return;

        else {
            for (let foundl of this.ls) {
                if (lineSegmentIntersection(l, foundl)) f.push(foundl);
                // f.push(foundl.idx)
            }
            if (this.div) {
                this.nw.ql(l, f);
                this.ne.ql(l, f);
                this.sw.ql(l, f);
                this.se.ql(l, f);
            }
        }
        let idxs = Array.from(new Set(f.map(JSON.stringify))).map(JSON.parse);
        return idxs.map(i => me.rays[i])
    }

    show() {
        stroke('green')
        noFill();
        strokeWeight(1);
        rectMode(CENTER);
        rect(this.bb.x, this.bb.y, this.bb.w * 2, this.bb.h * 2);
        for (let l of this.ls) {
            strokeWeight(1);
            line(l.x1, l.y1, l.x2, l.y2);
        }

        if (this.div) {
            this.ne.show();
            this.nw.show();
            this.se.show();
            this.sw.show();
        }
    }
}



class KB {

    // which between 0-24
    keyD(id, vel) {
        print('keyD', id, vel)

    }

    keyU(id) {
        print('keyU', id)
    }

    // which between 0-7
    knob(id, vel) {
        print('knob', id, vel)
        switch (id) {
            case 0:

                break
            case 1:

                break
            case 2:

                break
            case 3:

                break
            case 4:

                break
            case 5:

                break
            case 6:

                break
            case 7:

                break
            case -69:

                break
            default:
        }
    }

    // which between 0-7
    padD(id, vel) {
        print('padD', id, vel)

    }

    padU(id) {
        print('padU', id)
    }

    // padHeavy() { }

    constructor(midi) {
        this.midi = midi
        let inputs = midi.inputs.values()
        for (var input = inputs.next();
            input && !input.done;
            input = inputs.next()) {
            // each time there is a midi message call the onMIDIMessage function
            let hit = this.onMIDIMessage.bind(this)
            input.value.onmidimessage = hit;
        }

        this.recording = false
        this.replaying = false
        this.path = []
    }

    replay(message) {

    }

    onMIDIMessage(message) {
        // print(message.timeStamp)
        let type = message.data[0]
        let id = message.data[1]
        let vel = message.data[2]

        // handle recording press
        if (type == 153 && id == 7 && !this.recording && !this.replaying) {
            this.recording = true
            this.path = []
            print(1)
        } else if (type == 153 && id == 7 && this.recording && !this.replaying) {
            this.recording = false
            print(this.path)
        }

        // handle replaying press
        if (type == 153 && id == 6 && this.path.length > 0 && !this.recording && !this.replaying) {
            this.replaying = true
        } else if (type == 153 && id == 6 && this.path.length > 0 && !this.recording && this.replaying) {
            this.replaying = false
        }

        // handle recording
        if (this.recording) {
            this.path.append(message)
        }

        if (this.replaying) this.replay()

        switch (type) {
            case 144:
                this.keyD(id - 48, vel / 127)
                break
            case 128:
                this.keyU(id - 48, vel / 127)
                break
            case 176:
                this.knob(id - 70, vel / 127)
                break
            case 153:
                this.padD(id - 36, vel)
                break
            case 137:
                this.padU(id - 36, vel)
                break
            default:

                break
        }
    }
}

function connectMIDI() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(success, undefined);
    }
}

function success(midi) {
    console.log('Got midi!', midi);
    kb = new KB(midi)
}


class Drawing {
    // mousePressed = drawing.mousePressed.bind(drawing)
    // mouseDragged = drawing.mouseDragged.bind(drawing)
    // keyPressed = drawing.keyPressed.bind(drawing)
    constructor() {
        this.points = []
        this.active = undefined
    }

    draw() {
        beginShape()
        this.points.map(p => vertex(p.x, p.y))
        endShape()
        this.points.map(p => circle(p.x, p.y, 10))
        if (this.active) {
            push()
            stroke('red')
            circle(this.points[this.active].x, this.points[this.active].y, 20)
            pop()
        }
    }

    mousePressed() {
        this.active = this.closest(this.points, vec(mouseX, mouseY))
        this.draw()
    }

    mouseDragged() {
        this.points[this.active] = vec(mouseX, mouseY)
        this.draw()
    }

    keyPressed() {
        if (key == 'a') this.points.push(vec(mouseX, mouseY))
        if (key == 'd') this.points.splice(this.closest(this.points, vec(mouseX, mouseY)), 1)
        if (key == 's') this.vecPrint(this.points)
        if (key == 'f') this.points.splice(this.active, 0, vec(mouseX, mouseY))
        this.draw()
    }

    closest(points, pos) {
        let idx = points.reduce((prev, _, i) => {
            return pos.dist(points[i]) < pos.dist(points[prev]) ? i : prev;
        }, 0)
        return idx
    }

    vecPrint(points) {
        let info = points.reduce((s, p) => {
            s += "vec(" + (width / 2 - p.x) + ', ' + (height / 2 - p.y) + '),'
            return s
        }, '[')
        info += ']'
        print(info)
    }
}

function drawingOverride() {
    mousePressed = drawing.mousePressed.bind(drawing)
    mouseDragged = drawing.mouseDragged.bind(drawing)
    keyPressed = drawing.keyPressed.bind(drawing)
}