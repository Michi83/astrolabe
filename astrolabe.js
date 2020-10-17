/*
Symbols:
A       azimuth
a       altitude
phi     geographic latitude
h       hour angle
delta   declination
lambda  ecliptic longitude
beta    ecliptic latitude
epsilon obliquity of the ecliptic = 23.5 degrees

Color code:
black   mater
green   tympan
blue    rete
red     rule
*/

let deg = (radians) => {
    return 180 * radians / Math.PI
}

let rad = (degrees) => {
    return Math.PI * degrees / 180
}

let acos = Math.acos
let asin = Math.asin
let atan2 = Math.atan2
let cos = Math.cos
let epsilon = rad(23.5)
let hemisphere = 1 // 1 = north; -1 = south
let mater
let phi = rad(45)
let phiDegrees = 45
let rete
let reteLastClickedHourAngle = null
let reteRotation = rad(0)
let rule
let ruleLastClickedHourAngle = null
let ruleRotation = rad(0)
let sin = Math.sin
let astrolabe = document.getElementById("astrolabe")
let tan = Math.tan
let tympan

let azimuthalToEquatorial = (A, a) => {
    let h = atan2(sin(A) * cos(a),
        sin(a) * cos(phi) + cos(A) * cos(a) * sin(phi))
    let delta = asin(sin(a) * sin(phi) - cos(A) * cos(a) * cos(phi))
    return [h, delta]
}

let eclipticToEquatorial = (lambda, beta) => {
    let h = rad(270) - atan2(sin(lambda) * cos(beta) * cos(epsilon)
        - sin(beta) * sin(epsilon), cos(lambda) * cos(beta))
    let delta = asin(sin(beta) * cos(epsilon)
        + sin(lambda) * cos(beta) * sin(epsilon))
    return [h, delta]
}

let getClickedHourAngle = (event) => {
    let rect = astrolabe.getBoundingClientRect()
    let x
    let y
    if (event.type === "mousedown") {
        x = event.clientX - rect.x - 300
        y = 300 - event.clientY + rect.y
    } else {
        x = event.touches[0].clientX - rect.x - 300
        y = 300 - event.touches[0].clientY + rect.y
    }
    return atan2(x, y)
}

let mousedownCallback = (event) => {
    reteLastClickedHourAngle = getClickedHourAngle(event)
}

let mousemoveCallback = (event) => {
    if (reteLastClickedHourAngle !== null) {
        let clickedHourAngle = getClickedHourAngle(event)
        reteRotation += clickedHourAngle - reteLastClickedHourAngle
        rete.setAttribute("transform", `rotate(${deg(reteRotation)} 300 300)`)
        reteLastClickedHourAngle = clickedHourAngle
    } else if (ruleLastClickedHourAngle !== null) {
        let clickedHourAngle = getClickedHourAngle(event)
        ruleRotation += clickedHourAngle - ruleLastClickedHourAngle
        rule.setAttribute("transform", `rotate(${deg(ruleRotation)} 300 300)`)
        ruleLastClickedHourAngle = clickedHourAngle
    }
}

let mouseupCallback = (event) => {
    reteLastClickedHourAngle = null
    ruleLastClickedHourAngle = null
}

let plotAlmucantar = (a) => {
    let points = []
    for (let i = 0; i <= 360; i++) {
        let A = rad(i)
        let [h, delta] = azimuthalToEquatorial(A, a)
        let point = stereographic(h, delta)
        points.push(point)
    }
    plotCurve(points, "#00C000", tympan)
}

let plotAstrolabe = () => {
    astrolabe.textContent = ""
    let defs = subElement(astrolabe, "defs", {})
    let clipPath = subElement(defs, "clipPath", {"id": "main-clip-path"})
    subElement(clipPath, "circle", {
        "cx": 300,
        "cy": 300,
        "r": 275.5
    })
    plotMater()
    plotTympan()
    plotRete()
    plotRule()
    let latitudeLabel = document.getElementById("latitude")
    latitudeLabel.textContent = phiDegrees
    if (hemisphere === 1) {
        latitudeLabel.textContent += " N"
    } else {
        latitudeLabel.textContent += " S"
    }
}

let plotAzimuth = (A) => {
    let points = []
    for (let i = 0; i <= 85; i++) {
        let a = rad(i)
        let [h, delta] = azimuthalToEquatorial(A, a)
        let point = stereographic(h, delta)
        points.push(point)
    }
    plotCurve(points, "#00C000", tympan)
}

let plotCurve = (points, color, parent) => {
    let d
    for (let point of points) {
        let [x, y] = point
        if (x > 10000 || x < -10000 || y > 10000 || y < -10000) {
            continue
        }
        if (d === undefined) {
            d = `M ${x} ${y}`
        } else {
            d += ` L ${x} ${y}`
        }
    }
    subElement(parent, "path", {
        "d": d,
        "fill": "none",
        "stroke": color
    })
}

