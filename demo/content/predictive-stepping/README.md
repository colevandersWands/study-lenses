# Predictive Stepping

> These games teach you to read code and prepare you for predictive stepping:
>
> - 🥚 [compute-it](http://compute-it.toxicode.fr/)
> - 🐣 [little-dot](http://little-dot.toxicode.fr/)

> These videos cover predictive stepping:
>
> - [How to use this version of Study Lenses]()
> - [A guide to the files in this folder](https://denepo.js.org/welcome-to-js/3-understanding-programs/1-predicting-execution/guide.mp4).
> - [A class recording](https://www.youtube.com/watch?v=GAjQbsqTt4A) covering [these examples](https://github.com/denepo/predictive-stepping).

_Predictive Stepping_ is a study method where you quiz yourself on each step of a
program's execution, checking your predictions with using a debugger. After you have a
basic familiarity with your debugger, this study method is simple and effective - it's
like having a teacher by your side every day of the week!

Before learning more about predictive stepping, you first need to understand ...

## Program Memory

_Program Memory_ is a term that refers to the values stored in memory at EACH SPECIFIC
moment of execution. These values can change often, sometimes at every step of your
program! Learning to program requires you to understand:

- how does the JS engine represent memory?
- how does the JS engine interpret your code line-by-line?
- how does each instruction interact with program memory?

Your first goal is learning to see what is happening inside your program at each step:

- **DevTools Debugger**: The best way to peek inside program memory. It will take some
  practice to use effectively and is worth every second. You can see every value in
  memory, at every step of your program's execution. Debuggers are designed to help you
  understand how memory is structured in JS

## The Study Technique

To check if you _really_ understand a program, practice stepping through it in the
debugger like so:

0. Don't step forward yet!
1. Predict which line will execute next and how it will change program state
2. Step forward in the program.
3. Check your prediction.
4. Investigate if you were wrong: Is this a bug in the program, or is it something you did
   not understand?

That's it, happy studies!
