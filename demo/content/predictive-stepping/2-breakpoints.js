'use strict';

/* Devtool Breakpoints

  breakpoints will also pause your code on a specific line
  but they are part of your devtools, not the source code

  what does this mean?
  - if you change the code and run it again, the breakpoint may be gone
  - a debugger statement is part of your code, it will always be there

  use a breakpoint to pause on the same line as the `debugger;` in the last example

  here's a nice intro: https://www.youtube.com/watch?v=H0XScE08hy8
s
  Hint: try using the `run` and `debug` buttons, what's the difference?
    what happens to your breakpoints when you close your tab and open it again?

*/

let firstName = 'Brobes';

let lastName = 'Pierre';

// use a breakpoint on line this line to pause before fullName's value is assigned
let fullName = firstName + ' ' + lastName;

console.log('fullName:', fullName);
