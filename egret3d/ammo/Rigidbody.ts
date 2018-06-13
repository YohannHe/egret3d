namespace egret3d.ammo {
    /**
     * 
     */
    export class Rigidbody extends CollisionObject {
        @paper.serializedField
        private _mass: number = 1.0;

        @paper.serializedField
        private _friction: number = 0.5;
        @paper.serializedField
        private _rollingFriction: number = 0.0;

        @paper.serializedField
        private _linearDamping: number = 0.0;
        @paper.serializedField
        private _angularDamping: number = 0.0;

        @paper.serializedField
        private _additionalDamping: boolean = false;
        @paper.serializedField
        private _additionalLinearDampingFactor: number = 0.005;
        @paper.serializedField
        private _additionalLinearDampingThresholdSqr: number = 0.01;
        @paper.serializedField
        private _additionalAngularDampingFactor: number = 0.01;
        @paper.serializedField
        private _additionalAngularDampingThresholdSqr: number = 0.01;

        @paper.serializedField
        private _restitution: number = 0.0;
        @paper.serializedField
        private _linearSleepingThreshold: number = 0.8;
        @paper.serializedField
        private _angularSleepingThreshold: number = 1.0;

        @paper.serializedField
        private readonly _linearFactor: Vector3 = Vector3.ONE.clone();
        @paper.serializedField
        private readonly _angularFactor: Vector3 = Vector3.ONE.clone();
        private readonly _localInertia: Vector3 = Vector3.ZERO.clone();
        private _btRigidbody: Ammo.btRigidBody = null as any;

        protected _createCollisionObject() {
            const rigidBodyInfo = new Ammo.btRigidBodyConstructionInfo();
            rigidBodyInfo.m_friction = this._friction;
            rigidBodyInfo.m_rollingFriction = this._rollingFriction;
            rigidBodyInfo.m_linearDamping = this._linearDamping;
            rigidBodyInfo.m_angularDamping = this._angularDamping;
            rigidBodyInfo.m_additionalDamping = this._additionalDamping;
            rigidBodyInfo.m_additionalDampingFactor = this._additionalLinearDampingFactor;
            rigidBodyInfo.m_additionalLinearDampingThresholdSqr = this._additionalLinearDampingThresholdSqr;
            rigidBodyInfo.m_additionalAngularDampingFactor = this._additionalAngularDampingFactor;
            rigidBodyInfo.m_additionalAngularDampingThresholdSqr = this._additionalAngularDampingThresholdSqr;

            const btCollisionObject = new Ammo.btRigidBody(rigidBodyInfo);
            const motionState = new Ammo.btDefaultMotionState(this._getBTTransform()); // TODO 可扩展 的 state。
            btCollisionObject.setMotionState(motionState);
            //
            this._btRigidbody = btCollisionObject as any;

            return btCollisionObject;
        }
        /**
         * @internal
         */
        public _updateMass() {
            const helpVector3A = PhysicsSystem.helpVector3A;

            if (this.isDynamic()) {
                const collisionShape = this.gameObject.getComponent(CollisionShape as any) as CollisionShape;
                collisionShape.btCollisionShape.calculateLocalInertia(this._mass, helpVector3A);
                this._btRigidbody.setMassProps(this._mass, helpVector3A);
            }
            else {
                helpVector3A.setZero();
                this._btRigidbody.setMassProps(this._mass, helpVector3A);
            }
        }
        /**
         * 
         */
        public isDynamic() {
            return (this._collisionFlags & Ammo.CollisionFlags.StaticObject) !== Ammo.CollisionFlags.StaticObject
                && (this._collisionFlags & Ammo.CollisionFlags.KinematicObject) !== Ammo.CollisionFlags.KinematicObject;
        }
        /**
         * 
         */
        public get mass() {
            return this._mass;
        }
        public set mass(value: number) {
            if (this._mass === value) {
                return;
            }

            this._mass = value;

            if (this._btRigidbody) {
                this._updateMass();
            }
        }
        /**
         * 
         */
        public get friction() {
            return this._friction;
        }
        public set friction(value: number) {
            if (this._friction === value) {
                return;
            }

            this._friction = value;

            if (this._btRigidbody) {
                this._btRigidbody.setFriction(this._friction);
            }
        }
        /**
         * 
         */
        public get rollingFriction() {
            return this._rollingFriction;
        }
        public set rollingFriction(value: number) {
            if (this._rollingFriction === value) {
                return;
            }

            this._rollingFriction = value;

            if (this._btRigidbody) {
                this._btRigidbody.setRollingFriction(this._rollingFriction);
            }
        }
        /**
         * 
         */
        public get linearDamping() {
            return this._linearDamping;
        }
        public set linearDamping(value: number) {
            if (this._linearDamping === value) {
                return;
            }

            this._linearDamping = value;

            if (this._btRigidbody) {
                this._btRigidbody.setDamping(this._linearDamping, this._angularDamping);
            }
        }
        /**
         * 
         */
        public get angularDamping() {
            return this._angularDamping;
        }
        public set angularDamping(value: number) {
            if (this._angularDamping === value) {
                return;
            }

            this._angularDamping = value;

            if (this._btRigidbody) {
                this._btRigidbody.setDamping(this._linearDamping, this._angularDamping);
            }
        }
        /**
         * 
         */
        public get additionalDamping() {
            return this._additionalDamping;
        }
        public set additionalDamping(value: boolean) {
            if (this._additionalDamping === value) {
                return;
            }

            this._additionalDamping = value;

            if (this._btRigidbody) {
                // TODO
            }
        }
        /**
         * 
         */
        public get additionalLinearDampingFactor() {
            return this._additionalLinearDampingFactor;
        }
        public set additionalLinearDampingFactor(value: number) {
            if (this._additionalLinearDampingFactor === value) {
                return;
            }

            this._additionalLinearDampingFactor = value;

            if (this._btRigidbody) {
                // TODO
            }
        }
        /**
         * 
         */
        public get additionalLinearDampingThresholdSqr() {
            return this._additionalLinearDampingThresholdSqr;
        }
        public set additionalLinearDampingThresholdSqr(value: number) {
            if (this._additionalLinearDampingThresholdSqr === value) {
                return;
            }

            this._additionalLinearDampingThresholdSqr = value;

            if (this._btRigidbody) {
                // TODO
            }
        }
        /**
         * 
         */
        public get additionalAngularDampingFactor() {
            return this._additionalAngularDampingFactor;
        }
        public set additionalAngularDampingFactor(value: number) {
            if (this._additionalAngularDampingFactor === value) {
                return;
            }

            this._additionalAngularDampingFactor = value;

            if (this._btRigidbody) {
                // TODO
            }
        }
        /**
         * 
         */
        public get additionalAngularDampingThresholdSqr() {
            return this._additionalAngularDampingThresholdSqr;
        }
        public set additionalAngularDampingThresholdSqr(value: number) {
            if (this._additionalAngularDampingThresholdSqr === value) {
                return;
            }

            this._additionalAngularDampingThresholdSqr = value;

            if (this._btRigidbody) {
                // TODO
            }
        }
        /**
         * 
         */
        public get restitution() {
            return this._restitution;
        }
        public set restitution(value: number) {
            if (this._restitution === value) {
                return;
            }

            this._restitution = value;

            if (this._btRigidbody) {
                this._btRigidbody.setRestitution(this._restitution);
            }
        }
        /**
         * 
         */
        public get linearSleepingThreshold() {
            return this._linearSleepingThreshold;
        }
        public set linearSleepingThreshold(value: number) {
            if (this._linearSleepingThreshold === value) {
                return;
            }

            this._linearSleepingThreshold = value;

            if (this._btRigidbody) {
                this._btRigidbody.setSleepingThresholds(this._linearSleepingThreshold, this._angularSleepingThreshold);
            }
        }
        /**
         * 
         */
        public get angularSleepingThreshold() {
            return this._angularSleepingThreshold;
        }
        public set angularSleepingThreshold(value: number) {
            if (this._angularSleepingThreshold === value) {
                return;
            }

            this._angularSleepingThreshold = value;

            if (this._btRigidbody) {
                this._btRigidbody.setSleepingThresholds(this._linearSleepingThreshold, this._angularSleepingThreshold);
            }
        }
        /**
         * 
         */
        public get linearFactor(): Readonly<Vector3> {
            return this._linearFactor;
        }
        public set linearFactor(value: Readonly<Vector3>) {
            this._linearFactor.copy(value);

            if (this._btRigidbody) {
                const helpVector3A = PhysicsSystem.helpVector3A;
                helpVector3A.setValue(this._linearFactor.x, this._linearFactor.y, this._linearFactor.z);
                this._btRigidbody.setLinearFactor(helpVector3A);
            }
        }
        /**
         * 
         */
        public get angularFactor(): Readonly<Vector3> {
            return this._angularFactor;
        }
        public set angularFactor(value: Readonly<Vector3>) {
            this._angularFactor.copy(value);

            if (this._btRigidbody) {
                const helpVector3A = PhysicsSystem.helpVector3A;
                helpVector3A.setValue(this._angularFactor.x, this._angularFactor.y, this._angularFactor.z);
                this._btRigidbody.setAngularFactor(helpVector3A);
            }
        }
        /**
         * 
         */
        public get localInertia(): Readonly<Vector3> {
            // this._btRigidbody.getLocalInertia(); TODO
            return this._localInertia;
        }
        /**
         * 
         */
        public get btRigidbody() {
            return this._btRigidbody;
        }
    }
}