let plotDeclination = (delta) => {
    let points = []
    for (let i = 0; i <= 360; i++) {
        let h = rad(i)
        let point = stereographic(h, delta)
        points.push(point)
    }
    plotCurve(points, "#00C000", tympan)
}

let plotEcliptic = () => {
    let points = []
    for (let i = 0; i <= 360; i++) {
        let lambda = rad(i)
        let [h, delta] = eclipticToEquatorial(lambda, rad(0))
        let point = stereographic(h, delta)
        points.push(point)
    }
    plotCurve(points, "#0000C0", rete)
    // scale
    let r = 196.6042416823921 // radius of the ecliptic
    let cx = 300
    let cy = r + 25
    if (hemisphere === -1) {
        cy = 600 - cy
    }
    for (let i = 0; i < 360; i++) {
        let [h, delta] = eclipticToEquatorial(rad(i), rad(0))
        let [x2, y2] = stereographic(h, delta)
        let angle = atan2(x2 - cx, cy - y2)
        let d
        if (i % 30 === 0) {
            d = r - 25
        } else if (i % 10 === 0) {
            d = r - 15
        } else if (i % 5 === 0) {
            d = r - 10
        } else  {
            d = r - 5
        }
        let x1 = cx + d * sin(angle)
        let y1 = cy - d * cos(angle)
        subElement(rete, "line", {
            "stroke": "#0000C0",
            "x1": x1,
            "x2": x2,
            "y1": y1,
            "y2": y2
        })
        if (i % 10 === 0 && i % 30 !== 0) {
            let text = subElement(rete, "text", {
                "fill": "#0000C0",
                "style": "font-family: sans-serif; font-size: 8pt;",
                "text-anchor": "middle",
                "transform": `rotate(${deg(angle) + 180} ${x1} ${y1})`,
                "x": x1,
                "y": y1
            })
            text.textContent = i % 30
        } else if (i % 30 === 15) {
            let x = cx + (r - 15) * sin(angle)
            let y = cy - (r - 15) * cos(angle)
            let text = subElement(rete, "text", {
                "fill": "#0000C0",
                "style": "font-family: sans-serif; font-size: 8pt;",
                "text-anchor": "middle",
                "transform": `rotate(${deg(angle) + 180} ${x} ${y})`,
                "x": x,
                "y": y
            })
            if (i === 15) {
                text.textContent = "\u2648"
            } else if (i === 45) {
                text.textContent = "\u2649"
            } else if (i === 75) {
                text.textContent = "\u264A"
            } else if (i === 105) {
                text.textContent = "\u264B"
            } else if (i === 135) {
                text.textContent = "\u264C"
            } else if (i === 165) {
                text.textContent = "\u264D"
            } else if (i === 195) {
                text.textContent = "\u264E"
            } else if (i === 225) {
                text.textContent = "\u264F"
            } else if (i === 255) {
                text.textContent = "\u2650"
            } else if (i === 285) {
                text.textContent = "\u2651"
            } else if (i === 315) {
                text.textContent = "\u2652"
            } else if (i === 345) {
                text.textContent = "\u2653"
            }
        }
    }
}

let plotMater = () => {
    mater = subElement(astrolabe, "g", {})
    // outer circle
    subElement(mater, "circle", {
        "cx": 300,
        "cy": 300,
        "fill": "none",
        "r": 300,
        "stroke": "#000000"
    })
    // inner circle
    subElement(mater, "circle", {
        "cx": 300,
        "cy": 300,
        "fill": "none",
        "r": 275,
        "stroke": "#000000"
    })
    // scale
    for (let i = 0; i < 288; i++) {
        let angle = rad(i * 360 / 288)
        let d
        if (i % 12 === 0) {
            d = 290
        } else if (i % 6 === 0) {
            d = 285
        } else {
            d = 280
        }
        let x1 = 300 + 275 * sin(angle)
        let x2 = 300 + d * sin(angle)
        let y1 = 300 - 275 * cos(angle)
        let y2 = 300 - d * cos(angle)
        subElement(mater, "line", {
            "stroke": "#000000",
            "x1": x1,
            "x2": x2,
            "y1": y1,
            "y2": y2
        })
        if (i % 12 === 0) {
            let x = 300 + 290 * sin(angle)
            let y = 300 - 290 * cos(angle)
            let text = subElement(mater, "text", {
                "fill": "#000000",
                "style": "font-family: sans-serif; font-size: 8pt;",
                "text-anchor": "middle",
                "transform": `rotate(${deg(angle)} ${x} ${y})`,
                "x": x,
                "y": y
            })
            text.textContent = i / 12 % 12 === 0 ? 12 : i / 12 % 12
        }
    }
}

