namespace egret3d.oimo {
    const _attributes: gltf.MeshAttributeType[] = [
        gltf.MeshAttributeType.POSITION,
        gltf.MeshAttributeType.COLOR_0,
    ];
    let _material: Material = null!;
    /**
     * 
     */
    export class RayTester extends paper.Behaviour {
        @paper.serializedField
        public distance: number = 10.0;
        @paper.serializedField
        public collisionMask: paper.CullingMask = paper.CullingMask.Everything;

        private _hitted: boolean = false;
        private _mesh: egret3d.Mesh = null!;

        public onStart() {
            const meshFilter = this.gameObject.getOrAddComponent(egret3d.MeshFilter);
            const meshRender = this.gameObject.getOrAddComponent(egret3d.MeshRenderer);

            this._mesh = new egret3d.Mesh(4, 0, _attributes);
            const vertices = this._mesh.getVertices()!;
            const colors = this._mesh.getColors()!;

            vertices[0] = 0.0;
            vertices[1] = 0.0;
            vertices[2] = 0.0;
            vertices[3] = 0.0;
            vertices[4] = 0.0;
            vertices[5] = this.distance;
            vertices[6] = 0.0;
            vertices[7] = 0.0;
            vertices[8] = this.distance;
            vertices[9] = 0.0;
            vertices[10] = 0.0;
            vertices[11] = this.distance;

            for (let i = 0, l = colors.length; i < l; i += 4) {
                colors[i + 0] = 0.0;
                colors[i + 1] = 1.0;
                colors[i + 2] = 0.0;
                colors[i + 3] = 0.7;
            }

            this._mesh.glTFMesh.primitives[0].mode = gltf.MeshPrimitiveMode.Lines;

            if (!_material) {
                _material = new Material(egret3d.DefaultShaders.LINEDASHED);
            }

            meshRender.materials = [_material];
            meshFilter.mesh = this._mesh;
        }

        public onUpdate() {
            const transform = this.gameObject.transform;
            const matrix = transform.getWorldMatrix();
            const from = transform.getPosition();
            const to = egret3d.Vector3.create(this.distance, 0.0, 0.0).applyMatrix(matrix).release();
            const raycastInfo = PhysicsSystem.getInstance().rayCast(from, to, this.collisionMask);

            if (raycastInfo) {
                this._hitted = true;
                const inverseMatrix = matrix.clone().inverse();
                const v = raycastInfo.normal.applyMatrix(inverseMatrix).multiplyScalar(1.0);
                const vertices = this._mesh.getVertices()!;
                const colors = this._mesh.getColors()!;
                inverseMatrix.release();

                vertices[3] = raycastInfo.distance;
                vertices[4] = 0.0;
                vertices[5] = 0.0;
                vertices[6] = raycastInfo.distance;
                vertices[7] = 0.0;
                vertices[8] = 0.0;
                vertices[9] = v.x + raycastInfo.distance;
                vertices[10] = v.y;
                vertices[11] = v.z;

                for (let i = 2 * 4, l = colors.length; i < l; i += 4) {
                    colors[i + 0] = 1.0;
                    colors[i + 1] = 0.0;
                    colors[i + 2] = 0.0;
                    colors[i + 3] = 0.7;
                }

                this._mesh.uploadVertexBuffer();
                raycastInfo.release();
            }
            else if (this._hitted) {
                this._hitted = false;

                const vertices = this._mesh.getVertices();
                const colors = this._mesh.getColors()!;

                vertices[3] = 0.0;
                vertices[4] = 0.0;
                vertices[5] = this.distance;
                vertices[6] = 0.0;
                vertices[7] = 0.0;
                vertices[8] = this.distance;
                vertices[9] = 0.0;
                vertices[10] = 0.0;
                vertices[11] = this.distance;

                for (let i = 2 * 4, l = colors.length; i < l; i += 4) {
                    colors[i + 0] = 0.0;
                    colors[i + 1] = 1.0;
                    colors[i + 2] = 0.0;
                    colors[i + 3] = 0.7;
                }

                this._mesh.uploadVertexBuffer();
            }
        }
    }
}