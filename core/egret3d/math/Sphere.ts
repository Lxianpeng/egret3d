namespace egret3d {
    /**
     * 
     */
    export class Sphere extends paper.BaseRelease<Sphere> implements paper.ICCS<Sphere>, paper.ISerializable, IRaycast {
        private static readonly _instances: Sphere[] = [];
        /**
         * 
         * @param center 
         * @param radius 
         */
        public static create(center: Readonly<IVector3> = Vector3.ZERO, radius: number = 0.0) {
            if (this._instances.length > 0) {
                const instance = this._instances.pop()!.set(center, radius);
                instance._released = false;
                return instance;
            }

            return new Sphere().set(center, radius);
        }
        /**
         * 球半径。
         */
        public radius: number = 0.0;
        /**
         * 中心坐标。
         */
        public readonly center: Vector3 = Vector3.create();
        /**
         * 请使用 `egret3d.Sphere.create()` 创建实例。
         * @see egret3d.Sphere.create()
         */
        private constructor() {
            super();
        }

        public serialize() {
            return [this.center.x, this.center.y, this.center.z, this.radius];
        }

        public deserialize(value: Readonly<[number, number, number, number]>) {
            this.radius = value[3];
            this.center.fromArray(value);

            return this;
        }

        public clone() {
            return Sphere.create(this.center, this.radius);
        }

        public copy(value: Readonly<Sphere>) {
            return this.set(value.center, value.radius);
        }

        public set(center: Readonly<IVector3>, radius: number) {
            this.radius = radius;
            this.center.copy(center);

            return this;
        }

        public fromPoints(points: Readonly<ArrayLike<IVector3>>, center?: Readonly<IVector3>) {
            if (center) {
                this.center.copy(center);
            }
            else {
                this.center.copy(helpAABBA.fromPoints(points).center);
            }

            let maxRadiusSqrt = 0.0;
            for (let i = 0, l = points.length; i < l; i++) {
                maxRadiusSqrt = Math.max(maxRadiusSqrt, this.center.getDistance(points[i]));
            }

            this.radius = Math.sqrt(maxRadiusSqrt);

            return this;
        }

        public applyMatrix(matrix: Readonly<Matrix4>) {
            this.center.applyMatrix(matrix);
            this.radius = this.radius * matrix.getMaxScaleOnAxis();

            return this;

        }

        public contains(value: Readonly<IVector3 | Sphere>) {
            if (value instanceof Sphere) {
                const radiusDelta = this.radius - value.radius;
                if (radiusDelta >= 0.0) {
                    this.center.getSquaredDistance(value.center) <= (radiusDelta * radiusDelta);
                }

                return false;
            }

            return this.center.getSquaredDistance(value as IVector3) <= this.radius * this.radius;
        }

        public getDistance(value: Readonly<IVector3>) {
            return this.center.getDistance(value) - this.radius;
        }

        public clampPoint(point: Readonly<IVector3>, out: Vector3) {
            const squaredDistance = this.center.getSquaredDistance(point);

            if (squaredDistance > (this.radius * this.radius)) {
                out.subtract(this.center, point).normalize();
                out.multiplyScalar(this.radius).add(this.center);
            }
            else {
                out.copy(point);
            }

            return out;
        }

        public raycast(ray: Readonly<Ray>, raycastInfo?: RaycastInfo) {
            const v1 = helpVector3A.subtract(this.center, ray.origin);
            const tca = v1.dot(ray.direction);
            const d2 = v1.dot(v1) - tca * tca;
            const radius2 = this.radius * this.radius;

            if (d2 > radius2) return false;

            const thc = Math.sqrt(radius2 - d2);

            // t0 = first intersect point - entrance on front of sphere
            const t0 = tca - thc;

            // t1 = second intersect point - exit point on back of sphere
            const t1 = tca + thc;

            // test to see if both t0 and t1 are behind the ray - if so, return null
            if (t0 < 0.0 && t1 < 0.0) return false;

            // test to see if t0 is behind the ray:
            // if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
            // in order to always return an intersect point that is in front of the ray.

            // else t0 is in front of the ray, so return the first collision point scaled by t0

            if (raycastInfo) {
                ray.at(raycastInfo.distance = t0 < 0.0 ? t1 : t0, raycastInfo.position);
            }

            return true;

            // let center_ori = helpVec3_1;
            // Vector3.subtract(center, this.origin, center_ori);
            // let raydist = Vector3.dot(this.direction, center_ori);

            // if (raydist < 0) return false; // 到圆心的向量在方向向量上的投影为负，夹角不在-90与90之间

            // let orilen2 = Vector3.getSqrLength(center_ori);

            // let rad2 = radius * radius;

            // if (orilen2 < rad2) return true; // 射线起点在球里

            // let d = rad2 - (orilen2 - raydist * raydist);
            // if (d < 0) return false;

            // return true;
        }
    }
}