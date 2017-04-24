// from https://raw.githubusercontent.com/aframevr/aframe/master/examples/showcase/tracked-controls/components/aabb-collider.js
// but has continuous updating of objectsEls so that it works for
// dynamically added entities
AFRAME.registerComponent('aabb-collider', {
  schema: {
    objects: {default: ''},
    state: {default: 'collided'},
    interval: {type: 'number', default: 100}
  },

  init: function () {
    this.els = [];
    this.collisions = [];
    this.elMax = new THREE.Vector3();
    this.elMin = new THREE.Vector3();
  },

  /**
   * Update list of entities to test for collision.
   */
  update: function () {

  },

  tick: (function () {
    var boundingBox = new THREE.Box3();
    return function (time) {
      if ((time - this.lastTime > this.data.interval) || !this.lastTime) {
        var data = this.data;
        var objectEls;

        // Push entities into list of els to intersect.
        if (data.objects) {
          objectEls = this.el.sceneEl.querySelectorAll(data.objects);
        } else {
          // If objects not defined, intersect with everything.
          objectEls = this.el.sceneEl.children;
        }
        // Convert from NodeList to Array
        this.els = Array.prototype.slice.call(objectEls);
        this.lastTime = time;
      }

      var collisions = [];
      var el = this.el;
      var mesh = el.getObject3D('mesh');
      var self = this;
      // No mesh, no collisions
      if (!mesh) { return; }
      // Update the bounding box to account for rotations and
      // position changes.
      updateBoundingBox();
      // Update collisions.
      this.els.forEach(intersect);
      if (this.collisions.length > 0) {
        // console.log(`collisions ${JSON.stringify(this.collisions.map((item) => {return item.tagName;}))}`);
      }
      // Emit events.
      collisions.forEach(handleHit);
      // No collisions.
      // if (collisions.length === 0) { self.el.emit('hit', {el: null}); }
      // Updated the state of the elements that are not intersected anymore.
      this.collisions.filter(function (el) {
        return collisions.indexOf(el) === -1;
      }).forEach(function removeState (el) {
        el.removeState(self.data.state);
      });
      // Store new collisions
      this.collisions = collisions;

      // AABB collision detection
      function intersect (el) {
        var intersected;
        var mesh = el.getObject3D('mesh');
        var elMin;
        var elMax;
        if (!mesh) { return; }
        boundingBox.setFromObject(mesh);
        elMin = boundingBox.min;
        elMax = boundingBox.max;
        // Bounding boxes are always aligned with the world coordinate system.
        // The collision test checks for the conditions where cubes intersect.
        // It's an extension to 3 dimensions of this approach (with the condition negated)
        // https://www.youtube.com/watch?v=ghqD3e37R7E
        intersected = (self.elMin.x <= elMax.x && self.elMax.x >= elMin.x) &&
                      (self.elMin.y <= elMax.y && self.elMax.y >= elMin.y) &&
                      (self.elMin.z <= elMax.z && self.elMax.z >= elMin.z);
        if (!intersected) { return; }
        collisions.push(el);
      }

      function handleHit (hitEl) {
        hitEl.addState(self.data.state);
        self.el.emit('hit', {el: hitEl});
      }

      function updateBoundingBox () {
        boundingBox.setFromObject(mesh);
        self.elMin.copy(boundingBox.min);
        self.elMax.copy(boundingBox.max);
      }
    };
  })()
});
