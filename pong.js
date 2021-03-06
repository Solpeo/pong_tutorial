Engine.ready(function () {

    var controlOptions = {
        KEYBOARD: 'keyboard',
        MOUSE: 'mouse'
    };

    var settings = {
        barSize: 20,
        margin: 40,
        paddleHeight: 80,
        ballSize: 20,
        color: 'white',
        stroke: 'transparent',
        ballSpeed: 300,
        paddleSpeed: 100,
        minPaddleSpeed: 5,
        maxPaddleSpeed: 15,
        playerElasticity: 0.5,
        aiElasticity: 0.2,
        multiplayer: false,
        controls: {
            type: controlOptions.MOUSE,
            leftUp: 'W',
            leftDown: 'S',
            rightUp: 'ARROW_UP',
            rightDown: 'ARROW_DOWN',
            mouseY: 0
        }
    };

    var scene = new Engine.Scene();

    var viewport = new Engine.Viewport({
        width: 500,
        height: 500,
        background: 'black',
        id: 'engine'
    });

    var camera = new Engine.Camera({
        lookAt: scene,
        scrollable: false
    });

    viewport.addCamera(camera);

    // Draw Elements

    var layout = new Engine.UI.Layout({
        fill: camera
    });

    scene.appendChild(layout);

    var bars = {

        top: new Engine.UI.Box({
            height: settings.barSize,
            fill: settings.color,
            stroke: settings.stroke,
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

    var ball = new Engine.UI.Box({
        fill: settings.color,
        stroke: settings.stroke,
        width: settings.ballSize,
        height: settings.ballSize
    });

    layout.appendChild(ball);

    // Define game timer
    var game = new Engine.Timer({
        type: Engine.Timer.VSYNC,
        loop: true
    });

    // Collision helper
    function collide(box1, box2){
        return box1.background.bb.overlap(box2.background.bb);
    }

    // Motion

    ball.motion = {
        x: settings.ballSpeed,
        y: settings.ballSpeed / 2
    };

    paddles.left.motion = 0;

    paddles.right.motion = 0;

    function elasticMove(paddle, desiredPosition, elasticity){
        // This function moves the center of the paddle to the desired position
        var desiredTop = desiredPosition - 0.5 * settings.paddleHeight;
        var desiredChange = desiredTop - paddle.top;
        if (desiredChange < settings.minPaddleSpeed) return movePaddle(paddle, desiredTop);
        if (Math.abs(desiredChange) > settings.maxPaddleSpeed)
            desiredChange = (desiredChange > 0) ? settings.maxPaddleSpeed : -settings.maxPaddleSpeed;
        else
            desiredChange = elasticity * desiredChange;

        return movePaddle(paddle, paddle.top + desiredChange);
    }

    function movePaddle(paddle, top){
        // Helper function to move paddle, without going outside the bars
        top = (top + settings.paddleHeight > bars.bottom.top) ? bars.bottom.top - settings.paddleHeight : top;
        top = (top < bars.top.bottom) ? bars.top.bottom : top;

        paddle.setPosition(paddle.left, top);
    }

    game.on('step', function(){

        var dt = this.stepprogress / 1000;

        // Move left paddle
        if(settings.controls.type === controlOptions.KEYBOARD)
            movePaddle(paddles.left, paddles.left.top + Math.round(paddles.left.motion * dt));
        else if (settings.controls.type === controlOptions.MOUSE)
            elasticMove(paddles.left, settings.controls.mouseY, settings.playerElasticity);

        // Move right paddle
        if(settings.controls.type === controlOptions.KEYBOARD && settings.multiplayer)
            movePaddle(paddles.right, paddles.right.top + Math.round(paddles.right.motion * dt));
        else if (!settings.multiplayer)
            if (ball.motion.x > 0) /* Only move if the ball is moving to the right */
                elasticMove(paddles.right, ball.top + 0.5* ball.height, settings.aiElasticity);

        // Move ball
        var left = ball.left + Math.round(ball.motion.x * dt);
        var top = ball.top + Math.round(ball.motion.y * dt);
        ball.setPosition(left, top);

        if(ball.left < 0 || (ball.left + ball.width) > layout.width)
            resetGame();

        if(collide(ball, bars.top))
            ball.motion.y = settings.ballSpeed / 2;
        if(collide(ball, bars.bottom))
            ball.motion.y = -settings.ballSpeed / 2;
        if(collide(ball, paddles.left))
            ball.motion.x = settings.ballSpeed;
        if(collide(ball, paddles.right))
            ball.motion.x = -settings.ballSpeed;

    });

    // Input
    function handleKey (event, key){
        var direction = (event == 'down') ? 1 : -1;
        switch(key){
            case settings.controls.leftUp:
                paddles.left.motion -= direction * settings.paddleSpeed;
                break;
            case settings.controls.leftDown:
                paddles.left.motion += direction * settings.paddleSpeed;
                break;
            case settings.controls.rightUp:
                if(settings.multiplayer)
                    paddles.right.motion -= direction * settings.paddleSpeed;
                break;
            case settings.controls.rightDown:
                if(settings.multiplayer)
                    paddles.right.motion += direction * settings.paddleSpeed;
                break;
        }
    }

    Engine.Input.on('keydown', function(e){
        if(settings.controls.type === controlOptions.KEYBOARD)
            handleKey('down', e.key);
    }).on('keyup', function(e){
        if(settings.controls.type === controlOptions.KEYBOARD)
            handleKey('up', e.key);
    }).on('mousemove', function(e){
        if(settings.controls.type !== controlOptions.MOUSE) return;
        if(e.cameraY > bars.top.bottom && e.cameraY < bars.bottom.top)
            settings.controls.mouseY = e.cameraY;
    });

    // Reset game
    function resetGame(){
        ball.setPosition(layout.width / 2, layout.height / 2);
        ball.motion.x *= -1;
        if(Math.random() > 0.5)
            ball.motion.y *= -1;
    }

    // Start game
    game.play();
    resetGame();

    // Move both paddles to get them in correct starting positions
    movePaddle(paddles.left, 0);
    movePaddle(paddles.right, 0);

});