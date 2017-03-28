AFRAME.registerComponent('resizable', {
  schema: {
    usePhysics: { default: 'ifavailable' },
    geometryDimensions: { default: []}
  },
  init: function () {
    this.RESIZED_STATE = 'resized';
    this.RESIZE_EVENT = 'resize-start';
    this.UNRESIZE_EVENT = 'resize-end';
    this.resized = false;
    this.resizers = [];

    this.start = this.start.bind(this);
    this.end = this.end.bind(this);
  },
  update: function (oldDat) {

  },
  tick: function() {
    if (!this.resized) { return; }
    var geometry = this.el.getAttribute('geometry');
    var dimensionValues = this.data.geometryDimensions.map((dimension) => {
        return geometry[dimension];
    });
    var handPos = new THREE.Vector3()
        .copy(this.resizers[0].getAttribute('position')),
      otherHandPos = new THREE.Vector3()
        .copy(this.resizers[1].getAttribute('position')),
      currentStretch = handPos.distanceTo(otherHandPos),
      deltaStretch = 1;
    if (this.previousStretch !== null && currentStretch !== 0) {
      deltaStretch = currentStretch / this.previousStretch;
    }
    this.previousStretch = currentStretch;
    dimensionValues = dimensionValues.map((dimensionValue) => {
      return dimensionValue * deltaStretch;
    });
    this.data.geometryDimensions.map((dimension, index) => {
      this.el.setAttribute('geometry', dimension, dimensionValues[index]);
    });
    // force scale update for physics body
    if (this.el.body && this.data.usePhysics !== 'never') {
      var physicsShape = this.el.body.shapes[0];
      if(physicsShape.halfExtents) {
       physicsShape.halfExtents.scale(deltaStretch,
                                      physicsShape.halfExtents);
        physicsShape.updateConvexPolyhedronRepresentation();
    } else {
        if(!this.shapeWarned) {
          console.warn("Unable to resize physics body: unsupported shape");
          this.shapeWarned = true;
        }
        // todo: suport more shapes
      }
      this.el.body.updateBoundingRadius();
    }
  },
  pause: function () {
    this.el.removeEventListener(this.RESIZE_EVENT, this.start);
    this.el.removeEventListener(this.UNRESIZE_EVENT, this.end);
  },
  play: function () {
    this.el.addEventListener(this.RESIZE_EVENT, this.start);
    this.el.addEventListener(this.UNRESIZE_EVENT, this.end);
  },
  start: function(evt) {
    if (this.resized) { return; } //already resizeing
    this.resizers.push(evt.detail.hand, evt.detail.secondHand);
    this.resized = true;
    this.previousStretch = null;
    this.el.addState(this.RESIZED_STATE);
  },
  end: function (evt) {
    if(this.resizers.indexOf(evt.detail.hand) === -1) { return; }
    this.resizers = [];
    this.resized = false;
    this.el.removeState(this.RESIZED_STATE);
  }
});
