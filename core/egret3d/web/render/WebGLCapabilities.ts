namespace egret3d {
    function parseIncludes(string: string): string {
        const pattern = /#include +<([\w\d.]+)>/g;
        //
        function replace(_match: string, include: string) {
            const replace = (egret3d.ShaderChunk as any)[include];
            if (replace === undefined) {
                throw new Error('Can not resolve #include <' + include + '>');
            }

            return parseIncludes(replace);
        }
        //
        return string.replace(pattern, replace);
    }

    function getWebGLShader(type: number, gl: WebGLRenderingContext, info: gltf.Shader, defines: string): WebGLShader {
        let shader = gl.createShader(type);
        //
        gl.shaderSource(shader, defines + parseIncludes(info.uri!));
        gl.compileShader(shader);
        let parameter = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!parameter) {
            if (confirm("shader compile:" + info.name + " " + type + " error! ->" + gl.getShaderInfoLog(shader) + "\n" + ". did you want see the code?")) {
                gl.deleteShader(shader);
                alert(info.uri);
            }
            return null!;
        }

        return shader!;
    }
    /**
     * extract attributes
     */
    function extractAttributes(gl: WebGLRenderingContext, program: GlProgram) {
        const webglProgram = program.program;
        const totalAttributes = gl.getProgramParameter(webglProgram, gl.ACTIVE_ATTRIBUTES);
        //
        const attributes: WebGLActiveAttribute[] = [];
        for (let i = 0; i < totalAttributes; i++) {
            const attribData = gl.getActiveAttrib(webglProgram, i)!;
            const location = gl.getAttribLocation(webglProgram, attribData.name);
            attributes.push({ name: attribData.name, type: attribData.type, size: attribData.size, location });
        }
        program.attributes = attributes;
    }
    /**
     * extract uniforms
     */
    function extractUniforms(gl: WebGLRenderingContext, program: GlProgram, technique: gltf.Technique) {
        const webglProgram = program.program;
        const totalUniforms = gl.getProgramParameter(webglProgram, gl.ACTIVE_UNIFORMS);
        //
        const contextUniforms: WebGLActiveUniform[] = [];
        const uniforms: WebGLActiveUniform[] = [];
        for (let i = 0; i < totalUniforms; i++) {
            const uniformData = gl.getActiveUniform(webglProgram, i)!;
            const tUniform = technique.uniforms[uniformData.name];
            if (!tUniform) {
                console.error("缺少Uniform定义：" + uniformData.name);
            }
            const location = gl.getUniformLocation(webglProgram, uniformData!.name)!;

            if (tUniform.semantic) {
                contextUniforms.push({ name: uniformData.name, type: uniformData.type, size: uniformData.size, location });
            }
            else {
                uniforms.push({ name: uniformData.name, type: uniformData.type, size: uniformData.size, location });
            }
        }

        program.contextUniforms = contextUniforms;
        program.uniforms = uniforms;
    }
    /**
     * extract texUnits
     */
    function extractTexUnits(program: GlProgram) {
        const activeUniforms: WebGLActiveUniform[] = program.contextUniforms.concat(program.uniforms);
        const samplerArrayKeys: string[] = [];
        const samplerKeys: string[] = [];
        //排序
        for (let uniform of activeUniforms) {
            const key = uniform.name;
            if (uniform.type === gltf.UniformType.SAMPLER_2D || uniform.type === gltf.UniformType.SAMPLER_CUBE) {
                if (key.indexOf("[") > -1) {
                    samplerArrayKeys.push(key);
                }
                else {
                    samplerKeys.push(key);
                }
            }
        }

        let allKeys = samplerKeys.concat(samplerArrayKeys);
        let unitNumber: number = 0;
        for (let uniform of activeUniforms) {
            if (allKeys.indexOf(uniform.name) < 0) {
                continue;
            }

            if (!uniform.textureUnits) {
                uniform.textureUnits = [];
            }
            uniform.textureUnits.length = uniform.size;
            for (let i = 0; i < uniform.size; i++) {
                uniform.textureUnits[i] = unitNumber++;
            }
        }
    }

    /**
     * get max precision
     * @param gl
     * @param precision {string} the expect precision, can be: "highp"|"mediump"|"lowp"
     */
    function getMaxPrecision(gl: WebGLRenderingContext, precision: string = "highp") {
        if (precision === 'highp') {
            if (gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT)!.precision > 0 &&
                gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)!.precision > 0) {
                return 'highp';
            }
            precision = 'mediump';
        }
        if (precision === 'mediump') {
            if (gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.MEDIUM_FLOAT)!.precision > 0 &&
                gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT)!.precision > 0) {
                return 'mediump';
            }
        }
        return 'lowp';
    }

    function getExtension(gl: WebGLRenderingContext, name: string) {
        let browserPrefixes = [
            "",
            "MOZ_",
            "OP_",
            "WEBKIT_"
        ];
        for (let ii = 0; ii < browserPrefixes.length; ++ii) {
            let prefixedName = browserPrefixes[ii] + name;
            let ext = gl.getExtension(prefixedName);
            if (ext) {
                return ext;
            }
        }
        return null;
    }

    function getConstDefines(maxPrecision: string): string {
        let defines = "precision " + maxPrecision + " float; \n";
        defines += "precision " + maxPrecision + " int; \n";
        // defines += '#extension GL_OES_standard_derivatives : enable \n';

        return defines;
    }

    export class WebGLCapabilities extends paper.SingletonComponent {
        public static canvas: HTMLCanvasElement | null = null;
        public static webgl: WebGLRenderingContext | null = null;
        public static commonDefines: string = "";

        public version: number;

        public precision: string = "highp";

        public maxPrecision: string;

        public maxTextures: number;

        public maxVertexTextures: number;

        public maxTextureSize: number;

        public maxCubemapSize: number;

        public maxVertexUniformVectors: number;

        public floatTextures: boolean;

        public anisotropyExt: EXT_texture_filter_anisotropic;

        public shaderTextureLOD: any;

        public maxAnisotropy: number;

        public maxRenderTextureSize: number;
        public standardDerivatives: boolean;
        public s3tc: WEBGL_compressed_texture_s3tc;
        public textureFloat: boolean;
        public textureAnisotropicFilterExtension: EXT_texture_filter_anisotropic;

        public initialize() {
            super.initialize();

            const webgl = WebGLCapabilities.webgl;
            if (!webgl) {
                return;
            }

            this.version = parseFloat(/^WebGL\ ([0-9])/.exec(webgl.getParameter(webgl.VERSION))![1]);

            this.maxPrecision = getMaxPrecision(webgl, this.precision);

            this.maxTextures = webgl.getParameter(webgl.MAX_TEXTURE_IMAGE_UNITS);

            this.maxVertexTextures = webgl.getParameter(webgl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);

            this.maxTextureSize = webgl.getParameter(webgl.MAX_TEXTURE_SIZE);
            this.maxCubemapSize = webgl.getParameter(webgl.MAX_CUBE_MAP_TEXTURE_SIZE);

            this.maxVertexUniformVectors = webgl.getParameter(webgl.MAX_VERTEX_UNIFORM_VECTORS);

            this.floatTextures = !!getExtension(webgl, 'OES_texture_float');

            this.anisotropyExt = getExtension(webgl, 'EXT_texture_filter_anisotropic');

            this.shaderTextureLOD = getExtension(webgl, 'EXT_shader_texture_lod');

            this.maxAnisotropy = (this.anisotropyExt !== null) ? webgl.getParameter(this.anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;

            // use dfdx and dfdy must enable OES_standard_derivatives
            getExtension(webgl, "OES_standard_derivatives");
            // GL_OES_standard_derivatives
            getExtension(webgl, "GL_OES_standard_derivatives");

            //TODO
            WebGLCapabilities.commonDefines = getConstDefines(this.maxPrecision);
        }
    }

    /**
     * @internal
     */
    export class WebGLRenderState extends paper.SingletonComponent {
        private readonly _stateEnables: ReadonlyArray<gltf.EnableState> = [gltf.EnableState.BLEND, gltf.EnableState.CULL_FACE, gltf.EnableState.DEPTH_TEST]; // TODO
        private readonly _programs: { [key: string]: GlProgram } = {};
        private readonly _vsShaders: { [key: string]: WebGLShader } = {};
        private readonly _fsShaders: { [key: string]: WebGLShader } = {};
        private readonly _cacheStateEnable: { [key: string]: boolean | undefined } = {};
        private _cacheProgram: GlProgram | null = null;
        private _cacheState: gltf.States | null = null;

        private _getWebGLProgram(gl: WebGLRenderingContext, vs: gltf.Shader, fs: gltf.Shader, customDefines: string): WebGLProgram {
            let program = gl.createProgram();

            let key = vs.name + customDefines;
            let vertexShader = this._vsShaders[key];
            if (!vertexShader) {
                vertexShader = getWebGLShader(gl.VERTEX_SHADER, gl, vs, WebGLCapabilities.commonDefines + customDefines + ShaderChunk.common_vert_def);
                this._vsShaders[key] = vertexShader;
            }

            key = fs.name + customDefines;
            let fragmentShader = this._fsShaders[key];
            if (!fragmentShader) {
                fragmentShader = getWebGLShader(gl.FRAGMENT_SHADER, gl, fs, WebGLCapabilities.commonDefines + customDefines + ShaderChunk.common_frag_def);
                this._fsShaders[key] = fragmentShader;
            }

            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);

            gl.linkProgram(program);

            let parameter = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!parameter) {
                alert("program compile: " + vs.name + "_" + fs.name + " error! ->" + gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null as any;
            }

            return program!;
        }

        public clearState() {
            for (const key in this._cacheStateEnable) {
                delete this._cacheStateEnable[key];
            }

            this._cacheProgram = null;
            this._cacheState = null;
        }

        public updateState(state: gltf.States | null) {
            if (this._cacheState === state) {
                return;
            }
            this._cacheState = state;

            const webgl = WebGLCapabilities.webgl!;
            const stateEnables = this._stateEnables;
            const cacheStateEnable = this._cacheStateEnable;
            //TODO WebGLKit.draw(context, drawCall.material, drawCall.mesh, drawCall.subMeshIndex, drawType, transform._worldMatrixDeterminant < 0);
            for (const e of stateEnables) {
                const b = state ? state.enable && state.enable.indexOf(e) >= 0 : false;
                if (cacheStateEnable[e] !== b) {
                    cacheStateEnable[e] = b;
                    b ? webgl.enable(e) : webgl.disable(e);
                }
            }
            // Functions.
            if (state) {
                const functions = state.functions;
                if (functions) {
                    for (const fun in functions) {
                        ((webgl as any)[fun] as Function).apply(webgl, functions[fun]);
                    }
                }
            }
        }

        public useProgram(program: GlProgram) {
            if (this._cacheProgram !== program) {
                this._cacheProgram = program;
                WebGLCapabilities.webgl!.useProgram(program.program);

                return true;
            }

            return false;
        }

        public getProgram(material: Material, technique: gltf.Technique, defines: string) {
            const shader = material._shader;
            const extensions = shader.config.extensions!.KHR_techniques_webgl;
            const vertexShader = extensions!.shaders[0];
            const fragShader = extensions!.shaders[1];
            const name = vertexShader.name + "_" + fragShader.name + "_" + defines;//TODO材质标脏可以优化
            const webgl = WebGLCapabilities.webgl!;
            let program = this._programs[name];

            if (!program) {
                const webglProgram = this._getWebGLProgram(webgl, vertexShader, fragShader, defines);
                program = new GlProgram(webglProgram);
                this._programs[name] = program;
                extractAttributes(webgl, program);
                extractUniforms(webgl, program, technique);
                extractTexUnits(program);
            }
            //
            if (technique.program !== program.id) {
                technique.program = program.id;
            }

            return program;
        }

        /**
         * 设置render target与viewport
         * @param target render target
         * 
         */
        public targetAndViewport(viewport: Rectangle, target: BaseRenderTarget | null) {
            const webgl = WebGLCapabilities.webgl!;

            let w: number;
            let h: number;
            if (!target) {
                w = stage.screenViewport.w;
                h = stage.screenViewport.h;
                webgl.bindFramebuffer(webgl.FRAMEBUFFER, null);
            }
            else {
                w = target.width;
                h = target.height;
                target.use();
            }

            webgl.viewport(w * viewport.x, h * viewport.y, w * viewport.w, h * viewport.h);
            webgl.depthRange(0, 1);
        }
        /**
         * 清除缓存
         * @param camera 
         */
        public cleanBuffer(clearOptColor: boolean, clearOptDepath: boolean, clearColor: Color) {
            const webgl = WebGLCapabilities.webgl!;
            if (clearOptColor && clearOptDepath) {
                webgl.depthMask(true);
                webgl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
                webgl.clearDepth(1.0);
                webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT);
            }
            else if (clearOptDepath) {
                webgl.depthMask(true);
                webgl.clearDepth(1.0);
                webgl.clear(webgl.DEPTH_BUFFER_BIT);
            }
            else if (clearOptColor) {
                webgl.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
                webgl.clear(webgl.COLOR_BUFFER_BIT);
            }
        }
    }
}