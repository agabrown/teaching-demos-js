// @ts-check
/*
 * P5/Processing sketch that illustrates interactively the meaning of the orbital elements that
 * describe the orientation of a binary orbit with respect to the plane of the sky.
 *
 * Anthony Brown Apr 2023 - Apr 2023
 */

const paddingHorizontal = 50;
const paddingVertical = 50;

var longRightwardsArrow = "";
var longLeftwardsArrow = "";
var inclLabel = "Inclination = ";
var ascnodeLabel = "Longitude ascending node = ";
var argperiLabel = "Argument perihelion = ";

var camRotY = 75;
var camRotYMin = -180;
var camRotYMax = 180;
var camRotYStep = 1;

var camRotZ = 160;
var camRotZMin = -180;
var camRotZMax = 180;
var camRotZStep = 1;

var inclination = 0;
var inclinationMin = 0;
var inclinationMax = 180;
var inclinationStep = 1;

var ascendingNode = 0;
var ascendingNodeMin = 0;
var ascendingNodeMax = 360;
var ascendingNodeStep = 1;

var argPerihelion = 0;
var argPerihelionMin = 0;
var argPerihelionMax = 360;
var argPerihelionStep = 1;

var explanationText;
var explain;
var showHelp = false;
var helpVisible = false;
var helpButton;
var showOrientation = true;
var orientationButton;

var guiVisible = true;
var gui;

var rasc, rdesc, xasc, xdesc, yasc, ydesc;
var r, theta, M, f, fp, fpp, xl, ym;
var animateBody = false;
let myfont;

var semimajor = 2;
var eccentricity = 0.6;
var semiminor;
var refPlaneRadius = semimajor * (1 + eccentricity);
const SCALE = 100;
const HELPSIZE = 600;
const IMSIZE = 2 * SCALE * semimajor * (1 + eccentricity);

var ti, E;
var deg2rad;
let neImg;

