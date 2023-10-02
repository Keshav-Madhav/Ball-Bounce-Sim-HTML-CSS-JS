var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var mouseX, mouseY, mouseDownX, mouseDownY, mouseUpX, mouseUpY, mouseDownTime, mouseUpTime;
var radius = 10;
var isMouseDown = false;
var timeDifference = 0;

var RenderCurve = false;
const curveBtn = document.getElementById('curve');
curveBtn.addEventListener('click', () => {
    RenderCurve = !RenderCurve;
    if(RenderCurve) {
        curveBtn.innerHTML = "Hide Curve";
    } else {
        curveBtn.innerHTML = "Show Curve";
    }
});

var BallCollision = true;
const ballCollisionBtn = document.getElementById('ball-collision');
ballCollisionBtn.addEventListener('click', () => {
    BallCollision = !BallCollision;
    if(BallCollision) {
        ballCollisionBtn.innerHTML = "Disable Ball Collision";
    } else {
        ballCollisionBtn.innerHTML = "Enable Ball Collision";
    }
});

function handleStart(event) {
    mouseDownX = event.clientX || event.touches[0].clientX;
    mouseDownY = event.clientY || event.touches[0].clientY;
    mouseDownTime = new Date().getTime();
    isMouseDown = true;
    radius = 10;
}

function handleEnd(event) {
    mouseUpX = event.clientX || event.changedTouches[0].clientX;
    mouseUpY = event.clientY || event.changedTouches[0].clientY;
    mouseUpTime = new Date().getTime();

    var distance = Math.sqrt(Math.pow(mouseUpX - mouseDownX, 2) + Math.pow(mouseUpY - mouseDownY, 2));
    timeDifference = (mouseUpTime - mouseDownTime) / 1000;

    if(timeDifference > 500) {
        radius += timeDifference -500;
    }

    var speed = distance / (timeDifference*15000);

    if(distance < 5) {
        var ball = new Ball(mouseDownX, mouseDownY, 0, 0, radius);
    } else {
        var ball = new Ball(mouseDownX, mouseDownY, (mouseUpX - mouseDownX) * speed, (mouseUpY - mouseDownY) * speed, radius);
    }

    balls.push(ball);

    isMouseDown = false;
}

function handleMove(event) {
    mouseX = event.clientX || event.touches[0].clientX;
    mouseY = event.clientY || event.touches[0].clientY;
}

canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mouseup', handleEnd);
canvas.addEventListener('mousemove', handleMove);

canvas.addEventListener('touchstart', handleStart);
canvas.addEventListener('touchend', handleEnd);
canvas.addEventListener('touchmove', handleMove);

function resizeCanvas() {
    canvas.width = window.innerWidth-10;
    canvas.height = window.innerHeight-5;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Ball {
    constructor(x, y, dx, dy, radius) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.weight = this.radius * 0.1;
        this.gravity = 0.1 * this.weight; 
        this.friction = 0.8;
        this.elasticity = 0.9;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
    }

    update() {
        if(this.x + this.dx > canvas.width-this.radius || this.x + this.dx < this.radius) {
            this.dx = -this.dx * this.elasticity;
        }
        
        if(this.y + this.dy > canvas.height-this.radius) {
            this.dy = -this.dy * this.elasticity; 
            this.dx *= this.friction; 
        } else {
            this.dy += this.gravity; 
        }

        this.x += this.dx;
        this.y += this.dy;
    }
}

var balls = [
    // new Ball(canvas.width / 2, canvas.height - 600, 0, 0, 10),
    // new Ball(canvas.width / 3, canvas.height - 600, 0, 0, 10),
    // new Ball(canvas.width / 4, canvas.height - 600, 0, 0, 10),
];

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the curve
    if(RenderCurve){
        ctx.beginPath();
        ctx.moveTo(0, curve(0));
        for(var x = 1; x <= canvas.width; x++) {
            ctx.lineTo(x, curve(x));
        }
        ctx.strokeStyle = "white";
        ctx.stroke();
    }
    
    for(var i = 0; i < balls.length; i++) {
        balls[i].draw();
        if(RenderCurve) {
            handleCurveCollision(balls[i]);
        }
        balls[i].update();
    }

    if(isMouseDown) {
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, radius, 0, Math.PI*2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.closePath();
        
        timeDifference = (new Date().getTime() - mouseDownTime) / 1000;
        if(timeDifference > 0.5) {
            radius += (timeDifference - 0.5) / 60;
        }
    }

    if(BallCollision) {
        for(var i = 0; i < balls.length; i++) {
            for(var j = i + 1; j < balls.length; j++) {
                var dx = balls[i].x - balls[j].x;
                var dy = balls[i].y - balls[j].y;
                var distance = Math.sqrt(dx * dx + dy * dy);
    
                if(distance < balls[i].radius + balls[j].radius) {
                    collide(balls[i], balls[j]);
                }
            }
        }
    }
    
    requestAnimationFrame(draw);
}

