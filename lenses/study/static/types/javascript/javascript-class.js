import { CodeFE } from "../code/code-class.js";
import { studyWith } from "./lib/study-with.js";

export class JavaScriptFE extends CodeFE {
  constructor(config) {
    super(config);
    this.initJsUi();
  }

  initJsUi() {
    const formatButton = document.getElementById("format-button");
    const formatParent = formatButton.parentElement;
    const newFormatButton = document.createElement("button");
    newFormatButton.innerHTML = "format";
    newFormatButton.onclick = () => {
      // https://github.com/react-monaco-editor/react-monaco-editor/pull/212
      this.editor.executeEdits("", [
        {
          range: this.editor.getModel().getFullModelRange(),
          text: this.prettierFormat(this.editor.getValue()),
          // forceMoveMarkers: true
        },
      ]);
    };
    formatParent.replaceChild(newFormatButton, formatButton);

    // if (this.config.locals.loopGuard) {
    const loopGuardForm = document.getElementById("loop-guard-form");
    let lastActiveValue = this.config.locals.loopGuard.active;
    document
      .getElementById("loop-guard-input")
      .addEventListener("change", (event) => {
        if (event.target.checked) {
          this.config.locals.loopGuard.active = lastActiveValue;
          loopGuardForm.style = "display: inline-block;";
        } else {
          lastActiveValue = this.config.locals.loopGuard.active;
          this.config.locals.loopGuard.active = false;
          loopGuardForm.style = "display: none;";
        }
        event.preventDefault();
      });
    loopGuardForm.addEventListener("change", (event) => {
      this.config.locals.loopGuard.active = event.target.form.active.checked;
      this.config.locals.loopGuard.max = Number(event.target.form.max.value);
    });
    // }

    // if (this.config.locals.clearScheduled) {
    const clearAllScheduledFactory = () => {
      // timeout & interval share a pool of ids
      // clearTimeout will also clear intervals, and vice-versa
      // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Return_value
      let minId = setTimeout(() => {}, 0);
      return () => {
        const maxId = setTimeout(() => {}, 0);
        for (let i = minId; i < maxId; i++) {
          clearInterval(i);
        }
        minId = maxId + 1;
      };
    };
    const clearScheduledButton = document.getElementById(
      "clear-scheduled-button"
    );
    document
      .getElementById("clear-scheduled-input")
      .addEventListener("change", (event) => {
        if (event.target.checked) {
          clearScheduledButton.style = "display: inline-block;";
        } else {
          clearScheduledButton.style = "display: none;";
        }
      });
    clearScheduledButton.addEventListener("click", clearAllScheduledFactory());
    // }

    // if (this.config.locals.flowchart) {
    const flowchartButton = document.getElementById("flowchart-button");
    document
      .getElementById("flowchart-input")
      .addEventListener("change", (event) => {
        if (event.target.checked) {
          flowchartButton.style = "display: inline-block;";
        } else {
          flowchartButton.style = "display: none;";
        }
      });
    flowchartButton.addEventListener("click", () =>
      this.studyWith("flowchart")
    );
    // }

    // if (this.config.locals.eval) {

    const runContainer = document.getElementById("run-container");
    document.getElementById("run-input").addEventListener("change", (event) => {
      this.config.locals.run = !this.config.locals.run;
      if (event.target.checked) {
        runContainer.style = "display: inline-block;";
      } else {
        runContainer.style = "display: none;";
      }
    });

    const debugContainer = document.getElementById("debug-container");
    document
      .getElementById("debug-input")
      .addEventListener("change", (event) => {
        this.config.locals.debug = !this.config.locals.debug;
        if (event.target.checked) {
          debugContainer.style = "display: inline-block;";
        } else {
          debugContainer.style = "display: none;";
        }
      });

    document
      .getElementById("run-button")
      .addEventListener("click", () => this.studyWith("console"));
    document
      .getElementById("debug-button")
      .addEventListener("click", () => this.studyWith("debugger"));
    // }

    // if (this.config.locals.openIn) {
    const openInContainer = document.getElementById("open-in-container");
    document
      .getElementById("open-in-input")
      .addEventListener("change", (event) => {
        this.config.locals.openIn = !this.config.locals.openIn;
        if (event.target.checked) {
          openInContainer.style = "display: inline-block;";
        } else {
          openInContainer.style = "display: none;";
        }
      });

    document
      .getElementById("open-in-button")
      .addEventListener("click", (event) => {
        const thisThing = event.target.form.thisThing.value;
        this.studyWith(thisThing);
        event.preventDefault();
      });
    // }

    if (this.config.locals.trace) {
      const traceContainer = document.getElementById("trace-container");
      document
        .getElementById("trace-input")
        .addEventListener("change", (event) => {
          this.config.locals.trace = !this.config.locals.trace;
          if (event.target.checked) {
            traceContainer.style = "display: inline-block;";
          } else {
            traceContainer.style = "display: none;";
          }
        });

      document
        .getElementById("trace-button")
        .addEventListener("click", (event) => {
          // trace is a global function loaded if config.locals.trace === true
          // not a permenant solution
          trace(this.editor.getValue());
          event.preventDefault();
        });

      document
        .getElementById("trace-config")
        .addEventListener("change", (event) => {
          const option = event.target.id;
          if (typeof trace.config[option] === "boolean") {
            trace.config[option] = !trace.config[option];
          }
          event.preventDefault();
        });
    }
  }

  static insertLoopGuards = (evalCode, maxIterations) => {
    let loopNum = 0;
    const loopHeadRegex = /(for|while)([\s]*)\(([^\{]*)\)([\s]*)\{|do([\s]*)\{/gm;
    return evalCode.replace(loopHeadRegex, (loopHead) => {
      const id = ++loopNum;
      const newLine = `let loopGuard_${id} = 0\n${loopHead}\nif (++loopGuard_${id} > ${maxIterations}) { throw new RangeError('loopGuard_${id} is greater than ${maxIterations}') }\n`;
      return newLine;
    });
  };

  prettierFormat(code = this.editor.getValue()) {
    let formattedCode = "";
    let noSyntaxErrors = false;
    try {
      formattedCode = prettier.format(code, {
        parser: "babel",
        plugins: prettierPlugins,
      });
      noSyntaxErrors = true;
    } catch (err) {
      return code;
    }

    if (noSyntaxErrors) {
      return formattedCode;
    }
  }

  studyWith(environment) {
    if (
      this.config.locals.loopGuard &&
      this.config.locals.loopGuard.active &&
      !(environment === "parsons" || environment === "flowchart")
    ) {
      const loopGuarded = JavaScriptFE.insertLoopGuards(
        this.editor.getValue(),
        this.config.locals.loopGuard.max || 20
      );
      const formatted = this.prettierFormat(loopGuarded);
      studyWith[environment](formatted);
    } else {
      studyWith[environment](this.editor.getValue());
    }
  }
}