var sketch = function (p5) {

    p5.preload = function () {
        explanationText = p5.loadStrings("explanation.html");
        neImg = p5.createGraphics(IMSIZE, IMSIZE);
        neImg.textSize(36);
        neImg.background(127, 150);
        neImg.fill(0);
        neImg.push();
        neImg.translate(IMSIZE - 0.1 * IMSIZE, 0.5 * IMSIZE - 36);
        neImg.rotate(p5.PI / 2);
        neImg.text("N", 0, 0);
        neImg.pop();
        neImg.push();
        neImg.translate(0.52 * IMSIZE, 0.1 * IMSIZE);
        neImg.rotate(p5.PI / 2);
        neImg.text("E", 0, 0);
        neImg.pop();
    }

    p5.setup = function () {
        var canvas = p5.createCanvas(900, 900, p5.WEBGL);
        p5.perspective();
        canvas.position(0, 0);
        gui = p5.createGui(this, 'Orbital elements');
        gui.addGlobals('showHelp', 'showOrientation', 'animateBody', 'camRotY', 'camRotZ', 'inclination', 'ascendingNode', 'argPerihelion');
        gui.setPosition(p5.width, paddingVertical);

        explain = p5.createDiv(p5.join(explanationText, " "));
        explain.position(paddingHorizontal, paddingVertical);
        explain.size(HELPSIZE);

        p5.ellipseMode(p5.RADIUS);
        p5.angleMode(p5.RADIANS);

        p5.noFill();
        p5.smooth();
        deg2rad = (x) => (x / 180 * p5.PI);
        semiminor = semimajor * p5.sqrt(1 - eccentricity ** 2);
    }

    p5.draw = function () {
        p5.background(255);

        if (showHelp && !helpVisible) {
            explain = p5.createDiv(p5.join(explanationText, " "));
            explain.position(paddingHorizontal, paddingVertical);
            explain.size(HELPSIZE);
            helpVisible = true;
        } else {
            if (!showHelp) {
                explain.remove();
                helpVisible = false;
            }
        }

        p5.push();

        rightHanded3DtoWEBGL(p5, deg2rad(camRotY), deg2rad(camRotZ));

        p5.push()

        // p, q, -r normal triad vector. With -r towards the observer

        /*
         * Vector q pointing north (increasing declination).
         */
        p5.strokeWeight(1);
        p5.stroke(0);
        p5.line(0, 0, 0, refPlaneRadius * SCALE * 0.8, 0, 0);
        p5.push()
        p5.translate(refPlaneRadius * SCALE * 0.8, 0, 0);
        p5.rotateZ(-p5.HALF_PI);
        p5.cone(SCALE * 0.05, SCALE * 0.1);
        p5.pop();

        /*
         * Vector p pointing east (direction of increasing right ascension).
         */
        p5.line(0, 0, 0, 0, refPlaneRadius * SCALE * 0.8, 0);
        p5.push()
        p5.translate(0, refPlaneRadius * SCALE * 0.8, 0);
        p5.cone(SCALE * 0.05, SCALE * 0.1);
        p5.pop();

        /*
         * Vector -r pointing toward observer.
         */
        p5.line(0, 0, 0, 0, 0, refPlaneRadius * SCALE * 0.7);
        p5.push()
        p5.translate(0, 0, refPlaneRadius * SCALE * 0.7);
        p5.rotateX(p5.HALF_PI);
        p5.cone(SCALE * 0.05, SCALE * 0.1);
        p5.pop();

        // Orbit ellipse with its normal
        p5.noFill();
        p5.stroke(mptab10.get('blue'));
        p5.strokeWeight(3);
        /*
         * NOTE the transformation order: 1) translate, 2) rotate around Z by argPerihelion, 3) rotate around X by inclination, 4) rotate around Z by ascendingNode (reverse from order in adding transformations to the stack).
         */
        p5.rotateZ(deg2rad(ascendingNode));
        p5.rotateX(deg2rad(inclination));
        p5.rotateZ(deg2rad(argPerihelion));
        p5.push();
        p5.translate(-semimajor * eccentricity * SCALE, 0, 0);
        drawEllipse(p5, semimajor, eccentricity, SCALE);
        p5.pop();

        // Normal of orbital plane (along angular momentum vector)
        p5.stroke(mptab10.get('orange'));
        p5.line(0, 0, 0, 0, 0, refPlaneRadius * SCALE * 0.5);
        p5.push()
        p5.translate(0, 0, refPlaneRadius * SCALE * 0.5);
        p5.rotateX(p5.HALF_PI);
        p5.cone(SCALE * 0.05, SCALE * 0.1);
        p5.pop();

        // Draw line segment and point indicatiing perihelion
        p5.stroke(mptab10.get('orange'));
        p5.line(-semimajor * (1 + eccentricity) * SCALE, 0, 0, semimajor * (1 - eccentricity) * SCALE, 0, 0);
        p5.noStroke();
        p5.fill(mptab10.get('orange'));
        p5.circle(semimajor * (1 - eccentricity) * SCALE, 0, 7);

        ti = thiele_innes(p5, deg2rad(inclination), deg2rad(ascendingNode), deg2rad(argPerihelion));

        if (animateBody) {
            p5.push();
            p5.stroke(0);
            M = (p5.millis() / 4000 * p5.TWO_PI) % p5.TWO_PI;
            f = (x) => (x - eccentricity * p5.sin(x) - M);
            fp = (x) => (1 - eccentricity * p5.cos(x));
            fpp = (x) => (eccentricity * p5.sin(x));
            E = modifiedNewtonRaphson(f, fp, fpp, M);
            xl = SCALE * semimajor * (p5.cos(E) - eccentricity);
            ym = SCALE * semiminor * p5.sin(E);
            p5.push();
            p5.translate(xl, ym, 0);
            p5.stroke(mptab10.get("blue"));
            p5.sphere(SCALE * 0.1);
            p5.pop();
            p5.push();
            p5.stroke("black");
            p5.rotateZ(-deg2rad(argPerihelion));
            p5.rotateX(-deg2rad(inclination));
            p5.rotateZ(-deg2rad(ascendingNode));
            p5.translate(ti[0] * xl + ti[2] * ym, ti[1] * xl + ti[3] * ym, 0);
            p5.sphere(SCALE * 0.1);
            p5.pop();
            p5.pop();
        }

        // Draw line of nodes. The points on the ellipse at true anomaly -omega
        // (ascending node) and pi-omega (descending node) form the endpoints.
        if (inclination > 0.0 && inclination < 180.0) {
            rasc = SCALE * semimajor * (1 - eccentricity ** 2) / (1 + eccentricity * p5.cos(-deg2rad(argPerihelion)));
            rdesc = SCALE * semimajor * (1 - eccentricity ** 2) / (1 + eccentricity * p5.cos(p5.PI - deg2rad(argPerihelion)));
            xasc = rasc * p5.cos(-deg2rad(argPerihelion));
            yasc = rasc * p5.sin(-deg2rad(argPerihelion));
            xdesc = rdesc * p5.cos(p5.PI - deg2rad(argPerihelion));
            ydesc = rdesc * p5.sin(p5.PI - deg2rad(argPerihelion));
            p5.stroke(mptab10.get('red'));
            p5.line(xasc, yasc, 0, xdesc, ydesc, 0);
        }

        p5.pop();

        if (inclination > 0.0 && inclination < 180.0) {
            p5.push();
            p5.noFill();
            p5.stroke(0);
            p5.strokeWeight(1);
            // q = Al+Fm, p = Bl+Gm
            p5.applyMatrix(
                ti[0], ti[1], 0, 0,
                ti[2], ti[3], 0, 0,
                0, 0, 0, 0,
                0, 0, 0, 1
            );
            p5.translate(-semimajor * eccentricity * SCALE, 0, 0);
            drawEllipse(p5, semimajor, eccentricity, SCALE);
            p5.pop();
        }

        /* Sky plane (p-q plane of normal triad).
         * Draw this last so that the transparency works correctly (where the intention
         * is to see the orbital ellipse through the plane).
         */
        p5.push();
        p5.noStroke();
        p5.fill(mptab10.get('grey')[0], mptab10.get('grey')[1], mptab10.get('grey')[2], 150);
        if (showOrientation) {
            p5.rotateX(p5.PI);
            p5.texture(neImg);
        }
        p5.plane(2 * SCALE * refPlaneRadius, 2 * SCALE * refPlaneRadius, 50);
        p5.pop();

        //showWorldAxes(p5, SCALE);

        p5.pop();
    }

}

