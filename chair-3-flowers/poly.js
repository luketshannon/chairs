

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

        this.tx = 0
        this.ty = 0
        this.tr = 0

        this.x = 0
        this.y = 0
        this.r = 0
    }

    rotate(r, findBBox = 1) {
        this.tr += r
        let com = this.centerOfMass()
        this.shape = this.shape.map(v =>
            v.copy().sub(com).rotate(r).add(com)
        )
        if (findBBox)
            this.findBBox()
        return this
    }

    translate(x, y, findBBox = 1) {
        this.tx += x
        this.ty += y
        this.shape = this.shape.map(v => {
            return vec(
                v.x + x,
                v.y + y
            )
        })
        if (findBBox)
            this.findBBox()
        return this
    }

    bake() {
        this.rotate(this.r, 0)
        this.translate(this.x, this.y, 1)
        this.x = 0
        this.y = 0
        this.r = 0
        return this
    }

    unite(other) {
        // this.draw()
        // other.draw()
        // print(1, this, other)
        if (this.shape.length == 0) return other
        // print(2, this, other)

        if (!this.path) {
            this.path = new paper.Path()
            this.shape.map((p, i) => {
                if (i == 0) this.path.moveTo(p.x, p.y)
                else this.path.lineTo(p.x, p.y)
                if (i == this.shape.length - 1 && this.closed) this.path.lineTo(this.shape[0].x, this.shape[0].y)
            })
        }
        // print(3, this, other)
        if (!other.path) {
            other.path = new paper.Path()
            other.shape.map((p, i) => {
                if (i == 0) other.path.moveTo(p.x, p.y)
                else other.path.lineTo(p.x, p.y)
                if (i == other.shape.length - 1 && other.closed) other.path.lineTo(other.shape[0].x, other.shape[0].y)
            })
        }
        // print(4, this, other)
        // print(this.path, other.path)
        let united = this.path.unite(other.path)
        // print(united)
        this.path = united
        if (this.path.children) {
            print("more than one child")
            this.shape = []
            for (let child of this.path.children) {
                for (let seg of child.segments) {
                    this.shape.push(vec(seg.point.x, seg.point.y))
                }
            }
        } else {
            this.shape = united.segments.map(s => {
                return vec(s.point.x, s.point.y)
            }
            )
        }
        this.findBBox()
        return this
    }

    intersections(polys) {
        let inters = []
        for (let poly of polys) {
            for (let i = 0; i < this.shape.length; i++) {
                let j = (i + 1) % this.shape.length;
                for (let k = 0; k < poly.shape.length; k++) {
                    let l = (k + 1) % poly.shape.length;
                    if (Poly.intersect(
                        this.shape[i],
                        this.shape[j],
                        poly.shape[k],
                        poly.shape[l]))
                        inters.push(vec((this.shape[i].x + this.shape[j].x + poly.shape[k].x + poly.shape[l].x) / 4,
                            (this.shape[i].y + this.shape[j].y + poly.shape[k].y + poly.shape[l].y) / 4))
                }
            }
        }
        return inters
    }

    rndPointInPoly() {
        let pt
        do {
            pt = vec(rnd(this.bbl, this.bbr), rnd(this.bbt, this.bbb))
        } while (!this.contains(pt))
        return pt
    }


    static ellipse(x, y, r, r2 = undefined, arc = 3, rot = 0) {
        r2 = r2 ?? r
        let a = arc / max(r, r2)
        let shape = []
        let start = rnd(TAU)
        for (let i = start; i < TAU + start; i += a) {
            shape.push(vec(x + r * cos(i), y + r2 * sin(i)))
        }
        return new Poly(shape, 0, 0, 1, rot, 1)
    }

    static person(x = 0, y = 0, s = 1, r = 0, closed = true, c = undefined, sc = undefined) {
        let pp = [vec(99, 371), vec(132, 342), vec(155, 300), vec(206, 220), vec(232, 163), vec(270, 16), vec(230, 86), vec(215, 122), vec(203, 152), vec(170, 207), vec(144, 238), vec(128, 246), vec(147, 196), vec(176, 86), vec(184, 24), vec(192, -41), vec(207, -189), vec(212, -282), vec(215, -441), vec(210, -454), vec(174, -394), vec(167, -378), vec(143, -282), vec(124, -213), vec(94, -109), vec(91, -101), vec(75, 48), vec(56, -37), vec(24, -125), vec(-5, -234), vec(-37, -313), vec(-81, -390), vec(-125, -480), vec(-122, -450), vec(-113, -348), vec(-90, -205), vec(-69, -97), vec(-40, -16), vec(-4, 103), vec(34, 215), vec(47, 254), vec(31, 234), vec(4, 191), vec(-29, 130), vec(-70, 60), vec(-112, 6), vec(-90, 59), vec(-46, 170), vec(-9, 268), vec(14, 330), vec(40, 359), vec(47, 379), vec(42, 394), vec(35, 410), vec(38, 423), vec(48, 438), vec(70, 452), vec(87, 444), vec(107, 430), vec(108, 403), vec(96, 382),]
        pp.reverse()
        return new Poly(pp, x, y, s / 100, r + PI, closed, c, sc)
    }


    static rect(x, y, w, h) {
        w /= 2
        h /= 2
        let eps = 0.000001
        let shape = [
            vec(x - w, y - h),
            vec(x + w, y - h),
            vec(x + w + eps, y + h),
            vec(x - w - eps, y + h),
            vec(x - w, y - h)
        ]
        let poly = new Poly(shape)
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
            refline.setMag(39000)
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


    onCanvas(lm = 0, rm = W, tm = 0, bm = H) {
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
            this.shape = this.shape.map(v => vec(v.x - trans.x, v.y - trans.y))
            this.findBBox()
            return this
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


    centerOfMass() {
        return p5.Vector.div(this.shape.reduce((prev, curr) => {
            prev.add(curr)
            return prev
        }, vec(0, 0)), this.shape.length)
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

    drawp5() {
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

        beginShape()
        this.shape.map((v, i) => {
            vertex(v.x, v.y)
        })
        endShape(CLOSE)
        // this.drawNodes()

        pop()

    }

    draw(withOutline = true, withFills = false, smooth = false) {
        if (this.path) {
            this.path.strokeColor = 'red'
            return
        }
        if (this.shape.length == 0) {
            print('poly with shape.length==0')
            return
        }
        let path = new paper.Path();
        path.strokeColor = 'white'
        // path.fillColor = 'black'
        // path.moveTo(new paper.Point(50, 150));
        // path.lineTo(new paper.Point(150, 150));
        push()
        if (this.c != undefined) {
            if (this.c == -1) noFill()
            else
                path.fillColor = this.c
        }
        if (this.sc != undefined) {
            if (this.sc == -1) path.strokeColor = 'none'
            else
                path.strokeColor = this.sc
        }


        if (withOutline) {
            path.moveTo(new paper.Point(this.shape[0].x, this.shape[0].y));
            // beginShape()
            this.shape.map((v, i) => {
                path.lineTo(new paper.Point(v.x, v.y))
                // if (this.inactive[i]) {
                //     endShape()
                //     beginShape()
                // } else {
                // if (smooth) curveVertex(v.x, v.y)
                // else vertex(v.x, v.y)
                // }
            })
            if (this.closed) {
                path.lineTo(new paper.Point(this.shape[0].x, this.shape[0].y));
            }
            // print(2)
            //     endShape(CLOSE)
            // else
            //     endShape()
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