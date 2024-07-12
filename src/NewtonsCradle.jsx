import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

const NewtonsCradle = () => {
  const canvasRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const [force, setForce] = useState(0);

  let lastTimestamp = null;
  let lastVelocity = { x: 0, y: 0 };


  useEffect(() => {
    let engine;
    let render;
    let runner;
    let cradle;
    let mouse;
    let mouseConstraint;
    let lastTimestamp = null;
    let dragStartMousePosition = null;
    let dragStartBodyPosition = null;
    let isDragging = false;

    const setup = () => {
      // Destructure Matter.js components
      const { Engine, Render, Runner, Body, Composite, Constraint, Bodies, MouseConstraint, Mouse, Events } = Matter;

      // Create engine
      engine = Engine.create();
      const world = engine.world;

      // Create renderer
      render = Render.create({
        element: canvasRef.current,
        engine: engine,
        options: {
          width: 800,
          height: 600,
          showVelocity: true
        }
      });

      Render.run(render);

      // Create runner
      runner = Runner.create();
      Runner.run(runner, engine);

      // Define newtonsCradle function
      const newtonsCradle = (xx, yy, number, size, length) => {
        const newtonsCradleComposite = Composite.create({ label: 'Newtons Cradle' });

        for (let i = 0; i < number; i++) {
          const separation = 1.9;
          const circle = Bodies.circle(xx + i * (size * separation), yy + length, size, {
            inertia: Infinity,
            restitution: 1,
            friction: 0,
            frictionAir: 0,
            slop: size * 0.02
          });
          const constraint = Constraint.create({ pointA: { x: xx + i * (size * separation), y: yy }, bodyB: circle });

          Composite.addBody(newtonsCradleComposite, circle);
          Composite.addConstraint(newtonsCradleComposite, constraint);
        }

        return newtonsCradleComposite;
      };

      // Add Newton's Cradle setups
      cradle = newtonsCradle(280, 100, 5, 30, 200);
      Composite.add(world, cradle);
      Body.translate(cradle.bodies[0], { x: -180, y: -100 });

      // Add mouse control
      mouse = Mouse.create(render.canvas);
      mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false
          }
        }
      });

      Composite.add(world, mouseConstraint);
      render.mouse = mouse;

      // Event listeners for drag start and end
      Events.on(mouseConstraint, 'mousedown', (event) => {
        dragStartMousePosition = event.mouse.position;
        dragStartBodyPosition = mouseConstraint.body.position;
        isDragging = true;
      });

      Events.on(mouseConstraint, 'mouseup', (event) => {
        if (isDragging) {
          const dragEndMousePosition = event.mouse.position;
          const velocity = calculateVelocity(dragStartBodyPosition, dragEndMousePosition);
          const newAngle = calculateAngle(velocity);
          const newForce = calculateForce(velocity);

          setAngle(newAngle);
          setForce(newForce);

          isDragging = false;
        }
      });

      // Fit the render viewport to the scene
      Render.lookAt(render, {
        min: { x: 0, y: 50 },
        max: { x: 800, y: 600 }
      });

      function calculateVelocity(startPosition, endPosition) {
        const displacementX = endPosition.x - startPosition.x;
        const displacementY = endPosition.y - startPosition.y;
        const time = lastTimestamp ? (Date.now() - lastTimestamp) / 1000 : 0.016; // default to 60 fps
        lastTimestamp = Date.now();
        return {
          x: displacementX / time,
          y: displacementY / time
        };
      }

      function calculateAngle(velocity) {
        return Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
      }

      function calculateForce(velocity) {
        // Calculate magnitude of velocity vector
        const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
      
        // Assuming each ball has a mass of 1 (for simplicity)
        const mass = 1; // Mass of each ball
      
        // Force calculation using F = m * a
        // Here, acceleration a ≈ (change in velocity) / time
      
        // To get more accurate force, we use the change in momentum
        // Assuming a small time step between lastTimestamp and current time
        const timeStep = 0.016; // Assuming a frame rate of 60 FPS (0.016 seconds per frame)
      
        // Calculate the change in momentum (Δp = m * Δv)
        const deltaVelocityX = velocity.x - lastVelocity.x;
        const deltaVelocityY = velocity.y - lastVelocity.y;
      
        const deltaVelocityMagnitude = Math.sqrt(deltaVelocityX ** 2 + deltaVelocityY ** 2);
      
        // Calculate force using the change in momentum over time
        const force = mass * (deltaVelocityMagnitude / timeStep);
      
        // Update lastVelocity to current velocity for next calculation
        lastVelocity = { x: velocity.x, y: velocity.y };
      
        return force;
      }
    };

    // Setup the Matter.js environment
    setup();

    // Clean up
    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Composite.clear(engine.world);
      Matter.Engine.clear(engine);
    };
  }, []);

  return (
    <div>
      <div ref={canvasRef} />
      <p>Angle: {angle.toFixed(2)} degrees</p>
      <p>Force: {force.toFixed(2)} N</p>
    </div>
  );
};

export default NewtonsCradle;
