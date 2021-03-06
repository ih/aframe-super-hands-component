AFRAME.registerComponent('grabbable', {
  schema: {
    usePhysics: { default: 'ifavailable' },
  },
  init: function () {
    this.GRABBED_STATE = 'grabbed';
    this.GRAB_EVENT = 'grab-start';
    this.UNGRAB_EVENT = 'grab-end';
    this.constraint = null;
    this.grabbed = false;

    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  },
  update: function (oldDat) {
    if(this.data.usePhysics === 'never' && this.constraint) {
      this.el.body.world.removeConstraint(this.constraint);
      this.constraint = null;
    }
  },
  tick: function() {
    if(this.grabbed && !this.constraint &&
       this.data.usePhysics !== 'only') {
      // compute based on entire ancestor chain
      let scalingFactor = this.getScalingFactor(this.el);

      if (!scalingFactor) {
        scalingFactor = {x: 1, y: 1, z: 1};
      }
      var handPosition = this.grabber.getAttribute('position'),
          previousPosition = this.previousPosition || handPosition,
        // TODO also handle when scaling factor is 0
        deltaPosition = {
          x: (handPosition.x - previousPosition.x) * 1/scalingFactor.x,
          y: (handPosition.y - previousPosition.y) * 1/scalingFactor.y,
          z: (handPosition.z - previousPosition.z) * 1/scalingFactor.z
        },
        position = this.el.getAttribute('position');

      this.previousPosition = handPosition;
      this.el.setAttribute('position', {
        x: position.x + deltaPosition.x,
        y: position.y + deltaPosition.y,
        z: position.z + deltaPosition.z
      });
    }
  },
  pause: function () {
    this.el.removeEventListener(this.GRAB_EVENT, this.start);
    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
  },
  play: function () {
    this.el.addEventListener(this.GRAB_EVENT, this.start);
    this.el.addEventListener(this.UNGRAB_EVENT, this.end);
  },
  start: function(evt) {
    if (this.grabbed) { return; } //already grabbed
    this.grabber = evt.detail.hand;
    this.grabbed = true;
    this.el.addState(this.GRABBED_STATE);
    if(this.data.usePhysics !== 'never' && this.el.body &&
       this.grabber.body) {
      this.constraint = new window.CANNON
        .LockConstraint(this.el.body, this.grabber.body);
      this.el.body.world.addConstraint(this.constraint);
    } else if(this.data.usePhysics !== 'only') {
      this.previousPosition = null;
    }
  },
  end: function (evt) {
    if(evt.detail.hand !== this.grabber) { return; }
    if(this.constraint) {
      this.el.body.world.removeConstraint(this.constraint);
      this.constraint = null;
    }
    this.grabber = null;
    this.grabbed = false;
    this.el.removeState(this.GRABBED_STATE);
  },
  getScalingFactor: function (element) {
    let scalingFactor = {
      x: 1,
      y: 1,
      z: 1
    };

    while (element.parentEl.getAttribute('scale')) {
      let parentScale = element.parentEl.getAttribute('scale');
      scalingFactor.x *= parentScale.x !== 0 ? parentScale.x : 1;
      scalingFactor.y *= parentScale.y !== 0 ? parentScale.y : 1;
      scalingFactor.z *= parentScale.z !== 0 ? parentScale.z : 1;
      element = element.parentEl;
    }

    return scalingFactor;
  }
});
