// ==UserScript==
// @name         Otomatik Scroll Yöneticisi (Akıllı Hız)
// @namespace    @tanersb
// @version      2.0
// @description  Web sitelerinde otomatik kaydırma. Manuel hız girişi ve butonla artırma entegre edildi.
// @author       @tanersb
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const imzaMetni = "@tanersb";
    const refreshRate = 15;
    const widgetWidth = "50px";

    let scrollInterval = null;
    let currentSpeed = 0;

    const storageVisibleKey = 'tm_autoscroll_visible';
    const storageTopKey = 'tm_autoscroll_top';
    const storageLeftKey = 'tm_autoscroll_left';

    let isPanelVisible = localStorage.getItem(storageVisibleKey) === 'false' ? false : true;
    let savedTop = localStorage.getItem(storageTopKey) || '20%';
    let savedLeft = localStorage.getItem(storageLeftKey) || 'calc(100% - 60px)';

    const style = document.createElement('style');
    style.innerHTML = `
        .tm-hide-spin::-webkit-outer-spin-button,
        .tm-hide-spin::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        .tm-hide-spin {
            -moz-appearance: textfield;
        }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = savedTop;
    container.style.left = savedLeft;
    container.style.width = widgetWidth;
    container.style.zIndex = '2147483647';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.userSelect = 'none';
    container.style.overflow = 'hidden';
    container.style.transition = 'height 0.3s ease';

    const toggleBtn = document.createElement('div');
    toggleBtn.style.width = '100%';
    toggleBtn.style.height = '30px';
    toggleBtn.style.backgroundColor = '#222';
    toggleBtn.style.color = '#fff';
    toggleBtn.style.fontSize = '16px';
    toggleBtn.style.fontWeight = 'bold';
    toggleBtn.style.display = 'flex';
    toggleBtn.style.alignItems = 'center';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.borderBottom = '1px solid #444';
    toggleBtn.title = "Gizle / Göster";
    toggleBtn.innerHTML = isPanelVisible ? '&minus;' : '&#9776;';

    const controlsPanel = document.createElement('div');
    controlsPanel.style.display = isPanelVisible ? 'flex' : 'none';
    controlsPanel.style.flexDirection = 'column';
    controlsPanel.style.alignItems = 'center';
    controlsPanel.style.padding = '5px 0';
    controlsPanel.style.gap = '8px';

    const btnStyle = `
        width: 40px; height: 40px;
        cursor: pointer; border: none; border-radius: 6px;
        background: linear-gradient(145deg, #555, #333);
        color: white; font-weight: bold; font-size: 20px;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.1s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;

    function createBtn(html, title, colorOverride) {
        const btn = document.createElement('div');
        btn.innerHTML = html;
        btn.style.cssText = btnStyle;
        btn.title = title;
        if (colorOverride) btn.style.background = colorOverride;

        btn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            btn.style.transform = 'scale(0.9)';
        });
        btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
        return btn;
    }

    const btnUp = createBtn('&#9650;', 'Yukarı');
    const btnStop = createBtn('&#9632;', 'Durdur', '#d9534f');
    btnStop.style.fontSize = '12px';
    const btnDown = createBtn('&#9660;', 'Aşağı');

    const speedInput = document.createElement('input');
    speedInput.type = "number";
    speedInput.value = "1";
    speedInput.min = "0";
    speedInput.className = "tm-hide-spin";
    speedInput.style.width = "35px";
    speedInput.style.backgroundColor = "transparent";
    speedInput.style.border = "1px solid #555";
    speedInput.style.borderRadius = "4px";
    speedInput.style.color = "#fff";
    speedInput.style.textAlign = "center";
    speedInput.style.fontSize = "14px";
    speedInput.style.fontWeight = "bold";
    speedInput.style.outline = "none";
    
    speedInput.addEventListener('mousedown', (e) => e.stopPropagation());

    const authorSign = document.createElement('div');
    authorSign.innerText = imzaMetni;
    authorSign.style.color = '#666';
    authorSign.style.fontSize = '7px';
    authorSign.style.marginTop = '2px';
    authorSign.style.marginBottom = '2px';

    controlsPanel.appendChild(btnUp);
    controlsPanel.appendChild(btnStop);
    controlsPanel.appendChild(btnDown);
    controlsPanel.appendChild(speedInput);
    controlsPanel.appendChild(authorSign);

    container.appendChild(toggleBtn);
    container.appendChild(controlsPanel);
    document.body.appendChild(container);

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    toggleBtn.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isDragging = true;
            dragOffsetX = e.clientX - container.offsetLeft;
            dragOffsetY = e.clientY - container.offsetTop;
            container.style.opacity = '0.7';
            container.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            container.style.left = (e.clientX - dragOffsetX) + 'px';
            container.style.top = (e.clientY - dragOffsetY) + 'px';
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            container.style.opacity = '1';
            container.style.cursor = 'default';
            localStorage.setItem(storageTopKey, container.style.top);
            localStorage.setItem(storageLeftKey, container.style.left);
        }
    });

    function updateScroll() {
        window.scrollBy(0, currentSpeed);
    }

    function startLoop() {
        if (!scrollInterval) scrollInterval = setInterval(updateScroll, refreshRate);
    }

    function stopLoop() {
        clearInterval(scrollInterval);
        scrollInterval = null;
        currentSpeed = 0;
    }

    let isDragMove = false;
    toggleBtn.addEventListener('mousemove', () => { if(isDragging) isDragMove = true; });
    toggleBtn.addEventListener('mousedown', () => { isDragMove = false; });

    toggleBtn.addEventListener('click', () => {
        if (!isDragMove) {
            isPanelVisible = !isPanelVisible;
            controlsPanel.style.display = isPanelVisible ? 'flex' : 'none';
            toggleBtn.innerHTML = isPanelVisible ? '&minus;' : '&#9776;';
            localStorage.setItem(storageVisibleKey, isPanelVisible);
            if (!isPanelVisible) stopLoop();
        }
    });

    btnUp.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseFloat(speedInput.value);
        if (isNaN(val) || val <= 0) val = 1;

        if (currentSpeed < 0) {
            if (Math.abs(currentSpeed) !== val) {
                currentSpeed = -val;
            } else {
                currentSpeed -= 1;
            }
        } else {
            currentSpeed = -val;
        }
        
        speedInput.value = Math.abs(currentSpeed);
        startLoop();
    });

    btnDown.addEventListener('click', (e) => {
        e.stopPropagation();
        let val = parseFloat(speedInput.value);
        if (isNaN(val) || val <= 0) val = 1;

        if (currentSpeed > 0) {
            if (currentSpeed !== val) {
                currentSpeed = val;
            } else {
                currentSpeed += 1;
            }
        } else {
            currentSpeed = val;
        }

        speedInput.value = Math.abs(currentSpeed);
        startLoop();
    });

    btnStop.addEventListener('click', (e) => {
        e.stopPropagation();
        stopLoop();
    });

})();
