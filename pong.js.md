Getting Started With the Solpeo Framework
=========================================

To show you how to create a game with the Solpeo Framework, we'll show you how to create a Pong game.

    -

Firstly, it makes sense to wrap your game code in an `Engine.ready` handler, to make sure that everything that needs
to be loaded has in fact loaded before you game logic is interpreted.

    Engine.ready(function () {


In our quick example game, we would like to have a couple of options. So let's go ahead and define them. Firstly, you
can choose between mouse and keyboard control, so we need to define the options first.

        var controlOptions = {
            KEYBOARD: 'keyboard',
            MOUSE: 'mouse'
        };

        var settings = {

In Pong there is a top and bottom bar which define the top and bottom of the playing field. Let's make these 20px wide
and define that in the settings. Similarly, we'll define how large several other elements need to be.

            barSize: 20,
            margin: 40,
            paddleHeight: 80,
            ballSpeed: 10,
            ballSize: 20,
            color: 'white',
            stroke: 'transparent',

In the Pong game, both the ball and the paddles will need to be able to move. Let's define some variables here which
will allow us to fine-tune the movement later.

            paddleSpeed: 10,
            minPaddleSpeed: 5,
            maxPaddleSpeed: 15,
            playerElasticity: 0.5,
            aiElasticity: 0.2,

Finally, we'll define some settings for the controls.

            multiplayer: false,
            controls: {
                type: controlOptions.MOUSE,

Keyboard assignments are defined for when you would like to use keyboard for controls.

                leftUp: 'W',
                leftDown: 'S',
                rightUp: 'ARROW_UP',
                rightDown: 'ARROW_DOWN',

We'll use mouseY to store the current position of the mouse cursor when mouse controls are used.

                mouseY: 0
            }
        };

Essentials
----------

    -

The core of any game written using the Solpeo Engine is the `scene` object. It holds all elements which need to be
drawn onto the screen. Furthermore, other elements which have an in-game 'location' may also be placed on the scene,
for example sounds which are location-bound (like the sound a waterfall makes).

        var scene = new Engine.Scene();

To tell the Engine where to display the scene, a viewport is needed. A viewport is simply an area on the screen (usually
a `div` element) where the Engine should draw something. The scene is then rendered by a camera. A single viewport can
contain multiple cameras, which could for example look at different locations of the same scene, or different scenes.

If the width and height are left undefined, the viewport becomes fullscreen.

        var viewport = new Engine.Viewport({
            width: 500,
            height: 500,
            background: 'black',
            id: 'engine'
        });

The camera actually renders the scene.

        var camera = new Engine.Camera({
            lookAt: scene
        });

After adding the camera to the viewport, the engine will actually already run. If you run the current code it would
only display a black screen though. [See here](http://jsfiddle.net/Solpeo/EDaV2/)

        viewport.addCamera(camera);

Draw Elements
-------------

    -

We'll use a layout node to draw the visible elements on, because we would like to anchor the paddles and bars to the
outsides of the camera.

        var layout = window.layout = new Engine.UI.Layout({
            fill: camera
        });

        scene.appendChild(layout);

        var bars = {

            top: new Engine.UI.Box({
                height: settings.barSize,
                fill: settings.color,
                stroke: settings.stroke,

By setting the anchors, the bar will always be the same width as the camera and be connected to the top of the camera.
This happens because 'parent' in this case is 'layout' (we'll add the bars to the layout after defining them), and
'layout' has been set to fill the camera. marginTop is used to leave some space between the top of the layout and the
top of the bar.

                anchors: {
                    'fillwidth': 'parent.fillwidth',
                    'top': 'parent.top'
                },
                marginTop: settings.margin
            }),
            bottom: new Engine.UI.Box({
                height: settings.barSize,
                fill: settings.color,
                stroke: settings.stroke,
                anchors: {
                    'fillwidth': 'parent.fillwidth',
                    'bottom': 'parent.bottom'
                },
                marginBottom: settings.margin
            })

        };

        layout.appendChild(bars.top);
        layout.appendChild(bars.bottom);

The paddles are defined in the same way as the bars, but anchored to the left and right of the layout. We don't need to
set the top right now, because the motion code will handle that.

        var paddles = {

            left: new Engine.UI.Box({
                fill: settings.color,
                stroke: settings.stroke,
                width: settings.barSize,
                height: settings.paddleHeight,
                anchors: {
                    'left': 'parent.left'
                },
                marginLeft: settings.margin
            }),
            right: new Engine.UI.Box({
                fill: settings.color,
                stroke: settings.stroke,
                width: settings.barSize,
                height: settings.paddleHeight,
                anchors: {
                    'right': 'parent.right'
                },
                marginRight: settings.margin
            })

        };

        layout.appendChild(paddles.left);
        layout.appendChild(paddles.right);

Finally, the ball is added, again we don't need to bother with the position now, as the motion code will take care of
it. After drawing the game looks [like this](http://jsfiddle.net/Solpeo/wLbN3/)

        var ball = new Engine.UI.Box({
            fill: settings.color,
            stroke: settings.stroke,
            width: settings.ballSize,
            height: settings.ballSize
        });

        layout.appendChild(ball);

Game Logic
----------

    -

The core of the game is a timer, which will call its 'step' event whenever a new frame is drawn.

        var game = new Engine.Timer({
            type: Engine.Timer.VSYNC,
            loop: true
        });

To make the code a little easier to read, we'll create a quick helper to check if two boxes overlap. `UI.Box` objects
contain a `Geometry.Rectangle` as their `background`. This in turn has a `bb` (bounding box) which indicates it's
current on-scene position. Since we're building a 2D game made of only boxes, if they overlap, they're colliding.

        function collide(box1, box2){
            return box1.background.bb.overlap(box2.background.bb);
        }

In JavaScript we can always add custom keys to object, so let's add the motion keys to the `UI.Box` objects that need
to be able to move. The ball in 2 dimensions, the paddles only in the vertical direction. The motion for the paddles is
used when keyboard control is being used. Then when the key is pressed it will be changed to the speed in that direction
and reset to 0 when the key is released.

        ball.motion = {
            x: settings.ballSpeed,
            y: settings.ballSpeed / 2
        };

        paddles.left.motion = 0;

        paddles.right.motion = 0;

When the game is controlled by the mouse, we should smooth the movement of the paddle a little. This function is also
used for the AI. The AI in this game seems quite unbeatable, to have some fun, you could try to make the game winnable.

        function elasticMove(paddle, desiredPosition, elasticity){
            var desiredTop = desiredPosition - 0.5 * settings.paddleHeight;
            var desiredChange = desiredTop - paddle.top;
            if (desiredChange < settings.minPaddleSpeed) return movePaddle(paddle, desiredTop);
            if (Math.abs(desiredChange) > settings.maxPaddleSpeed)
                desiredChange = (desiredChange > 0) ? settings.maxPaddleSpeed : -settings.maxPaddleSpeed;
            else
                desiredChange = elasticity * desiredChange;

            return movePaddle(paddle, paddle.top + desiredChange);
        }

The movePaddle function checks if the user (or AI) is trying to move the paddle beyond the bars, and positions it
correctly.

        function movePaddle(paddle, top){
            // Helper function to move paddle, without going outside the bars
            top = (top + settings.paddleHeight > bars.bottom.top) ? bars.bottom.top - settings.paddleHeight : top;
            top = (top < bars.top.bottom) ? bars.top.bottom : top;

            paddle.setPosition(paddle.left, top);
        }

The on `step` handler is called on each new frame, in most games it would hold the game loop logic.

        game.on('step', function(){

First move the left paddle, which is always controlled by the user.

            if(settings.controls.type === controlOptions.KEYBOARD)
                movePaddle(paddles.left, paddles.left.top + paddles.left.motion);
            else if (settings.controls.type === controlOptions.MOUSE)
                elasticMove(paddles.left, settings.controls.mouseY, settings.playerElasticity);

Now move the right paddle, which depending on the settings is player controlled or AI controlled. The AI will simply
track the ball using elastic move.

            if(settings.controls.type === controlOptions.KEYBOARD && settings.multiplayer)
                movePaddle(paddles.right, paddles.right.top + paddles.right.motion);
            else if (!settings.multiplayer)
                if (ball.motion.x > 0) /* Only move if the ball is moving to the right */
                    elasticMove(paddles.right, ball.top + 0.5* ball.height, settings.aiElasticity);

The ball is moved each step

            var left = ball.left + ball.motion.x;
            var top = ball.top + ball.motion.y;
            ball.setPosition(left, top);

If the ball goes out of frame, the game is reset

            if(ball.left < 0 || (ball.left + ball.width) > layout.width)
                resetGame();

If the ball collides with either the bars or the paddles, its motion in one of its dimensions is reverted

            if(collide(ball, bars.top) || collide(ball,bars.bottom))
                ball.motion.y = -ball.motion.y;
            if(collide(ball,paddles.left) || collide(ball, paddles.right))
                ball.motion.x = -ball.motion.x;

        });

Handling Keyboard Input
-----------------------

    -

You can handle the 'keydown' by putting an event handler on `Engine.Input`.

        Engine.Input.on('keydown', function(e){
            if(settings.controls.type !== controlOptions.KEYBOARD) return;
            switch(e.key){
                case settings.controls.leftUp:

When the motion is set, the game loop will start moving the paddle

                    paddles.left.motion -= settings.paddleSpeed;
                    break;
                case settings.controls.leftDown:
                    paddles.left.motion += settings.paddleSpeed;
                    break;
                case settings.controls.rightUp:
                    if(settings.multiplayer)
                        paddles.right.motion -= settings.paddleSpeed;
                    break;
                case settings.controls.rightDown:
                    if(settings.multiplayer)
                        paddles.right.motion += settings.paddleSpeed;
                    break;
            }
        }).on('keyup', function(e){
            if(settings.controls.type !== controlOptions.KEYBOARD) return;
            switch(e.key){
                case settings.controls.leftUp:
                    paddles.left.motion += settings.paddleSpeed;
                    break;
                case settings.controls.leftDown:
                    paddles.left.motion -= settings.paddleSpeed;
                    break;
                case settings.controls.rightUp:
                    if(settings.multiplayer)
                        paddles.right.motion += settings.paddleSpeed;
                    break;
                case settings.controls.rightDown:
                    if(settings.multiplayer)
                        paddles.right.motion -= settings.paddleSpeed;
                    break;
            }

For mouse control we should store the position of the mouse when it changes

        }).on('mousemove', function(e){
            if(settings.controls.type !== controlOptions.MOUSE) return;
            settings.controls.mouseY = e.cameraY;
        });


When the ball goes out bounds, the ball should be placed in the middle of the field. It should then go towards the
player who just 'won', and randomly go up or down.

        function resetGame(){
            ball.setPosition(layout.width / 2, layout.height / 2);
            ball.motion.x = -ball.motion.x;
            if(Math.random() > 0.5)
                ball.motion.y = -ball.motion.y;
        }

Since `autoplay` is false on the game timer, we should call its `play` function manually. Let's also call resetGame
to start the game

        game.play();
        resetGame();

Move both paddles to get them in correct starting positions, the 'movePaddle' function will make sure they won't remain
in a position which collides with the top or bottom bars.

        movePaddle(paddles.left, 0);
        movePaddle(paddles.right, 0);

Finally, we need to close the `Engine.ready` handler. You can see the game running
[here](http://jsfiddle.net/Solpeo/FJkAr/). Please do keep in mind that the keyboard controls don't work in jsFiddle,
because jsFiddle captures the keyboard inputs before the Engine can.

    });