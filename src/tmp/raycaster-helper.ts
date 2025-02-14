import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  Intersection,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Raycaster,
  SphereGeometry,
  Vector3,
} from 'three'

const _o = new Object3D()
const _v = new Vector3()

class RaycasterHelper extends Object3D {
  raycaster: Raycaster
  hits: Intersection[]

  origin: Mesh<SphereGeometry, MeshBasicMaterial>
  near: Line<BufferGeometry, LineBasicMaterial>
  far: Line<BufferGeometry, LineBasicMaterial>

  nearToFar: Line<BufferGeometry, LineBasicMaterial>
  originToNear: Line<BufferGeometry, LineBasicMaterial>

  hitPoints: InstancedMesh

  colors = {
    near: 0xffffff,
    far: 0xffffff,
    originToNear: 0x333333,
    nearToFar: 0xffffff,
    origin: [0x0eec82, 0xff005b],
  }

  constructor(
    raycaster: Raycaster,
    public numberOfHitsToVisualize = 20
  ) {
    super()
    this.raycaster = raycaster

    this.hits = []

    this.origin = new Mesh(new SphereGeometry(0.04, 32), new MeshBasicMaterial())
    this.origin.name = 'RaycasterHelper_origin'
    this.origin.raycast = () => null

    const size = 0.1
    let geometry = new BufferGeometry()
    // prettier-ignore
    geometry.setAttribute( 'position', new Float32BufferAttribute( [
              - size, size, 0,
              size, size, 0,
              size, - size, 0,
              - size, - size, 0,
              - size, size, 0
          ], 3 ) );

    this.near = new Line(geometry, new LineBasicMaterial())
    this.near.name = 'RaycasterHelper_near'
    this.near.raycast = () => null

    this.far = new Line(geometry, new LineBasicMaterial())
    this.far.name = 'RaycasterHelper_far'
    this.far.raycast = () => null

    this.nearToFar = new Line(new BufferGeometry(), new LineBasicMaterial())
    this.nearToFar.name = 'RaycasterHelper_nearToFar'
    this.nearToFar.raycast = () => null

    this.nearToFar.geometry.setFromPoints([_v, _v])

    this.originToNear = new Line(this.nearToFar.geometry.clone(), new LineBasicMaterial())
    this.originToNear.name = 'RaycasterHelper_originToNear'
    this.originToNear.raycast = () => null

    this.hitPoints = new InstancedMesh(new SphereGeometry(0.04), new MeshBasicMaterial(), this.numberOfHitsToVisualize)
    this.hitPoints.name = 'RaycasterHelper_hits'
    this.hitPoints.raycast = () => null

    this.add(this.nearToFar)
    this.add(this.originToNear)

    this.add(this.near)
    this.add(this.far)

    this.add(this.origin)
    this.add(this.hitPoints)

    this.setColors()
  }

  setColors = (colors?: Partial<typeof this.colors>) => {
    const _colors = {
      ...this.colors,
      ...colors,
    }

    this.near.material.color.set(_colors.near)
    this.far.material.color.set(_colors.far)
    this.nearToFar.material.color.set(_colors.nearToFar)
    this.originToNear.material.color.set(_colors.originToNear)
  }

  update = () => {
    const origin = this.raycaster.ray.origin
    const direction = this.raycaster.ray.direction

    this.origin.position.copy(origin)

    this.near.position.copy(origin).add(direction.clone().multiplyScalar(this.raycaster.near))

    this.far.position.copy(origin).add(direction.clone().multiplyScalar(this.raycaster.far))

    this.far.lookAt(origin)
    this.near.lookAt(origin)

    let pos = this.nearToFar.geometry.getAttribute('position') as BufferAttribute
    pos.set([...this.near.position.toArray(), ...this.far.position.toArray()])
    pos.needsUpdate = true

    pos = this.originToNear.geometry.getAttribute('position') as BufferAttribute
    pos.set([...origin.toArray(), ...this.near.position.toArray()])
    pos.needsUpdate = true

    /**
     * Update hit points visualization
     */
    for (let i = 0; i < this.numberOfHitsToVisualize; i++) {
      const hit = this.hits?.[i]

      if (hit) {
        const { point } = hit
        _o.position.copy(point)
        _o.scale.setScalar(1)
      } else {
        _o.scale.setScalar(0)
      }

      _o.updateMatrix()

      this.hitPoints.setMatrixAt(i, _o.matrix)
    }

    this.hitPoints.instanceMatrix.needsUpdate = true

    /**
     * Update the color of the origin based on wether there are hits.
     */
    this.origin.material.color.set(this.hits.length > 0 ? this.colors.origin[0] : this.colors.origin[1])
  }

  dispose = () => {
    this.origin.geometry.dispose()
    this.origin.material.dispose()
    this.near.geometry.dispose()
    this.near.material.dispose()
    this.far.geometry.dispose()
    this.far.material.dispose()
    this.nearToFar.geometry.dispose()
    this.nearToFar.material.dispose()
    this.originToNear.geometry.dispose()
    this.originToNear.material.dispose()
    this.hitPoints.dispose()
  }
}

export { RaycasterHelper }
