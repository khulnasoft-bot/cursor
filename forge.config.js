module.exports = {
    packagerConfig: {
        name: 'Cursor',
        icon: 'assets/icon/icon',
        extraResource: [
            './lsp',
            './resources',
            './tutor',
            './todesktop-runtime-config.json',
        ],
        osxSign: {},
        protocols: [
            {
                name: 'Cursor',
                schemes: ['cursor'],
            },
        ],
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    icon: 'assets/icon/icon.png',
                },
            },
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                mimeType: ['x-scheme-handler/cursor'],
            },
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-webpack',
            config: {
                mainConfig: './webpack.main.config.js',
                devContentSecurityPolicy:
                    "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.posthog.com https://*.cursor.sh; img-src 'self' data: blob: file:; frame-src 'self'; style-src 'self' 'unsafe-inline';",
                renderer: {
                    config: './webpack.renderer.config.js',
                    entryPoints: [
                        {
                            html: './src/index.html',
                            js: './src/index.ts',
                            name: 'main_window',
                            preload: {
                                js: './src/preload.ts',
                            },
                        },
                    ],
                },
            },
        },
    ],
}
