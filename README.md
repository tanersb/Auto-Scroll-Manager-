# Auto Scroll Manager  🖱️

A sophisticated Tampermonkey userscript designed for seamless web reading and content consumption. It combines smooth scrolling mechanics with a smart, unobtrusive interface that stays out of your way when not needed.

## 🌟 Key Features

* **Butter Smooth Performance:** Utilizes `requestAnimationFrame` for stutter-free scrolling (60/144Hz optimized), replacing clunky interval-based methods.
* **Distraction-Free Mode:** When you minimize the control panel, the green target border automatically disappears, giving you a completely clean reading view while scrolling continues in the background.
* **Smart Target Detection:** Automatically identifies and locks onto scrollable areas (comments, sidebars, or main feed) with a single click.
* **Unobtrusive Startup:** The widget launches in a minimized state (icon mode) by default to keep your screen clutter-free from the moment the page loads.
* **Intelligent Persistence:** Remembers the widget's exact screen position and your preferences across page reloads and tabs.
* **Timer Mode (Shorts/Reels):** Dedicated loop mode for Instagram Reels, YouTube Shorts, or TikTok. Set a timer (e.g., 15s), and it will automatically swipe to the next video when time is up.

## 🎮 Controls

### 1. Continuous Scrolling (Reading Mode)
Ideal for articles, forums, and long feeds.
* **Up/Down Arrows:** Initiates scrolling. Clicking repeatedly acts as a "gas pedal," increasing the speed.
* **Input Box:** Manually type a specific speed value (e.g., `5`) and press an arrow to start immediately at that pace.
* **Stop Button (Red Square):** Halts scrolling instantly without resetting your speed setting, allowing for a quick resume.

### 2. Timer Mode (Content Loop)
Located above the input box, designed for short-form video platforms.
* **Set Duration:** Type the seconds in the input box (e.g., `10`).
* **Small Arrows:** Activates the countdown.
* **Behavior:** Waits for the set duration, performs a full scroll action (simulating a swipe), and repeats the cycle.

## 🚀 Installation

1.  Install the [Tampermonkey](https://www.tampermonkey.net/) extension for your browser.
2.  Create a new script in Tampermonkey.
3.  Copy and paste the `script.js` content.
4.  Save the script.

## 👨‍💻 Developer

Developed by **@tanersb**