draw();

function curve(x) {
    var a = -0.001;
    var h = canvas.width / 2; 
    var k = canvas.height-40;
    return a * Math.pow(x - h, 2) + k;
}

function curveDerivative(x) {
    var a = -0.001;
    var h = canvas.width / 2; 
    return 2 * a * (x - h);
}

function handleCurveCollision(ball) {
    var curveY = curve(ball.x);
    if(ball.y + ball.radius >= curveY) {
        var slope = curveDerivative(ball.x);
        var angleOfIncidence = Math.atan(slope);

        var velocity = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        var direction = Math.atan2(ball.dy, ball.dx);
        direction = 2 * angleOfIncidence - direction;
        
        var curveFriction = 0.999;

        // Apply the elasticity and friction to the velocity
        ball.dx = velocity * Math.cos(direction) * curveFriction * ball.elasticity;
        ball.dy = velocity * Math.sin(direction) * curveFriction * ball.elasticity;

        ball.y = curveY - ball.radius;
    }
}


function distance(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
}

function collide(ball1, ball2) {
    // Calculate the distance between the balls
    var dx = ball1.x - ball2.x;
    var dy = ball1.y - ball2.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate the angle of the collision
    var angle = Math.atan2(dy, dx);

    // Calculate the components of the velocity of each ball
    var velocity1 = Math.sqrt(ball1.dx * ball1.dx + ball1.dy * ball1.dy);
    var velocity2 = Math.sqrt(ball2.dx * ball2.dx + ball2.dy * ball2.dy);

    // Calculate the direction of each ball
    var direction1 = Math.atan2(ball1.dy, ball1.dx);
    var direction2 = Math.atan2(ball2.dy, ball2.dx);

    // Calculate the new velocity of each ball
    var velocity1x = velocity1 * Math.cos(direction1 - angle);
    var velocity1y = velocity1 * Math.sin(direction1 - angle);
    var velocity2x = velocity2 * Math.cos(direction2 - angle);
    var velocity2y = velocity2 * Math.sin(direction2 - angle);

    // The final velocities after collision are calculated considering the mass and elasticity
    var finalVelocity1x = ((ball1.weight - ball2.weight) * velocity1x + 2 * ball2.weight * velocity2x) / (ball1.weight + ball2.weight) * ball1.elasticity;
    var finalVelocity2x = ((ball2.weight - ball1.weight) * velocity2x + 2 * ball1.weight * velocity1x) / (ball1.weight + ball2.weight) * ball2.elasticity;

    // Convert velocities back to vectors
    ball1.dx = Math.cos(angle) * finalVelocity1x + Math.cos(angle + Math.PI/2) * velocity1y;
    ball1.dy = Math.sin(angle) * finalVelocity1x + Math.sin(angle + Math.PI/2) * velocity1y;
    ball2.dx = Math.cos(angle) * finalVelocity2x + Math.cos(angle + Math.PI/2) * velocity2y;
    ball2.dy = Math.sin(angle) * finalVelocity2x + Math.sin(angle + Math.PI/2) * velocity2y;

    if(distance < ball1.radius + ball2.radius) {
        var overlap = ball1.radius + ball2.radius - distance;
        var angle = Math.atan2(ball2.y - ball1.y, ball2.x - ball1.x);
        ball1.x -= overlap * Math.cos(angle) / 2;
        ball1.y -= overlap * Math.sin(angle) / 2;
        ball2.x += overlap * Math.cos(angle) / 2;
        ball2.y += overlap * Math.sin(angle) / 2;
    }
}
