export interface WeaveChallenge {
  id: string;
  title: string;
  brief: string;
  starter: string;
  expected: string[];
  hint: string;
}

export const WEAVE_CHALLENGES: WeaveChallenge[] = [
  {
    id: 'hello',
    title: 'Level 1 · Say Bula',
    brief: 'Use mount() to print exactly: Bula, Weave!',
    starter: `// mount() prints text to the screen\n// Try: mount("Bula, Weave!")\n`,
    expected: ['Bula, Weave!'],
    hint: 'mount("Bula, Weave!")',
  },
  {
    id: 'variables',
    title: 'Level 2 · Variables',
    brief: 'Declare state island = "Fiji" then mount a template that prints: Greetings from Fiji!',
    starter: `state island = "Fiji"\n\n// mount a template string using \${island}\n`,
    expected: ['Greetings from Fiji!'],
    hint: 'mount(`Greetings from ${island}!`)',
  },
  {
    id: 'loops',
    title: 'Level 3 · Loops',
    brief: 'Loop over the services list and mount() each one, in order.',
    starter: `state services = ["Laptop Repair", "Web Dev", "Networking"]\n\n// for each service in services { mount(service) }\n`,
    expected: ['Laptop Repair', 'Web Dev', 'Networking'],
    hint: 'for each service in services {\n  mount(service)\n}',
  },
  {
    id: 'functions',
    title: 'Level 4 · Components',
    brief: 'Write a component called double that returns its input times 2, then mount(double(21)).',
    starter: `// component double(n) { return n * 2 }\n\n// mount(double(21))\n`,
    expected: ['42'],
    hint: 'component double(n) {\n  return n * 2\n}\nmount(double(21))',
  },
  {
    id: 'conditionals',
    title: 'Level 5 · Routing',
    brief: 'Use route/else to check if 2026 is greater than 2020. Mount "Future" if true, otherwise mount "Past".',
    starter: `route (2026 > 2020) {\n  // mount "Future"\n} else {\n  // mount "Past"\n}\n`,
    expected: ['Future'],
    hint: 'route (2026 > 2020) {\n  mount("Future")\n} else {\n  mount("Past")\n}',
  },
  {
    id: 'finale',
    title: 'Level 6 · Visitor Counter',
    brief: 'Declare hook counter = 0. Loop over ["Josese","Ana","Sam"], mount "Hi, X!" for each name and increment counter. Finally mount `Total visitors: ${counter}`.',
    starter: `state visitors = ["Josese", "Ana", "Sam"]\nhook counter = 0\n\n// for each name in visitors {\n//   mount(\`Hi, \${name}!\`)\n//   counter = counter + 1\n// }\n\n// mount(\`Total visitors: \${counter}\`)\n`,
    expected: ['Hi, Josese!', 'Hi, Ana!', 'Hi, Sam!', 'Total visitors: 3'],
    hint: 'for each name in visitors {\n  mount(`Hi, ${name}!`)\n  counter = counter + 1\n}\nmount(`Total visitors: ${counter}`)',
  },
  {
    id: 'multiplication-table',
    title: 'Level 7 · Multiplication Table',
    brief: 'Loop over rows and cols (both [1,2,3]) with a loop inside a loop, and mount `${row} x ${col} = ${row * col}` for every pair.',
    starter: `state rows = [1, 2, 3]\nstate cols = [1, 2, 3]\n\n// for each row in rows {\n//   for each col in cols {\n//     mount(\`\${row} x \${col} = \${row * col}\`)\n//   }\n// }\n`,
    expected: ['1 x 1 = 1', '1 x 2 = 2', '1 x 3 = 3', '2 x 1 = 2', '2 x 2 = 4', '2 x 3 = 6', '3 x 1 = 3', '3 x 2 = 6', '3 x 3 = 9'],
    hint: 'for each row in rows {\n  for each col in cols {\n    mount(`${row} x ${col} = ${row * col}`)\n  }\n}',
  },
  {
    id: 'shopping-cart',
    title: 'Level 8 · Shopping Cart Total',
    brief: 'Declare hook total = 0. Loop over prices and add each price to total. Finally mount `Total: $${total}`.',
    starter: `state prices = [25, 40, 15, 20]\nhook total = 0\n\n// for each price in prices {\n//   total = total + price\n// }\n\n// mount(\`Total: $\${total}\`)\n`,
    expected: ['Total: $100'],
    hint: 'for each price in prices {\n  total = total + price\n}\nmount(`Total: $${total}`)',
  },
  {
    id: 'fastest-speed',
    title: 'Level 9 · Fastest Speed',
    brief: 'Loop over speeds and use route to update fastest whenever a speed beats it. Mount `Fastest: ${fastest} km/h`.',
    starter: `state speeds = [12, 45, 30, 45, 22]\nhook fastest = 0\n\n// for each speed in speeds {\n//   route (speed > fastest) {\n//     fastest = speed\n//   }\n// }\n\n// mount(\`Fastest: \${fastest} km/h\`)\n`,
    expected: ['Fastest: 45 km/h'],
    hint: 'for each speed in speeds {\n  route (speed > fastest) {\n    fastest = speed\n  }\n}\nmount(`Fastest: ${fastest} km/h`)',
  },
  {
    id: 'exam-pass-count',
    title: 'Level 10 · Exam Pass Count',
    brief: 'Loop over scores and count how many are 60 or above using route. Mount `Passed: ${passed} of 5`.',
    starter: `state scores = [55, 82, 91, 40, 76]\nhook passed = 0\n\n// for each score in scores {\n//   route (score >= 60) {\n//     passed = passed + 1\n//   }\n// }\n\n// mount(\`Passed: \${passed} of 5\`)\n`,
    expected: ['Passed: 3 of 5'],
    hint: 'for each score in scores {\n  route (score >= 60) {\n    passed = passed + 1\n  }\n}\nmount(`Passed: ${passed} of 5`)',
  },
  {
    id: 'running-receipt',
    title: 'Level 11 · Running Receipt',
    brief: 'Loop over cart, add each item to a running hook total, and mount a line per item showing the item price and the running total so far. No code is given this time — write the loop yourself using the cheatsheet below.',
    starter: `state cart = [10, 20, 5]\nhook running = 0\n\n// Write your own "for each" loop over cart here.\n// Inside it: add the item to running, then mount a line\n// showing the item price and the running total so far.\n`,
    expected: ['Item: $10 → Running total: $10', 'Item: $20 → Running total: $30', 'Item: $5 → Running total: $35'],
    hint: 'for each item in cart {\n  running = running + item\n  mount(`Item: $${item} → Running total: $${running}`)\n}',
  },
  {
    id: 'sum-to-n',
    title: 'Level 12 · Sum to N',
    brief: 'Write a recursive component sumTo(n): return 0 when n <= 0, otherwise n + sumTo(n - 1). Remove the // and fill in the ____ blank (the keyword for the "otherwise" branch of route). Mount `Sum 1 to 10: ${sumTo(10)}`.',
    starter: `// component sumTo(n) {\n//   route (n <= 0) {\n//     return 0\n//   } ____ {\n//     return n + sumTo(n - 1)\n//   }\n// }\n\n// mount(\`Sum 1 to 10: \${sumTo(10)}\`)\n`,
    expected: ['Sum 1 to 10: 55'],
    hint: 'component sumTo(n) {\n  route (n <= 0) {\n    return 0\n  } else {\n    return n + sumTo(n - 1)\n  }\n}\nmount(`Sum 1 to 10: ${sumTo(10)}`)',
  },
  {
    id: 'factorial',
    title: 'Level 13 · Factorial',
    brief: 'Write a recursive component factorial(n): return 1 when n <= 1, otherwise n * factorial(n - 1). Remove the // and fill in the ____ blank. Mount `5! = ${factorial(5)}`.',
    starter: `// component factorial(n) {\n//   route (n <= 1) {\n//     return 1\n//   } ____ {\n//     return n * factorial(n - 1)\n//   }\n// }\n\n// mount(\`5! = \${factorial(5)}\`)\n`,
    expected: ['5! = 120'],
    hint: 'component factorial(n) {\n  route (n <= 1) {\n    return 1\n  } else {\n    return n * factorial(n - 1)\n  }\n}\nmount(`5! = ${factorial(5)}`)',
  },
  {
    id: 'fibonacci',
    title: 'Level 14 · Fibonacci',
    brief: 'Write a recursive component fib(n): fib(0)=0, fib(1)=1, otherwise fib(n-1)+fib(n-2). Remove the // and fill in the ____ blank. Loop over [0,1,2,3,4,5,6] and mount `fib(${i}) = ${fib(i)}` for each.',
    starter: `// component fib(n) {\n//   route (n <= 1) {\n//     return n\n//   } ____ {\n//     return fib(n - 1) + fib(n - 2)\n//   }\n// }\n\n// for each i in [0, 1, 2, 3, 4, 5, 6] {\n//   mount(\`fib(\${i}) = \${fib(i)}\`)\n// }\n`,
    expected: ['fib(0) = 0', 'fib(1) = 1', 'fib(2) = 1', 'fib(3) = 2', 'fib(4) = 3', 'fib(5) = 5', 'fib(6) = 8'],
    hint: 'component fib(n) {\n  route (n <= 1) {\n    return n\n  } else {\n    return fib(n - 1) + fib(n - 2)\n  }\n}\nfor each i in [0, 1, 2, 3, 4, 5, 6] {\n  mount(`fib(${i}) = ${fib(i)}`)\n}',
  },
  {
    id: 'even-or-odd',
    title: 'Level 15 · Even or Odd (No % Allowed)',
    brief: 'Weave has no % operator. Remove the // and fill in the two ____ blanks (think: the keyword for the "otherwise" branch of route) to complete a recursive component isEven(n): "Even" when n == 0, "Odd" when n == 1, otherwise isEven(n - 2). Loop over [4,7,10,13] and mount `${n} is ${isEven(n)}`.',
    starter: `// component isEven(n) {\n//   route (n == 0) {\n//     return \"Even\"\n//   } ____ {\n//     route (n == 1) {\n//       return \"Odd\"\n//     } ____ {\n//       return isEven(n - 2)\n//     }\n//   }\n// }\n\n// for each n in [4, 7, 10, 13] {\n//   mount(\`\${n} is \${isEven(n)}\`)\n// }\n`,
    expected: ['4 is Even', '7 is Odd', '10 is Even', '13 is Odd'],
    hint: 'component isEven(n) {\n  route (n == 0) {\n    return "Even"\n  } else {\n    route (n == 1) {\n      return "Odd"\n    } else {\n      return isEven(n - 2)\n    }\n  }\n}\nfor each n in [4, 7, 10, 13] {\n  mount(`${n} is ${isEven(n)}`)\n}',
  },
  {
    id: 'fizzbuzz',
    title: 'Level 16 · FizzBuzz',
    brief: 'The classic — but still no %. The isDivisible(n, d) helper below (already written) returns 1 when divisible and 0 otherwise — Weave has no true/false, so route just treats 0 as falsy. Remove the // and fill in the three ____ blanks to loop over nums 1 to 15 and mount "FizzBuzz" (divisible by 15), "Fizz" (by 3), "Buzz" (by 5), or the number itself.',
    starter: `component isDivisible(n, d) {\n  route (n < d) {\n    route (n == 0) {\n      return 1\n    } else {\n      return 0\n    }\n  } else {\n    return isDivisible(n - d, d)\n  }\n}\n\nstate nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]\n\n// for each n in nums {\n//   route (isDivisible(n, 15)) {\n//     mount(\"FizzBuzz\")\n//   } ____ {\n//     route (isDivisible(n, 3)) {\n//       mount(\"Fizz\")\n//     } ____ {\n//       route (isDivisible(n, 5)) {\n//         mount(\"Buzz\")\n//       } ____ {\n//         mount(\`\${n}\`)\n//       }\n//     }\n//   }\n// }\n`,
    expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'],
    hint: 'for each n in nums {\n  route (isDivisible(n, 15)) {\n    mount("FizzBuzz")\n  } else {\n    route (isDivisible(n, 3)) {\n      mount("Fizz")\n    } else {\n      route (isDivisible(n, 5)) {\n        mount("Buzz")\n      } else {\n        mount(`${n}`)\n      }\n    }\n  }\n}',
  },
  {
    id: 'signal-bars',
    title: 'Level 17 · Signal Bars',
    brief: 'For each row in [1,2,3,4], build a hook string bar by looping the same list again and appending "█" whenever col <= row, then mount the finished bar for that row. No code is given this time — write it yourself using the cheatsheet below.',
    starter: `state rows = [1, 2, 3, 4]\n\n// Write your own nested loop here: for each row, build a\n// string (start it as "") by appending "█" once for every\n// col <= row, then mount the finished string for that row.\n`,
    expected: ['█', '██', '███', '████'],
    hint: 'for each row in rows {\n  hook bar = ""\n  for each col in rows {\n    route (col <= row) {\n      bar = bar + "█"\n    }\n  }\n  mount(bar)\n}',
  },
  {
    id: 'average-reading',
    title: 'Level 18 · Average Reading',
    brief: 'Loop over readings, accumulating both a total and a count in two hooks. Declare state average = total / count, then mount `Average: ${average}`. No code is given this time — write it yourself using the cheatsheet below.',
    starter: `state readings = [72, 68, 75, 65]\nhook total = 0\nhook count = 0\n\n// Write your own loop here: add each reading to total and\n// increment count. Afterward declare state average = total / count\n// and mount a line showing it.\n`,
    expected: ['Average: 70'],
    hint: 'for each r in readings {\n  total = total + r\n  count = count + 1\n}\nstate average = total / count\nmount(`Average: ${average}`)',
  },
  {
    id: 'grade-report',
    title: 'Level 19 · Grade Report',
    brief: 'Write a component grade(score) with nested route/else: 90+ returns "A", 75+ returns "B", 60+ returns "C", else "F". Remove the // and fill in the three ____ blanks. Loop over scores and mount `${score} → ${grade(score)}` for each.',
    starter: `// component grade(score) {\n//   route (score >= 90) {\n//     return \"A\"\n//   } ____ {\n//     route (score >= 75) {\n//       return \"B\"\n//     } ____ {\n//       route (score >= 60) {\n//         return \"C\"\n//       } ____ {\n//         return \"F\"\n//       }\n//     }\n//   }\n// }\n\nstate scores = [95, 82, 58, 71]\n\n// for each s in scores {\n//   mount(\`\${s} → \${grade(s)}\`)\n// }\n`,
    expected: ['95 → A', '82 → B', '58 → F', '71 → C'],
    hint: 'component grade(score) {\n  route (score >= 90) {\n    return "A"\n  } else {\n    route (score >= 75) {\n      return "B"\n    } else {\n      route (score >= 60) {\n        return "C"\n      } else {\n        return "F"\n      }\n    }\n  }\n}\nfor each s in scores {\n  mount(`${s} → ${grade(s)}`)\n}',
  },
  {
    id: 'signal-relay-network',
    title: 'Level 20 · Signal Relay Network',
    brief: 'Write a recursive component signalAt(hop): signalAt(0) = 100, and every further hop is signalAt(hop - 1) - 15. Remove the // and fill in the two ____ blanks. Loop over hops [0..5]; mount the strength at each hop, appending " — weak" and incrementing a hook when it drops below 50. Finish with mount(`Weak hops: ${weak}`).',
    starter: `// component signalAt(hop) {\n//   route (hop == 0) {\n//     return 100\n//   } ____ {\n//     return signalAt(hop - 1) - 15\n//   }\n// }\n\nstate hops = [0, 1, 2, 3, 4, 5]\nhook weak = 0\n\n// for each h in hops {\n//   state strength = signalAt(h)\n//   route (strength < 50) {\n//     mount(\`Hop \${h}: \${strength}% — weak\`)\n//     weak = weak + 1\n//   } ____ {\n//     mount(\`Hop \${h}: \${strength}%\`)\n//   }\n// }\n\n// mount(\`Weak hops: \${weak}\`)\n`,
    expected: ['Hop 0: 100%', 'Hop 1: 85%', 'Hop 2: 70%', 'Hop 3: 55%', 'Hop 4: 40% — weak', 'Hop 5: 25% — weak', 'Weak hops: 2'],
    hint: 'component signalAt(hop) {\n  route (hop == 0) {\n    return 100\n  } else {\n    return signalAt(hop - 1) - 15\n  }\n}\nfor each h in hops {\n  state strength = signalAt(h)\n  route (strength < 50) {\n    mount(`Hop ${h}: ${strength}% — weak`)\n    weak = weak + 1\n  } else {\n    mount(`Hop ${h}: ${strength}%`)\n  }\n}\nmount(`Weak hops: ${weak}`)',
  },
  {
    id: 'prime-finder',
    title: 'Level 21 · Prime Number Finder',
    brief: 'Weave still has no % operator. Write component isDivisible(n, d) using repeated subtraction (as in earlier levels), then component hasFactor(n, d) that recursively checks whether n has any factor in [d, n - 1], then component isPrime(n) that returns 0 for n < 2 and otherwise checks hasFactor(n, 2). Loop over nums and mount `${n} is prime` or `${n} is not prime` for each.',
    starter: `state nums = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]\n\n// Write component isDivisible(n, d), component hasFactor(n, d),\n// and component isPrime(n). Then loop over nums and mount the\n// verdict for each number.\n`,
    expected: ['2 is prime', '3 is prime', '4 is not prime', '5 is prime', '6 is not prime', '7 is prime', '8 is not prime', '9 is not prime', '10 is not prime', '11 is prime'],
    hint: 'component isDivisible(n, d) {\n  route (n < d) {\n    route (n == 0) {\n      return 1\n    } else {\n      return 0\n    }\n  } else {\n    return isDivisible(n - d, d)\n  }\n}\ncomponent hasFactor(n, d) {\n  route (d == n) {\n    return 0\n  } else {\n    route (isDivisible(n, d)) {\n      return 1\n    } else {\n      return hasFactor(n, d + 1)\n    }\n  }\n}\ncomponent isPrime(n) {\n  route (n < 2) {\n    return 0\n  } else {\n    route (hasFactor(n, 2)) {\n      return 0\n    } else {\n      return 1\n    }\n  }\n}\nfor each n in nums {\n  route (isPrime(n)) {\n    mount(`${n} is prime`)\n  } else {\n    mount(`${n} is not prime`)\n  }\n}',
  },
  {
    id: 'gcd',
    title: 'Level 22 · Greatest Common Divisor',
    brief: 'Still no % operator. Write a recursive component gcd(a, b) using the subtractive Euclidean algorithm: if a equals b, that\'s the answer; otherwise recurse with the larger value minus the smaller. Mount the gcd of each of the four pairs given.',
    starter: `// Write component gcd(a, b), then mount the gcd of each pair:\n// gcd(48, 18), gcd(56, 98), gcd(17, 5), gcd(100, 75).\n`,
    expected: ['gcd(48, 18) = 6', 'gcd(56, 98) = 14', 'gcd(17, 5) = 1', 'gcd(100, 75) = 25'],
    hint: 'component gcd(a, b) {\n  route (a == b) {\n    return a\n  } else {\n    route (a > b) {\n      return gcd(a - b, b)\n    } else {\n      return gcd(a, b - a)\n    }\n  }\n}\nmount(`gcd(48, 18) = ${gcd(48, 18)}`)\nmount(`gcd(56, 98) = ${gcd(56, 98)}`)\nmount(`gcd(17, 5) = ${gcd(17, 5)}`)\nmount(`gcd(100, 75) = ${gcd(100, 75)}`)',
  },
  {
    id: 'collatz',
    title: 'Level 23 · Collatz Conjecture',
    brief: 'Write component isEven(n) (recursive, no % — same trick as earlier levels), then a recursive component collatzSteps(n, steps) that halves n when even, otherwise turns it into 3n + 1, counting steps until n reaches 1. Loop over starts and mount `${s} takes ${collatzSteps(s, 0)} steps` for each.',
    starter: `state starts = [6, 11, 7]\n\n// Write component isEven(n) and a recursive component\n// collatzSteps(n, steps). Loop over starts and mount how many\n// steps each starting number takes to reach 1.\n`,
    expected: ['6 takes 8 steps', '11 takes 14 steps', '7 takes 16 steps'],
    hint: 'component isEven(n) {\n  route (n == 0) {\n    return 1\n  } else {\n    route (n == 1) {\n      return 0\n    } else {\n      return isEven(n - 2)\n    }\n  }\n}\ncomponent collatzSteps(n, steps) {\n  route (n == 1) {\n    return steps\n  } else {\n    route (isEven(n)) {\n      return collatzSteps(n / 2, steps + 1)\n    } else {\n      return collatzSteps((n * 3) + 1, steps + 1)\n    }\n  }\n}\nfor each s in starts {\n  mount(`${s} takes ${collatzSteps(s, 0)} steps`)\n}',
  },
  {
    id: 'pascals-triangle',
    title: 'Level 24 · Pascal\'s Triangle Row',
    brief: 'Reuse the factorial(n) pattern from earlier, then write component choose(n, k) = n! / (k! * (n - k)!). Loop over ks (0 through 6) and mount `C(6,${k}) = ${choose(n, k)}` to print row 6 of Pascal\'s Triangle.',
    starter: `state n = 6\nstate ks = [0, 1, 2, 3, 4, 5, 6]\n\n// Write component factorial(n) and component choose(n, k), then\n// loop over ks and mount each value of row 6 of Pascal's Triangle.\n`,
    expected: ['C(6,0) = 1', 'C(6,1) = 6', 'C(6,2) = 15', 'C(6,3) = 20', 'C(6,4) = 15', 'C(6,5) = 6', 'C(6,6) = 1'],
    hint: 'component factorial(n) {\n  route (n <= 1) {\n    return 1\n  } else {\n    return n * factorial(n - 1)\n  }\n}\ncomponent choose(n, k) {\n  return factorial(n) / (factorial(k) * factorial(n - k))\n}\nfor each k in ks {\n  mount(`C(6,${k}) = ${choose(n, k)}`)\n}',
  },
  {
    id: 'fibonacci-sum',
    title: 'Level 25 · Fibonacci Sum',
    brief: 'Reuse the recursive fib(n) pattern from an earlier level. Loop over idx, adding fib(i) to a hook total for each, then mount `Sum of first 10 Fibonacci numbers: ${total}`.',
    starter: `state idx = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]\n\n// Write the recursive component fib(n) from an earlier level, then\n// loop over idx, summing fib(i) into a hook, and mount the total.\n`,
    expected: ['Sum of first 10 Fibonacci numbers: 88'],
    hint: 'component fib(n) {\n  route (n <= 1) {\n    return n\n  } else {\n    return fib(n - 1) + fib(n - 2)\n  }\n}\nhook total = 0\nfor each i in idx {\n  total = total + fib(i)\n}\nmount(`Sum of first 10 Fibonacci numbers: ${total}`)',
  },
  {
    id: 'diamond-pattern',
    title: 'Level 26 · Diamond Pattern',
    brief: 'Build a 4-row "*" diamond. For each row, use two bounded inner loops over cols — the same over-shoot-and-check trick as the Signal Bars level — one appending a space while col <= (n - row), one appending a star while col <= (2 * row - 1). Mount the finished line for each row.',
    starter: `state n = 4\nstate cols = [1, 2, 3, 4, 5, 6, 7]\nstate rows = [1, 2, 3, 4]\n\n// For each row, build a line with (n - row) leading spaces followed\n// by (2 * row - 1) stars, using two bounded inner loops over cols.\n// Mount the finished line for each row to draw a diamond.\n`,
    expected: ['   *', '  ***', ' *****', '*******'],
    hint: 'for each row in rows {\n  hook line = ""\n  for each col in cols {\n    route (col <= (n - row)) {\n      line = line + " "\n    }\n  }\n  for each col in cols {\n    route (col <= ((2 * row) - 1)) {\n      line = line + "*"\n    }\n  }\n  mount(line)\n}',
  },
  {
    id: 'number-builder',
    title: 'Level 27 · Number Builder (Horner\'s Method)',
    brief: 'Given a list of digits, build the number they represent without any parsing helpers — loop over the digits and repeatedly do value = value * 10 + digit (this is Horner\'s method). Do it for both digits1 and digits2, mounting each result.',
    starter: `state digits1 = [1, 4, 2, 8]\nstate digits2 = [9, 0, 7]\n\n// Build the number each digit list represents without any parsing —\n// loop over the digits and repeatedly do: value = value * 10 + digit.\n// Mount the result for both lists.\n`,
    expected: ['Digits [1,4,2,8] build: 1428', 'Digits [9,0,7] build: 907'],
    hint: 'hook value1 = 0\nfor each d in digits1 {\n  value1 = (value1 * 10) + d\n}\nhook value2 = 0\nfor each d in digits2 {\n  value2 = (value2 * 10) + d\n}\nmount(`Digits [1,4,2,8] build: ${value1}`)\nmount(`Digits [9,0,7] build: ${value2}`)',
  },
  {
    id: 'recursive-range-sum',
    title: 'Level 28 · Recursive Range Sum',
    brief: 'Write a recursive component sumRange(a, b) that adds every integer from a to b — no loop allowed. Mount `Sum 1 to 50: ${sumRange(1, 50)}` and `Sum 10 to 20: ${sumRange(10, 20)}`.',
    starter: `// Write a recursive component sumRange(a, b) that adds every integer\n// from a to b without using a loop. Mount the sum from 1 to 50, and\n// the sum from 10 to 20.\n`,
    expected: ['Sum 1 to 50: 1275', 'Sum 10 to 20: 165'],
    hint: 'component sumRange(a, b) {\n  route (a == b) {\n    return a\n  } else {\n    return a + sumRange(a + 1, b)\n  }\n}\nmount(`Sum 1 to 50: ${sumRange(1, 50)}`)\nmount(`Sum 10 to 20: ${sumRange(10, 20)}`)',
  },
  {
    id: 'mutual-recursion',
    title: 'Level 29 · Mutual Recursion',
    brief: 'Write two components that call each other: isOdd(n) returns isEven(n - 1), and isEven(n) returns isOdd(n - 1), with n == 0 as the base case (isEven(0) = 1, isOdd(0) = 0). Loop over nums and mount `${n} is even` or `${n} is odd` for each.',
    starter: `state nums = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]\n\n// Write two components that call each other: isOdd(n) calls\n// isEven(n - 1), and isEven(n) calls isOdd(n - 1), with n == 0 as\n// the base case. Loop over nums and mount whether each is odd or even.\n`,
    expected: ['0 is even', '1 is odd', '2 is even', '3 is odd', '4 is even', '5 is odd', '6 is even', '7 is odd', '8 is even', '9 is odd'],
    hint: 'component isOdd(n) {\n  route (n == 0) {\n    return 0\n  } else {\n    return isEven(n - 1)\n  }\n}\ncomponent isEven(n) {\n  route (n == 0) {\n    return 1\n  } else {\n    return isOdd(n - 1)\n  }\n}\nfor each n in nums {\n  route (isEven(n)) {\n    mount(`${n} is even`)\n  } else {\n    mount(`${n} is odd`)\n  }\n}',
  },
  {
    id: 'tower-of-hanoi',
    title: 'Level 30 · Tower of Hanoi',
    brief: 'Write a recursive component hanoi(n): the minimum number of moves to solve Tower of Hanoi with n disks is 2 * hanoi(n - 1) + 1, with hanoi(0) = 0. Loop over disks and mount `${n} disks: ${hanoi(n)} moves` for each.',
    starter: `state disks = [1, 2, 3, 4, 5, 6, 7, 8]\n\n// Write a recursive component hanoi(n): the minimum move count to\n// solve Tower of Hanoi with n disks. Loop over disks and mount the\n// move count for each.\n`,
    expected: ['1 disks: 1 moves', '2 disks: 3 moves', '3 disks: 7 moves', '4 disks: 15 moves', '5 disks: 31 moves', '6 disks: 63 moves', '7 disks: 127 moves', '8 disks: 255 moves'],
    hint: 'component hanoi(n) {\n  route (n == 0) {\n    return 0\n  } else {\n    return (2 * hanoi(n - 1)) + 1\n  }\n}\nfor each n in disks {\n  mount(`${n} disks: ${hanoi(n)} moves`)\n}',
  },
  {
    id: 'number-staircase',
    title: 'Level 31 · Number Staircase',
    brief: 'For each row, build a line containing the numbers 1 through row, space-separated, by looping over rows again as a bounded inner loop (append `${col} ` while col <= row). Mount the finished line for each row.',
    starter: `state rows = [1, 2, 3, 4, 5]\n\n// For each row, build a line listing the numbers 1 through row\n// (space-separated) using a bounded inner loop over rows. Mount the\n// finished line for each row.\n`,
    expected: ['1', '1 2', '1 2 3', '1 2 3 4', '1 2 3 4 5'],
    hint: 'for each row in rows {\n  hook line = ""\n  for each col in rows {\n    route (col <= row) {\n      line = line + `${col} `\n    }\n  }\n  mount(line)\n}',
  },
  {
    id: 'sum-of-squares',
    title: 'Level 32 · Sum of Squares',
    brief: 'Write a recursive component sumSquares(n) that adds n * n to the sum of squares up to n - 1, with sumSquares(0) = 0. Loop over ns and mount `Sum of squares to ${n}: ${sumSquares(n)}` for each.',
    starter: `state ns = [3, 5, 10]\n\n// Write a recursive component sumSquares(n) that adds n squared to\n// the sum of squares up to n - 1. Loop over ns and mount the result\n// for each.\n`,
    expected: ['Sum of squares to 3: 14', 'Sum of squares to 5: 55', 'Sum of squares to 10: 385'],
    hint: 'component sumSquares(n) {\n  route (n == 0) {\n    return 0\n  } else {\n    return (n * n) + sumSquares(n - 1)\n  }\n}\nfor each n in ns {\n  mount(`Sum of squares to ${n}: ${sumSquares(n)}`)\n}',
  },
  {
    id: 'balanced-parens',
    title: 'Level 33 · Balanced Parentheses',
    brief: 'Write component checkBalance(tokens): loop over the list tracking a depth hook (+1 for "(", -1 for ")") and a broke hook that flags if depth ever goes negative. Return "Unbalanced" if broke or the final depth isn\'t 0, otherwise "Balanced". Mount the verdict for seq1, seq2, and seq3.',
    starter: `state seq1 = ["(", "(", ")", "(", ")", ")"]\nstate seq2 = ["(", ")", ")"]\nstate seq3 = ["(", "(", "("]\n\n// Write component checkBalance(tokens): walk the list tracking a\n// depth hook (+1 for "(", -1 for ")"), and return "Unbalanced" if\n// depth ever goes negative or doesn't end at 0, otherwise "Balanced".\n// Mount the verdict for all three sequences.\n`,
    expected: ['Sequence 1: Balanced', 'Sequence 2: Unbalanced', 'Sequence 3: Unbalanced'],
    hint: 'component checkBalance(tokens) {\n  hook depth = 0\n  hook broke = 0\n  for each t in tokens {\n    route (t == "(") {\n      depth = depth + 1\n    } else {\n      depth = depth - 1\n    }\n    route (depth < 0) {\n      broke = 1\n    }\n  }\n  route (broke == 1) {\n    return "Unbalanced"\n  } else {\n    route (depth == 0) {\n      return "Balanced"\n    } else {\n      return "Unbalanced"\n    }\n  }\n}\nmount(`Sequence 1: ${checkBalance(seq1)}`)\nmount(`Sequence 2: ${checkBalance(seq2)}`)\nmount(`Sequence 3: ${checkBalance(seq3)}`)',
  },
  {
    id: 'longest-signal-run',
    title: 'Level 34 · Longest Signal Run',
    brief: 'Loop over signal, tracking the current run of consecutive 1s in one hook and the longest run seen so far in another — reset the current run to 0 whenever you hit a 0. Mount `Longest unbroken signal run: ${longest}` at the end.',
    starter: `state signal = [1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 1]\n\n// Track the longest unbroken run of 1s using two hooks: one for the\n// current run length, one for the longest seen so far. Mount the\n// final longest run.\n`,
    expected: ['Longest unbroken signal run: 4'],
    hint: 'hook current = 0\nhook longest = 0\nfor each s in signal {\n  route (s == 1) {\n    current = current + 1\n    route (current > longest) {\n      longest = current\n    }\n  } else {\n    current = 0\n  }\n}\nmount(`Longest unbroken signal run: ${longest}`)',
  },
  {
    id: 'grand-finale-network-audit',
    title: 'Level 35 · Grand Finale — Network Audit',
    brief: 'The grand finale — combine everything you\'ve learned. Reuse the recursive signalAt(hop) decay component from Level 20 (signalAt(0) = 100, each hop drops 15). For each tower in towers, loop over its hops counting how many readings drop below 50 into a hook that resets every tower; mount `Tower weak hops: ${towerWeak}` for each tower, then mount `Grand total weak hops: ${grandWeak}`.',
    starter: `state towers = [[0, 1, 2, 3], [0, 1, 2], [0, 1, 2, 3, 4, 5]]\n\n// Reuse the recursive signalAt(hop) decay component from Level 20.\n// For each tower (a list of hops), count how many readings drop\n// below 50 into a hook that resets every tower, mount that tower's\n// weak count, then mount the grand total across all towers.\n`,
    expected: ['Tower weak hops: 0', 'Tower weak hops: 0', 'Tower weak hops: 2', 'Grand total weak hops: 2'],
    hint: 'component signalAt(hop) {\n  route (hop == 0) {\n    return 100\n  } else {\n    return signalAt(hop - 1) - 15\n  }\n}\nhook grandWeak = 0\nfor each hops in towers {\n  hook towerWeak = 0\n  for each h in hops {\n    state strength = signalAt(h)\n    route (strength < 50) {\n      towerWeak = towerWeak + 1\n    }\n  }\n  mount(`Tower weak hops: ${towerWeak}`)\n  grandWeak = grandWeak + towerWeak\n}\nmount(`Grand total weak hops: ${grandWeak}`)',
  },
  {
    id: 'power-function',
    title: 'Level 36 · Power Function',
    brief: 'Write a recursive component power(base, exp): power(base, 0) = 1, and each further step multiplies by base once more. Mount the result for the three given base/exponent pairs.',
    starter: `// Write a recursive component power(base, exp): the base case is\n// power(base, 0) = 1, otherwise multiply base by power(base, exp - 1).\n// Mount 2 ^ 10, 3 ^ 4, and 5 ^ 0.\n`,
    expected: ['2 ^ 10 = 1024', '3 ^ 4 = 81', '5 ^ 0 = 1'],
    hint: 'component power(base, exp) {\n  route (exp == 0) {\n    return 1\n  } else {\n    return base * power(base, exp - 1)\n  }\n}\nmount(`2 ^ 10 = ${power(2, 10)}`)\nmount(`3 ^ 4 = ${power(3, 4)}`)\nmount(`5 ^ 0 = ${power(5, 0)}`)',
  },
  {
    id: 'binary-to-decimal',
    title: 'Level 37 · Binary to Decimal',
    brief: 'Loop over each bits array using a hook value that doubles itself and adds the current bit on every step (value = (value * 2) + b). Mount the final decimal value for both bit arrays.',
    starter: `state bits1 = [1, 0, 1, 1]\nstate bits2 = [1, 1, 1, 1, 1]\n\n// Loop over each bits array, doubling a running "value" hook and\n// adding the current bit on every step. Mount the final decimal\n// value for both.\n`,
    expected: ['Bits [1,0,1,1] = 11', 'Bits [1,1,1,1,1] = 31'],
    hint: 'hook value1 = 0\nfor each b in bits1 {\n  value1 = (value1 * 2) + b\n}\nhook value2 = 0\nfor each b in bits2 {\n  value2 = (value2 * 2) + b\n}\nmount(`Bits [1,0,1,1] = ${value1}`)\nmount(`Bits [1,1,1,1,1] = ${value2}`)',
  },
  {
    id: 'digit-sum',
    title: 'Level 38 · Digit Sum',
    brief: 'Loop over each digits array, accumulating a running sum hook. Mount the total for both digit arrays.',
    starter: `state digits1 = [4, 9, 2, 7]\nstate digits2 = [1, 0, 0, 1]\n\n// Loop over each digits array, adding every digit into a running\n// sum hook. Mount both totals.\n`,
    expected: ['Digit sum of [4,9,2,7]: 22', 'Digit sum of [1,0,0,1]: 2'],
    hint: 'hook sum1 = 0\nfor each d in digits1 {\n  sum1 = sum1 + d\n}\nhook sum2 = 0\nfor each d in digits2 {\n  sum2 = sum2 + d\n}\nmount(`Digit sum of [4,9,2,7]: ${sum1}`)\nmount(`Digit sum of [1,0,0,1]: ${sum2}`)',
  },
  {
    id: 'checksum-digit',
    title: 'Level 39 · Checksum Digit (Luhn-style)',
    brief: 'Reuse the recursive isEven(n) parity check. Loop over digits with an idx hook: at even positions, double the digit and subtract 9 if the result is over 9, otherwise add the digit unchanged. Mount the final checksum total.',
    starter: `state digits = [4, 7, 9, 2, 1, 8, 6, 3]\n\n// Write component isEven(n) (recursive, no % operator). Loop over\n// digits with an idx hook: at even positions, double the digit and\n// subtract 9 if it goes over 9, otherwise add it unchanged. Mount\n// the final checksum total.\n`,
    expected: ['Checksum total: 42'],
    hint: 'component isEven(n) {\n  route (n == 0) {\n    return 1\n  } else {\n    route (n == 1) {\n      return 0\n    } else {\n      return isEven(n - 2)\n    }\n  }\n}\nhook idx = 0\nhook total = 0\nfor each d in digits {\n  route (isEven(idx)) {\n    state doubled = d * 2\n    route (doubled > 9) {\n      total = total + (doubled - 9)\n    } else {\n      total = total + doubled\n    }\n  } else {\n    total = total + d\n  }\n  idx = idx + 1\n}\nmount(`Checksum total: ${total}`)',
  },
  {
    id: 'best-trade',
    title: 'Level 40 · Best Trade',
    brief: 'Loop over prices tracking the lowest price seen so far in one hook, and the best possible profit (current price minus that low) in another, updating both every step. Mount the best profit found.',
    starter: `state prices = [7, 1, 5, 3, 6, 4]\n\n// Loop over prices tracking the lowest price seen so far (minSoFar)\n// and the best profit possible if sold today (current price minus\n// minSoFar), updating both hooks every step. Mount the best profit.\n`,
    expected: ['Best profit: 5'],
    hint: 'hook minSoFar = 999999\nhook maxProfit = 0\nfor each p in prices {\n  route (p < minSoFar) {\n    minSoFar = p\n  }\n  state profit = p - minSoFar\n  route (profit > maxProfit) {\n    maxProfit = profit\n  }\n}\nmount(`Best profit: ${maxProfit}`)',
  },
  {
    id: 'longest-increasing-streak',
    title: 'Level 41 · Longest Increasing Streak',
    brief: "Loop over values tracking a running streak hook (reset to 1 whenever the value doesn't increase) and a longest hook for the best streak seen — skip the comparison on the very first value using an isFirst flag. Mount the longest streak.",
    starter: `state values = [1, 2, 2, 3, 1, 5, 6, 7, 2]\n\n// Loop over values tracking a running "streak" hook (reset to 1\n// whenever the value doesn't strictly increase) and a "longest" hook\n// for the best streak seen. Use an isFirst flag hook so the very\n// first value doesn't get compared against anything. Mount the\n// longest streak found.\n`,
    expected: ['Longest increasing streak: 4'],
    hint: 'hook streak = 1\nhook longest = 1\nhook prevVal = 0\nhook isFirst = 1\nfor each v in values {\n  route (isFirst) {\n    isFirst = 0\n  } else {\n    route (v > prevVal) {\n      streak = streak + 1\n    } else {\n      streak = 1\n    }\n  }\n  route (streak > longest) {\n    longest = streak\n  }\n  prevVal = v\n}\nmount(`Longest increasing streak: ${longest}`)',
  },
  {
    id: 'array-max',
    title: 'Level 42 · Array Maximum',
    brief: 'Loop over readings, updating a max hook whenever a value beats it. Mount the max.',
    starter: `state readings = [42, 17, 88, 63, 29]\n\n// Loop over readings, keeping a max hook updated whenever a value\n// beats it. Mount the max.\n`,
    expected: ['Max: 88'],
    hint: 'hook max = -999999\nfor each r in readings {\n  route (r > max) {\n    max = r\n  }\n}\nmount(`Max: ${max}`)',
  },
  {
    id: 'array-min',
    title: 'Level 43 · Array Minimum',
    brief: 'Loop over readings, updating a min hook whenever a value beats it. Mount the min.',
    starter: `state readings = [42, 17, 88, 63, 29]\n\n// Loop over readings, keeping a min hook updated whenever a value\n// beats it. Mount the min.\n`,
    expected: ['Min: 17'],
    hint: 'hook min = 999999\nfor each r in readings {\n  route (r < min) {\n    min = r\n  }\n}\nmount(`Min: ${min}`)',
  },
  {
    id: 'is-sorted',
    title: 'Level 44 · Is It Sorted?',
    brief: 'Write component checkSorted(arr): loop over the list tracking the previous value in a hook, flipping a sorted hook to 0 if any value is smaller than what came before. Return sorted, and mount "Sorted"/"Not sorted" for seq1 and seq2.',
    starter: `state seq1 = [3, 7, 7, 9, 12]\nstate seq2 = [5, 2, 8, 1]\n\n// Write component checkSorted(arr): loop over the list tracking the\n// previous value in a hook, flipping a "sorted" hook to 0 if any\n// value is smaller than the one before it. Return sorted (1 or 0).\n// Mount "Sorted" or "Not sorted" for seq1 and seq2.\n`,
    expected: ['Sequence 1: Sorted', 'Sequence 2: Not sorted'],
    hint: 'component checkSorted(arr) {\n  hook prevVal = -999999\n  hook sorted = 1\n  for each x in arr {\n    route (x < prevVal) {\n      sorted = 0\n    }\n    prevVal = x\n  }\n  return sorted\n}\nroute (checkSorted(seq1)) {\n  mount("Sequence 1: Sorted")\n} else {\n  mount("Sequence 1: Not sorted")\n}\nroute (checkSorted(seq2)) {\n  mount("Sequence 2: Sorted")\n} else {\n  mount("Sequence 2: Not sorted")\n}',
  },
  {
    id: 'second-largest',
    title: 'Level 45 · Second Largest',
    brief: 'Loop over nums tracking both largest and second hooks in a single pass — when a new value beats largest, the old largest becomes the new second; otherwise check if it beats second instead. Mount both.',
    starter: `state nums = [12, 45, 3, 29, 8]\n\n// Loop over nums tracking both a largest and a second hook in one\n// pass. When a value beats largest, the old largest slides down into\n// second before largest is updated; otherwise check if it beats\n// second instead. Mount both.\n`,
    expected: ['Largest: 45', 'Second largest: 29'],
    hint: 'hook largest = -999999\nhook second = -999999\nfor each n in nums {\n  route (n > largest) {\n    second = largest\n    largest = n\n  } else {\n    route (n > second) {\n      second = n\n    }\n  }\n}\nmount(`Largest: ${largest}`)\nmount(`Second largest: ${second}`)',
  },
  {
    id: 'sum-even-positions',
    title: 'Level 46 · Sum at Even Positions',
    brief: "Reuse the recursive isEven(n) parity check. Loop over values with a manual idx hook (there's no built-in index), adding to a total hook only when idx is even. Mount the total.",
    starter: `state values = [10, 3, 20, 7, 30, 1, 40]\n\n// Write component isEven(n) (recursive, no % operator). Loop over\n// values keeping a manual idx hook (Weave has no built-in index),\n// adding to a total hook only when idx is even, and incrementing idx\n// every step. Mount the total.\n`,
    expected: ['Sum at even positions: 100'],
    hint: 'component isEven(n) {\n  route (n == 0) {\n    return 1\n  } else {\n    route (n == 1) {\n      return 0\n    } else {\n      return isEven(n - 2)\n    }\n  }\n}\nhook idx = 0\nhook total = 0\nfor each v in values {\n  route (isEven(idx)) {\n    total = total + v\n  }\n  idx = idx + 1\n}\nmount(`Sum at even positions: ${total}`)',
  },
  {
    id: 'vowel-counter',
    title: 'Level 47 · Vowel Counter',
    brief: 'Write component isVowel(c): since Weave has no || (or) operator, chain nested route/else checks against "a", "e", "i", "o", "u". Loop over word counting how many characters are vowels. Mount the count.',
    starter: `state word = ["f", "i", "j", "i", "a", "n"]\n\n// Write component isVowel(c): Weave has no || (or) operator, so\n// chain nested route/else checks against "a", "e", "i", "o", "u".\n// Loop over word counting how many characters are vowels. Mount the\n// count.\n`,
    expected: ['Vowels found: 3'],
    hint: 'component isVowel(c) {\n  route (c == "a") {\n    return 1\n  } else {\n    route (c == "e") {\n      return 1\n    } else {\n      route (c == "i") {\n        return 1\n      } else {\n        route (c == "o") {\n          return 1\n        } else {\n          route (c == "u") {\n            return 1\n          } else {\n            return 0\n          }\n        }\n      }\n    }\n  }\n}\nhook vowels = 0\nfor each c in word {\n  route (isVowel(c)) {\n    vowels = vowels + 1\n  }\n}\nmount(`Vowels found: ${vowels}`)',
  },
  {
    id: 'run-length-encode',
    title: 'Level 48 · Run-Length Encoding',
    brief: "Loop over signal tracking the current run's value and length in two hooks, appending `${value}x${length} ` to a result string whenever the value changes. Mount the finished string (don't forget to flush the final run after the loop).",
    starter: `state signal = [1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1]\n\n// Loop over signal tracking the current run's value (current) and\n// length (runLen) in two hooks. Whenever the value changes, append\n// \`\${current}x\${runLen} \` to a result string and start a new run.\n// After the loop, flush the final run (nothing changes value at the\n// very end, so it never gets appended inside the loop). Mount result.\n`,
    expected: ['1x3 0x2 1x2 0x3 1x1'],
    hint: 'hook result = ""\nhook current = -1\nhook runLen = 0\nfor each s in signal {\n  route (s == current) {\n    runLen = runLen + 1\n  } else {\n    route (runLen > 0) {\n      result = result + `${current}x${runLen} `\n    }\n    current = s\n    runLen = 1\n  }\n}\nresult = result + `${current}x${runLen}`\nmount(result)',
  },
  {
    id: 'total-bill',
    title: 'Level 49 · Total Bill With Quantities',
    brief: "Weave can't index into an array, so to \"unpack\" each [price, qty] pair, loop over its two values with an isFirst flag to tell them apart. Multiply price by qty for every item and mount the grand total.",
    starter: `state items = [[5, 3], [12, 2], [2, 10]]\n\n// Each item is a [price, qty] pair, but Weave can't index into an\n// array — loop over the pair's two values with an isFirst flag hook\n// to tell price from qty. Multiply price by qty for every item,\n// accumulate into a grandTotal hook, and mount it.\n`,
    expected: ['Grand total: $59'],
    hint: 'hook grandTotal = 0\nfor each item in items {\n  hook isFirst = 1\n  hook price = 0\n  hook qty = 0\n  for each part in item {\n    route (isFirst) {\n      price = part\n      isFirst = 0\n    } else {\n      qty = part\n    }\n  }\n  grandTotal = grandTotal + (price * qty)\n}\nmount(`Grand total: $${grandTotal}`)',
  },
  {
    id: 'grand-finale-2-delivery-audit',
    title: 'Level 50 · Grand Finale II — Fiji Delivery Route Audit (Final)',
    brief: "The second grand finale. Write totalDistance(legs) to sum a route's leg distances, and overLimit(legs, limit) to count how many legs exceed the limit. For each route in routes, mount its distance and flagged-leg count, accumulating both into grand total hooks, then mount the grand totals.",
    starter: `state routes = [[12, 8, 15, 6], [20, 5, 9], [3, 3, 3, 3, 3, 3]]\n\n// Write component totalDistance(legs): sums a route's leg distances.\n// Write component overLimit(legs, limit): counts how many legs\n// exceed limit. For each route in routes, mount its distance and\n// flagged-leg count (limit 10), accumulating both into grand total\n// hooks, then mount the grand totals.\n`,
    expected: [
      'Route distance: 41, legs over 10km: 2',
      'Route distance: 34, legs over 10km: 1',
      'Route distance: 18, legs over 10km: 0',
      'Grand total distance: 93',
      'Grand total flagged legs: 3',
    ],
    hint: 'component overLimit(legs, limit) {\n  hook flagged = 0\n  for each leg in legs {\n    route (leg > limit) {\n      flagged = flagged + 1\n    }\n  }\n  return flagged\n}\ncomponent totalDistance(legs) {\n  hook total = 0\n  for each leg in legs {\n    total = total + leg\n  }\n  return total\n}\nhook grandTotal = 0\nhook grandFlags = 0\nfor each route1 in routes {\n  state dist = totalDistance(route1)\n  state flags = overLimit(route1, 10)\n  grandTotal = grandTotal + dist\n  grandFlags = grandFlags + flags\n  mount(`Route distance: ${dist}, legs over 10km: ${flags}`)\n}\nmount(`Grand total distance: ${grandTotal}`)\nmount(`Grand total flagged legs: ${grandFlags}`)',
  },
];

export const SANDBOX_SAMPLE = `component greet(name) {
  return \`Hello, \${name}! Welcome to Weave.\`
}

state siteName = "LvTS Portfolio"
state visitors = ["Josese", "Ana", "Sam"]

mount(\`=== \${siteName} ===\`)

hook counter = 0

for each visitor in visitors {
  mount(greet(visitor))
  counter = counter + 1
}

mount(\`Visitors greeted: \${counter}\`)

route (counter > 2) {
  fetch(300)
  mount("Busy site! Data loaded after a short delay.")
} else {
  mount("Quiet day.")
}
`;

export const CHEATSHEET: { code: string; desc: string }[] = [
  { code: 'state x = v', desc: 'declare a variable' },
  { code: 'hook x = v', desc: 'variable that persists across loop iterations' },
  { code: 'component f(a) { }', desc: 'define a function' },
  { code: 'mount(x)', desc: 'output / print' },
  { code: 'route (c) { } else { }', desc: 'if / else' },
  { code: 'for each x in list { }', desc: 'loop over a list' },
  { code: 'return v', desc: 'return a value from a component' },
  { code: 'fetch(ms)', desc: 'fake async delay' },
  { code: '`text ${x}`', desc: 'string interpolation' },
];