let plotRete = () => {
    rete = subElement(astrolabe, "g", {"clip-path": "url(#main-clip-path)"})
    plotStar(rad(358), rad(29), "Alpheratz")
    plotStar(rad(354), rad(-42), "Ankaa")
    plotStar(rad(350), rad(56), "Schedar")
    plotStar(rad(349), rad(-18), "Diphda")
    plotStar(rad(336), rad(-57), "Achernar")
    plotStar(rad(328), rad(23), "Hamal")
    plotStar(rad(316), rad(-40), "Acamar")
    plotStar(rad(315), rad(4), "Menkar")
    plotStar(rad(309), rad(50), "Mirfak")
    plotStar(rad(291), rad(16), "Aldebaran")
    plotStar(rad(282), rad(-8), "Rigel")
    plotStar(rad(281), rad(46), "Capella")
    plotStar(rad(279), rad(6), "Bellatrix")
    plotStar(rad(279), rad(29), "Elnath")
    plotStar(rad(276), rad(-1), "Alnilam")
    plotStar(rad(271), rad(7), "Betelgeuse")
    plotStar(rad(264), rad(-53), "Canopus")
    plotStar(rad(259), rad(-17), "Sirius")
    plotStar(rad(256), rad(-29), "Adhara")
    plotStar(rad(245), rad(5), "Procyon")
    plotStar(rad(244), rad(28), "Pollux")
    plotStar(rad(234), rad(-59), "Avior")
    plotStar(rad(223), rad(-43), "Suhail")
    plotStar(rad(222), rad(-70), "Miaplacidus")
    plotStar(rad(218), rad(-9), "Alphard")
    plotStar(rad(208), rad(12), "Regulus")
    plotStar(rad(194), rad(62), "Dubhe")
    plotStar(rad(183), rad(15), "Denebola")
    plotStar(rad(176), rad(-17), "Gienah")
    plotStar(rad(174), rad(-63), "Acrux")
    plotStar(rad(172), rad(-57), "Gacrux")
    plotStar(rad(167), rad(56), "Alioth")
    plotStar(rad(159), rad(-11), "Spica")
    plotStar(rad(153), rad(49), "Alkaid")
    plotStar(rad(149), rad(-60), "Hadar")
    plotStar(rad(149), rad(-36), "Menkent")
    plotStar(rad(146), rad(19), "Arcturus")
    plotStar(rad(140), rad(-61), "Rigil Kentaurus")
    plotStar(rad(138), rad(-16), "Zubenelgenubi")
    plotStar(rad(137), rad(74), "Kochab")
    plotStar(rad(127), rad(27), "Alphecca")
    plotStar(rad(113), rad(-26), "Antares")
    plotStar(rad(108), rad(-69), "Atria")
    plotStar(rad(103), rad(-16), "Sabik")
    plotStar(rad(97), rad(-37), "Shaula")
    plotStar(rad(96), rad(13), "Rasalhague")
    plotStar(rad(91), rad(51), "Eltanin")
    plotStar(rad(84), rad(-34), "Kaus Australis")
    plotStar(rad(81), rad(39), "Vega")
    plotStar(rad(76), rad(-26), "Nunki")
    plotStar(rad(63), rad(9), "Altair")
    plotStar(rad(54), rad(-57), "Peacock")
    plotStar(rad(50), rad(45), "Deneb")
    plotStar(rad(34), rad(10), "Enif")
    plotStar(rad(28), rad(-47), "Al Na'ir")
    plotStar(rad(16), rad(-30), "Fomalhaut")
    plotStar(rad(14), rad(15), "Markab")
    plotStar(rad(319), rad(89), "Polaris")
    plotEcliptic()
    rete.setAttribute("transform", `rotate(${deg(reteRotation)} 300 300)`)
}

