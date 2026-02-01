// ==UserScript==
// @name         PennyDreadful EDHREC Filter
// @namespace    zinnerzPT
// @version      0.15
// @description  Hides non-legal Penny Dreadful cards in EDHREC
// @author       zinnerzPT
// @match        https://edhrec.com/*
// @grant        none
// @homepageURL  https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter
// @supportURL   https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter/issues
// @downloadURL  https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter/raw/main/PennyDreadfulEDHRECFilter.user.js
// @updateURL    https://github.com/zinnerzPT/PennyDreadfulEDHRECFilter/raw/main/PennyDreadfulEDHRECFilter.user.js
// ==/UserScript==

(function() {
    'use strict';

    let legalCardNames;

    // Hides cards in card view
    function hideCardsInCardView(hideCards) {
        const cardWrappers = document.querySelectorAll('[class*="Card_container"]');
        cardWrappers.forEach(cardWrapper => {
            let nameWrapper = cardWrapper.querySelector('[class*="Card_name"]');
            if (!nameWrapper) {
                nameWrapper = cardWrapper.querySelector('[class*="Card_nameUnderCard"]'); // if Names Under Cards option is ticked
            }
            if (nameWrapper) {
                const cardName = nameWrapper.textContent.trim();
                const isLegal = legalCardNames.includes(cardName);
                const shouldHide = hideCards ? !isLegal : false;
                cardWrapper.parentNode.classList.toggle('hidden-card', shouldHide);
            }
        });
    }

    // Hides cards in table view
    function hideCardsInTableView(hideCards) {
        const tableRows = document.querySelectorAll('.TableView_tableBody__fnXV9.edhrec-clipboard-dont-close tr');
        tableRows.forEach(row => {
            const cardNameElement = row.querySelector('.TableView_tableBody__fnXV9.edhrec-clipboard-dont-close a');
            if (cardNameElement) {
                const cardName = cardNameElement.textContent.trim();
                const isLegal = legalCardNames.includes(cardName);
                const shouldHide = hideCards ? !isLegal : false;
                row.classList.toggle('hidden-card', shouldHide);
            }
        });
    }

    // Hides cards in text view
    function hideCardsInTextView(hideCards) {
        const cardSections = document.querySelectorAll('[class*="TextView_textSection"]');
        cardSections.forEach(cardSection => {
            const cardLinks = cardSection.querySelectorAll('a');
            cardLinks.forEach(cardLink => {
                const cardName = cardLink.textContent.trim();
                const isLegal = legalCardNames.includes(cardName);
                const shouldHide = hideCards ? !isLegal : false;
                cardLink.parentNode.parentNode.classList.toggle('hidden-card', shouldHide);
            });
        });
    }

    // Creates and appends the toggle button to the navbar
    function createToggleButton(hideCards) {
        const navbar = document.querySelector('.Navbar_buttonContainer__A2QR6.navbar-nav');
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'Navbar_buttonContainer__A2QR6 toggle-container';
        const toggleButton = document.createElement('div');
        toggleButton.className = 'toggle-button';
        toggleButton.innerHTML = '<span class="toggle-label">PD Filter </span><label class="switch"><input type="checkbox" id="toggleSwitch"><span class="slider"></span></label>';
        const toggleSwitch = toggleButton.querySelector('#toggleSwitch');
        toggleSwitch.checked = hideCards;
        toggleButton.addEventListener('click', function() {
            hideCards = !hideCards;
            localStorage.setItem('hideCardsToggle', hideCards);
            toggleSwitch.checked = hideCards;
            hideCardsInCardView(hideCards);
            hideCardsInTableView(hideCards);
            hideCardsInTextView(hideCards);
        });
        toggleContainer.appendChild(toggleButton);
        navbar.appendChild(toggleContainer);
    }

    const targetUrl = 'https://pennydreadfulmtg.github.io/legal_cards.txt';

    fetch(targetUrl)
        .then(response => response.text())
        .then(data => {
            legalCardNames = data.split('\n').map(name => name.trim());
            let hideCards = localStorage.getItem('hideCardsToggle') === 'true';
            hideCardsInCardView(hideCards);
            hideCardsInTableView(hideCards);
            hideCardsInTextView(hideCards);
            createToggleButton(hideCards);
            window.addEventListener('scroll', function() {
                if (localStorage.getItem('hideCardsToggle') === 'true') {
                    hideCardsInCardView(true);
                    hideCardsInTableView(true);
                    hideCardsInTextView(true);
                }
            });
        })
        .catch(error => console.error('Failed to fetch legal card names:', error));

    // Add the following CSS style for the hidden-card class
    const style = document.createElement('style');
    style.textContent = `
        .hidden-card {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
})();