var myp5 = new p5(sketch);

/*
 * Draw an ellipse with the focus at (0,0,0) and perihelion at (a(1-e), 0, 0).
 *
 * Parameters:
 * p - the p5 object
 * a - semimajor axis (au)
 * e - eccentricity
 * s - scaling factor (from au to pixels)
 */
function drawEllipse(p5o, a, e, s) {
    let semimajor = a * s;
    //p5o.ellipse(-semimajor * e, 0, semimajor, semimajor * p5o.sqrt(1 - e * e), 50);
    p5o.ellipse(0, 0, semimajor, semimajor * p5o.sqrt(1 - e * e), 50);
}

/*
 * Calculate the Thiele-Innes parameters for the projection of the binary orbit on the plane of the sky.
 *
 * Parameters:
 * p5o - the p5 object
 * incl - inclination (radians)
 * lonasc - longitude of the ascending node (radians)
 * lonperi - argument of periapsis (radians)
 */
function thiele_innes(p5o, incl, lonasc, lonperi) {
    let a_ti = p5o.cos(lonperi) * p5o.cos(lonasc) - p5o.sin(lonperi) * p5o.sin(lonasc) * p5o.cos(incl);
    let b_ti = p5o.cos(lonperi) * p5o.sin(lonasc) + p5o.sin(lonperi) * p5o.cos(lonasc) * p5o.cos(incl);
    let f_ti = -(
        p5o.sin(lonperi) * p5o.cos(lonasc)
        + p5o.cos(lonperi) * p5o.sin(lonasc) * p5o.cos(incl)
    );
    let g_ti = -(
        p5o.sin(lonperi) * p5o.sin(lonasc)
        - p5o.cos(lonperi) * p5o.cos(lonasc) * p5o.cos(incl)
    );
    return [a_ti, b_ti, f_ti, g_ti];
}