// ==UserScript==
// @name         PennyDreadful EDHREC Filter
// @namespace    zinnerzPT
// @version      0.16
// @description  Highlights or hides non-legal Penny Dreadful cards in EDHREC
// @author       zinnerzPT
// @match        https://edhrec.com/*
// @grant        none
// @homepageURL  https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter
// @supportURL   https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter/issues
// @downloadURL  https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter/raw/main/PennyDreadfulEDHRECFilter.user.js
// @updateURL    https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter/raw/main/PennyDreadfulEDHRECFilter.user.js
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'pdFilterMode'; // off | hide | highlight
    const DATA_URL = 'https://pennydreadfulmtg.github.io/legal_cards.txt';

    let legalCardSet = new Set();
    let mode = localStorage.getItem(STORAGE_KEY) || 'highlight';

    function normalize(name) {
        return name?.trim();
    }

    function getState(name) {
        if (mode === 'off') return 'show';
        return legalCardSet.has(normalize(name)) ? 'show' : mode;
    }

    function applyState(el, state) {
        el.classList.remove('pd-hidden', 'pd-illegal');

        if (state === 'hide') {
            el.classList.add('pd-hidden');
        } else if (state === 'highlight') {
            el.classList.add('pd-illegal');
        }
    }

    function scan() {
        // Card view
        document.querySelectorAll('[class*="Card_container"]').forEach(card => {
            const nameEl =
                card.querySelector('[class*="Card_name"]') ||
                card.querySelector('[class*="Card_nameUnderCard"]');

            if (!nameEl) return;

            const name = normalize(nameEl.textContent);
            const container = card.parentNode;

            if (container) {
                applyState(container, getState(name));
            }
        });

        // Table view
        document.querySelectorAll('tr').forEach(row => {
            const link = row.querySelector('a');
            if (!link) return;

            const name = normalize(link.textContent);
            applyState(row, getState(name));
        });

        // Text view
        document.querySelectorAll('[class*="TextView_textSection"] a').forEach(link => {
            const name = normalize(link.textContent);
            const container = link.closest('li, div');

            if (container) {
                applyState(container, getState(name));
            }
        });
    }

    function createToggle() {
        const navbar = document.querySelector('.Navbar_buttonContainer__A2QR6.navbar-nav');
        if (!navbar) return;

        if (document.querySelector('#pd-filter-toggle')) return;

        const container = document.createElement('div');
        container.id = 'pd-filter-toggle';
        container.className = 'Navbar_buttonContainer__A2QR6';

        container.innerHTML = `
            <div class="pd-toggle-wrap">
                <span class="pd-toggle-label">PD Filter</span>
                <div class="pd-toggle-group">
                    <button data-mode="off">Off</button>
                    <button data-mode="highlight">Highlight</button>
                    <button data-mode="hide">Hide</button>
                </div>
            </div>
            `;

        const buttons = container.querySelectorAll('button');

        function updateUI() {
            buttons.forEach(btn => {
                if (btn.dataset.mode === mode) {
                    btn.classList.add('pd-active');
                } else {
                    btn.classList.remove('pd-active');
                }
            });
        }

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                mode = btn.dataset.mode;
                localStorage.setItem(STORAGE_KEY, mode);
                updateUI();
                scan();
            });
        });

        updateUI();
        navbar.appendChild(container);
    }

    function observe() {
        const observer = new MutationObserver(() => {
            scan();
            createToggle();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function hookNavigation() {
        const pushState = history.pushState;

        history.pushState = function () {
            pushState.apply(this, arguments);
            window.dispatchEvent(new Event('locationchange'));
        };

        window.addEventListener('popstate', () => {
            window.dispatchEvent(new Event('locationchange'));
        });

        window.addEventListener('locationchange', () => {
            setTimeout(() => {
                scan();
                createToggle();
            }, 300);
        });
    }

    function init(data) {
        legalCardSet = new Set(
            data.split('\n').map(normalize)
        );

        scan();
        createToggle();
        observe();
        hookNavigation();
    }

    fetch(DATA_URL)
        .then(r => r.text())
        .then(init)
        .catch(err => console.error('PD Filter error:', err));

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        .pd-hidden {
            display: none !important;
        }

        .pd-illegal {
            opacity: 0.35;
            filter: grayscale(70%);
            border: 2px solid #ff4d4d !important;
            border-radius: 6px;
        }

        /* Outer wrapper: keeps everything glued together */
        .pd-toggle-wrap {
            display: flex;
            align-items: stretch;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* Label */
        .pd-toggle-label {
            display: flex;
            align-items: center;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.08);
            border-right: 1px solid rgba(255, 255, 255, 0.15);
            line-height: 1;
        }

        /* Container */
        .pd-toggle-group {
            display: flex;
        }

        /* Buttons */
        .pd-toggle-group button {
            background: transparent;
            color: inherit;
            border: none;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
        }

        /* Hover */
        .pd-toggle-group button:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        /* Active state */
        .pd-toggle-group button.pd-active {
            background: rgba(255, 255, 255, 0.15);
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);

})();
