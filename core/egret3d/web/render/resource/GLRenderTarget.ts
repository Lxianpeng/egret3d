namespace egret3d {
    export abstract class BaseRenderTarget extends egret3d.Texture {
        /**
         * @internal
         */
        public _texture: WebGLTexture;
        protected _width: number;
        protected _height: number;
        protected _depth: boolean;
        protected _stencil: boolean;
        protected _mipmap: boolean;
        protected _linear: boolean;
        protected _fbo: WebGLFramebuffer;
        protected _renderbuffer: WebGLRenderbuffer;

        public constructor(name: string, width: number, height: number, depth: boolean = false, stencil: boolean = false, mipmap: boolean = false, linear: boolean = false) {
            super(name);
            this._width = width;
            this._height = height;
            this._depth = depth;
            this._stencil = stencil;
            this._mipmap = mipmap;
            this._linear = linear;

            this.uploadTexture();
        }

        protected uploadTexture() {
            const width = this._width;
            const height = this._height;
            const depth = this._depth;
            const stencil = this._stencil;
            const webgl = WebGLCapabilities.webgl;
            this._texture = webgl.createTexture()!;
            this._fbo = webgl.createFramebuffer()!;
            (this._fbo as any)["width"] = width;
            (this._fbo as any)["height"] = height;
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, this._fbo);
            if (depth || stencil) {
                this._renderbuffer = webgl.createRenderbuffer()!;
                webgl.bindRenderbuffer(webgl.RENDERBUFFER, this._renderbuffer);
                if (depth && stencil) {
                    webgl.renderbufferStorage(webgl.RENDERBUFFER, webgl.DEPTH_STENCIL, width, height);
                    webgl.framebufferRenderbuffer(webgl.FRAMEBUFFER, webgl.DEPTH_STENCIL_ATTACHMENT, webgl.RENDERBUFFER, this._renderbuffer);
                } else if (depth) {
                    webgl.renderbufferStorage(webgl.RENDERBUFFER, webgl.DEPTH_COMPONENT16, width, height);
                    webgl.framebufferRenderbuffer(webgl.FRAMEBUFFER, webgl.DEPTH_ATTACHMENT, webgl.RENDERBUFFER, this._renderbuffer);
                } else {
                    webgl.renderbufferStorage(webgl.RENDERBUFFER, webgl.STENCIL_INDEX8, width, height);
                    webgl.framebufferRenderbuffer(webgl.FRAMEBUFFER, webgl.STENCIL_ATTACHMENT, webgl.RENDERBUFFER, this._renderbuffer);
                }
                webgl.bindRenderbuffer(webgl.RENDERBUFFER, null);
            }
        }

        use() {
        }

        generateMipmap(): boolean {
            return false;
        }

        dispose() {
            if (!super.dispose()) {
                return false;
            }
            if (this._texture !== null) {
                const webgl = WebGLCapabilities.webgl;
                webgl.deleteFramebuffer(this._renderbuffer);
                webgl.deleteTexture(this._texture);
                this._renderbuffer = null as any;
                this._texture = null as any;
            }
        }

        caclByteLength() {
            return this.width * this.height * 4;
        }

        public get texture() {
            return this._texture;
        }

        public get width() {
            return this._width;
        }

        public get height() {
            return this._height;
        }
    }

    export class GlRenderTarget extends BaseRenderTarget {
        protected uploadTexture() {
            super.uploadTexture();

            const webgl = WebGLCapabilities.webgl;
            webgl.bindTexture(webgl.TEXTURE_2D, this.texture);
            webgl.pixelStorei(webgl.UNPACK_ALIGNMENT, 4);
            webgl.texImage2D(webgl.TEXTURE_2D, 0, webgl.RGBA, this._width, this._height, 0, webgl.RGBA, webgl.UNSIGNED_BYTE, null);

            if (this._mipmap) {
                webgl.generateMipmap(webgl.TEXTURE_2D);
                if (this._linear) {
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.LINEAR);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR_MIPMAP_LINEAR);
                }
                else {
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST_MIPMAP_NEAREST);
                }
            }
            else {
                if (this._linear) {
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.LINEAR);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);
                }
                else {
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
                    webgl.texParameteri(webgl.TEXTURE_2D, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST);
                }
            }

            webgl.framebufferTexture2D(webgl.FRAMEBUFFER, webgl.COLOR_ATTACHMENT0, webgl.TEXTURE_2D, this.texture, 0);
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);
        }

        use() {
            const webgl = WebGLCapabilities.webgl;
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, this._fbo);
        }

        generateMipmap() {
            if (this._mipmap) {
                const webgl = WebGLCapabilities.webgl;
                webgl.bindTexture(webgl.TEXTURE_2D, this.texture);
                webgl.generateMipmap(webgl.TEXTURE_2D);
                webgl.bindTexture(webgl.TEXTURE_2D, null);
                return true;
            }
            return false;
        }
    }

    export class GlRenderTargetCube extends BaseRenderTarget {
        public activeCubeFace: number = 0; // PX 0, NX 1, PY 2, NY 3, PZ 4, NZ 5

        constructor(name: string, width: number, height: number, depth: boolean = false, stencil: boolean = false) {
            super(name, width, height, depth, stencil);

            const webgl = WebGLCapabilities.webgl;
            webgl.bindTexture(webgl.TEXTURE_CUBE_MAP, this.texture);
            webgl.texParameteri(webgl.TEXTURE_CUBE_MAP, webgl.TEXTURE_MAG_FILTER, webgl.LINEAR);
            webgl.texParameteri(webgl.TEXTURE_CUBE_MAP, webgl.TEXTURE_MIN_FILTER, webgl.LINEAR);

            for (var i = 0; i < 6; i++) {
                webgl.texImage2D(webgl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, webgl.RGBA, width, height, 0, webgl.RGBA, webgl.UNSIGNED_BYTE, null);
            }

            webgl.framebufferTexture2D(webgl.FRAMEBUFFER, webgl.COLOR_ATTACHMENT0, webgl.TEXTURE_CUBE_MAP_POSITIVE_X + this.activeCubeFace, this.texture, 0);
        }

        use() {
            const webgl = WebGLCapabilities.webgl;
            webgl.bindFramebuffer(webgl.FRAMEBUFFER, this._fbo);
            webgl.framebufferTexture2D(webgl.FRAMEBUFFER, webgl.COLOR_ATTACHMENT0, webgl.TEXTURE_CUBE_MAP_POSITIVE_X + this.activeCubeFace, this.texture, 0);
        }
    }
}