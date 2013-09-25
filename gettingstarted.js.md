Getting Started With the Solpeo Framework
=========================================

    -

Firstly, it makes sense to wrap your game code in an `Engine.ready` handler, to make sure that everything that needs
to be loaded has in fact loaded before you game logic is interpreted.

    Engine.ready(function () {

The core of any game written using the Solpeo Engine is the `scene` object. It holds all elements which need to be
drawn onto the screen. Furthermore, other elements which have an in-game 'location' may also be placed on the scene,
for example sounds which are location-bound (like the sound a waterfall makes).

        var scene = new Engine.Scene();

To tell the Engine where to display the scene, a viewport is needed. A viewport is simply an area on the screen (usually
a `div` element) where the Engine should draw something. The scene is then rendered by a camera. A single viewport can
contain multiple cameras, which could for example look at different locations of the same scene, or different scenes.

Multiple viewports are only necessary when you want to embed multiple areas where the Engine can draw on a single page.

This code will already run (provided you close the `Engine.ready` handler). See
[here](http://jsfiddle.net/Solpeo/HDNfF/1/)

        var viewport = new Engine.Viewport({
            width: 800,
            height: 600,
            background: 'black',
            id: 'engine', // The ID of the div element you wish to render the engine in
            cameras: [
                new Engine.Camera({
                    lookAt: scene
                })
            ]
        });

To add an element to the scene, call `scene.appendChild`. The `Engine.Geometry` namespace contains several basic 2D
shapes that you can use to build the essentials of your game. Here we'll add an `Engine.Geometry.Rectangle`.

Because we would like to be able to rotate it later, we'll wrap it in a transformation node. A transformation node
applies a geometric transformation to all its children. They may also be nested to apply several transformations in
a row.

        scene.appendChild (new Engine.Transform({

In the Engine, if you give children of objects a 'name' parameter, you can then access it from its parent object using
this name. For example here we're adding an `Engine.Transform` object to `scene`, and give it the name `redSquare`. So
now we can access this object using `scene.redSquare`. For example, `scene.redSquare.Rotate(Math.PI / 4)` would rotate
the square by pi/4 radians.

            name: 'redSquare',
            children: [
                new Engine.Geometry.Rectangle({
                    width: 100,
                    height: 100,
                    fill: 'red'
                })
            ]
        }));

If you look at what this code [generates](http://jsfiddle.net/Solpeo/N3vvq/1/), you can see that the camera is centered
on the (0,0) position of the scene, and the top-left corner of the square is at this point. You could center the
Rectangle (as drawn) by calling `scene.redSquare.translate(-50,-50)`.

To make this 'hello world' example slightly more exciting, let's make this rectangle a rotating rectangle. To do this,
we'll use the `rotate` method described earlier. However, as we'd like to animate it, we should create a timer to
rotate our rectangle on each new frame.

        var timer = new Engine.Timer({

Timers in the Solpeo Engine have both loops and steps, to understand the distinction, please see
[this diagram](http://docs.solpeo.com/static/timers1.png). In this case, because the duration is set to 1000
milliseconds, the rectangle will rotate at 1 revolution per second.

            duration: 1000,

There are two types of timer, here we'll use the `VSYNC` type, because we would like to update the position of the
rectangle on each frame being drawn.

            type: Engine.Timer.VSYNC,

By setting `autoplay` to 'true' the timer will start playing right after its creation. If this is set to 'false', it
would only start when `timer.play()` is called.

            autoplay: true,

If `loop` were to be set to false, the rectangle would rotate once, and then stop. See the
[diagram](http://docs.solpeo.com/static/timers1.png) for additional details.

            loop: true,

The timer triggers several events in its operation. Here we will listen to its `step` event to reposition the rectangle
on each step. See the [diagram](http://docs.solpeo.com/static/timers1.png) for additional details.

            on: {
                step: function(){

The timer's `progress` indicates how far it is in its current `loop` iteration. As we've set the duration to 1000
milliseconds, this will give a ratio of how far we are in the 'current' second. This calculation yields a coefficient
we can use to rotate our square

                    var co = this.progress / this.duration;

                    // Apply rotation to the square
                    scene.redSquare.reset().rotate(co * 2 * Math.PI);

                }
            }
        });

Finally, we should close the `Engine.ready` handler. You can find the finished example
[here](http://jsfiddle.net/Solpeo/BpNru/1/).

    }