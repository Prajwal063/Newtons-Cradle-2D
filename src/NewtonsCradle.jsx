import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import './NewtonsCradle.css';

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
    let dragStartMousePosition = null;
    let dragStartBodyPosition = null;
    let isDragging = false;

    const setup = () => {
      const { Engine, Render, Runner, Body, Composite, Constraint, Bodies, MouseConstraint, Mouse, Events } = Matter;

      engine = Engine.create();
      const world = engine.world;

      render = Render.create({
        element: canvasRef.current,
        engine: engine,
        options: {
          width: 800,
          height: 600,
          showVelocity: true,
          background: '#222222',
          wireframes: false,
        }
      });

      Render.run(render);

      runner = Runner.create();
      Runner.run(runner, engine);

      const newtonsCradle = (xx, yy, number, size, length) => {
        const newtonsCradleComposite = Composite.create({ label: 'Newtons Cradle' });

        for (let i = 0; i < number; i++) {
          const separation = 1.9;
          const circle = Bodies.circle(xx + i * (size * separation), yy + length, size, {
            inertia: Infinity,
            restitution: 1,
            friction: 0,
            frictionAir: 0,
            slop: size * 0.02,
            render: {
              fillStyle: '#888888'
            }
          });
          const constraint = Constraint.create({ pointA: { x: xx + i * (size * separation), y: yy }, bodyB: circle });

          Composite.addBody(newtonsCradleComposite, circle);
          Composite.addConstraint(newtonsCradleComposite, constraint);
        }

        return newtonsCradleComposite;
      };

      cradle = newtonsCradle(280, 100, 5, 30, 200);
      Composite.add(world, cradle);
      Body.translate(cradle.bodies[0], { x: -180, y: -100 });

      mouse = Mouse.create(render.canvas);
      mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
          stiffness: 0.1,
          render: {
            visible: false
          }
        }
      });

      Composite.add(world, mouseConstraint);
      render.mouse = mouse;

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

      Render.lookAt(render, {
        min: { x: 0, y: 50 },
        max: { x: 800, y: 600 }
      });

      function calculateVelocity(startPosition, endPosition) {
        const displacementX = endPosition.x - startPosition.x;
        const displacementY = endPosition.y - startPosition.y;
        const time = lastTimestamp ? (Date.now() - lastTimestamp) / 1000 : 0.016;
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
        const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
        const mass = 1;
        const timeStep = 0.016;

        const deltaVelocityX = velocity.x - lastVelocity.x;
        const deltaVelocityY = velocity.y - lastVelocity.y;
        const deltaVelocityMagnitude = Math.sqrt(deltaVelocityX ** 2 + deltaVelocityY ** 2);

        const force = mass * (deltaVelocityMagnitude / timeStep);
        lastVelocity = { x: velocity.x, y: velocity.y };

        return force;
      }
    };

    setup();

    return () => {
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.Composite.clear(engine.world);
      Matter.Engine.clear(engine);
    };
  }, []);

  return (
    <div className="container">
      <div ref={canvasRef} />
      <p>Angle: {angle.toFixed(2)} degrees</p>
      <p>Force: {force.toFixed(2)} N</p>
    </div>
  );
};

export default NewtonsCradle;
