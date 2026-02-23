/**
 * Imports
 */

import { defineVersionedConfig } from '@viteplus/versions';

/**
 * Doc config
 */

export default defineVersionedConfig({
    title: 'xMap',
    base: '/xMap/',
    description: 'A library with a sourcemap parser and TypeScript code formatter for the CLI',
    head: [
        [ 'link', { rel: 'icon', type: 'image/png', href: '/xAnsi/xmap.png' }],
        [ 'meta', { name: 'theme-color', content: '#ff7e17' }],
        [ 'script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-1CQH1D9BMD' }],
        [
            'script', {},
            'window.dataLayer = window.dataLayer || [];function gtag(){ dataLayer.push(arguments); }gtag(\'js\', new Date());gtag(\'config\', \'G-1CQH1D9BMD\');'
        ]
    ],
    versionsConfig: {
        current: 'v4.x.x',
        versionSwitcher: false
    },
    themeConfig: {
        logo: '/xmap.png',

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide' },
            { component: 'VersionSwitcher' }
        ],

        sidebar: {
            root: [
                { text: 'Guide', link: '.' },
                { text: 'Parse', link: 'parse' },
                { text: 'Formatter', link: 'formatter' },
                { text: 'Highlighter', link: 'highlighter' },
                { text: 'SourceService', link: 'sourceService' }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/remotex-labs/xMap' },
            { icon: 'npm', link: 'https://www.npmjs.com/package/@remotex-labs/xmap' }
        ],

        docFooter: {
            prev: false,
            next: false
        },
        footer: {
            message: 'Released under the Mozilla Public License 2.0',
            copyright: `Copyright © ${ new Date().getFullYear() } @remotex-labs/xMap Contributors`
        }
    }
});
