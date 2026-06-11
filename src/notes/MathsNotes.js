// src/notes/MathsNotes.js

const MathsNotes = {

  'Sets': {
    intro: 'Sets and their Representations, Operations and Laws',
    sections: [
      {
        title: 'Sets and their Representations',
        content: 'A set is a well-defined collection of objects. Sets are denoted by capital letters A, B, C... and elements by small letters a, b, c...',
        bullets: [
          'If a is an element of set A, we write $a \\in A$ (belongs to). If not, $b \\notin A$.',
          'Roster/Tabular form: elements listed inside curly brackets, separated by commas. e.g. {2, 4, 6} = set of even positive integers less than 7.',
          'Set-builder form: V = {x : x is a vowel in English alphabet}.',
          'Cardinality $n(A)$: number of elements. If A = {1, 4, 8, 9, 10} then $n(A) = 5$.',
        ],
      },
      {
        title: 'The Empty Set',
        content: 'A set that does not contain any element is called the empty set (null set / void set), denoted by $\\phi$ or {}.',
        bullets: [
          'Set of odd natural numbers divisible by 2 is empty.',
          'A = {x : 1 < x < 2, x is a natural number} -- empty, no natural number between 1 and 2.',
          'C = {x : x is an even prime number greater than 2} -- empty, 2 is the only even prime.',
          'D = {x : $x^2 = 4$, x is odd} -- empty, no odd value satisfies this.',
        ],
      },
      {
        title: 'Types of Sets',
        bullets: [
          'Finite set: empty or definite number of elements. e.g. W = set of days of the week.',
          'Infinite set: indefinite number of elements. e.g. G = set of points on a line; {1, 3, 5, 7, ...}.',
          'Equal sets: A = B if they have exactly the same elements. e.g. A = {1,2,3,4}, B = {3,1,4,2} => A = B.',
          'Equivalent sets: same cardinality (number of elements) but not necessarily same elements.',
          'Two sets A and B are equal if $A \\subset B$ and $B \\subset A$.',
        ],
      },
      {
        title: 'Subsets and Intervals',
        content: 'A is a subset of B ($A \\subseteq B$) if every element of A is also in B. If $A \\subset B$ and $A \\neq B$, then A is a proper subset of B.',
        images: ['open_interval', 'half_open_left', 'half_open_right'],
        imageLabels: ['Open interval (a,b) -- both endpoints excluded', 'Half-open [a,b) -- a included, b excluded', 'Half-open (a,b] -- a excluded, b included'],
        bullets: [
          'Every set is a subset of itself: $A \\subseteq A$.',
          'Empty set $\\phi$ is a subset of every set.',
          '$N \\subset Z \\subset Q$, $Q \\subset R$, $T \\subset R$, $N \\not\\subset T$ (N = naturals, Z = integers, Q = rationals, T = irrationals, R = reals).',
          'Open interval: $(a, b) = \\{x : a < x < b\\}$ -- endpoints excluded.',
          'Closed interval: $[a, b] = \\{x : a \\leq x \\leq b\\}$ -- endpoints included.',
          '$[a, b) = \\{x : a \\leq x < b\\}$; $(a, b] = \\{x : a < x \\leq b\\}$.',
          'Length of interval = $b - a$.',
        ],
      },
      {
        title: 'Universal Set and Venn Diagrams',
        images: ['venn_universal'],
        imageLabels: ['Venn diagram: U = {1..10}, A = {2,4,6,8,10}, B = {4,6}'],
        bullets: [
          'Universal set U: set of all elements under consideration; all other sets are subsets of U.',
          'In human population studies, U = all people in the world.',
          'Venn diagrams: rectangles represent U; circles represent subsets.',
          'Elements of sets written in their respective circles.',
        ],
      },
      {
        title: 'Union of Sets',
        content: 'A ∪ B = {x : x ∈ A or x ∈ B} -- all elements in A or B or both.',
        bullets: [
          'If $B \\subset A$, then $A \\cup B = A$.',
          'Commutative law: $A \\cup B = B \\cup A$.',
          'Associative law: $(A \\cup B) \\cup C = A \\cup (B \\cup C)$.',
          'Identity: $A \\cup \\phi = A$.',
          'Idempotent: $A \\cup A = A$.',
          'Law of U: $U \\cup A = U$.',
          'Distributive: $A \\cup (B \\cap C) = (A \\cup B) \\cap (A \\cup C)$.',
        ],
      },
      {
        title: 'Intersection of Sets',
        content: 'A ∩ B = {x : x ∈ A and x ∈ B} -- elements common to both A and B.',
        images: ['venn_intersection', 'venn_intersection3'],
        imageLabels: ['Venn diagram: A ∩ B (two sets)', 'Venn diagram: A ∩ B ∩ C (three sets)'],
        bullets: [
          'If $B \\subset A$, then $A \\cap B = B$.',
          'Commutative: $A \\cap B = B \\cap A$.',
          'Associative: $(A \\cap B) \\cap C = A \\cap (B \\cap C)$.',
          'Law of $\\phi$ and U: $\\phi \\cap A = \\phi$; $U \\cap A = A$.',
          'Idempotent: $A \\cap A = A$.',
          'Distributive: $A \\cap (B \\cup C) = (A \\cap B) \\cup (A \\cap C)$.',
        ],
      },
      {
        title: 'Difference of Sets',
        content: 'A - B = {x : x ∈ A and x ∉ B} -- elements in A but not in B.',
        images: ['venn_difference', 'venn_ab_parts'],
        imageLabels: ['Venn diagram: A - B', 'Venn diagram: A-B, A∩B and B-A are mutually disjoint'],
        bullets: [
          '$A - B \\neq B - A$ (in general).',
          'The sets A - B, A ∩ B and B - A are mutually disjoint.',
          '$A - B = A \\cap B\'$.',
        ],
      },
      {
        title: 'Complement of a Set',
        content: "A' = U - A = {x : x ∈ U and x ∉ A}",
        images: ['venn_complement'],
        imageLabels: ["Venn diagram: Complement A' (shaded blue region outside A)"],
        bullets: [
          "$A \\cup A' = U$",
          "$A \\cap A' = \\phi$",
          "De Morgan's Law: $(A \\cup B)' = A' \\cap B'$; $(A \\cap B)' = A' \\cup B'$",
          "Double complementation: (A')'= A",
          "phi' = U and U' = phi",
        ],
      },
      {
        title: 'Cardinality Formula',
        content: '$$n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$$',
        bullets: [
          'For three sets: $n(A \\cup B \\cup C) = n(A) + n(B) + n(C) - n(A \\cap B) - n(B \\cap C) - n(A \\cap C) + n(A \\cap B \\cap C)$',
          'Power set $P(A)$: collection of all subsets. If $|A| = n$ then $|P(A)| = 2^n$.',
        ],
      },
    ],
  },

  'Relations and Functions': {
    intro: 'Cartesian Product, Relations and Functions',
    sections: [
      {
        title: 'Ordered Pairs',
        content: 'An ordered pair consists of two objects in a given fixed order. Two ordered pairs are equal iff corresponding first elements are equal and second elements are also equal.',
        bullets: [
          'If $(x+1, y-2) = (3, 1)$, then $x = 2$ and $y = 3$.',
          'Ordered pair is not a set -- the ordering matters.',
          '$A \\times A \\times A = \\{(a, b, c) : a, b, c \\in A\\}$ -- ordered triplet.',
        ],
      },
      {
        title: 'Cartesian Product of Sets',
        content: 'For two non-empty sets A and B: $$A \\times B = \\{(a, b) : a \\in A,\\ b \\in B\\}$$',
        images: ['cartesian_product'],
        imageLabels: ['Cartesian product A x B illustrated with two sets'],
        bullets: [
          'If $P$ or $Q$ is null, then $P \\times Q = \\phi$.',
          'If $n(A) = p$ and $n(B) = q$, then $n(A \\times B) = pq$.',
          'If A or B is infinite, then $A \\times B$ is also infinite.',
          '$A \\times B \\neq B \\times A$ in general.',
        ],
      },
      {
        title: 'Relations',
        content: 'A relation R from set A to set B is a subset of $A \\times B$. The set of all first elements is the domain; the set of all second elements is the range.',
        bullets: [
          'Number of possible relations from A to B: $2^{n(A) \\cdot n(B)}$.',
          'Identity relation: $R = \\{(a, a) : a \\in A\\}$.',
          'Universal relation: $R = A \\times A$.',
          'Empty relation: $R = \\phi$.',
        ],
      },
      {
        title: 'Types of Relations',
        bullets: [
          'Reflexive: $(a, a) \\in R$ for all $a \\in A$.',
          'Symmetric: $(a, b) \\in R \\Rightarrow (b, a) \\in R$.',
          'Transitive: $(a, b) \\in R$ and $(b, c) \\in R \\Rightarrow (a, c) \\in R$.',
          'Equivalence relation: reflexive + symmetric + transitive.',
        ],
      },
      {
        title: 'Functions',
        content: 'A function f: A → B is a relation where every element of A has exactly one image in B.',
        bullets: [
          'Domain: set A. Codomain: set B. Range: actual output values ⊆ B.',
          'One-one (Injective): $f(a_1) = f(a_2) \\Rightarrow a_1 = a_2$.',
          'Onto (Surjective): Range = Codomain.',
          'Bijective: both one-one and onto.',
          'Identity: $f(x) = x$. Constant: $f(x) = c$.',
          'Modulus: $f(x) = |x|$. Signum: $f(x) = 1$ if $x>0$, $0$ if $x=0$, $-1$ if $x<0$.',
          'Greatest integer: $f(x) = \\lfloor x \\rfloor$.',
        ],
      },
      {
        title: 'Composition and Inverse',
        content: 'Composition: $(f \\circ g)(x) = f(g(x))$. Inverse $f^{-1}$ exists only if f is bijective.',
        bullets: [
          '$f \\circ g \\neq g \\circ f$ in general.',
          '$(f \\circ g)^{-1} = g^{-1} \\circ f^{-1}$.',
          'If $f(x) = y$ then $f^{-1}(y) = x$.',
        ],
      },
    ],
  },

  'Trigonometric Functions': {
    intro: 'Angles, Radian Measure, Identities and Compound Angles',
    sections: [
      {
        title: 'Angles',
        content: 'Angle is a measure of rotation of a ray about its initial point. Anticlockwise = positive angle; Clockwise = negative angle.',
        images: ['positive_angle', 'negative_angle'],
        imageLabels: ['Positive angle -- anticlockwise rotation from initial to terminal side', 'Negative angle -- clockwise rotation from initial to terminal side'],
        bullets: [
          'Initial side: original ray. Terminal side: final position after rotation. Vertex: point of rotation.',
          'Co-terminal angles: different measures but same initial and terminal sides.',
        ],
      },
      {
        title: 'Degree and Radian Measure',
        images: ['radian_circle'],
        imageLabels: ['1 Radian: angle subtended by arc of length = radius in a unit circle'],
        content: '1 degree = $\\frac{1}{360}$ of a full revolution. $1° = 60\'$, $1\' = 60\"$. Radian: angle subtended at centre by arc of length = radius.',
        bullets: [
          '$2\\pi$ radians $= 360°$, so $\\pi$ radians $= 180°$.',
          '1 radian $= \\frac{180°}{\\pi} \\approx 57°16\'$.',
          '$1° = \\frac{\\pi}{180}$ radian $\\approx 0.01746$ radian.',
          'Arc length: $l = r\\theta$ ($\\theta$ in radians).',
          'Angle between consecutive digits on clock = 30°.',
          'Hour hand: 30° per hour = 0.5° per minute. Minute hand: 6° per minute.',
        ],
      },
      {
        title: 'Degree–Radian Conversion Table',
        images: ['trig_values_table'],
        imageLabels: ['Standard trigonometric values: sin, cos, tan at 0°, 30°, 45°, 60°, 90°, π, 3π/2, 2π'],
        table: {
          headers: ['Degree', '30°', '45°', '60°', '90°', '180°', '270°', '360°'],
          rows: [
            ['Radian', '$\\pi/6$', '$\\pi/4$', '$\\pi/3$', '$\\pi/2$', '$\\pi$', '$3\\pi/2$', '$2\\pi$'],
          ],
        },
      },
      {
        title: 'Trigonometric Functions -- Definitions',
        content: '$\\sin x = 0 \\Rightarrow x = n\\pi$. $\\cos x = 0 \\Rightarrow x = (2n+1)\\frac{\\pi}{2}$.',
        bullets: [
          '$\\text{cosec}\\ x = \\frac{1}{\\sin x}$, $x \\neq n\\pi$',
          '$\\sec x = \\frac{1}{\\cos x}$, $x \\neq (2n+1)\\frac{\\pi}{2}$',
          '$\\tan x = \\frac{\\sin x}{\\cos x}$, $x \\neq (2n+1)\\frac{\\pi}{2}$',
          '$\\cot x = \\frac{\\cos x}{\\sin x}$, $x \\neq n\\pi$',
        ],
      },
      {
        title: 'Pythagorean Identities',
        bullets: [
          '$\\sin^2 x + \\cos^2 x = 1$',
          '$1 + \\tan^2 x = \\sec^2 x$',
          '$1 + \\cot^2 x = \\text{cosec}^2 x$',
        ],
      },
      {
        title: 'Signs in Quadrants (ASTC)',
        content: 'Sign rule -- All/Silver/Tea/Cups (or All Students Take Calculus):',
        bullets: [
          'Quadrant I: All positive.',
          'Quadrant II: Sin, Cosec positive.',
          'Quadrant III: Tan, Cot positive.',
          'Quadrant IV: Cos, Sec positive.',
          '$\\cos(-x) = \\cos x$; $\\sin(-x) = -\\sin x$',
          '$\\cos(2n\\pi + x) = \\cos x$; $\\sin(2n\\pi + x) = \\sin x$',
        ],
      },
      {
        title: 'Domain and Range of Trigonometric Functions',
        table: {
          headers: ['Function', 'Domain', 'Range'],
          rows: [
            ['$\\sin x$', '$\\mathbb{R}$', '$[-1, 1]$'],
            ['$\\cos x$', '$\\mathbb{R}$', '$[-1, 1]$'],
            ['$\\tan x$', '$\\mathbb{R}$ except $(2n+1)\\frac{\\pi}{2}$', '$\\mathbb{R}$'],
            ['$\\cot x$', '$\\mathbb{R}$ except $n\\pi$', '$\\mathbb{R}$'],
            ['$\\text{cosec}\\ x$', '$\\mathbb{R}$ except $n\\pi$', '$(-\\infty,-1] \\cup [1,\\infty)$'],
            ['$\\sec x$', '$\\mathbb{R}$ except $(2n+1)\\frac{\\pi}{2}$', '$(-\\infty,-1] \\cup [1,\\infty)$'],
          ],
        },
      },
      {
        title: 'Compound Angle Formulas',
        bullets: [
          '$\\sin(x+y) = \\sin x\\cos y + \\cos x\\sin y$',
          '$\\sin(x-y) = \\sin x\\cos y - \\cos x\\sin y$',
          '$\\cos(x+y) = \\cos x\\cos y - \\sin x\\sin y$',
          '$\\cos(x-y) = \\cos x\\cos y + \\sin x\\sin y$',
          '$\\tan(x+y) = \\dfrac{\\tan x + \\tan y}{1 - \\tan x\\tan y}$',
          '$\\tan(x-y) = \\dfrac{\\tan x - \\tan y}{1 + \\tan x\\tan y}$',
          '$\\cot(x+y) = \\dfrac{\\cot x\\cot y - 1}{\\cot x + \\cot y}$',
          '$\\cos\\left(\\frac{\\pi}{2}+x\\right) = -\\sin x$; $\\sin\\left(\\frac{\\pi}{2}+x\\right) = \\cos x$',
          '$\\cos(2\\pi - x) = \\cos x$; $\\sin(2\\pi - x) = -\\sin x$',
        ],
      },
      {
        title: 'Double and Triple Angle Formulas',
        bullets: [
          '$\\sin 2x = 2\\sin x\\cos x = \\dfrac{2\\tan x}{1+\\tan^2 x}$',
          '$\\cos 2x = \\cos^2 x - \\sin^2 x = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x = \\dfrac{1-\\tan^2 x}{1+\\tan^2 x}$',
          '$\\tan 2x = \\dfrac{2\\tan x}{1-\\tan^2 x}$',
          '$\\sin 3x = 3\\sin x - 4\\sin^3 x$',
          '$\\cos 3x = 4\\cos^3 x - 3\\cos x$',
          '$\\tan 3x = \\dfrac{3\\tan x - \\tan^3 x}{1 - 3\\tan^2 x}$',
        ],
      },
      {
        title: 'Sum-to-Product and Product-to-Sum',
        bullets: [
          '$\\sin x + \\sin y = 2\\sin\\frac{x+y}{2}\\cos\\frac{x-y}{2}$',
          '$\\sin x - \\sin y = 2\\cos\\frac{x+y}{2}\\sin\\frac{x-y}{2}$',
          '$\\cos x + \\cos y = 2\\cos\\frac{x+y}{2}\\cos\\frac{x-y}{2}$',
          '$\\cos x - \\cos y = -2\\sin\\frac{x+y}{2}\\sin\\frac{x-y}{2}$',
          '$2\\sin x\\cos y = \\sin(x+y) + \\sin(x-y)$',
          '$2\\cos x\\cos y = \\cos(x-y) + \\cos(x+y)$',
          '$-2\\sin x\\sin y = \\cos(x+y) - \\cos(x-y)$',
          '$2\\cos x\\sin y = \\sin(x+y) - \\sin(x-y)$',
        ],
      },
      {
        title: 'General Solutions',
        bullets: [
          '$\\sin\\theta = 0 \\Rightarrow \\theta = n\\pi$, $n \\in \\mathbb{Z}$',
          '$\\cos\\theta = 0 \\Rightarrow \\theta = (2n+1)\\frac{\\pi}{2}$',
          '$\\tan\\theta = 0 \\Rightarrow \\theta = n\\pi$',
          '$\\sin\\theta = \\sin\\alpha \\Rightarrow \\theta = n\\pi + (-1)^n\\alpha$',
          '$\\cos\\theta = \\cos\\alpha \\Rightarrow \\theta = 2n\\pi \\pm \\alpha$',
          '$\\tan\\theta = \\tan\\alpha \\Rightarrow \\theta = n\\pi + \\alpha$',
        ],
      },
    ],
  },

  'Complex Numbers and Quadratic Equations': {
    intro: 'Complex Numbers, Powers of i, Modulus, Conjugate and Argand Plane',
    sections: [
      {
        title: 'Complex Numbers',
        content: 'If $i^2 = -1$, then $i = \\sqrt{-1}$ (iota). Complex number: $z = a + ib$ where $a, b \\in \\mathbb{R}$.',
        bullets: [
          'Real part: $\\text{Re}(z) = a$. Imaginary part: $\\text{Im}(z) = b$.',
          'If $z = 2 + 5i$, then $\\text{Re}(z) = 2$ and $\\text{Im}(z) = 5$.',
          'Every real number is a complex number, but every complex number is not necessarily real.',
          'Two complex numbers $z_1 = a+ib$ and $z_2 = c+id$ are equal iff $a = c$ and $b = d$.',
        ],
      },
      {
        title: 'Powers of i',
        content: '$i^0 = 1,\\ i^1 = i,\\ i^2 = -1,\\ i^3 = -i,\\ i^4 = 1$ (cycle of 4)',
        bullets: [
          '$i^n = i^r$ where $r$ is remainder when $n$ is divided by 4.',
          '$i^{-1} = -i,\\ i^{-2} = -1,\\ i^{-3} = i,\\ i^{-4} = 1$',
          '$i^{-n} = \\frac{1}{i^r}$ where $r$ is remainder when $n$ divided by 4.',
        ],
      },
      {
        title: 'Algebra of Complex Numbers',
        bullets: [
          'Addition: $(a+ib)+(c+id) = (a+c)+i(b+d)$. e.g. $(2+3i)+(-6+5i) = -4+8i$.',
          'Subtraction: $(a+ib)-(c+id) = (a-c)+i(b-d)$. e.g. $(6+3i)-(2-i) = 4+4i$.',
          'Multiplication: $(a+ib)(c+id) = (ac-bd)+i(ad+bc)$. e.g. $(3+5i)(2+6i) = -24+28i$.',
          'Division: $\\frac{z_1}{z_2} = z_1 \\cdot \\frac{1}{z_2}$ where $z_2 \\neq 0$.',
        ],
      },
      {
        title: 'Laws of Addition and Multiplication',
        bullets: [
          'Closure: sum and product of complex numbers is a complex number.',
          'Commutative: $z_1 + z_2 = z_2 + z_1$; $z_1 z_2 = z_2 z_1$.',
          'Associative: $(z_1+z_2)+z_3 = z_1+(z_2+z_3)$.',
          'Additive identity: $0 + 0i = 0$. Additive inverse of $z$: $-z$.',
          'Multiplicative identity: $1 + 0i = 1$.',
          'Multiplicative inverse: $z^{-1} = \\frac{a}{a^2+b^2} + i\\frac{-b}{a^2+b^2}$.',
          'Distributive: $z_1(z_2+z_3) = z_1z_2 + z_1z_3$.',
        ],
      },
      {
        title: 'Identities for Complex Numbers',
        bullets: [
          '$(z_1+z_2)^2 = z_1^2 + z_2^2 + 2z_1z_2$',
          '$(z_1-z_2)^2 = z_1^2 + z_2^2 - 2z_1z_2$',
          '$(z_1+z_2)^3 = z_1^3 + z_2^3 + 3z_1^2z_2 + 3z_2^2z_1$',
          '$(z_1-z_2)^3 = z_1^3 - z_2^3 - 3z_1^2z_2 + 3z_2^2z_1$',
          '$z_1^2 - z_2^2 = (z_1+z_2)(z_1-z_2)$',
        ],
      },
      {
        title: 'Modulus and Conjugate',
        content: 'Modulus: $|z| = \\sqrt{a^2+b^2}$. Conjugate: $\\bar{z} = a - ib$.',
        bullets: [
          '$z \\cdot \\bar{z} = |z|^2$.',
          'Multiplicative inverse: $z^{-1} = \\frac{\\bar{z}}{|z|^2}$.',
          '$|z_1 z_2| = |z_1||z_2|$.',
          '$\\left|\\frac{z_1}{z_2}\\right| = \\frac{|z_1|}{|z_2|}$, provided $|z_2| \\neq 0$.',
          '$\\overline{z_1 \\pm z_2} = \\bar{z_1} \\pm \\bar{z_2}$.',
          '$\\overline{z_1 z_2} = \\bar{z_1}\\bar{z_2}$.',
          '$|z_1 + z_2| \\leq |z_1| + |z_2|$ (triangle inequality).',
        ],
      },
      {
        title: 'Argand Plane',
        content: 'Complex number $z = x + iy$ represented as point $P(x, y)$ in the Argand (complex) plane. Polar form: $z = r(\\cos\\theta + i\\sin\\theta)$ where $r = |z|$.',
        bullets: [
          'Modulus: $r = \\sqrt{x^2+y^2} = |z|$.',
          'Argument: $\\arg(z) = \\theta = \\tan^{-1}(y/x)$.',
          'Principal argument: $-\\pi < \\theta \\leq \\pi$.',
          'Quadrant I: $\\arg(z) = \\theta$.',
          'Quadrant II: $\\arg(z) = \\pi - \\theta$.',
          'Quadrant III: $\\arg(z) = -(\\pi - \\theta)$.',
          'Quadrant IV: $\\arg(z) = -\\theta$.',
        ],
      },
      {
        title: 'Quadratic Equations with Complex Roots',
        content: 'For $ax^2+bx+c=0$ with $a,b,c \\in \\mathbb{R}$ and $b^2-4ac < 0$: $$x = \\frac{-b \\pm i\\sqrt{4ac-b^2}}{2a}$$',
        bullets: [
          'Every polynomial equation of degree $n$ has $n$ roots (real or complex).',
          'Example: $x^2+2=0 \\Rightarrow x^2=-2 \\Rightarrow x = \\pm\\sqrt{2}\\,i$.',
          'Sum of roots: $\\alpha+\\beta = -b/a$. Product: $\\alpha\\beta = c/a$.',
          'Complex roots of real polynomials always occur in conjugate pairs.',
        ],
      },
    ],
  },

  'Linear Inequalities': {
    intro: 'Types of Inequalities and Solving Linear Inequalities',
    sections: [
      {
        title: 'Types of Inequalities',
        content: 'A statement involving $\\geq$ or $\\leq$ (or $>$, $<$) is called an inequality. e.g. $7 > 5$, $5x-3 \\leq 4$.',
        bullets: [
          'Numerical inequalities: do not involve variables. e.g. $5 > 0$, $13 > -2$.',
          'Literal inequalities: involve variables. e.g. $3x - 4 \\leq 15$.',
          'Strict inequalities: involve only $<$ or $>$. e.g. $4x+5 > 20$.',
          'Slack inequalities: involve $\\leq$ or $\\geq$. e.g. $x+2y \\geq 3$.',
          'Linear inequality in one variable: $ax+b > 0$, $ax+b \\geq 0$ etc., $a \\neq 0$.',
          'Linear inequality in two variables: $ax+by > c$. e.g. $x < 2y+5$.',
        ],
      },
      {
        title: 'Rules for Solving Inequalities',
        bullets: [
          'Adding/subtracting same number: inequality sign unchanged.',
          'Multiplying/dividing by positive number: inequality sign unchanged.',
          'Multiplying/dividing by negative number: inequality sign REVERSES.',
          'e.g. $-2x > 4 \\Rightarrow x < -2$ (sign reverses when dividing by $-2$).',
          'e.g. $-5x+3 \\geq 18 \\Rightarrow -5x \\geq 15 \\Rightarrow x \\leq -3$.',
        ],
      },
      {
        title: 'Solving Linear Inequalities in One Variable',
        bullets: [
          'Solve like an equation but reverse sign when multiplying/dividing by negative.',
          '$3x+2 < 14 \\Rightarrow 3x < 12 \\Rightarrow x < 4$. Solution: $(-\\infty, 4)$.',
          'Represent solution on number line: open circle for strict, filled for non-strict.',
        ],
      },
      {
        title: 'Graphical Solution of Linear Inequalities in Two Variables',
        bullets: [
          'Replace inequality with equality to get boundary line.',
          'Strict ($<$, $>$): dashed line (points on line not included).',
          'Non-strict ($\\leq$, $\\geq$): solid line (points on line included).',
          'Shade the half-plane satisfying the inequality (test with origin $(0,0)$).',
          'If origin satisfies it, shade origin side; otherwise shade other side.',
        ],
      },
      {
        title: 'System of Linear Inequalities',
        content: 'Solution of a system is the intersection of solution sets of all inequalities -- the feasible region.',
        bullets: [
          'Graph each inequality separately.',
          'Shade feasible region satisfying ALL inequalities simultaneously.',
          'Feasible region may be bounded or unbounded.',
          'Used in Linear Programming problems.',
        ],
      },
    ],
  },

  'Binomial Theorem': {
    intro: 'Binomial Theorem for Positive Integral Indices and General Term',
    sections: [
      {
        title: 'Binomial Theorem Statement',
        content: 'For any positive integer $n$, the $n$th power of the sum of two numbers $x$ and $y$: $$(x+y)^n = {}^nC_0 x^n y^0 + {}^nC_1 x^{n-1}y^1 + {}^nC_2 x^{n-2}y^2 + \\cdots + {}^nC_n x^0 y^n$$',
        bullets: [
          'Also written as: $(x+y)^n = \\displaystyle\\sum_{k=0}^{n} {}^nC_k x^{n-k}y^k$',
          'Number of terms in expansion = $n+1$. e.g. $(x+y)^4$ has 5 terms.',
          'Coefficients ${}^nC_r$ are called binomial coefficients.',
          'Sum of indices of $x$ and $y$ in every term = $n$.',
          'Index of $x$ decreases by 1 each term; index of $y$ increases by 1.',
        ],
      },
      {
        title: 'Special Cases',
        bullets: [
          '$(x-y)^n = {}^nC_0 x^n - {}^nC_1 x^{n-1}y + {}^nC_2 x^{n-2}y^2 - \\cdots + (-1)^n {}^nC_n y^n$',
          '$(1+x)^n = {}^nC_0 + {}^nC_1 x + {}^nC_2 x^2 + \\cdots + {}^nC_n x^n$',
          '$(1-x)^n = {}^nC_0 - {}^nC_1 x + {}^nC_2 x^2 - \\cdots + (-1)^n {}^nC_n x^n$',
        ],
      },
      {
        title: "Pascal's Triangle",
        content: 'Each entry = sum of two entries directly above it. Row $n$ gives coefficients of $(a+b)^n$.',
        bullets: [
          'Row 0: 1',
          'Row 1: 1  1',
          'Row 2: 1  2  1',
          'Row 3: 1  3  3  1',
          'Row 4: 1  4  6  4  1',
          'Row 5: 1  5  10  10  5  1',
        ],
      },
      {
        title: 'General Term',
        content: 'The $(r+1)$th term (general term) in expansion of $(x+y)^n$: $$T_{r+1} = {}^nC_r\\, x^{n-r}\\, y^r$$',
        bullets: [
          'Coefficient of $(r+1)$th term in $(1+x)^n$ is ${}^nC_r$.',
          'Coefficient of $x^r$ in $(1+x)^n$ is ${}^nC_r$.',
          'Coefficient of $x^r$ in $(1-x)^n$ is $(-1)^n {}^nC_r$.',
        ],
      },
      {
        title: 'Middle Term',
        bullets: [
          'If $n$ is even: one middle term = $T_{n/2+1}$. e.g. in $(x+2y)^8$, middle term is $T_5$.',
          'If $n$ is odd: two middle terms = $T_{(n+1)/2}$ and $T_{(n+3)/2}$. e.g. in $(2x-y)^7$, middle terms are $T_4$ and $T_5$.',
          'In expansion of $\\left(x+\\frac{1}{x}\\right)^{2n}$ (x ≠ 0): middle term is $(n+1)$th term $= {}^{2n}C_n$ (constant).',
        ],
      },
      {
        title: 'Important Results',
        bullets: [
          'Sum of all coefficients: put $x=1$: ${}^nC_0+{}^nC_1+\\cdots+{}^nC_n = 2^n$.',
          'Put $x=-1$: ${}^nC_0-{}^nC_1+{}^nC_2-\\cdots = 0$.',
          'Sum of odd-position coefficients = Sum of even-position coefficients = $2^{n-1}$.',
          "Pascal's rule: ${}^nC_r + {}^nC_{r-1} = {}^{n+1}C_r$.",
          '${}^nC_r = {}^nC_{n-r}$ (symmetry).',
          '$r\\cdot{}^nC_r = n\\cdot{}^{n-1}C_{r-1}$.',
        ],
      },
    ],
  },

  'Sequences and Series': {
    intro: 'Sequences, Series, Arithmetic and Geometric Progressions, Means and Special Series',
    sections: [
      {
        title: 'Sequences (XI-8.1)',
        content: 'A sequence is an ordered list of numbers (or other elements like geometric objects) that often follow a specific pattern or function. The individual elements in a sequence are called terms.',
        bullets: [
          'Finite sequence: contains a finite number of terms and has a last term. e.g. 4, 8, 16, ..., 64 (first term 4, last term 64).',
          'Infinite sequence: a sequence that is not finite, i.e. it has no last term. e.g. {4, 8, 12, 16, 20, 24, ...}.',
          'The general term $a_n$ describes the sequence as a function of its position $n$.',
        ],
      },
      {
        title: 'Series (XI-8.1)',
        content: 'Let $a_1, a_2, a_3, \\ldots$ be a sequence. Then the sum $a_1 + a_2 + a_3 + \\cdots$ is called a series.',
        bullets: [
          'Finite series: has a finite number of terms. e.g. $2 + 4 + 6 + 8 + 10$.',
          'Infinite series: has an infinite number of terms. e.g. $2 + 4 + 6 + \\cdots$.',
        ],
      },
      {
        title: 'Arithmetic Progression (AP)',
        content: 'A sequence where consecutive terms differ by a constant $d$ (common difference).',
        bullets: [
          'General term: $a_n = a + (n-1)d$',
          'Sum of n terms: $S_n = \\frac{n}{2}[2a + (n-1)d] = \\frac{n}{2}(a + l)$ where $l$ = last term.',
          'Three terms in AP: $a-d, a, a+d$.',
          'Arithmetic Mean: $AM = \\frac{a+b}{2}$.',
          'If $A_1, A_2, \\ldots, A_n$ are $n$ AMs between $a$ and $b$: $d = \\frac{b-a}{n+1}$.',
        ],
      },
      {
        title: 'Geometric Progression (G.P.) (XI-8.2)',
        content: 'A sequence is a geometric progression (G.P.) if the ratio of any term to its preceding term is the same throughout. This constant factor is called the common ratio $r$.',
        bullets: [
          'Three terms of a G.P. can be taken as $\\dfrac{a}{r},\\ a,\\ ar$.',
          'Four terms of a G.P. can be taken as $\\dfrac{a}{r^3},\\ \\dfrac{a}{r},\\ ar,\\ ar^3$.',
          'If $a, b, c$ are in G.P. then $ak, bk, ck$ are also in G.P., where $k \\neq 0$.',
          'If each term of a G.P. is raised to some power, the resulting terms are also in G.P.',
          'Reciprocals of the terms of a G.P. always form a G.P.',
        ],
      },
      {
        title: 'General Term of a G.P. (XI-8.2)',
        content: 'The general (or $n$th) term of a G.P. is given by $$a_n = a r^{\\,n-1}$$ where $a$ is the first term and $r$ is the common ratio.',
      },
      {
        title: 'Sum to n Terms of a G.P. (XI-8.2)',
        content: 'The sum $S_n$ of the first $n$ terms of a G.P. (for $r \\neq 1$) is $$S_n = \\frac{a(r^n - 1)}{r - 1} = \\frac{a(1 - r^n)}{1 - r}$$',
        bullets: [
          'For $r = 1$: $S_n = na$.',
          'Sum of an infinite G.P. exists only if $|r| < 1$, and then $S_\\infty = \\dfrac{a}{1 - r}$.',
          'Three terms in G.P.: $a/r, a, ar$.',
        ],
      },
      {
        title: 'Geometric Mean (G.M.) (XI-8.2)',
        content: 'If $a, b, c$ are in G.P., then $b^2 = ac$. The geometric mean between two positive numbers $a$ and $b$ is $$G = \\sqrt{ab}$$',
        bullets: [
          'For $n$ GMs between $a$ and $b$: common ratio $r = \\left(\\frac{b}{a}\\right)^{1/(n+1)}$.',
        ],
      },
      {
        title: 'Relationship Between A.M. and G.M. (XI-8.2)',
        content: 'Let $A$ and $G$ be the A.M. and G.M. of two given positive real numbers $a$ and $b$. Then $$A \\geq G \\quad\\Longleftrightarrow\\quad \\frac{a+b}{2} \\geq \\sqrt{ab}$$ Equality holds if and only if $a = b$.',
      },
      {
        title: 'Special Series',
        bullets: [
          'Sum of first n natural numbers: $\\sum_{k=1}^n k = \\frac{n(n+1)}{2}$',
          'Sum of squares: $\\sum_{k=1}^n k^2 = \\frac{n(n+1)(2n+1)}{6}$',
          'Sum of cubes: $\\sum_{k=1}^n k^3 = \\left[\\frac{n(n+1)}{2}\\right]^2$',
        ],
      },
      {
        title: 'Arithmetico-Geometric Series',
        content: 'Series of form $a, (a+d)r, (a+2d)r^2, \\ldots$. Sum found by multiply-shift-subtract method.',
      },
    ],
  },

  'Straight Lines': {
    intro: 'Coordinate Geometry -- Distance, Section Formula, Slopes and Equations of Lines',
    sections: [
      {
        title: 'Introduction of Straight Lines (XI-9.1)',
        content: 'Basic coordinate-geometry results used throughout the chapter: distance, section formula, midpoint, area of a triangle and collinearity.',
        images: ['sl_internal_division', 'sl_external_division'],
        imageLabels: [
          'Point P divides AB internally in the ratio m : n',
          'Point P divides AB externally in the ratio m : n',
        ],
        bullets: [
          'Distance between $P(x_1, y_1)$ and $Q(x_2, y_2)$: $PQ = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.',
          'Internal division in ratio $m:n$: $P\\left(\\dfrac{mx_2+nx_1}{m+n},\\ \\dfrac{my_2+ny_1}{m+n}\\right)$.',
          'External division in ratio $m:n$: $P\\left(\\dfrac{mx_2-nx_1}{m-n},\\ \\dfrac{my_2-ny_1}{m-n}\\right)$.',
          'Midpoint of $AB$: $\\left(\\dfrac{x_2+x_1}{2},\\ \\dfrac{y_2+y_1}{2}\\right)$.',
          'Area of triangle with vertices $(x_1,y_1),(x_2,y_2),(x_3,y_3)$: $\\dfrac{1}{2}\\,|x_1(y_2-y_3) + x_2(y_3-y_1) + x_3(y_1-y_2)|$.',
          'If the area of triangle $ABC$ is zero, the points $A, B, C$ are collinear (lie on one line).',
        ],
      },
      {
        title: 'Slope of a Line (XI-9.1)',
        content: 'If $\\theta$ is the inclination of a line $l$ with the positive x-axis, then $\\tan\\theta$ is the slope (gradient), denoted $m$. Thus $m = \\tan\\theta$, $\\theta \\neq 90°$.',
        images: ['sl_inclination'],
        imageLabels: ['Inclination θ of a line with the positive x-axis; slope m = tan θ'],
        bullets: [
          'The slope of a line whose inclination is $90°$ is not defined.',
          'Slope of the x-axis is zero; slope of the y-axis is not defined.',
          'If $0° < \\theta < 90°$ then slope $> 0$; if $90° < \\theta < 180°$ then slope $< 0$.',
        ],
      },
      {
        title: 'Slope from Two Points (XI-9.1)',
        content: 'The slope of a line through two given points $(x_1, y_1)$ and $(x_2, y_2)$ is $$m = \\frac{y_2 - y_1}{x_2 - x_1}$$',
        images: ['sl_slope_two_points'],
        imageLabels: ['Slope of a line determined by two points on it'],
      },
      {
        title: 'Conditions for Parallel and Perpendicular Lines (XI-9.1)',
        bullets: [
          'Two lines $l_1$ and $l_2$ are parallel iff their slopes are equal: $m_1 = m_2$.',
          'Two non-vertical lines are perpendicular iff their slopes are negative reciprocals: $m_2 = -\\dfrac{1}{m_1}$, i.e. $m_1 m_2 = -1$.',
        ],
      },
      {
        title: 'Angle Between Two Lines (XI-9.1)',
        content: 'The angle $\\theta$ between two lines with slopes $m_1$ and $m_2$ is $$\\tan\\theta = \\left|\\frac{m_1 - m_2}{1 + m_1 m_2}\\right|,\\quad 1 + m_1 m_2 \\neq 0$$',
      },
      {
        title: 'Horizontal and Vertical Lines (XI-9.2)',
        content: 'A horizontal line at distance $a$ from the x-axis is $y = a$ or $y = -a$. A vertical line at distance $b$ from the y-axis is $x = b$ or $x = -b$.',
        images: ['sl_horizontal_lines', 'sl_vertical_lines'],
        imageLabels: ['Horizontal lines y = a and y = -a', 'Vertical lines x = b and x = -b'],
        bullets: [
          'Equation of the x-axis is $y = 0$.',
          'Equation of the y-axis is $x = 0$.',
        ],
      },
      {
        title: 'Point-Slope Form (XI-9.2)',
        content: 'Equation of a line with slope $m$ passing through a fixed point $(x_0, y_0)$: $$y - y_0 = m(x - x_0)$$',
        images: ['sl_point_slope'],
        imageLabels: ['Line through P₁(x₀, y₀) with slope m'],
        bullets: [
          'Example: line through $(-2, 3)$ with slope $-4$ is $y - 3 = -4(x + 2)$, i.e. $4x + y - 5 = 0$.',
        ],
      },
      {
        title: 'Two-Point Form (XI-9.2)',
        content: 'Equation of the line through points $(x_1, y_1)$ and $(x_2, y_2)$: $$\\frac{y - y_1}{x - x_1} = \\frac{y_2 - y_1}{x_2 - x_1}$$',
        images: ['sl_two_point'],
        imageLabels: ['Line passing through two given points P₁ and P₂'],
        bullets: [
          'Example: line through $(2, 3)$ and $(4, 5)$ gives $\\dfrac{y-3}{x-2} = \\dfrac{5-3}{4-2} = 1$, i.e. $x - y + 1 = 0$.',
        ],
      },
      {
        title: 'Slope-Intercept Form (XI-9.2)',
        content: 'Line with slope $m$ and y-intercept $c$: $y = mx + c$.',
        images: ['sl_slope_intercept', 'sl_through_origin'],
        imageLabels: ['Slope-intercept form: y = mx + c with y-intercept (0, c)', 'Line through the origin: y = mx'],
        bullets: [
          'Line with slope $m$ and x-intercept $d$: $y = m(x - d)$.',
          'Line with slope $m$ passing through the origin: $y = mx$.',
        ],
      },
      {
        title: 'Intercept Form (XI-9.2)',
        content: 'Equation of a line making intercepts $a$ and $b$ on the x-axis and y-axis respectively: $$\\frac{x}{a} + \\frac{y}{b} = 1$$',
        images: ['sl_intercept_form'],
        imageLabels: ['Intercept form: x/a + y/b = 1 with intercepts a and b'],
      },
      {
        title: 'Normal Form and General Form',
        table: {
          headers: ['Form', 'Equation', 'When to Use'],
          rows: [
            ['Normal form', 'x cos α + y sin α = p', 'Perpendicular length p from origin and angle α'],
            ['General form', 'ax + by + c = 0', 'General linear equation in two variables'],
          ],
        },
      },
      {
        title: 'Distance of a Point From a Line (XI-9.3)',
        content: 'Distance of a point $(x_1, y_1)$ from the line $Ax + By + C = 0$: $$d = \\left|\\frac{Ax_1 + By_1 + C}{\\sqrt{A^2 + B^2}}\\right|$$',
        bullets: [
          'Distance between parallel lines $Ax+By+C_1=0$ and $Ax+By+C_2=0$: $d = \\dfrac{|C_1 - C_2|}{\\sqrt{A^2+B^2}}$.',
        ],
      },
      {
        title: 'Shifting of Origin',
        content: 'If the origin is shifted to $(h, k)$, the new coordinates are $X = x - h$, $Y = y - k$. Used to simplify equations.',
      },
    ],
  },

  'Conic Sections': {
    intro: 'Circle, Hyperbola, Ellipse, Parabola and Sections of a Cone',
    sections: [
      {
        title: 'Circles',
        content: 'It is the set of all points in a plane that are equidistant from a fixed point in that plane.',
        images: ['circle_general', 'circle_origin'],
        imageLabels: [
          'Circle with centre (h, k) and radius r: (x − h)² + (y − k)² = r²',
          'Circle with centre at the origin: x² + y² = r²',
        ],
        bullets: [
          'Equation of circle: $(x - h)^2 + (y - k)^2 = r^2$, where centre $= (h, k)$ and radius $= r$.',
          'Equation of circle with centre at the origin: $x^2 + y^2 = r^2$, where radius $= r$.',
        ],
      },
      {
        title: 'Hyperbola',
        content: 'It is the set of all points in a plane, the difference of whose distances from two fixed points in the plane is a constant.',
        images: ['hyperbola_x', 'hyperbola_conjugate'],
        imageLabels: [
          'Standard hyperbola with foci on the x-axis: x²/a² − y²/b² = 1',
          'Conjugate hyperbola: y²/a² − x²/b² = 1',
        ],
        bullets: [
          'Eccentricity of a hyperbola: $e = \\dfrac{c}{a} > 1$.',
          'Relation between $a$, $b$ and $c$: $c = \\sqrt{a^2 + b^2}$.',
          'Standard equation of a hyperbola with foci on the x-axis: $\\dfrac{x^2}{a^2} - \\dfrac{y^2}{b^2} = 1$.',
          'Equation of the conjugate hyperbola: $\\dfrac{y^2}{a^2} - \\dfrac{x^2}{b^2} = 1$.',
          'Latus rectum (chord through foci perpendicular to the major axis) $= \\dfrac{2b^2}{a}$.',
          'A hyperbola in which $a = b$ is called an equilateral hyperbola; its eccentricity is $e = \\sqrt{2}$.',
        ],
      },
      {
        title: 'Ellipses',
        content: 'It is the set of points in a plane the sum of whose distances from two fixed points in the plane is a constant and is always greater than the distance between the fixed points.',
        images: ['ellipse_x', 'ellipse_y'],
        imageLabels: [
          'Ellipse with foci on the x-axis: x²/a² + y²/b² = 1',
          'Ellipse with foci on the y-axis: x²/b² + y²/a² = 1',
        ],
        bullets: [
          'Eccentricity of an ellipse: $e = \\dfrac{c}{a} < 1$.',
          'Relation between $a$, $b$ and $c$: $c = \\sqrt{a^2 - b^2}$.',
          'Equation of an ellipse with foci on the x-axis: $\\dfrac{x^2}{a^2} + \\dfrac{y^2}{b^2} = 1$.',
          'Equation of an ellipse with foci on the y-axis: $\\dfrac{x^2}{b^2} + \\dfrac{y^2}{a^2} = 1$.',
          'Length of latus rectum for an ellipse $= \\dfrac{2b^2}{a}$.',
          'When $c = 0$, both foci merge with the centre and $a^2 = b^2$ (i.e. $a = b$), so the ellipse becomes a circle.',
          'When $c = a$, then $b = 0$ and the ellipse reduces to the line segment $F_1F_2$ joining the two foci.',
        ],
      },
      {
        title: 'Parabola',
        content: 'A parabola is the set of all points in a plane that are equidistant from a fixed line and a fixed point in the plane. The fixed line is called the directrix, the fixed point F is called the focus, and the point of intersection of the parabola with the axis is called the vertex.',
        images: ['parabola_parts', 'parabola_right', 'parabola_left', 'parabola_up', 'parabola_down'],
        imageLabels: [
          'Parts of a parabola: directrix, focus, vertex and axis',
          'y² = 4ax — vertex (0,0), focus (a,0), directrix x = −a, latus rectum 4a',
          'y² = −4ax — vertex (0,0), focus (−a,0), directrix x = a, latus rectum 4a',
          'x² = 4ay — vertex (0,0), focus (0,a), directrix y = −a, latus rectum 4a',
          'x² = −4ay — vertex (0,0), focus (0,−a), directrix y = a, latus rectum 4a',
        ],
        bullets: [
          'Latus rectum: a chord through the focus perpendicular to the axis of the parabola.',
          '$y^2 = 4ax$: vertex $(0,0)$, focus $(a,0)$, directrix $x = -a$, latus rectum $4a$.',
          '$y^2 = -4ax$: vertex $(0,0)$, focus $(-a,0)$, directrix $x = a$, latus rectum $4a$.',
          '$x^2 = 4ay$: vertex $(0,0)$, focus $(0,a)$, directrix $y = -a$, latus rectum $4a$.',
          '$x^2 = -4ay$: vertex $(0,0)$, focus $(0,-a)$, directrix $y = a$, latus rectum $4a$.',
        ],
      },
      {
        title: 'Sections of a Cone',
        content: 'The curves obtained by slicing the cone with a plane not passing through the vertex are called conic sections, or simply conics. Circle, ellipse, parabola and hyperbola are curves obtained by the intersection of a plane and a cone in different positions.',
        bullets: [
          'A conic is the locus of a point which moves in a plane so that its distance from a fixed point bears a constant ratio to its distance from a fixed straight line.',
          'The fixed point is called the focus, the fixed straight line is called the directrix, and the constant ratio is called the eccentricity, denoted by $e$.',
        ],
      },
    ],
  },

  'Introduction to 3D Geometry': {
    intro: '3D Coordinate System, Octants, Distance and Section Formulas',
    sections: [
      {
        title: 'Coordinate Axes and Coordinate Planes in 3D Space (XI-11.1)',
        content: 'In three dimensions, the coordinate axes of a rectangular Cartesian system are three mutually perpendicular lines: the x, y and z-axes. The three planes determined by pairs of axes are the coordinate planes XY, YZ and ZX.',
        images: ['octants_3d'],
        imageLabels: ['The three coordinate planes divide space into eight octants'],
        bullets: [
          'The three coordinate planes divide space into eight parts called octants.',
          "Octants: OXYZ, OX'YZ, OXY'Z, OXYZ', OX'Y'Z, OXY'Z', OX'YZ', OX'Y'Z'.",
          'Origin $O = (0, 0, 0)$.',
        ],
      },
      {
        title: 'Sign Rule in the Eight Octants',
        content: 'The signs of the coordinates $(x, y, z)$ in each of the eight octants:',
        table: {
          headers: ['Coordinate', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'],
          rows: [
            ['x', '+', '-', '-', '+', '+', '-', '-', '+'],
            ['y', '+', '+', '-', '-', '+', '+', '-', '-'],
            ['z', '+', '+', '+', '+', '-', '-', '-', '-'],
          ],
        },
      },
      {
        title: 'Coordinates of a Point in Space (XI-11.1)',
        content: 'The coordinates of a point P in 3D are written as an ordered triplet $(x, y, z)$, where $x, y, z$ are the distances from the YZ, ZX and XY-planes respectively.',
        bullets: [
          'Points on the x-axis, y-axis, z-axis have the form $(x,0,0)$, $(0,y,0)$, $(0,0,z)$.',
          'Points on the xy, yz, xz-planes have the form $(x,y,0)$, $(0,y,z)$, $(x,0,z)$.',
          'Reflection of $(x,y,z)$ in the xy-, yz- and xz-planes is $(x,y,-z)$, $(-x,y,z)$ and $(x,-y,z)$ respectively.',
          'The absolute values of the coordinates of $P(x,y,z)$ give its perpendicular distances from the YZ, ZX and XY-planes.',
          'Foot of perpendicular from $P(a,b,c)$ to the XY-plane is $(a,b,0)$.',
        ],
      },
      {
        title: 'Distance Between Two Points (XI-11.2)',
        content: 'Distance between $P(x_1,y_1,z_1)$ and $Q(x_2,y_2,z_2)$: $$PQ = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2 + (z_2-z_1)^2}$$',
        bullets: [
          'Distance of $P(x,y,z)$ from the origin: $OP = \\sqrt{x^2 + y^2 + z^2}$.',
        ],
      },
      {
        title: 'Section Formula in 3D',
        content: 'Point dividing PQ in the ratio $m:n$ internally: $$R = \\left(\\frac{mx_2+nx_1}{m+n}, \\frac{my_2+ny_1}{m+n}, \\frac{mz_2+nz_1}{m+n}\\right)$$',
        bullets: [
          'Midpoint: $\\left(\\frac{x_1+x_2}{2}, \\frac{y_1+y_2}{2}, \\frac{z_1+z_2}{2}\\right)$.',
          'For external division: replace $+$ with $-$ in the numerator (use ratio $m:-n$).',
        ],
      },
      {
        title: 'Centroid of a Triangle',
        content: 'Centroid of a triangle with vertices $(x_1,y_1,z_1)$, $(x_2,y_2,z_2)$, $(x_3,y_3,z_3)$: $$G = \\left(\\frac{x_1+x_2+x_3}{3}, \\frac{y_1+y_2+y_3}{3}, \\frac{z_1+z_2+z_3}{3}\\right)$$',
      },
      {
        title: 'Direction Cosines and Ratios',
        content: 'Direction cosines $(l, m, n)$ of a line are the cosines of the angles it makes with the x, y, z axes. $$l^2 + m^2 + n^2 = 1$$',
        bullets: [
          'Direction ratios $(a, b, c)$ are proportional to $l, m, n$.',
          '$l = \\frac{a}{\\sqrt{a^2+b^2+c^2}}$, $m = \\frac{b}{\\sqrt{a^2+b^2+c^2}}$, $n = \\frac{c}{\\sqrt{a^2+b^2+c^2}}$.',
        ],
      },
    ],
  },

  'Limits and Derivatives': {
    intro: 'Limits, Standard Results and Differentiation',
    sections: [
      {
        title: 'Intuitive Idea of Derivatives (XI-12.1)',
        content: 'The derivative of a function is the slope of the line tangent to the curve at each point. If $y = f(x)$ is a curve, then the slope of the tangent at the point $(h, k)$ is $$m = \\left[\\frac{dy}{dx}\\right]_{(h,k)}$$',
      },
      {
        title: 'Concept of Limit (XI-12.1)',
        content: 'The limit of a function at a point is the common value of the left-hand and right-hand limits, when they coincide. $\\lim_{x\\to c} f(x) = l$ iff $\\lim_{x\\to c^-} f(x) = \\lim_{x\\to c^+} f(x) = l$.',
        bullets: [
          'Left-hand limit: $\\lim_{x \\to c^-} f(x)$. Right-hand limit: $\\lim_{x \\to c^+} f(x)$.',
          'A limit exists iff LHL = RHL.',
          'A limit may exist even if $f(c)$ is not defined.',
        ],
      },
      {
        title: 'Algebra of Limits (XI-12.1)',
        bullets: [
          '$\\lim_{x\\to a}[f(x) + g(x)] = \\lim_{x\\to a} f(x) + \\lim_{x\\to a} g(x)$',
          '$\\lim_{x\\to a}[f(x) - g(x)] = \\lim_{x\\to a} f(x) - \\lim_{x\\to a} g(x)$',
          '$\\lim_{x\\to a}[f(x) \\cdot g(x)] = \\lim_{x\\to a} f(x) \\cdot \\lim_{x\\to a} g(x)$',
          '$\\lim_{x\\to a}\\dfrac{f(x)}{g(x)} = \\dfrac{\\lim_{x\\to a} f(x)}{\\lim_{x\\to a} g(x)}$, provided $\\lim_{x\\to a} g(x) \\neq 0$',
          '$\\lim_{x\\to c} x^n = c^n$, for all $n \\in \\mathbb{N}$',
        ],
      },
      {
        title: 'Standard Limits (XI-12.1)',
        bullets: [
          '$\\lim_{x \\to a} \\dfrac{x^n - a^n}{x - a} = n\\,a^{n-1}$',
          '$\\lim_{x \\to 0} \\dfrac{e^x - 1}{x} = 1$',
          '$\\lim_{x \\to 0} \\dfrac{a^x - 1}{x} = \\log_e a$',
          '$\\lim_{x \\to 0} \\dfrac{\\log(1 + x)}{x} = 1$',
          '$\\lim_{x \\to 0} (1 + x)^{1/x} = e$',
          '$\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e$',
        ],
      },
      {
        title: 'Limits of Trigonometric Functions (XI-12.1)',
        bullets: [
          '$\\lim_{x \\to 0} \\dfrac{\\sin x}{x} = 1$ (x in radians)',
          '$\\lim_{x \\to 0} \\dfrac{\\tan x}{x} = 1$',
          '$\\lim_{x \\to 0} \\dfrac{1 - \\cos x}{x} = 0$',
        ],
      },
      {
        title: 'Derivatives — First Principles (XI-12.2)',
        content: 'For a real-valued function $f$ and a point $a$ in its domain, the derivative of $f$ at $a$ is $$f\'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}$$ It is also denoted $\\left.\\dfrac{d}{dx} f(x)\\right|_{x=a}$ or $\\left.\\dfrac{df}{dx}\\right|_{x=a}$.',
      },
      {
        title: 'Standard Derivatives (XI-12.2)',
        table: {
          headers: ['Function', 'Derivative'],
          rows: [
            ['$x^n$', '$n x^{n-1}$'],
            ['$\\sqrt{x}$', '$\\dfrac{1}{2\\sqrt{x}}$'],
            ['constant', '$0$'],
            ['$\\sin x$', '$\\cos x$'],
            ['$\\cos x$', '$-\\sin x$'],
            ['$\\tan x$', '$\\sec^2 x$'],
            ['$\\cot x$', '$-\\text{cosec}^2 x$'],
            ['$\\sec x$', '$\\sec x \\tan x$'],
            ['$\\text{cosec}\\ x$', '$-\\text{cosec}\\ x \\cot x$'],
            ['$e^x$', '$e^x$'],
            ['$\\ln x$', '$1/x$'],
          ],
        },
      },
      {
        title: 'Rules of Differentiation (XI-12.2)',
        bullets: [
          'Scalar multiple: $\\dfrac{d}{dx}[a\\,f(x)] = a\\,\\dfrac{d}{dx}f(x)$, where $a$ is constant.',
          'Sum/Difference: $\\dfrac{d}{dx}[f(x) \\pm g(x)] = \\dfrac{d}{dx}f(x) \\pm \\dfrac{d}{dx}g(x)$.',
          'Product rule: $\\dfrac{d}{dx}[f(x)\\,g(x)] = f(x)\\,\\dfrac{d}{dx}g(x) + g(x)\\,\\dfrac{d}{dx}f(x)$.',
          'Quotient rule: $\\dfrac{d}{dx}\\!\\left[\\dfrac{f(x)}{g(x)}\\right] = \\dfrac{g(x)\\,\\frac{d}{dx}f(x) - f(x)\\,\\frac{d}{dx}g(x)}{[g(x)]^2}$.',
          'Chain rule: $\\dfrac{d}{dx} f(g(x)) = f\'(g(x)) \\cdot g\'(x)$.',
        ],
      },
    ],
  },

  'Statistics': {
    intro: 'Measures of Dispersion -- Range, Mean Deviation, Variance and Standard Deviation',
    sections: [
      {
        title: 'Measures of Central Tendency',
        table: {
          headers: ['Measure', 'Formula', 'Best Used When'],
          rows: [
            ['Mean ($\\bar{x}$)', '$\\bar{x} = \\frac{\\sum x_i}{n}$ or $\\frac{\\sum f_i x_i}{\\sum f_i}$', 'Data has no extreme values'],
            ['Median', 'Middle value when data sorted; $\\frac{n+1}{2}$th term if n odd', 'Data has extreme values'],
            ['Mode', 'Most frequently occurring value', 'Finding most common value'],
          ],
        },
      },
      {
        title: 'Measures of Dispersion — Range (XI-13.1)',
        bullets: [
          'Range of ungrouped data and discrete frequency distribution = Largest observation − Smallest observation.',
          'Range of a continuous frequency distribution = Upper limit of the highest class − Lower limit of the lowest class.',
        ],
      },
      {
        title: 'Measures of Dispersion — Mean Deviation (XI-13.1)',
        content: 'Mean deviation measures the average of the absolute deviations of observations from a central value (mean or median).',
        bullets: [
          'Ungrouped data, about mean: $M.D. = \\dfrac{\\sum |x_i - \\bar{x}|}{n}$, where $\\bar{x}$ = mean, $n$ = number of observations.',
          'Ungrouped data, about median: $M.D. = \\dfrac{\\sum |x_i - M|}{n}$, where $M$ = median.',
          'Grouped data, about mean: $M.D. = \\dfrac{\\sum f_i\\,|x_i - \\bar{x}|}{N}$, where $N = \\sum f_i$.',
          'Grouped data, about median: $M.D. = \\dfrac{\\sum f_i\\,|x_i - M|}{N}$, where $N = \\sum f_i$.',
        ],
      },
      {
        title: 'Variance and Standard Deviation (XI-13.2)',
        content: 'Variance is the mean of the squares of the deviations from the mean. The standard deviation $\\sigma$ is the positive square root of the variance: $\\sigma = \\sqrt{\\text{Variance}}$.',
        bullets: [
          'Ungrouped data: $\\sigma^2 = \\dfrac{1}{n}\\sum (x_i - \\bar{x})^2$, $\\quad \\sigma = \\sqrt{\\dfrac{1}{n}\\sum (x_i - \\bar{x})^2}$.',
          'Discrete frequency distribution: $\\sigma^2 = \\dfrac{1}{N}\\sum f_i (x_i - \\bar{x})^2$, where $N = \\sum f_i$.',
          'Continuous frequency distribution: $\\sigma = \\dfrac{1}{N}\\sqrt{N\\sum f_i x_i^2 - \\left(\\sum f_i x_i\\right)^2}$.',
        ],
      },
      {
        title: 'Shortcut (Step-Deviation) Method for Variance',
        content: 'Using $y_i = \\dfrac{x_i - A}{h}$ (where $A$ = assumed mean, $h$ = class width): $$\\sigma^2 = \\frac{h^2}{N^2}\\left[N\\sum f_i y_i^2 - \\left(\\sum f_i y_i\\right)^2\\right]$$ $$\\sigma = \\frac{h}{N}\\sqrt{N\\sum f_i y_i^2 - \\left(\\sum f_i y_i\\right)^2}$$',
        bullets: [
          'If each observation is multiplied by a positive constant $k$, the variance becomes $k^2$ times the original and the standard deviation becomes $k$ times the original.',
          'If each observation is increased (or decreased) by $k$, the variance and standard deviation remain unchanged.',
        ],
      },
      {
        title: 'Coefficient of Variation',
        content: 'Used to compare the variability of two series with different means or units: $$CV = \\frac{\\sigma}{\\bar{x}} \\times 100\\%$$',
        bullets: [
          'Lower CV → more consistent/stable data.',
          'Higher CV → more variable/spread out data.',
        ],
      },
    ],
  },

  'Probability': {
    intro: 'Random Experiments, Events and the Axiomatic Approach',
    sections: [
      {
        title: 'Basic Concepts',
        content: 'An experiment whose outcome cannot be predicted with certainty is a random experiment.',
        bullets: [
          'Sample space (S): the set of all possible outcomes.',
          'Event: any subset of the sample space.',
          'Probability of event A (equally likely outcomes): $P(A) = \\frac{n(A)}{n(S)}$.',
          '$0 \\leq P(A) \\leq 1$, $P(S) = 1$, $P(\\phi) = 0$.',
        ],
      },
      {
        title: 'Event — Occurrence, Not, And, Or (XI-14.1)',
        content: 'An event is a subset of the sample space associated with a random experiment.',
        bullets: [
          'Elementary / Simple event: an event with only one sample point. e.g. on a die, getting an even prime number → {2}.',
          'Compound event: an event with more than one sample point. e.g. on a die, getting an even number → {2, 4, 6}.',
          'Sure (certain) event: the event equals the whole sample space. e.g. on a die, a number less than 7 → {1,2,3,4,5,6}.',
          'Impossible event: an event that cannot happen. e.g. on a die, a number more than 6 → { } = $\\phi$.',
          "Complementary event (\u2018not A\u2019): the set $A'$ or $S - A$.",
          "Event \u2018A but not B\u2019: the set $A - B$.",
          'Event \u2018A or B\u2019: the set $A \\cup B$.',
          'Event \u2018A and B\u2019: the set $A \\cap B$.',
        ],
      },
      {
        title: 'Exhaustive and Mutually Exclusive Events (XI-14.1)',
        bullets: [
          'Mutually exclusive events: A and B cannot occur together, i.e. $A \\cap B = \\phi$.',
          'Events $E_1, E_2, \\ldots, E_n$ are mutually exclusive and exhaustive if $E_1 \\cup E_2 \\cup \\cdots \\cup E_n = S$ and $E_i \\cap E_j = \\phi$ for all $i \\neq j$.',
          'Equally likely events: each event has the same probability.',
        ],
      },
      {
        title: 'Axiomatic Approach to Probability (XI-14.2)',
        content: 'A number $P(\\omega_i)$ is associated with each sample point $\\omega_i$ such that $0 \\leq P(\\omega_i) \\leq 1$ and $\\sum P(\\omega_i) = 1$ over all $\\omega_i \\in S$.',
        bullets: [
          'For any event A: $P(A) = \\sum P(\\omega_i)$ for all $\\omega_i \\in A$.',
          'For a finite sample space with equally likely outcomes: $P(A) = \\dfrac{n(A)}{n(S)}$, with $0 \\leq P(A) \\leq 1$.',
          'P(sure event) $= P(S) = 1$; P(impossible event) $= P(\\phi) = 0$.',
        ],
      },
      {
        title: 'Addition Theorem',
        content: 'For any two events A and B: $$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$$',
        bullets: [
          'If A and B are mutually exclusive: $P(A \\cup B) = P(A) + P(B)$.',
          'For three events: $P(A \\cup B \\cup C) = P(A) + P(B) + P(C) - P(A \\cap B) - P(B \\cap C) - P(A \\cap C) + P(A \\cap B \\cap C)$.',
        ],
      },
      {
        title: 'Important Results',
        bullets: [
          "$P(A') = 1 - P(A)$, and $P(A) + P(\\text{not } A) = 1$.",
          'If $A \\subseteq B$ then $P(A) \\leq P(B)$.',
          "$P(A \\cap B') = P(A) - P(A \\cap B)$.",
          "$P(A' \\cap B') = 1 - P(A \\cup B)$ (De Morgan's).",
          'For mutually exclusive and exhaustive events: $\\sum P(A_i) = 1$.',
        ],
      },
    ],
  },

};

export default MathsNotes;