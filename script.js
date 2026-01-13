// ==UserScript==
// @name         Otomatik Scroll Yöneticisi
// @namespace    @tanersb
// @version      4.0
// @description  Web sitelerinde otomatik kaydırma.
// @author       @tanersb
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const imzaMetni = "@tanersb";
    const baseSpeedMultiplier = 60;
    const widgetWidth = "55px";

    const baslangicGizli = true;
    const DEBUG = false;

    let animationFrameId = null;
    let intervalId = null;
    let countdownIntervalId = null;
    let lastTime = 0;
    let currentSpeed = 0;
    let targetElement = null;
    let mouseX = 0;
    let mouseY = 0;
    let countdownValue = 0;
    let isTimerMode = false;

    const storageVisibleKey = 'tm_autoscroll_visible';
    const storageTopKey = 'tm_autoscroll_top';
    const storageLeftKey = 'tm_autoscroll_left';

    let isPanelVisible;
    if (baslangicGizli) {
        isPanelVisible = false;
    } else {
        isPanelVisible = localStorage.getItem(storageVisibleKey) === 'false' ? false : true;
    }

    let savedTop = localStorage.getItem(storageTopKey) || '20%';
    let savedLeft = localStorage.getItem(storageLeftKey) || 'calc(100% - 70px)';

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const style = document.createElement('style');
    style.innerHTML = `
        .tm-hide-spin::-webkit-outer-spin-button,
        .tm-hide-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .tm-hide-spin { -moz-appearance: textfield; }
        .tm-btn-hover:active { transform: scale(0.95); }
        .tm-smooth-override { scroll-behavior: auto !important; }

        .tm-controls-panel {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .tm-panel-open {
            max-height: 450px;
            opacity: 1;
            transform: translateY(0) scale(1);
            padding-top: 8px !important;
            padding-bottom: 8px !important;
        }

        .tm-toggle-btn {
            width: 100%;
            height: 28px;
            background-color: transparent;
            color: #aaa;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 14px;
            border-bottom: 1px solid transparent;
        }
        .tm-toggle-btn:hover {
            color: #fff;
            background-color: rgba(255,255,255,0.05);
        }
        .tm-container-open .tm-toggle-btn {
            border-radius: 14px 14px 0 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .tm-toggle-icon {
             display: inline-block;
             font-size: 20px;
             line-height: 1;
             transition: transform 0.15s ease-out;
        }
        .tm-toggle-btn:active .tm-toggle-icon {
             transform: scale(0.8);
             color: #fff;
        }

        /* Yeni Timer Butonları İçin Stil */
        .tm-timer-btn-container {
            display: flex;
            flex-direction: row;
            gap: 4px;
            width: 100%;
            justify-content: center;
            margin-top: 4px; /* Üstteki butonlarla arayı aç */
        }

        .tm-timer-btn {
            width: 24px;
            height: 24px;
            cursor: pointer;
            border: none;
            border-radius: 8px; /* Daha yuvarlak köşeler */
            background: linear-gradient(145deg, #444, #2a2a2a);
            color: #fb8c00; /* Turuncu renk */
            font-weight: bold;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1);
            border: 1px solid #553300;
            pointer-events: auto;
            transition: all 0.1s ease;
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
    container.style.backgroundColor = 'rgba(20, 20, 20, 0.92)';
    container.style.borderRadius = '14px';
    container.style.boxShadow = '0 8px 25px rgba(0,0,0,0.7)';
    container.style.fontFamily = 'Consolas, monospace';
    container.style.userSelect = 'none';
    container.style.backdropFilter = 'blur(6px)';
    container.style.pointerEvents = 'auto';
    container.style.transition = 'box-shadow 0.3s ease';

    if (isPanelVisible) {
        container.classList.add('tm-container-open');
    }

    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'tm-toggle-btn';

    const iconOpen = '<span class="tm-toggle-icon">&#65123;</span>';
    const iconClosed = '<span class="tm-toggle-icon">&#9776;</span>';
    toggleBtn.innerHTML = isPanelVisible ? iconOpen : iconClosed;

    const controlsPanel = document.createElement('div');
    controlsPanel.className = 'tm-controls-panel' + (isPanelVisible ? ' tm-panel-open' : '');

    const btnStyle = `
        width: 42px; height: 38px;
        cursor: pointer; border: none; border-radius: 10px;
        background: linear-gradient(145deg, #3a3a3a, #222);
        color: #eee; font-weight: bold; font-size: 18px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 5px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1);
        border: 1px solid #444;
        pointer-events: auto;
        transition: all 0.1s ease;
    `;

    function createBtn(html, title, colorOverride, styleOverride) {
        const btn = document.createElement('div');
        btn.innerHTML = html;
        btn.style.cssText = styleOverride || btnStyle;
        btn.className = "tm-btn-hover";
        if (!styleOverride) btn.className += " tm-standard-btn"; // CSS sınıfı için işaretle
        btn.title = title;
        if (colorOverride) {
            btn.style.background = colorOverride;
            btn.style.boxShadow = '0 3px 5px rgba(200,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)';
            btn.style.border = '1px solid #a00';
        }
        return btn;
    }

    const btnUp = createBtn('&#9650;', 'Sürekli Yukarı');
    const btnStop = createBtn('&#9632;', 'Durdur', 'linear-gradient(145deg, #d32f2f, #9a0007)');
    btnStop.style.fontSize = '16px';
    const btnDown = createBtn('&#9660;', 'Sürekli Aşağı');


    const timerBtnContainer = document.createElement('div');
    timerBtnContainer.className = 'tm-timer-btn-container';


    const btnTimerUp = createBtn('&#9650;', 'Süreli Yukarı (Timer)', null, ' ');
    btnTimerUp.className = 'tm-timer-btn tm-btn-hover';
    const btnTimerDown = createBtn('&#9660;', 'Süreli Aşağı (Timer)', null, ' ');
    btnTimerDown.className = 'tm-timer-btn tm-btn-hover';

    timerBtnContainer.appendChild(btnTimerUp);
    timerBtnContainer.appendChild(btnTimerDown);


    const speedInput = document.createElement('input');
    speedInput.type = "number";
    speedInput.value = "5"; // Varsayılan timer süresi 5sn
    speedInput.min = "1";
    speedInput.className = "tm-hide-spin";
    speedInput.style.width = "42px";
    speedInput.style.padding = "4px 0";
    speedInput.style.backgroundColor = "#111";
    speedInput.style.border = "1px solid #333";
    speedInput.style.borderRadius = "6px";
    speedInput.style.color = "#0f0";
    speedInput.style.textAlign = "center";
    speedInput.style.fontSize = "13px";
    speedInput.style.fontWeight = "bold";
    speedInput.style.outline = "none";
    speedInput.style.boxShadow = "inset 0 2px 3px rgba(0,0,0,0.5)";
    speedInput.style.marginTop = "4px"; // Timer butonlarıyla arayı aç
    speedInput.addEventListener('mousedown', (e) => e.stopPropagation());

    const authorSign = document.createElement('div');
    authorSign.innerText = imzaMetni;
    authorSign.style.color = '#444';
    authorSign.style.fontSize = '8px';
    authorSign.style.marginTop = '4px';
    authorSign.style.letterSpacing = '1px';

    let debugInfo = null;
    if (DEBUG) {
        debugInfo = document.createElement('div');
        debugInfo.style.fontSize = '8px';
        debugInfo.style.color = '#00ff00';
        debugInfo.style.marginTop = '2px';
        debugInfo.style.marginBottom = '4px';
        debugInfo.style.textAlign = 'left';
        debugInfo.style.width = '90%';
        debugInfo.style.padding = '4px';
        debugInfo.style.backgroundColor = 'rgba(0,255,0,0.05)';
        debugInfo.style.borderRadius = '4px';
        debugInfo.style.lineHeight = '1.3';
        debugInfo.style.whiteSpace = 'pre';
        debugInfo.innerText = "RDY";
        controlsPanel.appendChild(debugInfo);
    }

    controlsPanel.appendChild(btnUp);
    controlsPanel.appendChild(btnStop);
    controlsPanel.appendChild(btnDown);
    controlsPanel.appendChild(timerBtnContainer);
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
            container.style.transform = 'scale(0.98)';
            container.style.boxShadow = '0 4px 15px rgba(0,0,0,0.9)';
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
            container.style.transform = 'scale(1)';
            container.style.boxShadow = '0 8px 25px rgba(0,0,0,0.7)';
            container.style.cursor = 'default';
            localStorage.setItem(storageTopKey, container.style.top);
            localStorage.setItem(storageLeftKey, container.style.left);
        }
    });

    document.addEventListener('mousedown', (e) => {
        if (container.contains(e.target)) return;

        let el = e.target;
        let foundScrollable = false;

        while (el && el !== document.body && el !== document.documentElement) {
            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY;
            const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && (el.scrollHeight > el.clientHeight);

            if (isScrollable) {
                targetElement = el;
                foundScrollable = true;
                break;
            }
            el = el.parentElement;
        }

        if (!foundScrollable) {
            targetElement = window;
        }

        updateDebugDisplay();

    }, { passive: true });

    function findScrollTarget() {
        if (targetElement) return targetElement;

        let bestEl = window;
        let maxArea = 0;
        const elements = document.querySelectorAll('div, section, main, ul');
        let limit = 0;

        for (let el of elements) {
            limit++;
            if (limit > 800) break;
            if (el.clientHeight < 50 || el.clientWidth < 50) continue;

            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY;
            const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && (el.scrollHeight > el.clientHeight);

            if (isScrollable) {
                const rect = el.getBoundingClientRect();
                const area = rect.width * rect.height;
                if (rect.height > 300 && rect.top < window.innerHeight && rect.left < window.innerWidth) {
                     if (area > maxArea) {
                         maxArea = area;
                         bestEl = el;
                     }
                }
            }
        }
        return bestEl;
    }

    function updateDebugDisplay() {
        if (!DEBUG || !debugInfo) return;

        let el = targetElement || window;
        let sTop = 0;
        let tagName = "NONE";
        let color = "#ff3333";

        if (el === window) {
            sTop = window.scrollY;
            tagName = "WIN";
            color = "#00ff00";
        } else if (el) {
            sTop = el.scrollTop;
            tagName = el.tagName || "DIV";
            color = "#00ffff";
            if (el.className && typeof el.className === 'string') {
                let cls = el.className.split(' ')[0];
                if(cls.length > 8) cls = cls.substring(0,8) + "..";
                tagName += "." + cls;
            }
        }

        let modeText = `SPD:${Math.abs(currentSpeed)}`;
        if (isTimerMode) {
            modeText = `TMR:${countdownValue}s`;
            color = "#fb8c00";
        }

        debugInfo.innerHTML =
            `<span style='color:${color};font-weight:bold'>${tagName}</span>\n` +
            `scroll:${Math.floor(sTop)}\n` +
            `X:${mouseX} | Y:${mouseY}\n` +
            modeText;
    }

    function step(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (!targetElement) targetElement = findScrollTarget();

        if (targetElement && targetElement !== window) {
             if(targetElement.style.scrollBehavior !== 'auto') targetElement.style.scrollBehavior = 'auto';
        } else if (targetElement === window) {
             if(document.documentElement.style.scrollBehavior !== 'auto') document.documentElement.style.scrollBehavior = 'auto';
        }

        if (targetElement) {
            const movePixels = (currentSpeed * baseSpeedMultiplier) * (deltaTime / 1200);
            if (targetElement === window) {
                window.scrollBy(0, movePixels);
            } else {
                targetElement.scrollBy(0, movePixels);
            }
        }
        updateDebugDisplay();

        if (currentSpeed !== 0 && !isTimerMode) {
            animationFrameId = requestAnimationFrame(step);
        } else {
            animationFrameId = null;
        }
    }

    function stopAll() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (countdownIntervalId) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }
        currentSpeed = 0;
        isTimerMode = false;
        countdownValue = 0;
        if (debugInfo) debugInfo.innerText = "STOP";
    }

    function triggerTimerScroll(direction) {
        stopAll();
        isTimerMode = true;

        if (!targetElement) targetElement = findScrollTarget();

        let seconds = parseFloat(speedInput.value) || 10;
        if(seconds < 1) seconds = 1;

        countdownValue = seconds;
        updateDebugDisplay();

        countdownIntervalId = setInterval(() => {
            countdownValue--;
            if (countdownValue < 0) countdownValue = seconds;
            updateDebugDisplay();
        }, 1000);

        intervalId = setInterval(() => {
            if (!targetElement) targetElement = findScrollTarget();

            let scrollAmount = 0;
            if (targetElement === window) {
                scrollAmount = window.innerHeight;
            } else {
                scrollAmount = targetElement.clientHeight;
            }

            if (direction === 'up') scrollAmount = -scrollAmount;

            if (targetElement === window) {
                window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            } else {
                targetElement.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            }

            countdownValue = seconds;
            updateDebugDisplay();

        }, seconds * 1000);
    }

    function triggerContinuous(direction) {
        stopAll();
        if (!targetElement) targetElement = findScrollTarget();

        let inputVal = parseFloat(speedInput.value) || 1;
        if(inputVal <= 0) inputVal = 1;

        const isInputChanged = inputVal !== Math.abs(currentSpeed);

        if (direction === 'down') {
            if (currentSpeed > 0 && !isInputChanged) currentSpeed += 1;
            else currentSpeed = inputVal;
        } else if (direction === 'up') {
            if (currentSpeed < 0 && !isInputChanged) currentSpeed -= 1;
            else currentSpeed = -inputVal;
        }

        speedInput.value = Math.abs(currentSpeed);

        if (!animationFrameId) {
            lastTime = 0;
            animationFrameId = requestAnimationFrame(step);
        }
    }

    btnUp.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); triggerContinuous('up'); });
    btnDown.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); triggerContinuous('down'); });

    btnTimerUp.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        triggerTimerScroll('up');
    });
    btnTimerDown.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        triggerTimerScroll('down');
    });

    btnStop.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        stopAll();
    });

    let isDragMove = false;
    toggleBtn.addEventListener('mousemove', () => { if(isDragging) isDragMove = true; });
    toggleBtn.addEventListener('mousedown', () => { isDragMove = false; });

    toggleBtn.addEventListener('click', (e) => {
        if (!isDragMove) {
            isPanelVisible = !isPanelVisible;

            if (isPanelVisible) {
                container.classList.add('tm-container-open');
                controlsPanel.classList.add('tm-panel-open');
                toggleBtn.innerHTML = iconOpen;
            } else {
                container.classList.remove('tm-container-open');
                controlsPanel.classList.remove('tm-panel-open');
                toggleBtn.innerHTML = iconClosed;
            }

            if (!baslangicGizli) localStorage.setItem(storageVisibleKey, isPanelVisible);
        }
    });
})();
