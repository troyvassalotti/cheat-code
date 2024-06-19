import { css, LitElement } from "lit";
import confetti from "canvas-confetti";

/**
 * Guitar Hero guitar controller key mappings.
 *
 * - Buttons numbered 4 and 5 do not register.
 * - The strum and whammy bars don't produce a button, so they are probably supposed to be buttons 4 and 5.
 *
 * The combo to trigger starpower: 7, 1, 7, 0, 7, 2, 7, 3, 6
 * Starpower in colors: Green, Red, Green, Yellow, Green, Blue, Green, Orange, Tilt
 *
 * @readonly
 * @enum {number}
 */
export const GuitarHeroKeymap = {
  Yellow: 0,
  Red: 1,
  Blue: 2,
  Orange: 3,
  Tilt: 6,
  Green: 7,
  Select: 8,
  Start: 9,
};

/**
 * PlayStation 2 controller key mappings.
 * @readonly
 * @enum {number}
 */
export const PS2Keymap = {
  Triangle: 0,
  Circle: 1,
  X: 2,
  Square: 3,
  L1: 4,
  R1: 5,
  L2: 6,
  R2: 7,
  Select: 8,
  Start: 9,
  LeftStick: 10,
  RightStick: 11,
};

/**
 * @element cheat-code
 *
 * @attribute pattern - Key combination to trigger the cheat code.
 * @attribute type - Event type to listen for.
 * @attribute timelimit - How long to wait between key presses.
 * @attribute duration - How long the code should last.
 *
 * @property {import('canvas-confetti').Options} confettiOptions - Custom confetti options.
 */
export default class CheatCode extends LitElement {
  static tagName = "cheat-code";

  static styles = css`
    :host {
      display: none;
    }
  `;

  static properties = {
    /** @type {"konamicode" | "starpower" | string} */
    pattern: {
      type: String,
      converter: (value) => {
        return CheatCode.patternMatcher(value);
      },
    },

    /** @type {"keyboard" | "gamepad"} */
    type: { type: String },

    timeLimit: { type: Number },
    duration: { type: Number },

    /** @type {import("canvas-confetti").Options} */
    confettiOptions: { type: Object },
  };

  constructor() {
    super();
    this.pattern = CheatCode.patternMatcher("konamicode");
    this.type = "keyboard";
    this.timeLimit = 1000;
    this.duration = 10;
    this.confettiOptions = {
      disableForReducedMotion: true,
      spread: 360,
      startVelocity: 30,
      ticks: 60,
      zIndex: 0,
    };
    this.gamepads = {};
    this.buttonState = {};
    this.entries = [];
    this.lastEntryTime = Date.now();
    this.timer = 0;

    this.keyboardInit = this.keyboardInit.bind(this);
    this.gamepadConnected = this.gamepadConnected.bind(this);
    this.gamepadDisconnected = this.gamepadDisconnected.bind(this);
  }

  static patternMatcher(pattern) {
    switch (pattern) {
      case "starpower":
        return "7 1 7 0 7 2 7 3 6";
      case "konamicode":
        return "ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a Enter";
      default:
        return pattern;
    }
  }

  get currentCode() {
    return this.entries.join(" ");
  }

  get connectedGamepads() {
    return navigator.getGamepads();
  }

  get gamepadIndexes() {
    return Object.keys(this.gamepads);
  }

  checkTime() {
    if (Date.now() - this.lastEntryTime > this.timeLimit) {
      this.entries = [];
    }
  }

  checkCode(event) {
    const { key } = event;

    if (key) {
      this.entries.push(key);
      this.lastEntryTime = Date.now();

      if (this.currentCode === this.pattern) {
        this.loadConfetti();
      }
    }
  }

  gamepadConnected(event) {
    const { gamepad } = event;

    if (gamepad) {
      console.info(
        "Gamepad connected at index %d: %s. %d buttons, %d axes. Are you ready to rock?",
        gamepad.index,
        gamepad.id,
        gamepad.buttons.length,
        gamepad.axes.length,
      );

      this.gamepads[gamepad.index] = true;
      this.readGamepadValues();
    }
  }

  gamepadDisconnected(event) {
    const { gamepad } = event;

    if (gamepad) {
      console.info(
        "Gamepad disconnected from index %d: %s",
        gamepad.index,
        gamepad.id,
      );

      delete this.gamepads[gamepad.index];
    }
  }

  buttonPressed(id) {
    console.log("Button Pressed!", id);
    this.checkTime();
    this.entries.push(id);
    this.lastEntryTime = this.now;

    if (this.currentCode === this.pattern) {
      this.loadConfetti();
    }
  }

  readGamepadValues() {
    // Traverse the list of gamepads reading the ones connected to this browser
    this.gamepadIndexes.forEach((item, index) => {
      if (!item || !this.connectedGamepads || !this.connectedGamepads[index])
        return;

      const { buttons } = this.connectedGamepads[index];

      buttons.forEach((button, index) => {
        if (button.pressed) {
          // If the button is pressed && its previous state was not pressed, mark it as pressed and call the handler
          if (!this.buttonState[index]) {
            this.buttonState[index] = true;
            this.buttonPressed(index);
          }
        } else {
          delete this.buttonState[index];
        }
      });
    });

    // Continue to call itself while there are gamepads connected
    if (this.gamepadIndexes.length > 0) {
      window.requestAnimationFrame(this.readGamepadValues);
    }
  }

  loadConfetti() {
    const duration = this.duration * 1000;
    const animationEnd = Date.now() + duration;

    this.timer = window.setInterval(
      () => this.fireConfetti(duration, animationEnd),
      250,
    );
  }

  fireConfetti(duration, end) {
    const timeLeft = end - Date.now();

    if (timeLeft <= 0) {
      clearInterval(this.timer);
      this.destroy();
    }

    const particleCount = 50 * (timeLeft / duration);
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    const yCoordinate = () => Math.random() - 0.2;

    const firstVariation = {
      particleCount,
      origin: {
        x: randomInRange(0.1, 0.3),
        y: yCoordinate(),
      },
    };

    const secondVariation = {
      particleCount,
      origin: {
        x: randomInRange(0.7, 0.9),
        y: yCoordinate(),
      },
    };

    confetti(Object.assign({}, this.confettiOptions, firstVariation));
    confetti(Object.assign({}, this.confettiOptions, secondVariation));
  }

  keyboardInit(keyEvent) {
    this.checkTime();
    this.checkCode(keyEvent);
  }

  listen() {
    switch (this.type) {
      case "gamepad":
        window.addEventListener("gamepadconnected", this.gamepadConnected);
        window.addEventListener(
          "gamepaddisconnected",
          this.gamepadDisconnected,
        );
        break;
      case "keyboard":
      default:
        document.addEventListener("keydown", this.keyboardInit);
    }
  }

  destroy() {
    switch (this.type) {
      case "gamepad":
        window.removeEventListener("gamepadconnected", this.gamepadConnected);
        window.removeEventListener(
          "gamepaddisconnected",
          this.gamepadDisconnected,
        );
        break;
      case "keyboard":
      default:
        document.removeEventListener("keydown", this.keyboardInit);
        break;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.listen();
  }

  disconnectedCallback() {
    this.destroy();
    super.disconnectedCallback();
  }
}

if (!window.customElements.get(CheatCode.tagName)) {
  window.customElements.define(CheatCode.tagName, CheatCode);
}