let plotRule = () => {
    rule = subElement(astrolabe, "g", {})
    rule.addEventListener("mousedown", ruleMousedownCallback)
    rule.addEventListener("touchstart", ruleMousedownCallback)
    // shape
    let d = "M 0 300"
    d += " A 25 25 0 0 1 25 275"
    d += " H 300"
    d += " A 27 27 0 0 1 325 300"
    d += " H 600"
    d += " A 25 25 0 0 1 575 325"
    d += " H 300"
    d += " A 25 25 0 0 1 275 300"
    d += " Z"
    subElement(rule, "path", {
        "d": d,
        "fill": "#FFFFFF",
        "fill-opacity": 0.5,
        "stroke": "#C00000"
    })
    // scale
    for (let i = -23; i <= 90; i++) {
        let [x, y] = stereographic(rad(90), rad(hemisphere * i))
        let d
        if (i % 10 === 0) {
            d = 15
        } else if (i % 5 === 0) {
            d = 10
        } else {
            d = 5
        }
        subElement(rule, "line", {
            "stroke": "#C00000",
            "x1": x,
            "x2": x,
            "y1": y,
            "y2": y + d,
        })
        subElement(rule, "line", {
            "stroke": "#C00000",
            "x1": 600 - x,
            "x2": 600 - x,
            "y1": y,
            "y2": y - d,
        })
        if (i % 10 === 0) {
            let text
            text = subElement(rule, "text", {
                "fill": "#C00000",
                "style": "font-family: sans-serif; font-size: 8pt;",
                "text-anchor": "middle",
                "transform": `rotate(180 ${x} ${y + 15})`,
                "x": x,
                "y": y + 15
            })
            text.textContent = i
            text = subElement(rule, "text", {
                "fill": "#C00000",
                "style": "font-family: sans-serif; font-size: 8pt;",
                "text-anchor": "middle",
                "x": 600 - x,
                "y": y - 15
            })
            text.textContent = hemisphere * i
        }
    }
    rule.setAttribute("transform", `rotate(${deg(ruleRotation)} 300 300)`)
}

let plotStar = (sha, delta, name) => {
    // sha = sidereal hour angle
    // Used in navigation. Similar to right ascension but measured in degrees
    // westward instead of eastward.
    let h = sha + rad(270)
    let [x, y] = stereographic(h, delta)
    subElement(rete, "circle", {
        "cx": x,
        "cy": y,
        "fill": "#0000C0",
        "r": 2
    })
    let text = subElement(rete, "text", {
        "fill": "#0000C0",
        "style": "font-family: sans-serif; font-size: 8pt;",
        "text-anchor": "middle",
        "transform": `rotate(${deg(h)} ${x} ${y})`,
        "x": x,
        "y": y
    })
    text.textContent = name
}

let plotTympan = () => {
    tympan = subElement(astrolabe, "g", {"clip-path": "url(#main-clip-path)"})
    plotDeclination(rad(0))
    plotDeclination(rad(hemisphere * 23.5))
    for (let i = 0; i < 360; i += 10) {
        plotAzimuth(rad(i))
    }
    for (let i = 0; i < 90; i += 5) {
        plotAlmucantar(rad(i))
    }
    plotUnequalHours()
}

let plotUnequalHours = () => {
    for (let i = 1; i < 12; i++) {
        let points = []
        for (let j = -23.5; j <= 23.5; j++) {
            let delta = rad(j)
            let h = acos(-tan(delta) * tan(phi))
            if (!isNaN(h)) {
                h += i * (rad(360) - 2 * h) / 12
                let point = stereographic(h, delta)
                points.push(point)
            }
        }
        plotCurve(points, "#00C000", tympan)
    }
}

let ruleMousedownCallback = (event) => {
    ruleLastClickedHourAngle = getClickedHourAngle(event)
    event.stopPropagation()
}

let stereographic = (h, delta) => {
    let r = 180.29790050168543 * tan((rad(90) - hemisphere * delta) / 2)
    let x = 300 + r * sin(h)
    let y = 300 - r * cos(h)
    return [x, y]
}

let subElement = (parent, tag, attributes) => {
    let child = document.createElementNS("http://www.w3.org/2000/svg", tag)
    for (let key in attributes) {
        child.setAttribute(key, attributes[key])
    }
    parent.appendChild(child)
    return child
}

document.getElementById("minus-button").addEventListener("click", () => {
    if (hemisphere === 1 && phiDegrees === 0) {
        hemisphere = -1
        plotAstrolabe()
    } else if (!(hemisphere === -1 && phiDegrees === 90)) {
        phiDegrees -= hemisphere
        phi = rad(hemisphere * phiDegrees)
        plotAstrolabe()
    }
})

document.getElementById("plus-button").addEventListener("click", () => {
    if (hemisphere === -1 && phiDegrees === 0) {
        hemisphere = 1
        plotAstrolabe()
    } else if (!(hemisphere === 1 && phiDegrees === 90)) {
        phiDegrees += hemisphere
        phi = rad(hemisphere * phiDegrees)
        plotAstrolabe()
    }
})

astrolabe.addEventListener("mousedown", mousedownCallback)
astrolabe.addEventListener("touchstart", mousedownCallback)
window.addEventListener("mousemove", mousemoveCallback)
window.addEventListener("touchmove", mousemoveCallback)
window.addEventListener("mouseup", mouseupCallback)
window.addEventListener("touchend", mouseupCallback)
plotAstrolabe()
