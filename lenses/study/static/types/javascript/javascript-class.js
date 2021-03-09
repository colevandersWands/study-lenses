import { CodeFE } from "../code/code-class.js";
import { studyWith } from "./static/study-with.js";

export class JavaScriptFE extends CodeFE {
  constructor(config) {
    super(config);

    // if (this.config.locals.trace) {
    //   for (const key in this.config.locals.trace) {
    //     if (typeof this.config.locals.trace[key] === "boolean") {
    //       trace.config[key] = this.config.locals.trace[key];
    //     }
    //   }
    // }

    window.editor = this.editor;

    this.initJsUi();
  }

  initJsUi() {
    const formatButton = document.getElementById("format-button");
    if (formatButton === null) {
      return;
    }

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
    clearScheduledButton.addEventListener("click", clearScheduledFactory());
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

    const variablesButton = document.getElementById("variables-button");
    document
      .getElementById("flowchart-input")
      .addEventListener("change", (event) => {
        if (event.target.checked) {
          variablesButton.style = "display: inline-block;";
        } else {
          variablesButton.style = "display: none;";
        }
      });
    variablesButton.addEventListener("click", () =>
      this.studyWith("variables")
    );

    const astButton = document.getElementById("ast-button");
    document.getElementById("ast-input").addEventListener("change", (event) => {
      if (event.target.checked) {
        astButton.style = "display: inline-block;";
      } else {
        astButton.style = "display: none;";
      }
    });
    astButton.addEventListener("click", () => this.studyWith("acorn"));

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
  }

  // static insertLoopGuards = (evalCode, maxIterations) => {
  //   let loopNum = 0;
  //   const loopHeadRegex = /(for|while)([\s]*)\(([^\{]*)\)([\s]*)\{|do([\s]*)\{/gm;
  //   return evalCode.replace(loopHeadRegex, (loopHead) => {
  //     const id = ++loopNum;
  //     const newLine = `let loopGuard_${id} = 0\n${loopHead}\nif (++loopGuard_${id} > ${maxIterations}) { throw new RangeError('loopGuard_${id} is greater than ${maxIterations}') }\n`;
  //     return newLine;
  //   });
  // };

  static insertLoopGuards = (evalCode, maxIterations) => {
    const blockify = (...body) => {
      const blockStatement = Acorn.parse("{}").body[0];
      blockStatement.body = body;
      return blockStatement;
    };

    const generateLoopGuard = (id, max) => {
      const variable = Acorn.parse(`let loopGuard_${id} = 0;`).body[0];
      variable.generated = true;
      const check = Acorn.parse(
        `if (++loopGuard_${id} > ${max}) { throw new RangeError("loopGuard_${id} is greater than ${max}"); }`
      );
      check.generated = true;
      return {
        variable,
        check,
      };
    };

    const ast =
      typeof evalCode === "object"
        ? evalCode
        : Acorn.parse(evalCode, { locations: true });

    let loopNumber = 1;

    const guardedTree = walk(ast, {
      enter(node) {
        if (node.generated || node.visited) {
          this.skip();
        }
      },
      leave(node, parent, prop, index) {
        if (
          node.type !== "WhileStatement" &&
          node.type !== "ForStatement" &&
          node.type !== "ForOfStatement" &&
          node.type !== "ForInStatement" &&
          node.type !== "DoWhileStatement"
        ) {
          return;
        }
        const { variable, check } = generateLoopGuard(
          loopNumber,
          maxIterations
        );
        if (node.body && node.body.type !== "BlockStatement") {
          node.body = blockify(node.body);
        }

        node.body.body.unshift(check);

        const indexOfNode = parent.body.indexOf(node);

        parent.body.splice(indexOfNode, 0, variable);

        node.visited = true;

        loopNumber++;
      },
    });

    const guarded =
      typeof evalCode === "object"
        ? guardedTree
        : Astring.generate(guardedTree);

    return guarded;
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
    if (environment === "acorn") {
      try {
        console.log(Acorn.parse(this.editor.getValue(), { locations: true }));
      } catch (err) {
        console.error(err);
      }
      return;
    }

    let formatted = getMonacoSelection(this.editor) || this.editor.getValue();
    if (
      this.config.locals.loopGuard &&
      this.config.locals.loopGuard.active &&
      environment !== "parsons" &&
      environment !== "flowchart" &&
      environment !== "diff" &&
      environment !== "highlight"
    ) {
      const loopGuarded = JavaScriptFE.insertLoopGuards(
        this.editor.getValue(),
        this.config.locals.loopGuard.max || 20
      );
      formatted = this.prettierFormat(loopGuarded);
      studyWith[environment](formatted);
      return;
    }

    if (typeof studyWith[environment] === "function") {
      studyWith[environment](formatted);
    } else {
      this.openSelectionWith(environment, formatted);
    }
  }
}
